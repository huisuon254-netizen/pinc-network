import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, Coins,
  TrendingUp, Clock, Bell, History, Search, Download, User, Bitcoin,
  Building2, AlertCircle, CheckCircle2, XCircle, Globe, Smartphone,
  CreditCard, Send, Receipt, Banknote, CircleDollarSign, Inbox,
  Landmark, ExternalLink, Shield, QrCode, Copy, Lock, Users,
  MessageSquare, Zap, Tag, Euro, DollarSign, MessageCircle,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../../store/appStore';

type Tab = 'dashboard' | 'transactions' | 'payments' | 'crypto' | 'escrow' | 'agent' | 'notifications' | 'history';
type TxFilter = 'all' | 'deposit' | 'withdrawal' | 'transfer' | 'earning';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Wallet size={14} /> },
  { id: 'transactions', label: 'Transactions', icon: <Receipt size={14} /> },
  { id: 'payments', label: 'Payment Methods', icon: <CreditCard size={14} /> },
  { id: 'crypto', label: 'Crypto', icon: <Bitcoin size={14} /> },
  { id: 'escrow', label: 'Escrow', icon: <Shield size={14} /> },
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

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <div style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }}>{icon}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{title}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</div>
    </div>
  );
}

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

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  countries: string;
  fee: string;
  speed: string;
  type: 'deposit' | 'withdrawal' | 'both';
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'wise', name: 'Wise', icon: <Globe size={18} />, color: '#00b9ff', description: 'Low-cost consumer transfers. Bank transfer/debit card with low fixed + FX fees.', countries: '40+ countries', fee: 'Low fixed + FX', speed: '1-2 days', type: 'both' },
  { id: 'remitly', name: 'Remitly', icon: <Send size={18} />, color: '#4caf50', description: 'Global family remittances. Bank/cash/wallet delivery with tiered speed pricing.', countries: '100+ countries', fee: 'Tiered', speed: 'Minutes-days', type: 'both' },
  { id: 'revolut', name: 'Revolut', icon: <Smartphone size={18} />, color: '#eb008b', description: 'Digital banking & travel. In-app/bank transfer with plan-based fees.', countries: '30+ countries', fee: 'Plan-based', speed: 'Instant', type: 'both' },
  { id: 'paypal', name: 'PayPal', icon: <CreditCard size={18} />, color: '#003087', description: 'Quick P2P between users. Digital wallet with variable + FX fees.', countries: '200+ countries', fee: 'Variable + FX', speed: 'Instant', type: 'both' },
  { id: 'connectpay', name: 'ConnectPay', icon: <Euro size={18} />, color: '#6c5ce7', description: 'Scalable European platforms. SEPA/SWIFT/bulk with custom volume pricing.', countries: '80+ countries', fee: 'Custom volume', speed: '1-2 days', type: 'both' },
  { id: 'wisebiz', name: 'Wise Business', icon: <Building2 size={18} />, color: '#0a6e4a', description: 'International SMBs. Bank transfer with low fixed + FX fees.', countries: '40+ countries', fee: 'Low fixed + FX', speed: '1-2 days', type: 'both' },
  { id: 'airwallex', name: 'Airwallex', icon: <Globe size={18} />, color: '#0052ff', description: 'Scaling tech & SaaS. Bank/API routing with variable fees.', countries: '60+ countries', fee: 'Variable', speed: '1-3 days', type: 'both' },
  { id: 'payoneer', name: 'Payoneer', icon: <Landmark size={18} />, color: '#ff6600', description: 'Freelancers & marketplaces. Receiving accounts with variable fees.', countries: '150+ countries', fee: 'Variable', speed: '1-3 days', type: 'both' },
  { id: 'ofx', name: 'OFX', icon: <ArrowRightLeft size={18} />, color: '#005b96', description: 'International transfers. Bank transfer with $0 fee on transfers >$10k.', countries: '190+ countries', fee: '$0 (>$10k)', speed: '1-3 days', type: 'withdrawal' },
];

