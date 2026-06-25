import { useState } from 'react';
import { Crown, Check, Star, Zap, Building2, Plus, Edit3 } from 'lucide-react';

interface Plan {
  id: string; name: string; price: number; features: string[]; color: string; icon: React.ReactNode; subscribers: number;
}

const DEFAULT_PLANS: Plan[] = [
  { id: 'basic', name: 'Basic', price: 0, features: ['5 GB Storage', 'Standard Speed', 'Community Access', 'Basic Analytics'], color: 'var(--text-secondary)', icon: <Star size={16} />, subscribers: 8200 },
  { id: 'pro', name: 'Pro', price: 9.99, features: ['50 GB Storage', 'Priority Speed', 'All Communities', 'Advanced Analytics', 'Custom Themes', 'Priority Support'], color: 'var(--accent-blue)', icon: <Zap size={16} />, subscribers: 2400 },
  { id: 'enterprise', name: 'Enterprise', price: 49.99, features: ['Unlimited Storage', 'Maximum Speed', 'All Features', 'Custom Branding', 'API Access', 'Dedicated Support', 'SLA Guarantee'], color: 'var(--accent-yellow)', icon: <Building2 size={16} />, subscribers: 180 },
];

export default function PremiumMgmtPage() {
  const [plans, setPlans] = useState(DEFAULT_PLANS);

  return (
    <div style={{ padding: '1.25rem', maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Premium Management</h1>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>Subscription tiers and pricing</p>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.75rem',
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 6, color: 'var(--accent-yellow)', cursor: 'pointer', fontSize: '0.65rem',
        }}>
          <Plus size={12} /> New Plan
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', marginBottom: '1rem' }}>
        {plans.map(p => (
          <div key={p.id} style={{
            background: 'var(--bg-card)', border: `1px solid ${p.color}40`, borderRadius: 8,
            padding: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
              <div style={{ color: p.color }}>{p.icon}</div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: p.color }}>{p.name}</div>
                <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{p.subscribers.toLocaleString()} subscribers</div>
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              ${p.price}<span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mo</span>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              {p.features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 0', fontSize: '0.55rem', color: 'var(--text-secondary)' }}>
                  <Check size={10} color={p.color} /> {f}
                </div>
              ))}
            </div>
            <button style={{
              width: '100%', padding: '0.4rem', background: `${p.color}15`, border: `1px solid ${p.color}40`,
              borderRadius: 6, color: p.color, cursor: 'pointer', fontSize: '0.6rem', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
              <Edit3 size={11} /> Edit Plan
            </button>
          </div>
        ))}
      </div>

      {/* Revenue */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem',
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>REVENUE BREAKDOWN</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          {[
            { label: 'BASIC REVENUE', value: '$0', color: 'var(--text-muted)' },
            { label: 'PRO REVENUE', value: `$${(2400 * 9.99).toLocaleString()}`, color: 'var(--accent-blue)' },
            { label: 'ENTERPRISE REVENUE', value: `$${(180 * 49.99).toLocaleString()}`, color: 'var(--accent-yellow)' },
          ].map(r => (
            <div key={r.label} style={{
              background: 'var(--bg-tertiary)', borderRadius: 6, padding: '0.6rem 0.75rem', textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{r.label}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: r.color, marginTop: 2 }}>{r.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
