import { useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { Crown, Check, Star, Zap, Building2, Plus, Edit3 } from 'lucide-react';

const planColors = ['var(--text-secondary)', 'var(--accent-blue)', 'var(--accent-yellow)'];
const planIcons = [<Star size={16} />, <Zap size={16} />, <Building2 size={16} />];

export default function PremiumMgmtPage() {
  const { premiumPlans, loadPremiumPlans, createPlan, updatePlan } = useAdminStore();

  useEffect(() => {
    loadPremiumPlans();
  }, []);

  const handleNewPlan = () => {
    const name = prompt('New plan name:');
    if (!name) return;
    createPlan({ id: name.toLowerCase().replace(/\s+/g, '_'), name, price: 0, features: [] });
  };

  const handleEditPlan = (id: string) => {
    const plan = premiumPlans.find(p => p.id === id);
    if (!plan) return;
    const priceStr = prompt(`Price for ${plan.name}:`, String(plan.price));
    if (priceStr === null) return;
    updatePlan(id, { price: parseFloat(priceStr) || 0 });
  };

  return (
    <div style={{ padding: '1.25rem', maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Premium Management</h1>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>Subscription tiers and pricing</p>
        </div>
        <button onClick={handleNewPlan} style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.75rem',
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 6, color: 'var(--accent-yellow)', cursor: 'pointer', fontSize: '0.65rem',
        }}>
          <Plus size={12} /> New Plan
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', marginBottom: '1rem' }}>
        {premiumPlans.map((p, i) => {
          const color = planColors[i % planColors.length];
          const icon = planIcons[i % planIcons.length];
          return (
            <div key={p.id} style={{
              background: 'var(--bg-card)', border: `1px solid ${color}40`, borderRadius: 8,
              padding: '1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
                <div style={{ color }}>{icon}</div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color }}>{p.name}</div>
                  <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{p.subscribers.toLocaleString()} subscribers</div>
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                ${p.price}<span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mo</span>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                {p.features.map((f, fi) => (
                  <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 0', fontSize: '0.55rem', color: 'var(--text-secondary)' }}>
                    <Check size={10} color={color} /> {f}
                  </div>
                ))}
              </div>
              <button onClick={() => handleEditPlan(p.id)} style={{
                width: '100%', padding: '0.4rem', background: `${color}15`, border: `1px solid ${color}40`,
                borderRadius: 6, color, cursor: 'pointer', fontSize: '0.6rem', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: 4,
              }}>
                <Edit3 size={11} /> Edit Plan
              </button>
            </div>
          );
        })}
      </div>

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem',
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>REVENUE BREAKDOWN</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          {premiumPlans.map((p, i) => {
            const color = planColors[i % planColors.length];
            return (
              <div key={p.id} style={{
                background: 'var(--bg-tertiary)', borderRadius: 6, padding: '0.6rem 0.75rem', textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{p.name.toUpperCase()} REVENUE</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color, marginTop: 2 }}>${(p.price * p.subscribers).toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
