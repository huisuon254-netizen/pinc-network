import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { DollarSign, TrendingUp, ArrowUpCircle, ArrowDownCircle, Shield, Percent } from 'lucide-react';

export default function SaraiControlPage() {
  const [feeSettings, setFeeSettings] = useState({
    deposit_fee: 0.01, withdrawal_fee: 0.02, escrow_fee: 0.025, marketplace_fee: 0.05,
  });
  const [walletStats, setWalletStats] = useState({
    total_deposits: 0, total_withdrawals: 0, daily_volume: 0, monthly_volume: 0, fee_revenue: 0,
  });

  useEffect(() => {
    invoke('cmd_admin_wallet_stats').then(r => setWalletStats(r as any)).catch(() => {});
  }, []);

  return (
    <div style={{ padding: '1.25rem', maxWidth: 1100 }}>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>SARAI Control Center</h1>
        <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>Wallet and financial operations</p>
      </div>

      {/* Wallet Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
        {[
          { label: 'TOTAL DEPOSITS', value: `$${walletStats.total_deposits.toLocaleString()}`, color: 'var(--neon-green)' },
          { label: 'TOTAL WITHDRAWALS', value: `$${walletStats.total_withdrawals.toLocaleString()}`, color: 'var(--accent-red)' },
          { label: 'DAILY VOLUME', value: `$${walletStats.daily_volume.toLocaleString()}`, color: 'var(--neon-cyan)' },
          { label: 'MONTHLY VOLUME', value: `$${walletStats.monthly_volume.toLocaleString()}`, color: 'var(--accent-purple)' },
          { label: 'FEE REVENUE', value: `$${walletStats.fee_revenue.toLocaleString()}`, color: 'var(--accent-yellow)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
            padding: '0.7rem 0.85rem',
          }}>
            <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{s.label}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Fee Controls */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
        padding: '1rem', marginBottom: '1rem',
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Percent size={14} /> FEE CONTROLS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
          {[
            { key: 'deposit_fee', label: 'Deposit Fee', icon: <ArrowDownCircle size={12} /> },
            { key: 'withdrawal_fee', label: 'Withdrawal Fee', icon: <ArrowUpCircle size={12} /> },
            { key: 'escrow_fee', label: 'Escrow Fee', icon: <Shield size={12} /> },
            { key: 'marketplace_fee', label: 'Marketplace Fee', icon: <DollarSign size={12} /> },
          ].map(f => (
            <div key={f.key} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 0.75rem',
              background: 'var(--bg-tertiary)', borderRadius: 6,
            }}>
              <span style={{ color: 'var(--text-muted)' }}>{f.icon}</span>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', flex: 1 }}>{f.label}</span>
              <input type="number" step="0.001" min="0" max="0.5"
                value={(feeSettings as any)[f.key]}
                onChange={e => setFeeSettings(prev => ({ ...prev, [f.key]: parseFloat(e.target.value) || 0 }))}
                style={{
                  width: 60, padding: '0.3rem 0.4rem', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)', borderRadius: 4, color: 'var(--neon-green)',
                  fontSize: '0.7rem', textAlign: 'right',
                }} />
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>%</span>
            </div>
          ))}
        </div>
        <button style={{
          marginTop: '0.75rem', padding: '0.4rem 1rem', background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6, color: 'var(--neon-green)',
          cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600,
        }}>Save Fee Settings</button>
      </div>

      {/* Fraud Detection */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
        padding: '1rem',
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Shield size={14} /> FRAUD DETECTION
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          {[
            { label: 'SUSPICIOUS TX', value: 3, color: 'var(--accent-yellow)' },
            { label: 'BOT DETECTED', value: 1, color: 'var(--accent-red)' },
            { label: 'FLAGGED', value: 7, color: 'var(--accent-orange)' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-tertiary)', borderRadius: 6, padding: '0.6rem 0.75rem', textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
