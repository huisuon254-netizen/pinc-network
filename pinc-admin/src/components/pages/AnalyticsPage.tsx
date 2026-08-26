import { useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { BarChart3, TrendingUp, Users, DollarSign, Activity, Gamepad2, Briefcase, Server, Wifi } from 'lucide-react';

export default function AnalyticsPage() {
  const { stats, analyticsData, loadDashboard, loadAnalyticsData } = useAdminStore();

  useEffect(() => {
    loadDashboard();
    loadAnalyticsData();
  }, []);

  const metrics = [
    { section: 'GROWTH', items: [
      { label: 'Daily Active Users', value: stats.online_users, color: 'var(--neon-cyan)', icon: <Users size={14} /> },
      { label: 'New Users Today', value: stats.new_users_today, color: 'var(--neon-green)', icon: <TrendingUp size={14} /> },
      { label: 'Retention Rate', value: `${analyticsData.retention_rate}%`, color: 'var(--accent-purple)', icon: <BarChart3 size={14} /> },
    ]},
    { section: 'REVENUE', items: [
      { label: 'Fee Revenue', value: `$${stats.total_wallet_value}`, color: 'var(--accent-yellow)', icon: <DollarSign size={14} /> },
      { label: 'Premium Revenue', value: `$${analyticsData.premium_revenue.toLocaleString()}`, color: 'var(--accent-blue)', icon: <DollarSign size={14} /> },
      { label: 'Hosting Revenue', value: `$${analyticsData.hosting_revenue.toLocaleString()}`, color: 'var(--accent-orange)', icon: <DollarSign size={14} /> },
    ]},
    { section: 'PLATFORM USAGE', items: [
      { label: 'TREIFIC', value: `${analyticsData.treific_active} active`, color: 'var(--accent-blue)', icon: <Activity size={14} /> },
      { label: 'WAGERS', value: `${stats.active_games} games`, color: 'var(--accent-red)', icon: <Gamepad2 size={14} /> },
      { label: 'JOBS', value: `${stats.active_jobs} jobs`, color: 'var(--accent-purple)', icon: <Briefcase size={14} /> },
      { label: 'RENTBIT', value: `${stats.active_servers} servers`, color: 'var(--accent-orange)', icon: <Server size={14} /> },
      { label: 'STARTERAN', value: `${stats.active_nodes} nodes`, color: 'var(--neon-green)', icon: <Wifi size={14} /> },
    ]},
  ];

  const chartData = analyticsData.growth_history.length > 0 ? analyticsData.growth_history : [];

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

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
        padding: '1rem', height: 200,
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>GROWTH TREND (30 DAYS)</div>
        <div style={{ height: 'calc(100% - 24px)', display: 'flex', alignItems: 'flex-end', gap: 3, padding: '0 4px' }}>
          {chartData.length > 0 ? (
            chartData.map((val, i) => {
              const h = Math.max(0, Math.min(100, val));
              return (
                <div key={i} style={{
                  flex: 1, height: `${h}%`, background: `rgba(37,99,235,${0.2 + (h / 100) * 0.6})`,
                  borderRadius: '2px 2px 0 0', transition: 'height 0.3s',
                }} />
              );
            })
          ) : (
            <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.65rem', paddingTop: '2rem' }}>
              No growth data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
