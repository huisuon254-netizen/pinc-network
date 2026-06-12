import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

// ── Types ────────────────────────────────────────────────────────────────────

type WagerStatus = "pending" | "active" | "settled" | "disputed" | "cancelled";

type WagerCategory = "sports" | "gaming" | "custom";

interface WagerParticipant {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface Wager {
  id: string;
  creator: WagerParticipant;
  opponent: WagerParticipant | null;
  title: string;
  description: string;
  stake_amount: number;
  category: WagerCategory;
  status: WagerStatus;
  winner_id: string | null;
  deadline: string;
  created_at: string;
  updated_at: string;
  terms: string;
}

interface LeaderboardEntry {
  user: WagerParticipant;
  wins: number;
  losses: number;
  total_wagers: number;
  win_rate: number;
}

interface WagerStats {
  total_wagers: number;
  wins: number;
  losses: number;
  pending: number;
  total_staked: number;
  total_won: number;
}

type Tab = "active" | "create" | "history" | "leaderboard";

type DetailView =
  | { kind: "none" }
  | { kind: "detail"; wager: Wager }
  | { kind: "settle"; wager: Wager };

// ── API helpers ──────────────────────────────────────────────────────────────

async function api<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  return invoke<T>(cmd, args);
}

async function fetchActiveWagers(): Promise<Wager[]> {
  try {
    return await api<Wager[]>("get_active_wagers");
  } catch {
    return [];
  }
}

async function fetchWagerHistory(): Promise<Wager[]> {
  try {
    return await api<Wager[]>("get_wager_history");
  } catch {
    return [];
  }
}

async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    return await api<LeaderboardEntry[]>("get_wager_leaderboard");
  } catch {
    return [];
  }
}

async function fetchWagerStats(): Promise<WagerStats> {
  try {
    return await api<WagerStats>("get_wager_stats");
  } catch {
    return { total_wagers: 0, wins: 0, losses: 0, pending: 0, total_staked: 0, total_won: 0 };
  }
}

async function createWager(payload: {
  opponent_id: string;
  title: string;
  description: string;
  terms: string;
  stake_amount: number;
  category: WagerCategory;
  deadline: string;
}): Promise<Wager> {
  return api<Wager>("create_wager", payload);
}

async function respondToWager(wager_id: string, accept: boolean): Promise<Wager> {
  return api<Wager>("respond_to_wager", { wagerId: wager_id, accept });
}

async function settleWager(wager_id: string, winner_id: string): Promise<Wager> {
  return api<Wager>("settle_wager", { wagerId: wager_id, winnerId: winner_id });
}

async function cancelWager(wager_id: string): Promise<Wager> {
  return api<Wager>("cancel_wager", { wagerId: wager_id });
}

// ── Utility ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function timeLeft(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  if (days > 0) return `${days}d ${hours}h left`;
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  return `${hours}h ${minutes}m left`;
}

function statusColor(s: WagerStatus): string {
  switch (s) {
    case "active":
      return "text-emerald-400 bg-emerald-400/10 border-emerald-400/30";
    case "pending":
      return "text-amber-400 bg-amber-400/10 border-amber-400/30";
    case "settled":
      return "text-slate-400 bg-slate-400/10 border-slate-400/30";
    case "disputed":
      return "text-red-400 bg-red-400/10 border-red-400/30";
    case "cancelled":
      return "text-slate-500 bg-slate-500/10 border-slate-500/30";
  }
}

function categoryIcon(c: WagerCategory): string {
  switch (c) {
    case "sports":
      return "\u26bd";
    case "gaming":
      return "\ud83c\udfae";
    case "custom":
      return "\ud83d\udca1";
  }
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatsBar({ stats }: { stats: WagerStats }) {
  const items: { label: string; value: string; accent: string }[] = [
    { label: "Total Wagers", value: String(stats.total_wagers), accent: "text-violet-400" },
    { label: "Wins", value: String(stats.wins), accent: "text-emerald-400" },
    { label: "Losses", value: String(stats.losses), accent: "text-red-400" },
    { label: "Win Rate", value: stats.total_wagers ? `${Math.round((stats.wins / Math.max(stats.total_wagers - stats.pending, 1)) * 100)}%` : "0%", accent: "text-amber-400" },
    { label: "Staked", value: `$${formatCurrency(stats.total_staked)}`, accent: "text-sky-400" },
    { label: "Won", value: `$${formatCurrency(stats.total_won)}`, accent: "text-emerald-400" },
  ];
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
      {items.map((it) => (
        <div key={it.label} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-center">
          <div className={`text-lg font-bold ${it.accent}`}>{it.value}</div>
          <div className="text-[11px] text-slate-500 uppercase tracking-wider mt-0.5">{it.label}</div>
        </div>
      ))}
    </div>
  );
}

