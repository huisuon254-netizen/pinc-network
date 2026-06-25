import { useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { Trophy, DollarSign, Server, Wifi, Users, Activity, TrendingUp, Heart, Globe, Shield } from 'lucide-react';

export default function OwnerDashboardPage() {
  const { stats, nodes, servers, loadDashboard } = useAdminStore();
  useEffect(() => { loadDashboard(); }, []);

  const healthScore = Math.min(100, Math.floor(
    (stats.online_users / Math.max(stats.total_users, 1)) * 30 +
    (nodes.filter(n => n.online).length / Math.max(nodes.length, 1)) * 30 +
    (servers.filter(s => s.health === 'green').length / Math.max(servers.length, 1)) * 40
  ));

  const healthColor = healthScore >= 80 ? 'var(--neon-green)' : healthScore >= 50 ? 'var(--accent-yellow)' : 'var(--accent-red)';

  return (
    <div style={{ padding: '1.25rem', maxWidth: 1100 }}>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-yellow)' }}>Owner Dashboard</h1>
        <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>Executive overview and platform health</p>
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
            <span style={{ color: 'var(--neon-cyan)' }}>TREIFIC <Heart size={10} style={{ display: 'inline' }} /></span>
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
          { label: 'TOTAL REVENUE', value: `$${(stats.total_wallet_value * 0.05).toLocaleString()}`, color: 'var(--neon-green)' },
          { label: 'MONTHLY REVENUE', value: `$${(stats.total_wallet_value * 0.004).toLocaleString()}`, color: 'var(--accent-blue)' },
          { label: 'ANNUAL REVENUE', value: `$${(stats.total_wallet_value * 0.05).toLocaleString()}`, color: 'var(--accent-purple)' },
          { label: 'PLATFORM VALUE', value: `$${(stats.total_wallet_value * 10).toLocaleString()}`, color: 'var(--accent-yellow)' },
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
          { label: 'ACTIVE USERS', value: stats.online_users, icon: <Users size={14} />, color: 'var(--neon-cyan)' },
          { label: 'BANDWIDTH', value: `${nodes.reduce((a, n) => a + n.bandwidth_mbps, 0)} Mbps`, icon: <Globe size={14} />, color: 'var(--accent-yellow)' },
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
          { label: 'RETENTION', value: '78%', color: 'var(--accent-purple)' },
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
