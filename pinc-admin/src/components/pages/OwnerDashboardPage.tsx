import { useEffect, useState } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { Trophy, DollarSign, Server, Wifi, Users, Activity, TrendingUp, Heart, Globe, Shield } from 'lucide-react';

export default function OwnerDashboardPage() {
  const { stats, nodes, servers, transactions, loadDashboard } = useAdminStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      await loadDashboard();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to refresh dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 10000);
    return () => clearInterval(t);
  }, []);

  const onlineNodes = nodes.filter(n => n.online).length;
  const totalRevenue = servers.reduce((a, s) => a + s.revenue, 0);
  const totalVolume = transactions.reduce((a, t) => a + t.amount, 0);

  const healthScore = Math.min(100, Math.floor(
    (stats.online_users / Math.max(stats.total_users, 1)) * 30 +
    (onlineNodes / Math.max(nodes.length, 1)) * 30 +
    (servers.filter(s => s.health === 'green').length / Math.max(servers.length, 1)) * 40
  ));

  const healthColor = healthScore >= 80 ? 'var(--neon-green)' : healthScore >= 50 ? 'var(--accent-yellow)' : 'var(--accent-red)';

  if (loading && stats.total_users === 0 && nodes.length === 0) {
    return (
      <div style={{ padding: '1.25rem', maxWidth: 1100 }}>
        <div style={{ marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-yellow)' }}>Owner Dashboard</h1>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>Loading executive overview...</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
              padding: '0.7rem 0.85rem', height: 70, animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.25rem', maxWidth: 1100 }}>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-yellow)' }}>Owner Dashboard</h1>
          <p style={{ fontSize: '0.6rem', color: error ? 'var(--accent-red)' : 'var(--text-muted)', marginTop: 2 }}>
            {error || 'Executive overview and platform health'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: healthColor, fontSize: '0.65rem' }}>
          <Activity size={14} />
          {healthScore}/100
        </div>
      </div>

      {/* Global Health Score */}
      <div style={{
        background: 'var(--bg-card)', border: `1px solid ${healthColor}40`, borderRadius: 8,
        padding: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', border: `4px solid ${healthColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: healthColor }}>{healthScore}</div>
            <div style={{ fontSize: '0.45rem', color: 'var(--text-muted)' }}>/ 100</div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>GLOBAL HEALTH SCORE</div>
          <div style={{ display: 'flex', gap: 12, fontSize: '0.55rem' }}>
            <span style={{ color: 'var(--neon-cyan)' }}>STARTERAN <Heart size={10} style={{ display: 'inline' }} /></span>
            <span style={{ color: 'var(--neon-green)' }}>WAGERS <Heart size={10} style={{ display: 'inline' }} /></span>
            <span style={{ color: 'var(--accent-blue)' }}>JOBS <Heart size={10} style={{ display: 'inline' }} /></span>
            <span style={{ color: 'var(--accent-orange)' }}>RENTBIT <Heart size={10} style={{ display: 'inline' }} /></span>
            <span style={{ color: 'var(--neon-green)' }}>STARTERAN <Heart size={10} style={{ display: 'inline' }} /></span>
          </div>
        </div>
      </div>

      {/* Financial */}
      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>FINANCIAL</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
        {[
          { label: 'TOTAL REVENUE', value: `$${totalRevenue.toLocaleString()}`, color: 'var(--neon-green)' },
          { label: 'PLATFORM VALUE', value: `$${(stats.total_wallet_value + totalVolume).toLocaleString()}`, color: 'var(--accent-yellow)' },
          { label: 'TXN VOLUME', value: `$${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, color: 'var(--neon-cyan)' },
          { label: 'ACTIVE USERS', value: `${stats.online_users} / ${stats.total_users}`, color: 'var(--accent-purple)' },
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

      {/* Infrastructure */}
      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>INFRASTRUCTURE</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
        {[
          { label: 'TOTAL NODES', value: nodes.length, icon: <Wifi size={14} />, color: 'var(--neon-green)' },
          { label: 'TOTAL SERVERS', value: servers.length, icon: <Server size={14} />, color: 'var(--accent-orange)' },
          { label: 'ONLINE NODES', value: onlineNodes, icon: <Activity size={14} />, color: 'var(--neon-cyan)' },
          { label: 'TRANSACTIONS', value: transactions.length, icon: <DollarSign size={14} />, color: 'var(--accent-yellow)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
            padding: '0.7rem 0.85rem', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ color: s.color }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Growth */}
      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>GROWTH</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
        {[
          { label: 'NEW USERS', value: stats.new_users_today, color: 'var(--neon-green)' },
          { label: 'ACTIVE SESSIONS', value: stats.active_sessions, color: 'var(--neon-cyan)' },
          { label: 'PLATFORM VALUE', value: `$${(stats.total_wallet_value + totalVolume).toLocaleString()}`, color: 'var(--accent-purple)' },
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
    </div>
  );
}
