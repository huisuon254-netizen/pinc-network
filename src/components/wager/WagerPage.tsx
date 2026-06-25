import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Trophy,
  Swords,
  Users,
  Gamepad2,
  Shield,
  Brain,
  Palette,
  FileText,
  Briefcase,
  Lightbulb,
  Star,
  Timer,
  Crown,
  ChevronRight,
  Zap,
  TrendingUp,
  Plus,
  Play,
  Globe,
} from "lucide-react";
import { GameLauncher, CreateCustomGameView, PlayableGame } from "./Games";
import { GameDistributionPlayer } from "./GameDistributionPlayer";
import type { GDGame, GameResult } from "../../types";

// ── Types ────────────────────────────────────────────────────────────────────

type WagerStatus = "pending" | "active" | "settled" | "disputed" | "cancelled";

type WagerCategory = "sports" | "gaming" | "custom";

type GameCategory = "single_player" | "multiplayer" | "family";

type TournamentType = "daily" | "weekly" | "monthly" | "annual";

type ChallengeCategory = "gaming" | "coding" | "cybersecurity" | "ai" | "design" | "content" | "business" | "innovation";

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

interface Game {
  id: string;
  name: string;
  category: GameCategory;
  player_count: number;
  rating: number;
  description: string;
}

interface Tournament {
  id: string;
  name: string;
  type: TournamentType;
  prize_pool: number;
  participants: number;
  max_participants: number;
  start_time: string;
  status: "upcoming" | "active" | "completed";
  game_name: string;
}

interface Challenge {
  id: string;
  category: ChallengeCategory;
  name: string;
  icon: string;
  difficulty_levels: number;
  active_challenges: number;
}

interface LeaderboardPlayer {
  id: string;
  username: string;
  avatar_url: string | null;
  score: number;
  games_won: number;
}

type Tab = "wagers" | "games" | "tournaments" | "challenges" | "leaderboard";

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

async function fetchGames(): Promise<Game[]> {
  try {
    return await api<Game[]>("cmd_get_games");
  } catch {
    return [];
  }
}

async function fetchTournaments(): Promise<Tournament[]> {
  try {
    return await api<Tournament[]>("cmd_get_tournaments");
  } catch {
    return [];
  }
}

async function fetchChallenges(): Promise<Challenge[]> {
  try {
    return await api<Challenge[]>("cmd_get_challenges");
  } catch {
    return [];
  }
}

async function fetchLeaderboardPlayers(): Promise<LeaderboardPlayer[]> {
  try {
    return await api<LeaderboardPlayer[]>("cmd_get_wagers");
  } catch {
    return [];
  }
}

// ── Utility ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

// ── Games Tab ────────────────────────────────────────────────────────────────

