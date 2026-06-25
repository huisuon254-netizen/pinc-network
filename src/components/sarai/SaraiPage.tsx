import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, Coins,
  TrendingUp, Clock, Bell, History, Search, Download, User, Bitcoin,
  Building2, AlertCircle, CheckCircle2, XCircle, Filter, Eye,
  CreditCard, Send, Receipt, Banknote, CircleDollarSign, Inbox,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../../store/appStore';

type Tab = 'dashboard' | 'transactions' | 'agent' | 'notifications' | 'history';
type TxFilter = 'all' | 'deposit' | 'withdrawal' | 'transfer' | 'earning';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Wallet size={14} /> },
  { id: 'transactions', label: 'Transactions', icon: <Receipt size={14} /> },
  { id: 'agent', label: 'P2P Agent', icon: <User size={14} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={14} /> },
  { id: 'history', label: 'History', icon: <History size={14} /> },
];

const formatAmount = (n: number | null | undefined) => (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

const statusBadge: Record<string, { bg: string; fg: string; border: string }> = {
  completed: { bg: 'rgba(57,255,20,0.1)', fg: 'var(--neon-green)', border: 'rgba(57,255,20,0.3)' },
  pending: { bg: 'rgba(255,230,0,0.1)', fg: 'var(--neon-yellow)', border: 'rgba(255,230,0,0.3)' },
  failed: { bg: 'rgba(255,34,85,0.1)', fg: 'var(--neon-red)', border: 'rgba(255,34,85,0.3)' },
};

const notifIcon: Record<string, React.ReactNode> = {
  incoming: <ArrowDownToLine size={14} />,
  outgoing: <ArrowUpFromLine size={14} />,
  completed: <CheckCircle2 size={14} />,
  failed: <XCircle size={14} />,
};

const notifColor: Record<string, string> = {
  incoming: 'var(--neon-green)',
  outgoing: 'var(--neon-red)',
  completed: 'var(--neon-green)',
  failed: 'var(--neon-red)',
};

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <div style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }}>{icon}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{title}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</div>
    </div>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────
