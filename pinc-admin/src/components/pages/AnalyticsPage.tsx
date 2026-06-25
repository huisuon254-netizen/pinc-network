import { useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { BarChart3, TrendingUp, Users, DollarSign, Activity, Gamepad2, Briefcase, Server, Wifi } from 'lucide-react';

export default function AnalyticsPage() {
  const { stats, loadDashboard } = useAdminStore();
  useEffect(() => { loadDashboard(); }, []);

  const metrics = [
    { section: 'GROWTH', items: [
      { label: 'Daily Active Users', value: stats.online_users, color: 'var(--neon-cyan)', icon: <Users size={14} /> },
      { label: 'New Users Today', value: stats.new_users_today, color: 'var(--neon-green)', icon: <TrendingUp size={14} /> },
      { label: 'Retention Rate', value: '78%', color: 'var(--accent-purple)', icon: <BarChart3 size={14} /> },
    ]},
    { section: 'REVENUE', items: [
      { label: 'Fee Revenue', value: `$${stats.total_wallet_value}`, color: 'var(--accent-yellow)', icon: <DollarSign size={14} /> },
      { label: 'Premium Revenue', value: '$26,380', color: 'var(--accent-blue)', icon: <DollarSign size={14} /> },
      { label: 'Hosting Revenue', value: '$12,450', color: 'var(--accent-orange)', icon: <DollarSign size={14} /> },
    ]},
    { section: 'PLATFORM USAGE', items: [
      { label: 'TREIFIC', value: '892 active', color: 'var(--accent-blue)', icon: <Activity size={14} /> },
      { label: 'WAGERS', value: `${stats.active_games} games`, color: 'var(--accent-red)', icon: <Gamepad2 size={14} /> },
      { label: 'JOBS', value: `${stats.active_jobs} jobs`, color: 'var(--accent-purple)', icon: <Briefcase size={14} /> },
      { label: 'RENTBIT', value: `${stats.active_servers} servers`, color: 'var(--accent-orange)', icon: <Server size={14} /> },
      { label: 'STARTERAN', value: `${stats.active_nodes} nodes`, color: 'var(--neon-green)', icon: <Wifi size={14} /> },
    ]},
  ];

  return (
    <div style={{ padding: '1.25rem', maxWidth: 1100 }}>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Analytics Center</h1>
        <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>Platform growth and usage metrics</p>
      </div>

      {metrics.map(group => (
        <div key={group.section} style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>{group.section}</div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${group.items.length}, 1fr)`, gap: '0.5rem' }}>
            {group.items.map(item => (
              <div key={item.label} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
                padding: '0.75rem 0.85rem', display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{ color: item.color }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Chart Placeholder */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
        padding: '1rem', height: 200,
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>GROWTH TREND (30 DAYS)</div>
        <div style={{ height: 'calc(100% - 24px)', display: 'flex', alignItems: 'flex-end', gap: 3, padding: '0 4px' }}>
          {Array.from({ length: 30 }).map((_, i) => {
            const h = 20 + Math.random() * 80;
            return (
              <div key={i} style={{
                flex: 1, height: `${h}%`, background: `rgba(37,99,235,${0.2 + (h / 100) * 0.6})`,
                borderRadius: '2px 2px 0 0', transition: 'height 0.3s',
              }} />
            );
          })}
        </div>
      </div>
    </div>
  );
}
