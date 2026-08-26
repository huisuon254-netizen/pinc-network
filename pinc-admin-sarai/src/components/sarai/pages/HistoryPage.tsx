import { useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Search, Download, Inbox, Coins, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft } from 'lucide-react';
import type { DepositOrder } from '../../../types/sarai';
import { useAppStore } from '../../../store/appStore';
import { useI18n } from '../../../i18n';

const formatAmount = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatTime = (ts: number) => {
  const d = new Date(ts * 1000);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const typeIcon: Record<string, React.ReactNode> = {
  deposit: <ArrowDownToLine size={14} />,
  withdrawal: <ArrowUpFromLine size={14} />,
  transfer: <ArrowRightLeft size={14} />,
  earning: <Coins size={14} />,
};

const typeColor: Record<string, string> = {
  deposit: 'var(--neon-green)',
  withdrawal: 'var(--neon-red)',
  transfer: 'var(--electric-blue)',
  earning: 'var(--soft-purple)',
};

export const statusBadge: Record<string, { bg: string; fg: string; border: string }> = {
  completed: { bg: 'rgba(57,255,20,0.1)', fg: 'var(--neon-green)', border: 'rgba(57,255,20,0.3)' },
  pending: { bg: 'rgba(255,230,0,0.1)', fg: 'var(--neon-yellow)', border: 'rgba(255,230,0,0.3)' },
  failed: { bg: 'rgba(255,34,85,0.1)', fg: 'var(--neon-red)', border: 'rgba(255,34,85,0.3)' },
  EscrowHeld: { bg: 'rgba(192,192,192,0.15)', fg: '#C0C0C0', border: 'rgba(192,192,192,0.4)' },
  PaymentConfirmed: { bg: 'rgba(192,192,192,0.15)', fg: '#C0C0C0', border: 'rgba(192,192,192,0.4)' },
  Disputed: { bg: 'rgba(255,34,85,0.15)', fg: 'var(--neon-red)', border: 'rgba(255,34,85,0.5)' },
  Cancelled: { bg: 'rgba(74,85,104,0.15)', fg: 'var(--text-muted)', border: 'rgba(74,85,104,0.3)' },
  Completed: { bg: 'rgba(57,255,20,0.1)', fg: 'var(--neon-green)', border: 'rgba(57,255,20,0.3)' },
  PendingPayment: { bg: 'rgba(255,230,0,0.1)', fg: 'var(--neon-yellow)', border: 'rgba(255,230,0,0.3)' },
};

interface UnifiedEntry {
  id: string;
  kind: 'tx' | 'p2p' | 'notif';
  type: string;
  amount: number;
  currency: string;
  status: string;
  from: string;
  to: string;
  timestamp: number;
  description: string;
  raw: any;
}

export default function HistoryPage() {
  const [search, setSearch] = useState('');
  const [txs, setTxs] = useState<any[]>([]);
  const [orders, setOrders] = useState<DepositOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();
  const notifications = useAppStore((s) => s.notifications);

  const load = async () => {
    setLoading(true);
    const [txRes, orderRes] = await Promise.allSettled([
      invoke<any[]>('cmd_get_transactions'),
      // Try new command, fallback to list via SQL-like command if not exists
      invoke<DepositOrder[]>('cmd_p2p_deposit_list').catch(async () => {
        try {
          return await invoke<DepositOrder[]>('cmd_p2p_agent_list_orders').catch(() => []);
        } catch {
          return [];
        }
      }),
    ]);
    if (txRes.status === 'fulfilled' && Array.isArray(txRes.value)) setTxs(txRes.value);
    // Also try get_wallet_history for richer history if available
    try {
      const hist = await invoke<any[]>('cmd_get_wallet_history').catch(() => null);
      if (Array.isArray(hist) && hist.length > txs.length) setTxs(hist as any);
    } catch {}
    if (orderRes.status === 'fulfilled' && Array.isArray(orderRes.value)) setOrders(orderRes.value as DepositOrder[]);
    // Fallback: try to fetch orders via direct query command if exists
    try {
      const alt = await invoke<DepositOrder[]>('cmd_p2p_list_deposit_orders').catch(() => null);
      if (Array.isArray(alt) && alt.length > 0) setOrders(alt);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const unified: UnifiedEntry[] = useMemo(() => {
    const txEntries: UnifiedEntry[] = txs.map((t: any) => {
      const type = String(t.type || t.tx_type || 'transfer').toLowerCase();
      const amount = Number(t.amount) || 0;
      const status = String(t.status || 'pending');
      const ts = Number(t.timestamp ?? t.created_at ?? t.sent_at ?? Date.now() / 1000);
      const currency = String(t.currency || t.currency_code || t.raw?.currency || t.memo?.match?.(/\b[A-Z]{3,6}\b/)?.[0] || (type === 'transfer' && t.description?.match?.(/\b(USD|KES|EUR|BTC|ETH|USDT|USDC|NGN|ZAR|INR|GBP|JPY)\b/)?.[0]) || 'PINC').toUpperCase();
      // Normalize to token symbol if present in raw
      const curFinal = String(t.currency || t.to_node && (t.currency) || currency).toUpperCase();
      return {
        id: String(t.id),
        kind: 'tx' as const,
        type,
        amount,
        currency: String(t.currency || t.raw?.currency || curFinal || 'PINC').toUpperCase(),
        status,
        from: String(t.from || t.from_node || ''),
        to: String(t.to || t.to_node || t.peer_id || ''),
        timestamp: ts,
        description: String(t.description || t.memo || (t.currency ? `${t.amount} ${t.currency} ${t.from || ''} → ${t.to || ''}` : `${t.from || ''} → ${t.to || ''}`)),
        raw: t,
      };
    });

    const p2pEntries: UnifiedEntry[] = orders.map((o) => ({
      id: o.id,
      kind: 'p2p' as const,
      type: 'deposit',
      amount: Number(o.total_amount ?? o.amount),
      currency: String(o.currency || 'USD').toUpperCase(),
      status: String(o.status),
      from: String(o.buyer_node_id),
      to: String(o.agent_id),
      timestamp: Number(o.created_at),
      description: `P2P ${o.currency} via ${o.agent_id} · escrow ${o.escrow_id || ''} · expires ${new Date(o.expires_at * 1000).toLocaleTimeString()}`,
      raw: o,
    }));

    const notifEntries: UnifiedEntry[] = (Array.isArray(notifications) ? notifications : []).map((n: any) => ({
      id: String(n.id),
      kind: 'notif' as const,
      type: String(n.category || n.type || 'notif'),
      amount: Number(n.amount || 0),
      currency: String(n.currency || n.raw?.currency || '').toUpperCase(),
      status: n.read ? 'completed' : 'pending',
      from: String(n.from_to || n.title || ''),
      to: '',
      timestamp: Number(n.timestamp || n.created_at || Date.now() / 1000),
      description: String(n.message || n.title || ''),
      raw: n,
    }));

    const all = [...txEntries, ...p2pEntries, ...notifEntries];
    all.sort((a, b) => b.timestamp - a.timestamp);
    return all;
  }, [txs, orders, notifications]);

  const filtered = useMemo(() => {
    if (!search.trim()) return unified;
    const q = search.toLowerCase();
    return unified.filter(
      (e) =>
        (e.description || '').toLowerCase().includes(q) ||
        (e.from || '').toLowerCase().includes(q) ||
        (e.to || '').toLowerCase().includes(q) ||
        (e.type || '').toLowerCase().includes(q) ||
        (e.id || '').toLowerCase().includes(q) ||
        (e.status || '').toLowerCase().includes(q) ||
        (e.currency || '').toLowerCase().includes(q) ||
        (e.raw?.currency || '').toLowerCase().includes(q)
    );
  }, [unified, search]);

  const exportCsv = () => {
    const header = ['id', 'kind', 'type', 'amount', 'status', 'from', 'to', 'timestamp', 'description'];
    const rows = filtered.map((e) => [e.id, e.kind, e.type, String(e.amount), e.status, e.from, e.to, String(e.timestamp), `"${String(e.description).replace(/"/g, '""')}"`]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sarai-history-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t('common.loading')}</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="pinc-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search unified timeline (transactions + p2p_deposit_orders + notifications)" style={{ paddingLeft: '2.25rem' }} />
        </div>
        <button className="pinc-btn" onClick={exportCsv} style={{ flexShrink: 0 }}>
          <Download size={14} /> Export
        </button>
      </div>

      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
        {filtered.length} entries · {txs.length} tx · {orders.length} p2p orders · {(notifications || []).length} notifications
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <Inbox size={32} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{search ? 'No matches' : 'No history yet'}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Unified timeline merges wallet transactions, escrow p2p orders and notifications.</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Kind', 'Type', 'Amount', 'Status', 'From / To', 'Description', 'Date'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '0.625rem 0.75rem',
                      textAlign: 'left',
                      color: 'var(--text-muted)',
                      fontWeight: 600,
                      fontSize: '0.65rem',
                      letterSpacing: '0.08em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const st = statusBadge[e.status] || statusBadge[e.status.toLowerCase()] || statusBadge.pending;
                const isP2p = e.kind === 'p2p';
                const col = typeColor[e.type] || (isP2p ? 'var(--neon-green)' : 'var(--text-muted)');
                const icon = typeIcon[e.type] || (isP2p ? <Coins size={10} /> : <Inbox size={10} />);
                return (
                  <tr key={`${e.kind}-${e.id}`} style={{ borderBottom: '1px solid var(--border)', background: isP2p && e.status === 'EscrowHeld' ? 'rgba(192,192,192,0.04)' : undefined }}>
                    <td style={{ padding: '0.625rem 0.75rem', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{e.kind}</td>
                    <td style={{ padding: '0.625rem 0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: `${col}15`,
                            border: `1px solid ${col}33`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: col,
                          }}
                        >
                          {icon}
                        </div>
                        <span style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{e.type}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'monospace', fontWeight: 600, color: e.type === 'deposit' || e.type === 'earning' ? 'var(--neon-green)' : e.amount < 0 ? 'var(--neon-red)' : 'var(--text-primary)' }}>
                      {formatAmount(Math.abs(e.amount))} <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 400 }}>{e.currency || e.raw?.currency || ''}</span>
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem' }}>
                      <span style={{ padding: '0.1rem 0.5rem', borderRadius: '3px', fontSize: '0.65rem', fontWeight: 600, background: st.bg, color: st.fg, border: `1px solid ${st.border}` }}>
                        {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '0.625rem 0.75rem',
                        color: 'var(--text-secondary)',
                        fontFamily: 'monospace',
                        fontSize: '0.7rem',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {e.from || '—'} → {e.to || '—'}
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem', color: 'var(--text-muted)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description || '—'}</td>
                    <td style={{ padding: '0.625rem 0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatTime(e.timestamp)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