function DashboardTab({ balance, transactions }: { balance: { balance: number; pending: number; total_earned: number } | null; transactions: any[] }) {
  const deposits = transactions.filter(t => t.type === 'deposit').length;
  const withdrawals = transactions.filter(t => t.type === 'withdrawal').length;
  const transfers = transactions.filter(t => t.type === 'transfer').length;
  const earnings = transactions.filter(t => t.type === 'earning').length;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pinc-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>TOTAL BALANCE</div>
            <Wallet size={14} style={{ color: 'var(--neon-green)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--neon-green)', fontFamily: 'monospace' }} className="glow-green">
            {balance ? `$${formatAmount(balance.balance + balance.pending)}` : '$0.00'}
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>All funds combined</div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, rgba(57,255,20,0.2), rgba(57,255,20,0.5), rgba(57,255,20,0.2))' }} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="pinc-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>AVAILABLE BALANCE</div>
            <CircleDollarSign size={14} style={{ color: 'var(--electric-blue)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--electric-blue)', fontFamily: 'monospace' }}>
            {balance ? `$${formatAmount(balance.balance)}` : '$0.00'}
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Ready to use</div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, rgba(0,212,255,0.2), rgba(0,212,255,0.5), rgba(0,212,255,0.2))' }} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="pinc-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>PENDING BALANCE</div>
            <Clock size={14} style={{ color: 'var(--neon-yellow)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--neon-yellow)', fontFamily: 'monospace' }}>
            {balance ? `$${formatAmount(balance.pending)}` : '$0.00'}
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>In processing</div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, rgba(255,230,0,0.2), rgba(255,230,0,0.5), rgba(255,230,0,0.2))' }} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="pinc-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>TOTAL EARNED</div>
            <TrendingUp size={14} style={{ color: 'var(--soft-purple)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--soft-purple)', fontFamily: 'monospace' }}>
            {balance ? `$${formatAmount(balance.total_earned)}` : '$0.00'}
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Lifetime earnings</div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, rgba(168,85,247,0.2), rgba(168,85,247,0.5), rgba(168,85,247,0.2))' }} />
        </motion.div>
      </div>

      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>TRANSACTION COUNTS</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
        {[
          { label: 'Deposits', count: deposits, icon: <ArrowDownToLine size={14} />, color: 'var(--neon-green)' },
          { label: 'Withdrawals', count: withdrawals, icon: <ArrowUpFromLine size={14} />, color: 'var(--neon-red)' },
          { label: 'Transfers', count: transfers, icon: <ArrowRightLeft size={14} />, color: 'var(--electric-blue)' },
          { label: 'Earnings', count: earnings, icon: <Coins size={14} />, color: 'var(--soft-purple)' },
        ].map((item) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="pinc-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${item.color}15`, border: `1px solid ${item.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: item.color, fontFamily: 'monospace' }}>{item.count}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{item.label}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Transactions Tab ─────────────────────────────────────────────────────────
function TransactionsTab({ transactions }: { transactions: any[] }) {
  const [txFilter, setTxFilter] = useState<TxFilter>('all');
  const filtered = useMemo(() => txFilter === 'all' ? transactions : transactions.filter(t => t.type === txFilter), [transactions, txFilter]);

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
        {(['all', 'deposit', 'withdrawal', 'transfer', 'earning'] as TxFilter[]).map((f) => (
          <button key={f} onClick={() => setTxFilter(f)} style={{
            flex: 1, padding: '0.4rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
            background: txFilter === f ? 'var(--electric-blue)' : 'transparent',
            color: txFilter === f ? 'var(--bg-primary)' : 'var(--text-muted)',
            border: 'none', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.05em',
          }}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={txFilter} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
          {filtered.length === 0 ? (
            <EmptyState icon={<Inbox size={40} />} title="No transactions yet" subtitle="Your transaction history will appear here" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {filtered.map((tx) => {
                const st = statusBadge[tx.status] || statusBadge.pending;
                return (
                  <div key={tx.id} className="pinc-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${typeColor[tx.type]}15`, border: `1px solid ${typeColor[tx.type]}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: typeColor[tx.type], flexShrink: 0 }}>
                      {typeIcon[tx.type] || <Coins size={14} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{tx.type}</span>
                        <span style={{ padding: '0.1rem 0.5rem', borderRadius: '3px', fontSize: '0.65rem', fontWeight: 600, background: st.bg, color: st.fg, border: `1px solid ${st.border}` }}>
                          {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tx.description || `${tx.from || '—'} → ${tx.to || '—'}`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'monospace', color: tx.type === 'deposit' || tx.type === 'earning' ? 'var(--neon-green)' : 'var(--neon-red)' }}>
                        {tx.type === 'deposit' || tx.type === 'earning' ? '+' : '-'}${formatAmount(tx.amount)}
                      </div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{formatTime(tx.timestamp)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── P2P Agent Tab ────────────────────────────────────────────────────────────
function P2PAgentTab() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      {/* Deposit Section */}
      <div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>DEPOSIT FUNDS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            { title: 'Agent Deposit', desc: 'Deposit via verified P2P agent. Cash or bank transfer processed within 15 minutes.', icon: <User size={20} />, color: 'var(--neon-green)' },
            { title: 'Crypto Deposit', desc: 'Send BTC, ETH, or USDT to your PINC wallet address. Confirmations in 10-30 minutes.', icon: <Bitcoin size={20} />, color: 'var(--electric-blue)' },
            { title: 'Internal Transfer', desc: 'Transfer between PINC wallets instantly with zero fees.', icon: <ArrowRightLeft size={20} />, color: 'var(--soft-purple)' },
          ].map((item) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="pinc-card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = item.color)} onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: '8px', background: `${item.color}15`, border: `1px solid ${item.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{item.title}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Withdrawal Section */}
      <div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>WITHDRAW FUNDS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            { title: 'Agent Withdrawal', desc: 'Cash out via verified P2P agent. Pickup scheduled within 1-24 hours.', icon: <Banknote size={20} />, color: 'var(--neon-red)', disabled: false },
            { title: 'Crypto Withdrawal', desc: 'Withdraw to external BTC, ETH, or USDT wallet. Processed within 30 minutes.', icon: <Bitcoin size={20} />, color: 'var(--neon-yellow)', disabled: false },
            { title: 'Bank Withdrawal', desc: 'Direct bank transfer. Currently in development.', icon: <Building2 size={20} />, color: 'var(--text-muted)', disabled: true },
          ].map((item) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="pinc-card" style={{ cursor: item.disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: item.disabled ? 0.5 : 1 }}
              onMouseEnter={e => { if (!item.disabled) e.currentTarget.style.borderColor = item.color; }} onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: '8px', background: `${item.color}15`, border: `1px solid ${item.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</span>
                    {item.disabled && <span className="badge badge-pending" style={{ fontSize: '0.55rem' }}>Coming Soon</span>}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────
function NotificationsTab({ notifications }: { notifications: any[] }) {
  return (
    <div>
      {notifications.length === 0 ? (
        <EmptyState icon={<Bell size={40} />} title="No notifications" subtitle="Wallet notifications will appear here" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {notifications.map((n) => {
            const color = notifColor[n.type] || 'var(--text-muted)';
            return (
              <div key={n.id} className="pinc-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderLeft: n.read ? '1px solid var(--border)' : `3px solid ${color}` }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${color}15`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                  {notifIcon[n.type] || <AlertCircle size={14} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{n.type}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'monospace', color }}>
                      {n.type === 'incoming' ? '+' : n.type === 'outgoing' ? '-' : ''}${formatAmount(n.amount)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{n.from_to || '—'}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{formatTime(n.timestamp)}</div>
                  {!n.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--electric-blue)', marginTop: '4px', marginLeft: 'auto' }} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────
function HistoryTab({ history }: { history: any[] }) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    if (!search.trim()) return history;
    const q = search.toLowerCase();
    return history.filter(t =>
      (t.description || '').toLowerCase().includes(q) ||
      (t.from || '').toLowerCase().includes(q) ||
      (t.to || '').toLowerCase().includes(q) ||
      (t.type || '').toLowerCase().includes(q) ||
      (t.id || '').toLowerCase().includes(q)
    );
  }, [history, search]);

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="pinc-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions..." style={{ paddingLeft: '2.25rem' }} />
        </div>
        <button className="pinc-btn" style={{ flexShrink: 0 }}>
          <Download size={14} /> Export
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Search size={40} />} title="No history found" subtitle={search ? 'Try a different search term' : 'Transaction history will appear here'} />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Type', 'Amount', 'Status', 'From / To', 'Description', 'Date'].map(h => (
                  <th key={h} style={{ padding: '0.625rem 0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.65rem', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => {
                const st = statusBadge[tx.status] || statusBadge.pending;
                return (
                  <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.625rem 0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${typeColor[tx.type]}15`, border: `1px solid ${typeColor[tx.type]}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: typeColor[tx.type] }}>
                          {typeIcon[tx.type] || <Coins size={10} />}
                        </div>
                        <span style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{tx.type}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'monospace', fontWeight: 600, color: tx.type === 'deposit' || tx.type === 'earning' ? 'var(--neon-green)' : 'var(--neon-red)' }}>
                      {tx.type === 'deposit' || tx.type === 'earning' ? '+' : '-'}${formatAmount(tx.amount)}
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem' }}>
                      <span style={{ padding: '0.1rem 0.5rem', borderRadius: '3px', fontSize: '0.65rem', fontWeight: 600, background: st.bg, color: st.fg, border: `1px solid ${st.border}` }}>
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.7rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.from || '—'} → {tx.to || '—'}
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem', color: 'var(--text-muted)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.description || '—'}
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatTime(tx.timestamp)}</td>
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SaraiPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [balance, setBalance] = useState<{ balance: number; pending: number; total_earned: number } | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [b, txs, hist] = await Promise.allSettled([
          invoke<{ balance: number; pending: number; total_earned: number }>('cmd_get_wallet_balance'),
          invoke<any[]>('cmd_get_transactions'),
          invoke<any[]>('cmd_get_wallet_history'),
        ]);
        if (b.status === 'fulfilled') setBalance(b.value);
        if (txs.status === 'fulfilled') setTransactions(txs.value);
        if (hist.status === 'fulfilled') setHistory(hist.value);

        // Notifications may not be wallet-specific; load from store or empty
        try {
          const store = useAppStore.getState();
          if (store.notifications?.length) {
            setNotifications(store.notifications);
          }
        } catch {}
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '0.25rem' }}>WALLET SYSTEM</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>SARAI</div>
          <span className="badge badge-info">PHASE 7</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '6px', border: '1px solid var(--border)', overflowX: 'auto' }}>
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', borderRadius: '4px',
            fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.03em', whiteSpace: 'nowrap',
            background: activeTab === tab.id ? 'var(--electric-blue)' : 'transparent',
            color: activeTab === tab.id ? 'var(--bg-primary)' : 'var(--text-muted)',
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
          }}>
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading wallet data...</div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <DashboardTab balance={balance} transactions={transactions} />}
              {activeTab === 'transactions' && <TransactionsTab transactions={transactions} />}
              {activeTab === 'agent' && <P2PAgentTab />}
              {activeTab === 'notifications' && <NotificationsTab notifications={notifications} />}
              {activeTab === 'history' && <HistoryTab history={history} />}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