function GamesTab({
  games,
  webGames,
  onCreateCustomGame,
  onPlayGDGame,
}: {
  games: Game[];
  webGames: GDGame[];
  onCreateCustomGame: () => void;
  onPlayGDGame: (game: GDGame) => void;
}) {
  const [categoryFilter, setCategoryFilter] = useState<GameCategory | "all">("all");

  const filtered = games.filter((g) => categoryFilter === "all" || g.category === categoryFilter);

  const categoryBadge = (c: GameCategory) => {
    const map: Record<GameCategory, { label: string; color: string }> = {
      single_player: { label: "Single Player", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" },
      multiplayer: { label: "Multiplayer", color: "text-sky-400 bg-sky-400/10 border-sky-400/30" },
      family: { label: "Family", color: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
    };
    const info = map[c];
    return (
      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${info.color}`}>
        {info.label}
      </span>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-violet-400" />
          Games
        </h2>
        <div className="flex gap-2">
          {(["all", "single_player", "multiplayer", "family"] as const).map((c) => (
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
              {c === "all" ? "All" : c.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Create Custom Game */}
      <div className="mb-6">
        <button
          type="button"
          onClick={onCreateCustomGame}
          className="w-full py-3 rounded-xl border border-dashed border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Custom Game Challenge
        </button>
      </div>

      {/* API Games */}
      <h3 className="text-sm font-semibold text-white mb-3">Available Games</h3>
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Gamepad2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No additional games available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((game) => {
            return (
              <div
                key={game.id}
                className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 hover:border-violet-500/40 hover:bg-white/[0.05] transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors">{game.name}</h3>
                  {categoryBadge(game.category)}
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{game.description}</p>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>{(game.player_count ?? 0).toLocaleString()} players</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="font-medium text-amber-400">{game.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Web Games (GameDistribution) */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          Web Games
        </h3>
        <p className="text-xs text-slate-500 mb-4">Browser-based games powered by GameDistribution. Play with bets and earn points.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {webGames.map((game) => (
            <div
              key={game.id}
              className="rounded-xl bg-white/[0.03] border border-cyan-500/20 p-4 hover:border-cyan-500/40 hover:bg-white/[0.05] transition-all group"
            >
              {game.thumbnail && (
                <img src={game.thumbnail} alt={game.title} className="w-full h-24 object-cover rounded-lg mb-3" />
              )}
              <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors mb-1">{game.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2 mb-3">{game.description}</p>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span>{game.provider || "Web Game"}</span>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="font-medium text-amber-400">{game.rating.toFixed(1)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onPlayGDGame(game)}
                className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                Play Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tournaments Tab ──────────────────────────────────────────────────────────

function TournamentsTab({
  tournaments,
  onJoin,
  showCreateForm,
  onToggleCreate,
  createForm,
  setCreateForm,
  createFormErrors,
  onCreateSubmit,
  createSubmitting,
}: {
  tournaments: Tournament[];
  onJoin: (id: string) => void;
  showCreateForm: boolean;
  onToggleCreate: () => void;
  createForm: { name: string; type: string; prize: string; max: string; start: string };
  setCreateForm: React.Dispatch<React.SetStateAction<{ name: string; type: string; prize: string; max: string; start: string }>>;
  createFormErrors: Record<string, string>;
  onCreateSubmit: (e: React.FormEvent) => void;
  createSubmitting: boolean;
}) {
  const [typeFilter, setTypeFilter] = useState<TournamentType | "all">("all");

  const filtered = tournaments.filter((t) => typeFilter === "all" || t.type === typeFilter);

  const inputCls =
    "w-full rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 transition-colors";

  const typeBadge = (t: TournamentType) => {
    const map: Record<TournamentType, { label: string; color: string }> = {
      daily: { label: "Daily", color: "text-sky-400 bg-sky-400/10 border-sky-400/30" },
      weekly: { label: "Weekly", color: "text-violet-400 bg-violet-400/10 border-violet-400/30" },
      monthly: { label: "Monthly", color: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
      annual: { label: "Annual", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" },
    };
    const info = map[t];
    return (
      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${info.color}`}>
        {info.label}
      </span>
    );
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "upcoming":
        return "text-amber-400";
      case "active":
        return "text-emerald-400";
      case "completed":
        return "text-slate-500";
      default:
        return "text-slate-400";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          Tournaments
        </h2>
        <div className="flex gap-2 items-center">
          {(["all", "daily", "weekly", "monthly", "annual"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 text-[11px] font-medium rounded-full border transition-colors ${
                typeFilter === t
                  ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                  : "bg-white/[0.03] border-white/[0.06] text-slate-500 hover:text-slate-300"
              }`}
            >
              {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          <button
            type="button"
            onClick={onToggleCreate}
            className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold rounded-full bg-violet-600 hover:bg-violet-500 text-white transition-colors"
          >
            <Plus className="w-3 h-3" />
            Create Tournament
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="mb-6 rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">New Tournament</h3>
            <button type="button" onClick={onToggleCreate} className="text-slate-500 hover:text-white text-xs">Cancel</button>
          </div>
          {createFormErrors._submit && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400 mb-3">{createFormErrors._submit}</div>
          )}
          <form onSubmit={onCreateSubmit} className="max-w-lg space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Name *</label>
              <input className={inputCls} placeholder="Tournament name" value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} />
              {createFormErrors.name && <p className="text-[11px] text-red-400 mt-0.5">{createFormErrors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Type *</label>
                <select className={inputCls} value={createForm.type} onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value }))}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Prize Pool (PINC) *</label>
                <input type="number" step="0.01" min="0" className={inputCls} placeholder="0.00" value={createForm.prize} onChange={(e) => setCreateForm((f) => ({ ...f, prize: e.target.value }))} />
                {createFormErrors.prize && <p className="text-[11px] text-red-400 mt-0.5">{createFormErrors.prize}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Max Participants *</label>
                <input type="number" min="2" className={inputCls} placeholder="64" value={createForm.max} onChange={(e) => setCreateForm((f) => ({ ...f, max: e.target.value }))} />
                {createFormErrors.max && <p className="text-[11px] text-red-400 mt-0.5">{createFormErrors.max}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Start Time *</label>
                <input type="datetime-local" className={inputCls} value={createForm.start} onChange={(e) => setCreateForm((f) => ({ ...f, start: e.target.value }))} />
                {createFormErrors.start && <p className="text-[11px] text-red-400 mt-0.5">{createFormErrors.start}</p>}
              </div>
            </div>
            <button
              type="submit"
              disabled={createSubmitting}
              className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors"
            >
              {createSubmitting ? "Creating..." : "Create Tournament"}
            </button>
          </form>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No tournaments available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((tournament) => (
            <div
              key={tournament.id}
              className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 hover:border-amber-500/40 hover:bg-white/[0.05] transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">{tournament.name}</h3>
                  <p className="text-xs text-slate-500">{tournament.game_name}</p>
                </div>
                {typeBadge(tournament.type)}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Prize Pool</div>
                  <div className="text-sm font-bold text-amber-400">${formatCurrency(tournament.prize_pool)}</div>
                </div>
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Participants</div>
                  <div className="text-sm font-bold text-white">
                    {tournament.participants}/{tournament.max_participants}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Timer className="w-3.5 h-3.5" />
                  <span>{tournament.start_time ? new Date(tournament.start_time).toLocaleString() : '—'}</span>
                </div>
                <span className={`text-[11px] font-medium ${statusColor(tournament.status)}`}>
                  {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                </span>
              </div>

              <button
                type="button"
                disabled={tournament.status !== "upcoming" || tournament.participants >= tournament.max_participants}
                onClick={() => onJoin(tournament.id)}
                className="w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5"
              >
                <Swords className="w-3.5 h-3.5" />
                {tournament.participants >= tournament.max_participants ? "Full" : "Join Tournament"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Challenges Tab ───────────────────────────────────────────────────────────

function ChallengesTab({
  challenges,
  showCreateForm,
  onToggleCreate,
  createForm,
  setCreateForm,
  createFormErrors,
  onCreateSubmit,
  createSubmitting,
}: {
  challenges: Challenge[];
  showCreateForm: boolean;
  onToggleCreate: () => void;
  createForm: { title: string; category: string; difficulty: string; reward: string; description: string };
  setCreateForm: React.Dispatch<React.SetStateAction<{ title: string; category: string; difficulty: string; reward: string; description: string }>>;
  createFormErrors: Record<string, string>;
  onCreateSubmit: (e: React.FormEvent) => void;
  createSubmitting: boolean;
}) {
  const categoryMeta: Record<ChallengeCategory, { icon: React.ReactNode; color: string }> = {
    gaming: { icon: <Gamepad2 className="w-6 h-6" />, color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" },
    coding: { icon: <Zap className="w-6 h-6" />, color: "text-sky-400 border-sky-400/30 bg-sky-400/10" },
    cybersecurity: { icon: <Shield className="w-6 h-6" />, color: "text-red-400 border-red-400/30 bg-red-400/10" },
    ai: { icon: <Brain className="w-6 h-6" />, color: "text-violet-400 border-violet-400/30 bg-violet-400/10" },
    design: { icon: <Palette className="w-6 h-6" />, color: "text-pink-400 border-pink-400/30 bg-pink-400/10" },
    content: { icon: <FileText className="w-6 h-6" />, color: "text-amber-400 border-amber-400/30 bg-amber-400/10" },
    business: { icon: <Briefcase className="w-6 h-6" />, color: "text-sky-400 border-sky-400/30 bg-sky-400/10" },
    innovation: { icon: <Lightbulb className="w-6 h-6" />, color: "text-amber-400 border-amber-400/30 bg-amber-400/10" },
  };

  const inputCls =
    "w-full rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 transition-colors";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Swords className="w-5 h-5 text-sky-400" />
          Challenges
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{challenges.length} categories</span>
          <button
            type="button"
            onClick={onToggleCreate}
            className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold rounded-full bg-violet-600 hover:bg-violet-500 text-white transition-colors"
          >
            <Plus className="w-3 h-3" />
            Create Challenge
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="mb-6 rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">New Challenge</h3>
            <button type="button" onClick={onToggleCreate} className="text-slate-500 hover:text-white text-xs">Cancel</button>
          </div>
          {createFormErrors._submit && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400 mb-3">{createFormErrors._submit}</div>
          )}
          <form onSubmit={onCreateSubmit} className="max-w-lg space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Title *</label>
              <input className={inputCls} placeholder="Challenge title" value={createForm.title} onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))} />
              {createFormErrors.title && <p className="text-[11px] text-red-400 mt-0.5">{createFormErrors.title}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Category *</label>
                <select className={inputCls} value={createForm.category} onChange={(e) => setCreateForm((f) => ({ ...f, category: e.target.value }))}>
                  <option value="gaming">Gaming</option>
                  <option value="coding">Coding</option>
                  <option value="cybersecurity">Cybersecurity</option>
                  <option value="ai">AI</option>
                  <option value="design">Design</option>
                  <option value="content">Content</option>
                  <option value="business">Business</option>
                  <option value="innovation">Innovation</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Difficulty *</label>
                <select className={inputCls} value={createForm.difficulty} onChange={(e) => setCreateForm((f) => ({ ...f, difficulty: e.target.value }))}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Reward Points *</label>
              <input type="number" min="1" className={inputCls} placeholder="100" value={createForm.reward} onChange={(e) => setCreateForm((f) => ({ ...f, reward: e.target.value }))} />
              {createFormErrors.reward && <p className="text-[11px] text-red-400 mt-0.5">{createFormErrors.reward}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Description *</label>
              <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Describe the challenge..." value={createForm.description} onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))} />
              {createFormErrors.description && <p className="text-[11px] text-red-400 mt-0.5">{createFormErrors.description}</p>}
            </div>
            <button
              type="submit"
              disabled={createSubmitting}
              className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors"
            >
              {createSubmitting ? "Creating..." : "Create Challenge"}
            </button>
          </form>
        </div>
      )}

      {challenges.length === 0 ? (
        <div className="text-center py-16">
          <Swords className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No challenges available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {challenges.map((challenge) => {
            const meta = categoryMeta[challenge.category] || categoryMeta.gaming;
            return (
              <div
                key={challenge.id}
                className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 hover:border-violet-500/40 hover:bg-white/[0.05] transition-all group cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-3 ${meta.color}`}>
                  {meta.icon}
                </div>
                <h3 className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors mb-1">
                  {challenge.name}
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] text-slate-500">
                    {challenge.difficulty_levels} difficulty {challenge.difficulty_levels === 1 ? "level" : "levels"}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-[11px] text-violet-400 font-medium">
                    {challenge.active_challenges} active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-1">
                    {[...Array(Math.min(3, challenge.active_challenges))].map((_, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 rounded-full bg-violet-500/30 border border-[#09090f] flex items-center justify-center text-[8px] font-bold text-violet-300"
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-violet-400 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Leaderboard Tab ──────────────────────────────────────────────────────────

function LeaderboardTab({ players }: { players: LeaderboardPlayer[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-400" />
          Leaderboard
        </h2>
        <span className="text-xs text-slate-500">{players.length} players</span>
      </div>

      {players.length === 0 ? (
        <div className="text-center py-16">
          <Crown className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No leaderboard data yet</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.03]">
                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Rank</th>
                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Player</th>
                <th className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Score</th>
                <th className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Games Won</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, i) => (
                <tr key={player.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <span className={`font-bold ${i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-600" : "text-slate-500"}`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-[10px] font-bold text-violet-400 overflow-hidden">
                        {player.avatar_url ? (
                          <img src={player.avatar_url} alt={player.username} className="w-full h-full object-cover" />
                        ) : (
                          player.username[0]?.toUpperCase()
                        )}
                      </div>
                      <span className="font-medium text-white">{player.username}</span>
                      {i === 0 && <Crown className="w-4 h-4 text-amber-400" />}
                    </div>
                  </td>
                  <td className="text-right px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                      <span className="font-bold text-violet-400">{(player.score ?? 0).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="text-right px-4 py-3 font-medium text-emerald-400">{player.games_won}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
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
            <div className="text-[10px] text-slate-500 mt-0.5">{wager.deadline ? new Date(wager.deadline).toLocaleString() : '—'}</div>
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
  const [tab, setTab] = useState<Tab>("wagers");
  const [activeWagers, setActiveWagers] = useState<Wager[]>([]);
  const [history, setHistory] = useState<Wager[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<WagerStats>({ total_wagers: 0, wins: 0, losses: 0, pending: 0, total_staked: 0, total_won: 0 });
  const [detail, setDetail] = useState<DetailView>({ kind: "none" });
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<WagerCategory | "all">("all");

  const [games, setGames] = useState<Game[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboardPlayers, setLeaderboardPlayers] = useState<LeaderboardPlayer[]>([]);

  const webGames: GDGame[] = [
    // ── GameDistribution Games (Real GD IDs) ──────────────────────────────────
    { id: "gd_78056fce3de343b4bdebeaece5a65ad7", title: "Mountain Bus Driver", description: "Drive through breathtaking mountain roads picking up passengers", thumbnail: "https://img.gamedistribution.com/78056fce3de343b4bdebeaece5a65ad7-512x384.jpg", url: "https://html5.gamedistribution.com/78056fce3de343b4bdebeaece5a65ad7/", category: "racing", provider: "GameDistribution", rating: 4.5, plays: 85000 },
    { id: "gd_23ada7a4947d45da80d471400396bc41", title: "Chess", description: "Classic two-player strategy board game", thumbnail: "https://img.gamedistribution.com/23ada7a4947d45da80d471400396bc41-512x384.jpeg", url: "https://html5.gamedistribution.com/23ada7a4947d45da80d471400396bc41/", category: "strategy", provider: "GameDistribution", rating: 4.7, plays: 320000 },
    { id: "gd_647536adcfa040668029eae70c72ce33", title: "Tetris", description: "Classic block-stacking puzzle game", thumbnail: "https://img.gamedistribution.com/647536adcfa040668029eae70c72ce33-512x384.jpg", url: "https://html5.gamedistribution.com/647536adcfa040668029eae70c72ce33/", category: "puzzle", provider: "GameDistribution", rating: 4.6, plays: 450000 },
    { id: "gd_b34a92d49e9348d591116bb98fe9dab1", title: "Bubble Shooter", description: "Classic bubble matching puzzle game", thumbnail: "https://img.gamedistribution.com/b34a92d49e9348d591116bb98fe9dab1-512x384.jpeg", url: "https://html5.gamedistribution.com/b34a92d49e9348d591116bb98fe9dab1/", category: "puzzle", provider: "GameDistribution", rating: 4.4, plays: 280000 },
    { id: "gd_f3cc88c0cee84b8e8ccc1d0ab4fce528", title: "Mahjong", description: "Combine tiles of the same type to complete levels", thumbnail: "https://img.gamedistribution.com/f3cc88c0cee84b8e8ccc1d0ab4fce528.jpg", url: "https://html5.gamedistribution.com/f3cc88c0cee84b8e8ccc1d0ab4fce528/", category: "puzzle", provider: "GameDistribution", rating: 4.3, plays: 190000 },
    { id: "gd_69d78d071f704fa183d75b4114ae40ec", title: "Basketball Stars", description: "Cool 2-player basketball tournament game", thumbnail: "https://img.gamedistribution.com/69d78d071f704fa183d75b4114ae40ec-512x384.jpg", url: "https://html5.gamedistribution.com/69d78d071f704fa183d75b4114ae40ec/", category: "sports", provider: "GameDistribution", rating: 4.5, plays: 380000 },
    { id: "gd_e4834283bce2457980b6cb1da52c1430", title: "2048", description: "Slide and merge numbers to reach 2048", thumbnail: "https://img.gamedistribution.com/e4834283bce2457980b6cb1da52c1430-512x384.jpeg", url: "https://html5.gamedistribution.com/e4834283bce2457980b6cb1da52c1430/", category: "puzzle", provider: "GameDistribution", rating: 4.5, plays: 520000 },
    { id: "gd_96c578f96c3342b691b17faa51b69579", title: "Klondike Solitaire", description: "Classic solitaire card game", thumbnail: "https://img.gamedistribution.com/96c578f96c3342b691b17faa51b69579.jpg", url: "https://html5.gamedistribution.com/96c578f96c3342b691b17faa51b69579/", category: "casual", provider: "GameDistribution", rating: 4.3, plays: 210000 },
    { id: "gd_d460edf318754839a8ab30502e12ba18", title: "Sudoku", description: "Deluxe sudoku puzzle for all skill levels", thumbnail: "https://img.gamedistribution.com/d460edf318754839a8ab30502e12ba18-512x384.jpeg", url: "https://html5.gamedistribution.com/d460edf318754839a8ab30502e12ba18/", category: "puzzle", provider: "GameDistribution", rating: 4.4, plays: 175000 },
    { id: "gd_13eabea86f7c4cd993a156258420e9ec", title: "Football Legends 2026", description: "Fast-paced arcade soccer 1v1 and 2v2", thumbnail: "https://img.gamedistribution.com/13eabea86f7c4cd993a156258420e9ec-512x384.jpg", url: "https://html5.gamedistribution.com/13eabea86f7c4cd993a156258420e9ec/", category: "sports", provider: "GameDistribution", rating: 4.6, plays: 410000 },
    { id: "gd_77e1107ca4be4fdfb62b498d014bbfa7", title: "Tower Defense", description: "Defend your territory with strategic tower placement", thumbnail: "https://img.gamedistribution.com/77e1107ca4be4fdfb62b498d014bbfa7-512x384.jpeg", url: "https://html5.gamedistribution.com/77e1107ca4be4fdfb62b498d014bbfa7/", category: "strategy", provider: "GameDistribution", rating: 4.5, plays: 290000 },
    // ── GameFlare Games ─────────────────────────────────────────────────────
    // ── Action ────────────────────────────────────────────────────────────────
    { id: "gf_1", title: "Ashen Ninja: Rust and Katana", description: "Fast-paced ninja action with sword combat", thumbnail: "https://data.gameflare.com/games/11375/cLNZM1JHFuOG1D-400-300.jpg", url: "https://distribution.gameflare.com/embed/ashen-ninja-rust-and-katana/", category: "action", provider: "GameFlare", rating: 4.5, plays: 42000 },
    { id: "gf_2", title: "Squad Shooter", description: "Tactical squad-based shooter game", thumbnail: "https://data.gameflare.com/games/11370/Dm4vQPLcO3cYO9-400-300.jpg", url: "https://distribution.gameflare.com/embed/squad-shooter/", category: "action", provider: "GameFlare", rating: 4.3, plays: 38000 },
    { id: "gf_3", title: "Planet Hero", description: "Defend the planet from alien invasion", thumbnail: "https://data.gameflare.com/games/11170/eeaTRfs0Yaqof8-400-300.jpg", url: "https://distribution.gameflare.com/embed/planet-hero/", category: "action", provider: "GameFlare", rating: 4.4, plays: 35000 },
    { id: "gf_4", title: "Project Exo Assault", description: "Exosuit combat in futuristic warfare", thumbnail: "https://data.gameflare.com/games/11148/i3W9vY1SBNPUyj-400-300.jpg", url: "https://distribution.gameflare.com/embed/project-exo-assault/", category: "action", provider: "GameFlare", rating: 4.2, plays: 31000 },
    { id: "gf_5", title: "Marine Showdown", description: "Military combat standoff", thumbnail: "https://data.gameflare.com/games/11007/fccjcFeOdi7nun-400-300.jpg", url: "https://distribution.gameflare.com/embed/marine-showdown-standoff-in-afghanistan/", category: "action", provider: "GameFlare", rating: 4.1, plays: 29000 },
    { id: "gf_6", title: "Missile Control", description: "Strategic missile strike operations", thumbnail: "https://data.gameflare.com/games/10971/PMkmHH0JGWP0Ge-400-300.jpg", url: "https://distribution.gameflare.com/embed/missile-control-infiltration-strike/", category: "action", provider: "GameFlare", rating: 4.3, plays: 27000 },
    { id: "gf_7", title: "Legendary Archer", description: "Master the bow and arrow", thumbnail: "https://data.gameflare.com/games/10431/KgT1ydZe0OM5OD-400-300.jpg", url: "https://distribution.gameflare.com/embed/legendary-archer/", category: "action", provider: "GameFlare", rating: 4.6, plays: 52000 },
    { id: "gf_8", title: "Skibidi Online", description: "Battle skibidi toilets in this viral hit", thumbnail: "https://data.gameflare.com/games/10113/zJ5qAZK4yhqp5e-400-300.jpg", url: "https://distribution.gameflare.com/embed/skibidi-online/", category: "action", provider: "GameFlare", rating: 4.0, plays: 68000 },
    { id: "gf_9", title: "Dinogen Online", description: "Dinosaur survival FPS", thumbnail: "https://data.gameflare.com/games/9835/BmJskWnl9zs5b4-400-300.png", url: "https://distribution.gameflare.com/embed/dinogen-online/", category: "action", provider: "GameFlare", rating: 4.7, plays: 95000 },
    { id: "gf_10", title: "Swordsman of Persia", description: "Sword fighting adventure", thumbnail: "https://data.gameflare.com/games/9953/GDvSonlOsqC0OH-400-300.jpg", url: "https://distribution.gameflare.com/embed/swordsman-of-persia/", category: "action", provider: "GameFlare", rating: 4.4, plays: 41000 },
    { id: "gf_11", title: "Evil Space Base: FPS", description: "Space station combat shooter", thumbnail: "https://data.gameflare.com/games/10084/AHcCH3CXCiWGmN-400-300.jpg", url: "https://distribution.gameflare.com/embed/evil-space-base-fps/", category: "action", provider: "GameFlare", rating: 4.2, plays: 33000 },
    // ── Puzzle ────────────────────────────────────────────────────────────────
    { id: "gf_12", title: "Tic Tac Foe", description: "Advanced tic tac toe with AI opponent", thumbnail: "https://data.gameflare.com/games/11239/fXPyLgqujsoci4-400-300.jpg", url: "https://distribution.gameflare.com/embed/tic-tac-foe/", category: "puzzle", provider: "GameFlare", rating: 4.0, plays: 22000 },
    { id: "gf_13", title: "Red Escape", description: "Escape rooms with red theme", thumbnail: "https://data.gameflare.com/games/10842/TwHsoylQXMRz5l-400-300.jpg", url: "https://distribution.gameflare.com/embed/red-escape/", category: "puzzle", provider: "GameFlare", rating: 4.3, plays: 28000 },
    { id: "gf_14", title: "Would You Rather?", description: "Fun decision-making game", thumbnail: "https://data.gameflare.com/games/10162/UMH2wk6Zh04PeW-400-300.jpg", url: "https://distribution.gameflare.com/embed/would-you-rather/", category: "puzzle", provider: "GameFlare", rating: 4.1, plays: 45000 },
    { id: "gf_15", title: "TOGETHER", description: "Cooperative puzzle adventure", thumbnail: "https://data.gameflare.com/games/10123/R9RrrIyYaTjnr1-400-300.jpg", url: "https://distribution.gameflare.com/embed/together/", category: "puzzle", provider: "GameFlare", rating: 4.5, plays: 19000 },
    { id: "gf_16", title: "Board Boss", description: "Board game strategy puzzle", thumbnail: "https://data.gameflare.com/games/10090/4lYjRdZ0W4K1Ds-400-300.jpg", url: "https://distribution.gameflare.com/embed/board-boss/", category: "puzzle", provider: "GameFlare", rating: 4.2, plays: 24000 },
    { id: "gf_17", title: "City Blocks", description: "Block puzzle city builder", thumbnail: "https://data.gameflare.com/games/9726/ezvbjrBuzW0jG8-400-300.jpg", url: "https://distribution.gameflare.com/embed/city-blocks/", category: "puzzle", provider: "GameFlare", rating: 4.4, plays: 36000 },
    // ── Arcade ────────────────────────────────────────────────────────────────
    { id: "gf_18", title: "Octagon", description: "Fast-paced geometric obstacle course", thumbnail: "https://data.gameflare.com/games/5759/WB5Cq2Jmi1SwQn-400-300.jpg", url: "https://distribution.gameflare.com/embed/octagon/", category: "arcade", provider: "GameFlare", rating: 4.6, plays: 78000 },
    { id: "gf_19", title: "Parkour World", description: "Free running parkour game", thumbnail: "https://data.gameflare.com/games/10122/rhWZLG3GLC3SCP-400-300.jpg", url: "https://distribution.gameflare.com/embed/parkour-world/", category: "arcade", provider: "GameFlare", rating: 4.3, plays: 55000 },
    { id: "gf_20", title: "Only Up! Parkour", description: "Climb as high as you can", thumbnail: "https://data.gameflare.com/games/10105/DE1mtdgBM4PDIr-400-300.jpg", url: "https://distribution.gameflare.com/embed/only-up-parkour/", category: "arcade", provider: "GameFlare", rating: 4.5, plays: 82000 },
    { id: "gf_21", title: "Platform Kid", description: "Classic platform jumping game", thumbnail: "https://data.gameflare.com/games/11216/OsmGZssx2BUrzf-400-300.jpg", url: "https://distribution.gameflare.com/embed/platform-kid/", category: "arcade", provider: "GameFlare", rating: 4.2, plays: 34000 },
    { id: "gf_22", title: "Gibbets: Bow Master", description: "Save people by shooting ropes", thumbnail: "https://data.gameflare.com/games/9917/uUNqz79e8iyvyo-400-300.jpg", url: "https://distribution.gameflare.com/embed/gibbets-bow-master/", category: "arcade", provider: "GameFlare", rating: 4.4, plays: 61000 },
    { id: "gf_23", title: "Count Masters", description: "Running crowd battle game", thumbnail: "https://data.gameflare.com/games/9650/R6Zr5ry0oraX0K-400-300.jpg", url: "https://distribution.gameflare.com/embed/count-masters/", category: "arcade", provider: "GameFlare", rating: 4.3, plays: 73000 },
    { id: "gf_24", title: "Muscle Clicker", description: "Gym workout clicker game", thumbnail: "https://data.gameflare.com/games/10195/k1vJHDqki2BNpD-400-300.jpg", url: "https://distribution.gameflare.com/embed/muscle-clicker/", category: "arcade", provider: "GameFlare", rating: 4.1, plays: 48000 },
    // ── Racing ────────────────────────────────────────────────────────────────
    { id: "gf_25", title: "Truck and Police", description: "Police chase truck driving game", thumbnail: "https://data.gameflare.com/games/10124/c82bChkSLm6sHq-400-300.jpg", url: "https://distribution.gameflare.com/embed/truck-and-police/", category: "racing", provider: "GameFlare", rating: 4.2, plays: 44000 },
    { id: "gf_26", title: "Park It", description: "Parking precision driving game", thumbnail: "https://data.gameflare.com/games/10085/rSDkmwphJhs2Kg-400-300.jpg", url: "https://distribution.gameflare.com/embed/park-it/", category: "racing", provider: "GameFlare", rating: 4.0, plays: 32000 },
    { id: "gf_27", title: "The Crossing Barriers", description: "Car driving adventure", thumbnail: "https://data.gameflare.com/games/11081/GblhlpRnPWZxJz-400-300.jpg", url: "https://distribution.gameflare.com/embed/the-crossing-barriers-aid-deliverance/", category: "racing", provider: "GameFlare", rating: 4.1, plays: 26000 },
    // ── Strategy ──────────────────────────────────────────────────────────────
    { id: "gf_28", title: "Idle Medieval: Tower Defense", description: "Medieval tower defense strategy", thumbnail: "https://data.gameflare.com/games/10761/7vMe6yYD9K0Hbg-400-300.jpg", url: "https://distribution.gameflare.com/embed/idle-medieval-tower-defense/", category: "strategy", provider: "GameFlare", rating: 4.5, plays: 56000 },
    { id: "gf_29", title: "Arena Heroes Tactics", description: "Turn-based tactical combat", thumbnail: "https://data.gameflare.com/games/9795/7q6srttV4bM08G-400-300.jpg", url: "https://distribution.gameflare.com/embed/tournament-heroes-online/", category: "strategy", provider: "GameFlare", rating: 4.4, plays: 39000 },
    { id: "gf_30", title: "Mini Colony", description: "Build and manage your colony", thumbnail: "https://data.gameflare.com/games/9797/JAazjylEIycK1f-400-300.jpg", url: "https://distribution.gameflare.com/embed/mini-colony/", category: "strategy", provider: "GameFlare", rating: 4.3, plays: 28000 },
    { id: "gf_31", title: "Mini Farm", description: "Farm building simulation", thumbnail: "https://data.gameflare.com/games/9654/aFHyAf29qVoL6z-400-300.jpg", url: "https://distribution.gameflare.com/embed/mini-farm/", category: "strategy", provider: "GameFlare", rating: 4.2, plays: 35000 },
    { id: "gf_32", title: "My Land: King Defender", description: "Defend your kingdom from invaders", thumbnail: "https://data.gameflare.com/games/9945/FKi2m8qxNS1Wa2-400-300.jpg", url: "https://distribution.gameflare.com/embed/my-land-king-defender/", category: "strategy", provider: "GameFlare", rating: 4.5, plays: 47000 },
    // ── Adventure ─────────────────────────────────────────────────────────────
    { id: "gf_33", title: "Groomy Island", description: "Explore a mysterious island", thumbnail: "https://data.gameflare.com/games/10323/Evne5dBIpmjPbq-400-300.jpg", url: "https://distribution.gameflare.com/embed/groomy-island/", category: "adventure", provider: "GameFlare", rating: 4.3, plays: 31000 },
    { id: "gf_34", title: "Alone In The Evil Mansion", description: "Survive the haunted mansion", thumbnail: "https://data.gameflare.com/games/10975/Fy9CHO6jp5sAgm-400-300.jpg", url: "https://distribution.gameflare.com/embed/alone-in-the-evil-mansion/", category: "adventure", provider: "GameFlare", rating: 4.4, plays: 29000 },
    { id: "gf_35", title: "A Visit to Hell", description: "Survive the underworld", thumbnail: "https://data.gameflare.com/games/10098/kXBUM6bLsGdRmu-400-300.jpg", url: "https://distribution.gameflare.com/embed/a-visit-to-hell/", category: "adventure", provider: "GameFlare", rating: 4.1, plays: 25000 },
    { id: "gf_36", title: "Black Apocalypse", description: "Post-apocalyptic survival", thumbnail: "https://data.gameflare.com/games/9919/1qn8JCtGl7nKJF-400-300.jpg", url: "https://distribution.gameflare.com/embed/black-apocalypse/", category: "adventure", provider: "GameFlare", rating: 4.2, plays: 22000 },
    { id: "gf_37", title: "The Last Santa Warrior", description: "Santa fights to save Christmas", thumbnail: "https://data.gameflare.com/games/11188/CwnrU0AeqlC5ZR-400-300.jpg", url: "https://distribution.gameflare.com/embed/the-last-santa-warrior-winter-s-end/", category: "adventure", provider: "GameFlare", rating: 4.0, plays: 18000 },
    // ── Casual ────────────────────────────────────────────────────────────────
    { id: "gf_38", title: "House Builder", description: "Build houses in this construction sim", thumbnail: "https://data.gameflare.com/games/9635/KEBxruJxxtARPn-400-300.jpg", url: "https://distribution.gameflare.com/embed/house-builder/", category: "casual", provider: "GameFlare", rating: 4.3, plays: 58000 },
    { id: "gf_39", title: "Unicorn Family Simulator", description: "Live as a magical unicorn", thumbnail: "https://data.gameflare.com/games/9280/7sn9uDm8BP371E-400-300.jpg", url: "https://distribution.gameflare.com/embed/unicorn-family-simulator/", category: "casual", provider: "GameFlare", rating: 4.1, plays: 42000 },
    { id: "gf_40", title: "Tiger Family Simulator", description: "Tiger family life simulation", thumbnail: "https://data.gameflare.com/games/10346/RLGJbzyUkQnnci-400-300.jpg", url: "https://distribution.gameflare.com/embed/tiger-family-simulator/", category: "casual", provider: "GameFlare", rating: 4.0, plays: 37000 },
    { id: "gf_41", title: "Wolf Family Simulator", description: "Wolf pack life simulation", thumbnail: "https://data.gameflare.com/games/10330/npUGSdhrEZgm5i-400-300.jpg", url: "https://distribution.gameflare.com/embed/wolf-family-simulator/", category: "casual", provider: "GameFlare", rating: 4.2, plays: 33000 },
    { id: "gf_42", title: "Let\'s Fart Brandon", description: "Funny comedy game", thumbnail: "https://data.gameflare.com/games/9725/iQZQGEiitosCPT-400-300.jpg", url: "https://distribution.gameflare.com/embed/let-s-fart-brandon/", category: "casual", provider: "GameFlare", rating: 3.9, plays: 64000 },
    { id: "gf_43", title: "The Patriots Revolution", description: "Revolutionary war action", thumbnail: "https://data.gameflare.com/games/11371/FcB9Yo230qM5xb-400-300.jpg", url: "https://distribution.gameflare.com/embed/the-patriots-revolution/", category: "action", provider: "GameFlare", rating: 4.3, plays: 36000 },
    { id: "gf_44", title: "Assault on the Demonic Realm", description: "Battle demons in dark fantasy", thumbnail: "https://data.gameflare.com/games/11250/CndrH5i97GXlPD-400-300.jpg", url: "https://distribution.gameflare.com/embed/assault-on-the-demonic-realm/", category: "action", provider: "GameFlare", rating: 4.4, plays: 31000 },
    { id: "gf_45", title: "Rogue Sergeant", description: "Military stealth operations", thumbnail: "https://data.gameflare.com/games/11051/DISwttVoBQ0TDG-400-300.jpg", url: "https://distribution.gameflare.com/embed/rogue-sergeant-the-final-operation/", category: "action", provider: "GameFlare", rating: 4.2, plays: 27000 },
    { id: "gf_46", title: "Baby Sniper In Vietnam", description: "Sniper shooting game", thumbnail: "https://data.gameflare.com/games/10889/LWYmqXBDtWDfed-400-300.jpg", url: "https://distribution.gameflare.com/embed/baby-sniper-in-vietnam/", category: "action", provider: "GameFlare", rating: 4.0, plays: 39000 },
    { id: "gf_47", title: "Lion Soldier\'s Vengeance", description: "Lion warrior action game", thumbnail: "https://data.gameflare.com/games/10858/1fanYg2QlU5g4o-400-300.jpg", url: "https://distribution.gameflare.com/embed/lion-soldier-s-vengeance/", category: "action", provider: "GameFlare", rating: 4.1, plays: 24000 },
    { id: "gf_48", title: "Soldier of Ruins", description: "Post-apocalyptic soldier combat", thumbnail: "https://data.gameflare.com/games/10755/iVAR87ga0370cP-400-300.jpg", url: "https://distribution.gameflare.com/embed/soldier-of-ruins/", category: "action", provider: "GameFlare", rating: 4.3, plays: 32000 },
    { id: "gf_49", title: "Axe of the Ancients", description: "Dwarven axe throwing action", thumbnail: "https://data.gameflare.com/games/10715/UnDmdi8aH5sN79-400-300.jpg", url: "https://distribution.gameflare.com/embed/axe-of-the-ancients-dwarven-fury/", category: "action", provider: "GameFlare", rating: 4.2, plays: 28000 },
    { id: "gf_50", title: "Revenge and Justice", description: "Fight for justice in the streets", thumbnail: "https://data.gameflare.com/games/10692/xanQs9PKI0HCA0-400-300.jpg", url: "https://distribution.gameflare.com/embed/revenge-and-justice/", category: "action", provider: "GameFlare", rating: 4.1, plays: 26000 },
    { id: "gf_51", title: "Arena Baby Tournament", description: "Baby arena combat game", thumbnail: "https://data.gameflare.com/games/10654/Z5EzixzeOhZIPf-400-300.jpg", url: "https://distribution.gameflare.com/embed/arena-baby-tournament/", category: "action", provider: "GameFlare", rating: 3.8, plays: 43000 },
    { id: "gf_52", title: "Two Hands of Satan", description: "Dark magic combat game", thumbnail: "https://data.gameflare.com/games/10485/jktArhqYEuoHTy-400-300.jpg", url: "https://distribution.gameflare.com/embed/two-hands-of-satan/", category: "action", provider: "GameFlare", rating: 4.0, plays: 21000 },
    { id: "gf_53", title: "The Surreptitious Operation", description: "Stealth mission game", thumbnail: "https://data.gameflare.com/games/10448/uKpP5h9hkqkN9T-400-300.jpg", url: "https://distribution.gameflare.com/embed/the-surreptitious-operation/", category: "action", provider: "GameFlare", rating: 4.3, plays: 25000 },
    { id: "gf_54", title: "Volunteer to the Darkness", description: "Dark fantasy adventure", thumbnail: "https://data.gameflare.com/games/10414/22dml5zgV2oBwo-400-300.jpg", url: "https://distribution.gameflare.com/embed/volunteer-to-the-darkness/", category: "adventure", provider: "GameFlare", rating: 4.2, plays: 19000 },
    { id: "gf_55", title: "Seeking Justice In The Galaxy", description: "Space opera action adventure", thumbnail: "https://data.gameflare.com/games/10357/3JpaAgKYrqb84R-400-300.jpg", url: "https://distribution.gameflare.com/embed/seeking-justice-in-the-galaxy/", category: "action", provider: "GameFlare", rating: 4.1, plays: 23000 },
    { id: "gf_56", title: "Robot Wars: Rise of Resistance", description: "Robot combat strategy", thumbnail: "https://data.gameflare.com/games/10347/ksRBexcXRntQZv-400-300.jpg", url: "https://distribution.gameflare.com/embed/robot-wars-rise-of-resistance/", category: "action", provider: "GameFlare", rating: 4.3, plays: 35000 },
    { id: "gf_57", title: "The Lonesome Shooter", description: "Solo shooter survival", thumbnail: "https://data.gameflare.com/games/10303/C8oH72oj9MYOlg-400-300.jpg", url: "https://distribution.gameflare.com/embed/the-lonesome-shooter/", category: "action", provider: "GameFlare", rating: 4.0, plays: 28000 },
    { id: "gf_58", title: "The Scythian Warrior", description: "Ancient warrior combat", thumbnail: "https://data.gameflare.com/games/10295/5jvSHBgCnm6LWi-400-300.jpg", url: "https://distribution.gameflare.com/embed/the-scythian-warrior/", category: "action", provider: "GameFlare", rating: 4.2, plays: 22000 },
    { id: "gf_59", title: "The Malevolent Mansion", description: "Escape the evil mansion", thumbnail: "https://data.gameflare.com/games/10260/KruS750ESUIlRs-400-300.jpg", url: "https://distribution.gameflare.com/embed/the-malevolent-mansion-of-evil/", category: "adventure", provider: "GameFlare", rating: 4.1, plays: 20000 },
    { id: "gf_60", title: "A Sniper\'s Vengeance", description: "Precision sniper shooting", thumbnail: "https://data.gameflare.com/games/10226/2jiNQi8Yr1gOO3-400-300.jpg", url: "https://distribution.gameflare.com/embed/a-snipers-vengeance/", category: "action", provider: "GameFlare", rating: 4.4, plays: 38000 },
    { id: "gf_61", title: "Bullet and Cry in Space", description: "Space shooter combat", thumbnail: "https://data.gameflare.com/games/10222/FWK7ZX8W9bXcSx-400-300.jpg", url: "https://distribution.gameflare.com/embed/bullet-and-cry-in-space/", category: "action", provider: "GameFlare", rating: 4.0, plays: 26000 },
    { id: "gf_62", title: "Darkness in Spaceship", description: "Horror survival in space", thumbnail: "https://data.gameflare.com/games/10180/Zz8QBycoXBDSza-400-300.jpg", url: "https://distribution.gameflare.com/embed/darkness-in-spaceship/", category: "action", provider: "GameFlare", rating: 4.2, plays: 31000 },
    { id: "gf_63", title: "The Resistance Fighters", description: "Guerrilla warfare tactics", thumbnail: "https://data.gameflare.com/games/10151/ahvRGLknsPFx37-400-300.jpg", url: "https://distribution.gameflare.com/embed/the-resistance-fighters/", category: "action", provider: "GameFlare", rating: 4.3, plays: 29000 },
    { id: "gf_64", title: "Assault on the Evil Star", description: "Star Wars inspired space battle", thumbnail: "https://data.gameflare.com/games/10144/VdtbgOTQCtbqm1-400-300.jpg", url: "https://distribution.gameflare.com/embed/assault-on-the-evil-star/", category: "action", provider: "GameFlare", rating: 4.1, plays: 24000 },
    { id: "gf_65", title: "Kurofune Samurai", description: "Japanese samurai sword combat", thumbnail: "https://data.gameflare.com/games/10106/VxUjvDVmE9aQ9I-400-300.jpg", url: "https://distribution.gameflare.com/embed/kurofune-samurai/", category: "action", provider: "GameFlare", rating: 4.5, plays: 46000 },
    { id: "gf_66", title: "Board Boss", description: "Strategic board game challenge", thumbnail: "https://data.gameflare.com/games/10090/4lYjRdZ0W4K1Ds-400-300.jpg", url: "https://distribution.gameflare.com/embed/board-boss/", category: "puzzle", provider: "GameFlare", rating: 4.2, plays: 24000 },
    { id: "gf_67", title: "The Courage of an American Grandfather", description: "Heartwarming adventure story", thumbnail: "https://data.gameflare.com/games/10077/fUSTO2eWQpXYPj-400-300.jpg", url: "https://distribution.gameflare.com/embed/the-courage-of-an-american-grandfather/", category: "adventure", provider: "GameFlare", rating: 4.3, plays: 18000 },
    { id: "gf_68", title: "A Rifleman From Ireland", description: "Irish soldier shooting game", thumbnail: "https://data.gameflare.com/games/10064/kkKcBoJzBCLJNN-400-300.jpg", url: "https://distribution.gameflare.com/embed/a-rifleman-from-ireland/", category: "action", provider: "GameFlare", rating: 4.0, plays: 22000 },
    { id: "gf_69", title: "Soldier of Homeland: Sahara", description: "Desert warfare combat", thumbnail: "https://data.gameflare.com/games/10043/vxSxKgG1MRHOPt-400-300.jpg", url: "https://distribution.gameflare.com/embed/soldier-of-homeland-sahara/", category: "action", provider: "GameFlare", rating: 4.1, plays: 20000 },
    { id: "gf_70", title: "In Search of Wisdom", description: "Puzzle adventure game", thumbnail: "https://data.gameflare.com/games/10019/7eNyFomLC97573-400-300.jpg", url: "https://distribution.gameflare.com/embed/in-search-of-wisdom-and-salvation/", category: "adventure", provider: "GameFlare", rating: 4.2, plays: 17000 },
    { id: "gf_71", title: "Alone In The Evil Space Base", description: "Space horror survival", thumbnail: "https://data.gameflare.com/games/9990/SISDGc7FoBXtjm-400-300.jpg", url: "https://distribution.gameflare.com/embed/alone-in-the-evil-space-base/", category: "adventure", provider: "GameFlare", rating: 4.3, plays: 25000 },
    { id: "gf_72", title: "Soldier Of The Homeland", description: "Patriotic military shooter", thumbnail: "https://data.gameflare.com/games/9971/OvYnyxihUWsWBN-400-300.jpg", url: "https://distribution.gameflare.com/embed/soldier-of-the-homeland/", category: "action", provider: "GameFlare", rating: 4.0, plays: 21000 },
    { id: "gf_73", title: "Black Soldier of Rome", description: "Roman gladiator combat", thumbnail: "https://data.gameflare.com/games/9904/kOWHilWMZzhAnf-400-300.jpg", url: "https://distribution.gameflare.com/embed/black-soldier-of-rome/", category: "action", provider: "GameFlare", rating: 4.2, plays: 27000 },
    { id: "gf_74", title: "Mini Samurai Kurofune", description: "Mini samurai platform action", thumbnail: "https://data.gameflare.com/games/9890/O17pjqdeGHIlcj-400-300.jpg", url: "https://distribution.gameflare.com/embed/mini-samurai-kurofune/", category: "action", provider: "GameFlare", rating: 4.1, plays: 23000 },
    { id: "gf_75", title: "Gears of Babies", description: "Funny baby action game", thumbnail: "https://data.gameflare.com/games/9879/MMe1otm1r7rdXA-400-300.jpg", url: "https://distribution.gameflare.com/embed/gears-of-babies/", category: "casual", provider: "GameFlare", rating: 3.9, plays: 34000 },
    { id: "gf_76", title: "Security Breach", description: "Hacking security game", thumbnail: "https://data.gameflare.com/games/9796/gMo5KCTxB7iBAB-400-300.jpg", url: "https://distribution.gameflare.com/embed/security-breach/", category: "action", provider: "GameFlare", rating: 4.3, plays: 41000 },
    { id: "gf_77", title: "The Patriots: Fight and Freedom", description: "Patriotic combat adventure", thumbnail: "https://data.gameflare.com/games/9776/rqHngH5FbzYZjY-400-300.jpg", url: "https://distribution.gameflare.com/embed/the-patriots-fight-and-freedom/", category: "action", provider: "GameFlare", rating: 4.1, plays: 26000 },
    { id: "gf_78", title: "The Letter: Seeker Of Truths", description: "Mystery puzzle adventure", thumbnail: "https://data.gameflare.com/games/9758/fwqZaaB51v3klq-400-300.jpg", url: "https://distribution.gameflare.com/embed/the-letter-seeker-of-truths/", category: "adventure", provider: "GameFlare", rating: 4.4, plays: 20000 },
    { id: "gf_79", title: "Super Red", description: "Color-based platform action", thumbnail: "https://data.gameflare.com/games/9742/mJWCCAhPfqwlDq-400-300.jpg", url: "https://distribution.gameflare.com/embed/super-red/", category: "arcade", provider: "GameFlare", rating: 4.2, plays: 29000 },
    { id: "gf_80", title: "Squad Hero Tower", description: "Tower defense hero strategy", thumbnail: "https://data.gameflare.com/games/9732/XXj6xHixYVx5YP-400-300.jpg", url: "https://distribution.gameflare.com/embed/squad-hero-tower/", category: "strategy", provider: "GameFlare", rating: 4.3, plays: 37000 },
  ];

  const [activeGame, setActiveGame] = useState<PlayableGame | null>(null);
  const [activeGDGame, setActiveGDGame] = useState<GDGame | null>(null);
  const [showCreateCustomGame, setShowCreateCustomGame] = useState(false);

  const [showCreateWager, setShowCreateWager] = useState(false);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [showCreateTournament, setShowCreateTournament] = useState(false);

  const [challengeForm, setChallengeForm] = useState({
    title: "",
    category: "gaming",
    difficulty: "easy",
    reward: "",
    description: "",
  });
  const [challengeFormErrors, setChallengeFormErrors] = useState<Record<string, string>>({});
  const [challengeSubmitting, setChallengeSubmitting] = useState(false);

  const [tournamentForm, setTournamentForm] = useState({
    name: "",
    type: "daily",
    prize: "",
    max: "",
    start: "",
  });
  const [tournamentFormErrors, setTournamentFormErrors] = useState<Record<string, string>>({});
  const [tournamentSubmitting, setTournamentSubmitting] = useState(false);

  const currentUserId = "";

  const load = useCallback(async () => {
    setLoading(true);
    const [a, h, l, s, g, t, ch, lp] = await Promise.all([
      fetchActiveWagers(),
      fetchWagerHistory(),
      fetchLeaderboard(),
      fetchWagerStats(),
      fetchGames(),
      fetchTournaments(),
      fetchChallenges(),
      fetchLeaderboardPlayers(),
    ]);
    setActiveWagers(a);
    setHistory(h);
    setLeaderboard(l);
    setStats(s);
    setGames(g);
    setTournaments(t);
    setChallenges(ch);
    setLeaderboardPlayers(lp);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreateChallenge(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!challengeForm.title.trim()) errs.title = "Title is required";
    if (!challengeForm.description.trim()) errs.description = "Description is required";
    if (!challengeForm.reward || parseInt(challengeForm.reward) <= 0) errs.reward = "Reward must be > 0";
    setChallengeFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setChallengeSubmitting(true);
    try {
      await invoke("cmd_create_challenge", {
        title: challengeForm.title.trim(),
        category: challengeForm.category,
        difficulty: challengeForm.difficulty,
        rewardPoints: parseInt(challengeForm.reward),
        description: challengeForm.description.trim(),
      });
      setShowCreateChallenge(false);
      setChallengeForm({ title: "", category: "gaming", difficulty: "easy", reward: "", description: "" });
      load();
    } catch (err) {
      setChallengeFormErrors({ _submit: String(err) });
    } finally {
      setChallengeSubmitting(false);
    }
  }

  async function handleCreateTournament(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!tournamentForm.name.trim()) errs.name = "Name is required";
    if (!tournamentForm.prize || parseFloat(tournamentForm.prize) <= 0) errs.prize = "Prize pool must be > 0";
    if (!tournamentForm.max || parseInt(tournamentForm.max) <= 0) errs.max = "Max participants must be > 0";
    if (!tournamentForm.start) errs.start = "Start time is required";
    setTournamentFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setTournamentSubmitting(true);
    try {
      await invoke("cmd_create_tournament", {
        name: tournamentForm.name.trim(),
        type_: tournamentForm.type,
        prizePool: parseFloat(tournamentForm.prize),
        maxParticipants: parseInt(tournamentForm.max),
        startTime: new Date(tournamentForm.start).toISOString(),
      });
      setShowCreateTournament(false);
      setTournamentForm({ name: "", type: "daily", prize: "", max: "", start: "" });
      load();
    } catch (err) {
      setTournamentFormErrors({ _submit: String(err) });
    } finally {
      setTournamentSubmitting(false);
    }
  }

  async function handleJoinTournament(tournamentId: string) {
    try {
      await invoke("cmd_join_tournament", { tournamentId });
      load();
    } catch (err) {
      console.error("Failed to join tournament:", err);
    }
  }

  const filteredActive = activeWagers.filter((w) => categoryFilter === "all" || w.category === categoryFilter);
  const filteredHistory = history.filter((w) => categoryFilter === "all" || w.category === categoryFilter);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "wagers", label: "Wagers", icon: <Swords className="w-4 h-4" /> },
    { id: "games", label: "Games", icon: <Gamepad2 className="w-4 h-4" /> },
    { id: "tournaments", label: "Tournaments", icon: <Trophy className="w-4 h-4" /> },
    { id: "challenges", label: "Challenges", icon: <Zap className="w-4 h-4" /> },
    { id: "leaderboard", label: "Leaderboard", icon: <Crown className="w-4 h-4" /> },
  ];

  const showWagerFilter = tab === "wagers";

  return (
    <div className="min-h-screen bg-[#09090f] text-white">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Wagers &amp; Games</h1>
            <p className="text-sm text-slate-500 mt-0.5">Bet on outcomes, play games, compete in tournaments, climb the leaderboard</p>
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
              className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                tab === t.id ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Category filter (only for wagers tab) */}
        {showWagerFilter && (
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
            {tab === "wagers" && (
              <div>
                <StatsBar stats={stats} />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTab("wagers")}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-violet-600 text-white"
                    >
                      Active ({filteredActive.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab("wagers")}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white transition-colors"
                    >
                      History ({filteredHistory.length})
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateWager(!showCreateWager)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create Wager
                  </button>
                </div>

                {showCreateWager && (
                  <div className="mb-6 rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-white">New Wager</h3>
                      <button type="button" onClick={() => setShowCreateWager(false)} className="text-slate-500 hover:text-white text-xs">Cancel</button>
                    </div>
                    <CreateWagerForm onCreated={() => { setShowCreateWager(false); load(); }} />
                  </div>
                )}

                {filteredActive.length === 0 && !showCreateWager ? (
                  <div className="text-center py-16">
                    <div className="text-4xl mb-3">&#127919;</div>
                    <p className="text-sm text-slate-500">No active wagers</p>
                    <button type="button" onClick={() => setTab("wagers")} className="mt-3 text-xs text-violet-400 hover:text-violet-300 font-medium">
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

            {tab === "games" && !activeGame && !activeGDGame && !showCreateCustomGame && (
              <GamesTab
                games={games}
                webGames={webGames}
                onCreateCustomGame={() => setShowCreateCustomGame(true)}
                onPlayGDGame={(game) => setActiveGDGame(game)}
              />
            )}

            {tab === "games" && activeGDGame && (
              <GameDistributionPlayer
                game={activeGDGame}
                betAmount={0}
                onBack={() => setActiveGDGame(null)}
                onGameResult={(result) => {
                  console.log("GD Game result:", result);
                }}
              />
            )}

            {tab === "games" && activeGame && (
              <GameLauncher
                game={activeGame}
                onBack={() => setActiveGame(null)}
                onStatsUpdate={(stats) => {
                  // Update global stats if needed
                  console.log("Game stats:", stats);
                }}
              />
            )}

            {tab === "games" && showCreateCustomGame && (
              <CreateCustomGameView onBack={() => setShowCreateCustomGame(false)} />
            )}

            {tab === "tournaments" && (
              <TournamentsTab
                tournaments={tournaments}
                onJoin={async (id) => { await invoke("cmd_join_tournament", { tournamentId: id }); load(); }}
                showCreateForm={showCreateTournament}
                onToggleCreate={() => setShowCreateTournament(!showCreateTournament)}
                createForm={tournamentForm}
                setCreateForm={setTournamentForm}
                createFormErrors={tournamentFormErrors}
                onCreateSubmit={async (e) => {
                  e.preventDefault();
                  const errors: Record<string, string> = {};
                  if (!tournamentForm.name.trim()) errors.name = "Name required";
                  if (!tournamentForm.prize || parseFloat(tournamentForm.prize) <= 0) errors.prize = "Valid prize required";
                  if (!tournamentForm.max || parseInt(tournamentForm.max) <= 0) errors.max = "Max participants required";
                  if (!tournamentForm.start) errors.start = "Start time required";
                  setTournamentFormErrors(errors);
                  if (Object.keys(errors).length > 0) return;
                  setTournamentSubmitting(true);
                  try {
                    await invoke("cmd_create_tournament", {
                      name: tournamentForm.name.trim(),
                      type: tournamentForm.type,
                      prizePool: parseFloat(tournamentForm.prize),
                      maxParticipants: parseInt(tournamentForm.max),
                      startTime: new Date(tournamentForm.start).toISOString(),
                    });
                    setShowCreateTournament(false);
                    setTournamentForm({ name: "", type: "daily", prize: "", max: "", start: "" });
                    load();
                  } catch (err) {
                    setTournamentFormErrors({ general: String(err) });
                  } finally {
                    setTournamentSubmitting(false);
                  }
                }}
                createSubmitting={tournamentSubmitting}
              />
            )}

            {tab === "challenges" && (
              <ChallengesTab
                challenges={challenges}
                showCreateForm={showCreateChallenge}
                onToggleCreate={() => setShowCreateChallenge(!showCreateChallenge)}
                createForm={challengeForm}
                setCreateForm={setChallengeForm}
                createFormErrors={challengeFormErrors}
                onCreateSubmit={async (e) => {
                  e.preventDefault();
                  const errors: Record<string, string> = {};
                  if (!challengeForm.title.trim()) errors.title = "Title required";
                  if (!challengeForm.description.trim()) errors.description = "Description required";
                  if (!challengeForm.reward || parseFloat(challengeForm.reward) <= 0) errors.reward = "Valid reward required";
                  setChallengeFormErrors(errors);
                  if (Object.keys(errors).length > 0) return;
                  setChallengeSubmitting(true);
                  try {
                    await invoke("cmd_create_challenge", {
                      title: challengeForm.title.trim(),
                      category: challengeForm.category,
                      difficulty: challengeForm.difficulty,
                      reward: parseFloat(challengeForm.reward),
                      description: challengeForm.description.trim(),
                    });
                    setShowCreateChallenge(false);
                    setChallengeForm({ title: "", category: "gaming", difficulty: "easy", reward: "", description: "" });
                    load();
                  } catch (err) {
                    setChallengeFormErrors({ general: String(err) });
                  } finally {
                    setChallengeSubmitting(false);
                  }
                }}
                createSubmitting={challengeSubmitting}
              />
            )}

            {tab === "leaderboard" && <LeaderboardTab players={leaderboardPlayers} />}
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
