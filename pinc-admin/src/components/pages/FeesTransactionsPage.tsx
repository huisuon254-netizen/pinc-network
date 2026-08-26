import { useState, useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { Percent, RefreshCw, Save, DollarSign, ArrowUpCircle, ArrowDownCircle, TrendingUp } from 'lucide-react';

export default function FeesTransactionsPage() {
  const { fees, loadFees, setFees, walletStats, loadWalletStats } = useAdminStore();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    platform_fee: fees.platform_fee_percent,
    withdrawal_fee: fees.withdrawal_fee,
    transaction_fee: fees.transaction_fee,
    minimum_withdrawal: fees.minimum_withdrawal,
  });

  useEffect(() => {
    loadFees();
    loadWalletStats();
  }, []);

  useEffect(() => {
    setForm({
      platform_fee: fees.platform_fee_percent,
      withdrawal_fee: fees.withdrawal_fee,
      transaction_fee: fees.transaction_fee,
      minimum_withdrawal: fees.minimum_withdrawal,
    });
  }, [fees]);

  const refresh = () => { loadFees(); loadWalletStats(); };

  const saveFees = async () => {
    setSaving(true);
    try {
      await setFees(form.platform_fee, form.withdrawal_fee, form.transaction_fee, form.minimum_withdrawal);
    } catch {}
    setSaving(false);
  };

  return (
    <div style={{ padding: '1.25rem', maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Fees & Transactions</h1>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>Configure platform fees and transaction limits</p>
        </div>
        <button onClick={refresh} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.75rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6, color: 'var(--neon-green)', cursor: 'pointer', fontSize: '0.65rem' }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.7rem 0.85rem' }}>
          <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>TOTAL DEPOSITS</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--neon-green)', marginTop: 2 }}>${walletStats.total_deposits.toLocaleString()}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.7rem 0.85rem' }}>
          <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>TOTAL WITHDRAWALS</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-red)', marginTop: 2 }}>${walletStats.total_withdrawals.toLocaleString()}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.7rem 0.85rem' }}>
          <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>DAILY VOLUME</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--neon-cyan)', marginTop: 2 }}>${walletStats.daily_volume.toLocaleString()}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.7rem 0.85rem' }}>
          <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>FEE REVENUE</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-yellow)', marginTop: 2 }}>${walletStats.fee_revenue.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Percent size={14} /> FEE CONFIGURATION
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
          {[
            { key: 'platform_fee', label: 'Platform Fee', sub: '%', icon: <Percent size={12} />, min: 0, max: 20, step: 0.1 },
            { key: 'withdrawal_fee', label: 'Withdrawal Fee', sub: '$', icon: <ArrowUpCircle size={12} />, min: 0, max: 50, step: 0.01 },
            { key: 'transaction_fee', label: 'Transaction Fee', sub: '$', icon: <TrendingUp size={12} />, min: 0, max: 10, step: 0.01 },
            { key: 'minimum_withdrawal', label: 'Min Withdrawal', sub: '$', icon: <DollarSign size={12} />, min: 0, max: 1000, step: 1 },
          ].map(f => (
            <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 0.75rem', background: 'var(--bg-tertiary)', borderRadius: 6 }}>
              <span style={{ color: 'var(--text-muted)' }}>{f.icon}</span>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', flex: 1 }}>{f.label}</span>
              <input
                type="number"
                step={f.step}
                min={f.min}
                max={f.max}
                value={form[f.key as keyof typeof form]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: parseFloat(e.target.value) || 0 }))}
                style={{ width: 80, padding: '0.3rem 0.4rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--neon-green)', fontSize: '0.7rem', textAlign: 'right' }}
              />
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{f.sub}</span>
            </div>
          ))}
        </div>
        <button onClick={saveFees} disabled={saving} style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 1rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6, color: 'var(--neon-green)', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600 }}>
          <Save size={12} /> {saving ? 'Saving...' : 'Save Fee Settings'}
        </button>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrendingUp size={14} /> MONTHLY FEE REVENUE
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
          <div style={{ background: 'var(--bg-tertiary)', borderRadius: 6, padding: '0.6rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>PLATFORM</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--neon-green)', marginTop: 2 }}>${(walletStats.fee_revenue * 0.6).toFixed(2)}</div>
          </div>
          <div style={{ background: 'var(--bg-tertiary)', borderRadius: 6, padding: '0.6rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>WITHDRAWAL</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-yellow)', marginTop: 2 }}>${(walletStats.fee_revenue * 0.25).toFixed(2)}</div>
          </div>
          <div style={{ background: 'var(--bg-tertiary)', borderRadius: 6, padding: '0.6rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>TRANSACTION</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--neon-cyan)', marginTop: 2 }}>${(walletStats.fee_revenue * 0.15).toFixed(2)}</div>
          </div>
          <div style={{ background: 'var(--bg-tertiary)', borderRadius: 6, padding: '0.6rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>TOTAL</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-purple)', marginTop: 2 }}>${walletStats.fee_revenue.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
