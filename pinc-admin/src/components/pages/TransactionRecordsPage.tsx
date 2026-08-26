import { useEffect, useState } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { RefreshCw, Search, Filter, Download } from 'lucide-react';

const TYPE_OPTIONS = ['', 'Deposit', 'Withdrawal', 'Transfer', 'Fee', 'Refund', 'Claim', 'Purchase'];
const STATUS_OPTIONS = ['', 'PENDING', 'COMPLETED', 'REJECTED', 'FAILED', 'CANCELLED'];

export default function TransactionRecordsPage() {
  const { allTransactions, loadAllTransactions, filters, setFilters } = useAdminStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadAllTransactions(); }, []);

  const refresh = async () => {
    setRefreshing(true);
    try { await loadAllTransactions(); } catch {}
    setRefreshing(false);
  };

  const statusColor = (s: string) => {
    switch (s.toUpperCase()) {
      case 'COMPLETED': return 'var(--neon-green)';
      case 'PENDING': return 'var(--accent-yellow)';
      case 'REJECTED':
      case 'FAILED':
      case 'CANCELLED': return 'var(--accent-red)';
      default: return 'var(--text-muted)';
    }
  };

  const typeColor = (t: string) => {
    switch (t.toUpperCase()) {
      case 'DEPOSIT': return 'var(--neon-green)';
      case 'WITHDRAWAL': return 'var(--accent-red)';
      case 'FEE': return 'var(--accent-yellow)';
      default: return 'var(--accent-blue)';
    }
  };

  return (
    <div style={{ padding: '1.25rem', maxWidth: 1200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Transaction Records</h1>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>{allTransactions.length} transaction records</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={refresh} disabled={refreshing} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.75rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6, color: 'var(--neon-green)', cursor: 'pointer', fontSize: '0.65rem' }}>
            <RefreshCw size={12} /> Refresh
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.75rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 6, color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '0.65rem' }}>
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.5rem' }}>
          <Filter size={12} color="var(--text-muted)" />
          <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.08em' }}>FILTERS</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={10} style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input placeholder="Search user or ID..." value={filters.user} onChange={e => setFilters({ user: e.target.value })} style={{ width: '100%', padding: '0.35rem 0.4rem 0.35rem 1.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: '0.6rem' }} />
          </div>
          <select value={filters.txType} onChange={e => setFilters({ txType: e.target.value })} style={{ padding: '0.35rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: '0.6rem' }}>
            {TYPE_OPTIONS.map(o => <option key={o} value={o}>{o || 'All Types'}</option>)}
          </select>
          <select value={filters.status} onChange={e => setFilters({ status: e.target.value })} style={{ padding: '0.35rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: '0.6rem' }}>
            {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o || 'All Statuses'}</option>)}
          </select>
          <input type="date" value={filters.startDate} onChange={e => setFilters({ startDate: e.target.value })} placeholder="Start date" style={{ padding: '0.35rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: '0.6rem', colorScheme: 'dark' }} />
          <input type="date" value={filters.endDate} onChange={e => setFilters({ endDate: e.target.value })} placeholder="End date" style={{ padding: '0.35rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: '0.6rem', colorScheme: 'dark' }} />
        </div>
      </div>

      {/* Transactions Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr 80px 60px 70px 80px 70px', gap: '0.4rem', padding: '0.5rem 0.75rem', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)', fontSize: '0.55rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
          <span>ID</span>
          <span>FROM</span>
          <span>TO</span>
          <span style={{ textAlign: 'right' }}>AMOUNT</span>
          <span>TYPE</span>
          <span>STATUS</span>
          <span style={{ textAlign: 'right' }}>DATE</span>
          <span>CURRENCY</span>
        </div>
        {allTransactions.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
            No transactions found matching your filters
          </div>
        )}
        {allTransactions.map(tx => (
          <div key={tx.id} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr 80px 60px 70px 80px 70px', gap: '0.4rem', padding: '0.45rem 0.75rem', borderBottom: '1px solid var(--border)', fontSize: '0.6rem', alignItems: 'center' }}>
            <span style={{ fontFamily: 'monospace', color: 'var(--neon-cyan)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.id.slice(0, 10)}</span>
            <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.from_node}</span>
            <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.to_node}</span>
            <span style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: tx.amount >= 0 ? 'var(--neon-green)' : 'var(--accent-red)' }}>${tx.amount.toFixed(2)}</span>
            <span style={{ fontSize: '0.55rem', color: typeColor(tx.tx_type), fontWeight: 600, textTransform: 'uppercase' }}>{tx.tx_type}</span>
            <span style={{ fontSize: '0.55rem', color: statusColor(tx.status), fontWeight: 600 }}>{tx.status}</span>
            <span style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.55rem' }}>{new Date(tx.created_at).toLocaleDateString()}</span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.55rem', color: 'var(--text-muted)' }}>{tx.currency}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