function WagerCard({
  wager,
  onClick,
  onAccept,
  onDecline,
  currentUserId,
}: {
  wager: Wager;
  onClick: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  currentUserId?: string;
}) {
  const isPendingForMe = wager.status === "pending" && wager.opponent?.id === currentUserId;
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-violet-500/40 hover:bg-white/[0.05] transition-all p-4 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">{categoryIcon(wager.category)}</span>
            <h3 className="text-sm font-semibold text-white truncate">{wager.title}</h3>
          </div>
          <p className="text-xs text-slate-500 line-clamp-1 mb-2">{wager.description}</p>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-medium text-slate-300">{wager.creator.username}</span>
            {wager.opponent ? (
              <>
                <span className="text-slate-600">vs</span>
                <span className="font-medium text-slate-300">{wager.opponent.username}</span>
              </>
            ) : (
              <span className="text-slate-600 italic">awaiting opponent</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusColor(wager.status)}`}>
            {wager.status.toUpperCase()}
          </span>
          <span className="text-sm font-bold text-violet-400">${formatCurrency(wager.stake_amount)}</span>
          <span className="text-[10px] text-slate-500">{timeLeft(wager.deadline)}</span>
        </div>
      </div>
      {isPendingForMe && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-white/[0.06]" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={onDecline}
            className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
          >
            Decline
          </button>
        </div>
      )}
    </button>
  );
}

// ── Create Wager Form ────────────────────────────────────────────────────────

function CreateWagerForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    opponent_id: "",
    title: "",
    description: "",
    terms: "",
    stake_amount: "",
    category: "sports" as WagerCategory,
    deadline: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.opponent_id.trim()) e.opponent_id = "Opponent is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.terms.trim()) e.terms = "Terms are required";
    const stake = parseFloat(form.stake_amount);
    if (isNaN(stake) || stake <= 0) e.stake_amount = "Stake must be > 0";
    if (!form.deadline) e.deadline = "Deadline is required";
    else if (new Date(form.deadline).getTime() <= Date.now()) e.deadline = "Deadline must be in the future";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError("");
    try {
      await createWager({
        opponent_id: form.opponent_id.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        terms: form.terms.trim(),
        stake_amount: parseFloat(form.stake_amount),
        category: form.category,
        deadline: new Date(form.deadline).toISOString(),
      });
      onCreated();
      setForm({ opponent_id: "", title: "", description: "", terms: "", stake_amount: "", category: "sports", deadline: "" });
    } catch (err) {
      setServerError(String(err));
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 transition-colors";
  const errCls = "text-[11px] text-red-400 mt-0.5";

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <h2 className="text-lg font-bold text-white">Create a Wager</h2>

      {serverError && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400">{serverError}</div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Opponent ID *</label>
        <input className={inputCls} placeholder="User ID of opponent" value={form.opponent_id} onChange={(e) => set("opponent_id", e.target.value)} />
        {errors.opponent_id && <p className={errCls}>{errors.opponent_id}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Title *</label>
        <input className={inputCls} placeholder="e.g. Lakers vs Celtics" value={form.title} onChange={(e) => set("title", e.target.value)} />
        {errors.title && <p className={errCls}>{errors.title}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Description *</label>
        <textarea className={`${inputCls} resize-none`} rows={2} placeholder="What's the wager about?" value={form.description} onChange={(e) => set("description", e.target.value)} />
        {errors.description && <p className={errCls}>{errors.description}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Terms &amp; Conditions *</label>
        <textarea className={`${inputCls} resize-none`} rows={3} placeholder="How is the winner decided?" value={form.terms} onChange={(e) => set("terms", e.target.value)} />
        {errors.terms && <p className={errCls}>{errors.terms}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Stake Amount ($) *</label>
          <input type="number" step="0.01" min="0" className={inputCls} placeholder="0.00" value={form.stake_amount} onChange={(e) => set("stake_amount", e.target.value)} />
          {errors.stake_amount && <p className={errCls}>{errors.stake_amount}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Category *</label>
          <select className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value as WagerCategory)}>
            <option value="sports">Sports</option>
            <option value="gaming">Gaming</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Deadline *</label>
        <input type="datetime-local" className={inputCls} value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
        {errors.deadline && <p className={errCls}>{errors.deadline}</p>}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors"
      >
        {submitting ? "Creating..." : "Create Wager"}
      </button>
    </form>
  );
}

// ── Detail Modal ─────────────────────────────────────────────────────────────

function WagerDetailModal({
  wager,
  currentUserId,
  onClose,
  onSettle,
  onCancel,
}: {
  wager: Wager;
  currentUserId?: string;
  onClose: () => void;
  onSettle: (winnerId: string) => void;
  onCancel: () => void;
}) {
  const [settleWinner, setSettleWinner] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const isCreator = wager.creator.id === currentUserId;
  const canSettle = wager.status === "active" && isCreator;
  const canCancel = wager.status === "pending" && isCreator;

  async function handleSettle() {
    if (!settleWinner) return;
    setActionLoading(true);
    try {
      await onSettle(settleWinner);
      onClose();
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    setActionLoading(true);
    try {
      await onCancel();
      onClose();
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-2xl bg-[#0f0f14] border border-white/[0.08] shadow-2xl p-6 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-3 mb-5">
          <span className="text-2xl">{categoryIcon(wager.category)}</span>
          <div>
            <h2 className="text-lg font-bold text-white">{wager.title}</h2>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusColor(wager.status)}`}>
              {wager.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Description</div>
            <p className="text-sm text-slate-300">{wager.description}</p>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Terms</div>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{wager.terms}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Stake</div>
            <div className="text-lg font-bold text-violet-400">${formatCurrency(wager.stake_amount)}</div>
          </div>
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Deadline</div>
            <div className="text-sm font-medium text-white">{timeLeft(wager.deadline)}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{new Date(wager.deadline).toLocaleString()}</div>
          </div>
        </div>

        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 mb-5">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Parties</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-[10px] font-bold text-violet-400">
                {wager.creator.username[0]?.toUpperCase()}
              </div>
              <span className="text-sm text-white">{wager.creator.username}</span>
              <span className="text-[10px] text-slate-500">(creator)</span>
              {wager.winner_id === wager.creator.id && (
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">WINNER</span>
              )}
            </div>
            {wager.opponent && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-[10px] font-bold text-sky-400">
                  {wager.opponent.username[0]?.toUpperCase()}
                </div>
                <span className="text-sm text-white">{wager.opponent.username}</span>
                <span className="text-[10px] text-slate-500">(opponent)</span>
                {wager.winner_id === wager.opponent.id && (
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">WINNER</span>
                )}
              </div>
            )}
          </div>
        </div>

        {canSettle && wager.opponent && (
          <div className="rounded-lg bg-amber-500/[0.07] border border-amber-500/20 p-3 mb-4">
            <div className="text-xs font-semibold text-amber-400 mb-2">Declare Winner</div>
            <div className="flex gap-2 mb-3">
              {[wager.creator, wager.opponent].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSettleWinner(p.id)}
                  className={`flex-1 text-xs font-medium py-2 rounded-lg border transition-colors ${
                    settleWinner === p.id
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                      : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:border-white/20"
                  }`}
                >
                  {p.username}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={!settleWinner || actionLoading}
              onClick={handleSettle}
              className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-white transition-colors"
            >
              {actionLoading ? "Settling..." : "Confirm Settlement"}
            </button>
          </div>
        )}

        {canCancel && (
          <button
            type="button"
            disabled={actionLoading}
            onClick={handleCancel}
            className="w-full py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {actionLoading ? "Cancelling..." : "Cancel Wager"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function WagerPage() {
  const [tab, setTab] = useState<Tab>("active");
  const [activeWagers, setActiveWagers] = useState<Wager[]>([]);
  const [history, setHistory] = useState<Wager[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<WagerStats>({ total_wagers: 0, wins: 0, losses: 0, pending: 0, total_staked: 0, total_won: 0 });
  const [detail, setDetail] = useState<DetailView>({ kind: "none" });
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<WagerCategory | "all">("all");

  const currentUserId = ""; // set from auth context

  const load = useCallback(async () => {
    setLoading(true);
    const [a, h, l, s] = await Promise.all([fetchActiveWagers(), fetchWagerHistory(), fetchLeaderboard(), fetchWagerStats()]);
    setActiveWagers(a);
    setHistory(h);
    setLeaderboard(l);
    setStats(s);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredActive = activeWagers.filter((w) => categoryFilter === "all" || w.category === categoryFilter);
  const filteredHistory = history.filter((w) => categoryFilter === "all" || w.category === categoryFilter);

  const tabs: { id: Tab; label: string }[] = [
    { id: "active", label: "Active" },
    { id: "create", label: "Create" },
    { id: "history", label: "History" },
    { id: "leaderboard", label: "Leaderboard" },
  ];

  return (
    <div className="min-h-screen bg-[#09090f] text-white">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Wagers</h1>
            <p className="text-sm text-slate-500 mt-0.5">Bet on outcomes, settle disputes, climb the leaderboard</p>
          </div>
          <button
            type="button"
            onClick={load}
            className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20 transition-colors"
            title="Refresh"
          >
            <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                tab === t.id ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Category filter (all tabs except create) */}
        {tab !== "create" && (
          <div className="flex gap-2 mb-4">
            {(["all", "sports", "gaming", "custom"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategoryFilter(c)}
                className={`px-3 py-1 text-[11px] font-medium rounded-full border transition-colors ${
                  categoryFilter === c
                    ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                    : "bg-white/[0.03] border-white/[0.06] text-slate-500 hover:text-slate-300"
                }`}
              >
                {c === "all" ? "All" : c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {tab === "active" && (
              <div>
                <StatsBar stats={stats} />
                {filteredActive.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-4xl mb-3">&#127919;</div>
                    <p className="text-sm text-slate-500">No active wagers</p>
                    <button type="button" onClick={() => setTab("create")} className="mt-3 text-xs text-violet-400 hover:text-violet-300 font-medium">
                      Create one now
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredActive.map((w) => (
                      <WagerCard
                        key={w.id}
                        wager={w}
                        currentUserId={currentUserId}
                        onClick={() => setDetail({ kind: "detail", wager: w })}
                        onAccept={async () => {
                          await respondToWager(w.id, true);
                          load();
                        }}
                        onDecline={async () => {
                          await respondToWager(w.id, false);
                          load();
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "create" && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
                <CreateWagerForm onCreated={() => { setTab("active"); load(); }} />
              </div>
            )}

            {tab === "history" && (
              <div>
                <StatsBar stats={stats} />
                {filteredHistory.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-4xl mb-3">&#128214;</div>
                    <p className="text-sm text-slate-500">No wager history yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredHistory.map((w) => (
                      <WagerCard
                        key={w.id}
                        wager={w}
                        currentUserId={currentUserId}
                        onClick={() => setDetail({ kind: "detail", wager: w })}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "leaderboard" && (
              <div>
                {leaderboard.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-4xl mb-3">&#127942;</div>
                    <p className="text-sm text-slate-500">No leaderboard data yet</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white/[0.03]">
                          <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">#</th>
                          <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Player</th>
                          <th className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">W</th>
                          <th className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">L</th>
                          <th className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Win %</th>
                          <th className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((entry, i) => (
                          <tr key={entry.user.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3">
                              <span className={`font-bold ${i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-600" : "text-slate-500"}`}>
                                {i + 1}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-[9px] font-bold text-violet-400">
                                  {entry.user.username[0]?.toUpperCase()}
                                </div>
                                <span className="font-medium text-white">{entry.user.username}</span>
                              </div>
                            </td>
                            <td className="text-right px-4 py-3 font-medium text-emerald-400">{entry.wins}</td>
                            <td className="text-right px-4 py-3 font-medium text-red-400">{entry.losses}</td>
                            <td className="text-right px-4 py-3 font-medium text-amber-400">{entry.win_rate.toFixed(1)}%</td>
                            <td className="text-right px-4 py-3 text-slate-400">{entry.total_wagers}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {detail.kind === "detail" && (
        <WagerDetailModal
          wager={detail.wager}
          currentUserId={currentUserId}
          onClose={() => setDetail({ kind: "none" })}
          onSettle={async (winnerId) => {
            await settleWager(detail.wager.id, winnerId);
            load();
          }}
          onCancel={async () => {
            await cancelWager(detail.wager.id);
            load();
          }}
        />
      )}
    </div>
  );
}