function PaymentsTab() {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState('');
  const [txType, setTxType] = useState<'deposit' | 'withdrawal'>('deposit');

  const handleSubmit = async () => {
    if (!selectedMethod || !amount) return;
    try {
      await invoke('cmd_create_payment', { provider: selectedMethod.id, type: txType, amount: parseFloat(amount) });
      setSelectedMethod(null);
      setAmount('');
    } catch {}
  };

  return (
    <div>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>PAYMENT PROVIDERS</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
        All major payment providers integrated as real deposit and withdrawal gateways.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
        {PAYMENT_METHODS.map((method, i) => (
          <motion.div key={method.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            onClick={() => { setSelectedMethod(method); setTxType(method.type === 'withdrawal' ? 'withdrawal' : 'deposit'); }}
            className="pinc-card" style={{ cursor: 'pointer', padding: '1.25rem', transition: 'all 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = method.color)} onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '10px', background: `${method.color}15`, border: `1px solid ${method.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: method.color, flexShrink: 0 }}>
                {method.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{method.name}</div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: '3px', background: method.type === 'deposit' ? 'rgba(57,255,20,0.1)' : method.type === 'withdrawal' ? 'rgba(255,34,85,0.1)' : 'rgba(0,212,255,0.1)', color: method.type === 'deposit' ? 'var(--neon-green)' : method.type === 'withdrawal' ? 'var(--neon-red)' : 'var(--electric-blue)', textTransform: 'capitalize' }}>
                    {method.type}
                  </span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{method.countries}</span>
                </div>
              </div>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>{method.description}</div>
            <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.65rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
              <div><span style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}>FEE</span><br /><span style={{ color: 'var(--neon-cyan)', fontWeight: 600 }}>{method.fee}</span></div>
              <div><span style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}>SPEED</span><br /><span style={{ color: 'var(--neon-green)', fontWeight: 600 }}>{method.speed}</span></div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedMethod && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="pinc-card" style={{ padding: '1.5rem', width: 420, maxWidth: '90vw' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '10px', background: `${selectedMethod.color}15`, border: `1px solid ${selectedMethod.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: selectedMethod.color }}>
                    {selectedMethod.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedMethod.name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{selectedMethod.countries} · {selectedMethod.speed} speed</div>
                  </div>
                </div>
                <button onClick={() => setSelectedMethod(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.3rem', padding: '0.25rem' }}>×</button>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>{selectedMethod.description}</div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <div>Fee</div>
                  <div style={{ color: 'var(--neon-cyan)', fontWeight: 600, fontSize: '0.8rem' }}>{selectedMethod.fee}</div>
                </div>
                <div style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <div>Speed</div>
                  <div style={{ color: 'var(--neon-green)', fontWeight: 600, fontSize: '0.8rem' }}>{selectedMethod.speed}</div>
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>AMOUNT (USD)</label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input className="pinc-input" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" style={{ width: '100%', fontSize: '1rem', paddingLeft: '2rem' }} />
                </div>
              </div>
              {selectedMethod.type === 'both' && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <button onClick={() => setTxType('deposit')} style={{
                    flex: 1, padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                    background: txType === 'deposit' ? 'var(--neon-green)' : 'transparent',
                    color: txType === 'deposit' ? 'var(--bg-primary)' : 'var(--text-muted)',
                    border: txType === 'deposit' ? 'none' : '1px solid var(--border)',
                    transition: 'all 0.2s',
                  }}><ArrowDownToLine size={14} style={{ marginRight: '0.375rem', verticalAlign: 'middle' }} /> Deposit</button>
                  <button onClick={() => setTxType('withdrawal')} style={{
                    flex: 1, padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                    background: txType === 'withdrawal' ? 'var(--neon-red)' : 'transparent',
                    color: txType === 'withdrawal' ? 'var(--bg-primary)' : 'var(--text-muted)',
                    border: txType === 'withdrawal' ? 'none' : '1px solid var(--border)',
                    transition: 'all 0.2s',
                  }}><ArrowUpFromLine size={14} style={{ marginRight: '0.375rem', verticalAlign: 'middle' }} /> Withdraw</button>
                </div>
              )}
              <button className="pinc-btn pinc-btn-primary" onClick={handleSubmit} style={{ width: '100%', fontSize: '0.8rem', padding: '0.7rem' }}>
                {txType === 'deposit' ? <ArrowDownToLine size={14} /> : <ArrowUpFromLine size={14} />}
                {' '}{txType === 'deposit' ? 'Deposit' : 'Withdraw'} via {selectedMethod.name}
              </button>
              <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                <a href="#" style={{ fontSize: '0.65rem', color: 'var(--electric-blue)', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                  <ExternalLink size={10} /> Visit {selectedMethod.name} website
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CryptoTab() {
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [cryptoSide, setCryptoSide] = useState<'deposit' | 'withdrawal'>('deposit');
  const [selectedCoin, setSelectedCoin] = useState<'BTC' | 'ETH' | 'USDT'>('BTC');
  const [copiedAddr, setCopiedAddr] = useState('');

  const wallets: Record<string, { address: string; network: string; min: string; fee: string }> = {
    BTC: { address: 'bc1q5arx2g9j0y0z8xq4n3m7p6k2j9f8d7s6h5j4k3', network: 'Bitcoin (BTC)', min: '0.001 BTC', fee: '0.0005 BTC' },
    ETH: { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18', network: 'Ethereum (ERC-20)', min: '0.01 ETH', fee: '0.003 ETH' },
    USDT: { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18', network: 'Ethereum (ERC-20)', min: '10 USDT', fee: '5 USDT' },
  };

  const coinColors: Record<string, string> = { BTC: '#f7931a', ETH: '#627eea', USDT: '#26a17b' };

  const copyAddr = (coin: string) => {
    navigator.clipboard.writeText(wallets[coin].address);
    setCopiedAddr(coin);
    setTimeout(() => setCopiedAddr(''), 2000);
  };

  const handleCryptoSubmit = async () => {
    if (!cryptoAmount) return;
    try {
      await invoke('cmd_crypto_transaction', { coin: selectedCoin, type: cryptoSide, amount: parseFloat(cryptoAmount) });
      setCryptoAmount('');
    } catch {}
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>CRYPTO DEPOSIT</div>
          <div className="pinc-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              {(['BTC', 'ETH', 'USDT'] as const).map((coin) => (
                <button key={coin} onClick={() => { setSelectedCoin(coin); setCryptoSide('deposit'); }} style={{
                  flex: 1, padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                  background: selectedCoin === coin && cryptoSide === 'deposit' ? `${coinColors[coin]}22` : 'transparent',
                  color: selectedCoin === coin && cryptoSide === 'deposit' ? coinColors[coin] : 'var(--text-muted)',
                  border: selectedCoin === coin && cryptoSide === 'deposit' ? `1px solid ${coinColors[coin]}44` : '1px solid var(--border)',
                  fontFamily: 'monospace', transition: 'all 0.2s',
                }}>{coin}</button>
              ))}
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '0.35rem' }}>{selectedCoin} WALLET ADDRESS</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ flex: 1, padding: '0.6rem 0.75rem', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {wallets[selectedCoin].address}
                </div>
                <button onClick={() => copyAddr(selectedCoin)} style={{
                  padding: '0.4rem 0.75rem', borderRadius: '6px', background: `${coinColors[selectedCoin]}15`, border: `1px solid ${coinColors[selectedCoin]}33`,
                  color: coinColors[selectedCoin], cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, transition: 'all 0.2s',
                }}>
                  {copiedAddr === selectedCoin ? 'Copied!' : <><Copy size={12} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} /> Copy</>}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <div style={{ width: 120, height: 120, borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.25rem' }}>
                <QrCode size={48} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>QR Code</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              <div style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '4px', background: 'var(--bg-secondary)' }}>
                Network: <span style={{ color: 'var(--text-secondary)' }}>{wallets[selectedCoin].network}</span>
              </div>
              <div style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '4px', background: 'var(--bg-secondary)' }}>
                Min: <span style={{ color: 'var(--text-secondary)' }}>{wallets[selectedCoin].min}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>CRYPTO WITHDRAWAL</div>
          <div className="pinc-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              {(['BTC', 'ETH', 'USDT'] as const).map((coin) => (
                <button key={coin} onClick={() => { setSelectedCoin(coin); setCryptoSide('withdrawal'); }} style={{
                  flex: 1, padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                  background: selectedCoin === coin && cryptoSide === 'withdrawal' ? `${coinColors[coin]}22` : 'transparent',
                  color: selectedCoin === coin && cryptoSide === 'withdrawal' ? coinColors[coin] : 'var(--text-muted)',
                  border: selectedCoin === coin && cryptoSide === 'withdrawal' ? `1px solid ${coinColors[coin]}44` : '1px solid var(--border)',
                  fontFamily: 'monospace', transition: 'all 0.2s',
                }}>{coin}</button>
              ))}
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>DESTINATION ADDRESS</label>
              <input className="pinc-input" placeholder="Enter recipient wallet address" style={{ width: '100%', fontSize: '0.75rem', fontFamily: 'monospace' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>AMOUNT ({selectedCoin})</label>
              <input className="pinc-input" type="number" value={cryptoAmount} onChange={e => setCryptoAmount(e.target.value)} placeholder={`Min ${wallets[selectedCoin].min}`} style={{ width: '100%', fontSize: '0.9rem', fontFamily: 'monospace' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              <div style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '4px', background: 'var(--bg-secondary)' }}>
                Fee: <span style={{ color: 'var(--neon-red)' }}>{wallets[selectedCoin].fee}</span>
              </div>
              <div style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '4px', background: 'var(--bg-secondary)' }}>
                Network: <span style={{ color: 'var(--text-secondary)' }}>{wallets[selectedCoin].network}</span>
              </div>
            </div>
            <button className="pinc-btn" onClick={handleCryptoSubmit} style={{ width: '100%', fontSize: '0.8rem', padding: '0.7rem', color: 'var(--neon-red)', borderColor: 'var(--neon-red)' }}>
              <ArrowUpFromLine size={14} /> Withdraw {selectedCoin}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EscrowTab() {
  const [escrowStep, setEscrowStep] = useState<'create' | 'fund' | 'release' | 'dispute'>('create');
  const [escrowAmount, setEscrowAmount] = useState('');
  const [counterparty, setCounterparty] = useState('');

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {([{ id: 'create', label: 'Create', icon: <Lock size={14} /> }, { id: 'fund', label: 'Fund', icon: <ArrowDownToLine size={14} /> }, { id: 'release', label: 'Release', icon: <CheckCircle2 size={14} /> }, { id: 'dispute', label: 'Dispute', icon: <AlertCircle size={14} /> }] as const).map((step) => (
          <button key={step.id} onClick={() => setEscrowStep(step.id)} style={{
            flex: 1, padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
            background: escrowStep === step.id ? 'var(--electric-blue)' : 'transparent',
            color: escrowStep === step.id ? 'var(--bg-primary)' : 'var(--text-muted)',
            border: escrowStep === step.id ? 'none' : '1px solid var(--border)',
            transition: 'all 0.2s',
          }}>{step.icon} {step.label}</button>
        ))}
      </div>

      <motion.div key={escrowStep} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {escrowStep === 'create' && (
          <div className="pinc-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--electric-blue)' }}>
                <Shield size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>New Escrow Transaction</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Secure P2P transaction with multi-signature release</div>
              </div>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>COUNTERPARTY PINC ID</label>
              <input className="pinc-input" value={counterparty} onChange={e => setCounterparty(e.target.value)} placeholder="Enter recipient PINC ID or username" style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>AMOUNT (USD)</label>
              <input className="pinc-input" type="number" value={escrowAmount} onChange={e => setEscrowAmount(e.target.value)} placeholder="0.00" style={{ width: '100%', fontSize: '1rem' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>FEES</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)', fontWeight: 600 }}>0.5% ($--.--)</div>
              </div>
              <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>TIMELOCK</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--neon-yellow)', fontWeight: 600 }}>24 hours</div>
              </div>
            </div>

            <button className="pinc-btn pinc-btn-primary" style={{ width: '100%', fontSize: '0.8rem', padding: '0.7rem' }}>
              <Shield size={14} /> Create Escrow Contract
            </button>

            <div style={{ marginTop: '1rem', fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
              Funds are held in smart contract. Release requires both party signatures or arbitrator ruling.
            </div>
          </div>
        )}

        {escrowStep === 'fund' && (
          <div className="pinc-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-green)' }}>
                <ArrowDownToLine size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Fund Escrow #PINC-742</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Deposit funds to activate the contract</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', padding: '0.75rem', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Contract Amount</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>$250.00</div>
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Your Balance</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neon-green)', fontFamily: 'monospace' }}>$1,234.56</div>
              </div>
            </div>
            <button className="pinc-btn pinc-btn-primary" style={{ width: '100%', fontSize: '0.8rem', padding: '0.7rem' }}>
              <ArrowDownToLine size={14} /> Fund Escrow ($250.00)
            </button>
          </div>
        )}

        {escrowStep === 'release' && (
          <div className="pinc-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-green)' }}>
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Release Funds</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Confirm delivery and release payment</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {[
                { label: 'Contract ID', value: 'PINC-742', color: 'var(--electric-blue)' },
                { label: 'Amount Held', value: '$250.00', color: 'var(--neon-green)' },
                { label: 'Counterparty', value: 'node_8f3a...b2c1', color: 'var(--text-secondary)' },
                { label: 'Timelock Remaining', value: '18h 42m', color: 'var(--neon-yellow)' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '4px', background: 'var(--bg-secondary)', fontSize: '0.7rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                  <span style={{ color: item.color, fontWeight: 600, fontFamily: 'monospace' }}>{item.value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="pinc-btn" style={{ flex: 1, fontSize: '0.75rem', color: 'var(--neon-red)', borderColor: 'var(--neon-red)' }}>
                <XCircle size={14} /> Dispute
              </button>
              <button className="pinc-btn pinc-btn-primary" style={{ flex: 1, fontSize: '0.75rem' }}>
                <CheckCircle2 size={14} /> Release Payment
              </button>
            </div>
          </div>
        )}

        {escrowStep === 'dispute' && (
          <div className="pinc-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'rgba(255,34,85,0.1)', border: '1px solid rgba(255,34,85,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-red)' }}>
                <AlertCircle size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Raise Dispute</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Escrow #PINC-742 · 1 dispute in progress</div>
              </div>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>DISPUTE REASON</label>
              <select className="pinc-input" style={{ width: '100%', fontSize: '0.75rem' }}>
                <option>Item not received</option>
                <option>Item not as described</option>
                <option>Counterparty unresponsive</option>
                <option>Fraudulent activity</option>
                <option>Other</option>
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>EVIDENCE / NOTES</label>
              <textarea className="pinc-input" rows={4} placeholder="Describe the issue and provide any evidence..." style={{ width: '100%', fontSize: '0.75rem', fontFamily: 'inherit', resize: 'vertical' }} />
            </div>
            <button className="pinc-btn" style={{ width: '100%', fontSize: '0.8rem', padding: '0.7rem', color: 'var(--neon-red)', borderColor: 'var(--neon-red)' }}>
              <AlertCircle size={14} /> Submit Dispute
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function P2PAgentTab() {
  const [agentSearch, setAgentSearch] = useState('');
  const [agentPrompt, setAgentPrompt] = useState('');

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>LOCAL PAYMENT METHODS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { name: 'M-Pesa', region: 'Kenya · Tanzania · Mozambique', icon: <Smartphone size={18} />, color: '#4caf50' },
              { name: 'GCash', region: 'Philippines', icon: <Smartphone size={18} />, color: '#007aff' },
              { name: 'Paytm', region: 'India', icon: <Smartphone size={18} />, color: '#00baf2' },
              { name: 'Pix', region: 'Brazil', icon: <Zap size={18} />, color: '#32bcad' },
              { name: 'PromptPay', region: 'Thailand', icon: <Smartphone size={18} />, color: '#6c5ce7' },
              { name: 'Mobile Money', region: 'Ghana · Nigeria · Uganda', icon: <Smartphone size={18} />, color: '#f7931a' },
            ].map((method) => (
              <motion.div key={method.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="pinc-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = method.color)} onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                <div style={{ width: 36, height: 36, borderRadius: '8px', background: `${method.color}15`, border: `1px solid ${method.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: method.color }}>
                  {method.icon}
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{method.name}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{method.region}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>P2P AGENT PROMPT</div>
          <div className="pinc-card" style={{ padding: '1.25rem' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>AGENT INSTRUCTION</label>
              <textarea className="pinc-input" rows={4} value={agentPrompt} onChange={e => setAgentPrompt(e.target.value)}
                placeholder="e.g. Find the best deposit rate via M-Pesa for $200...&#10;e.g. Suggest withdrawal method with lowest fees to Kenya...&#10;e.g. Create escrow for buying 0.5 BTC from node_abc..."
                style={{ width: '100%', fontSize: '0.75rem', fontFamily: 'inherit', resize: 'vertical' }} />
            </div>
            <button className="pinc-btn pinc-btn-primary" style={{ width: '100%', fontSize: '0.75rem', padding: '0.6rem' }}>
              <MessageCircle size={14} /> Execute Agent Instruction
            </button>
            <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {['Best rate $200 deposit', 'Lowest fee withdrawal', 'Escrow for BTC', 'Send to M-Pesa', 'Compare providers'].map((s) => (
                <button key={s} onClick={() => setAgentPrompt(s)} style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-muted)', fontSize: '0.6rem', cursor: 'pointer' }}>{s}</button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>NEARBY AGENTS</div>
            <div className="pinc-card" style={{ padding: '0.75rem 1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--electric-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 700 }}>JK</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>john_kinuthia</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Nairobi, KE · 98% trust score</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Online</div>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--neon-green)', marginLeft: 'auto', marginTop: '4px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="pinc-btn" style={{ flex: 1, fontSize: '0.65rem', padding: '0.35rem 0.5rem' }}><MessageSquare size={12} /> Message</button>
                <button className="pinc-btn pinc-btn-primary" style={{ flex: 1, fontSize: '0.65rem', padding: '0.35rem 0.5rem' }}><Users size={12} /> Request Trade</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '0.25rem' }}>DECENTRALIZED FINANCE SYSTEM</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>SARAI</div>
          <div style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 600, background: 'rgba(0,212,255,0.1)', color: 'var(--electric-blue)', border: '1px solid rgba(0,212,255,0.3)' }}>
            v2.0
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '6px', border: '1px solid var(--border)', overflowX: 'auto', flexWrap: 'nowrap' }}>
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.85rem', borderRadius: '4px',
            fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.03em', whiteSpace: 'nowrap',
            background: activeTab === tab.id ? 'var(--electric-blue)' : 'transparent',
            color: activeTab === tab.id ? 'var(--bg-primary)' : 'var(--text-muted)',
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
          }}>
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

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
              {activeTab === 'payments' && <PaymentsTab />}
              {activeTab === 'crypto' && <CryptoTab />}
              {activeTab === 'escrow' && <EscrowTab />}
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
