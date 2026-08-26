import { useEffect, useState } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { Users, Activity, Zap, Server, Globe, DollarSign, Gamepad2, Briefcase, Wifi, Shield, TrendingUp, Clock } from 'lucide-react';

const StatCard = ({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) => (
  <div style={{
    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
    padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: 10,
  }}>
    <div style={{
      width: 36, height: 36, borderRadius: 8, background: `${color}15`,
      border: `1px solid ${color}40`, display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0,
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
      <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{label}</div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { stats, loadDashboard, nodes, servers, transactions } = useAdminStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('—');

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      await loadDashboard();
      setLastUpdated(new Date().toLocaleTimeString());
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
  const totalVolume = transactions.reduce((a, t) => a + t.amount, 0);

  if (loading && stats.total_users === 0 && nodes.length === 0) {
    return (
      <div style={{ padding: '1.25rem', maxWidth: 1100 }}>
        <div style={{ marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Platform Overview</h1>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>Loading system-wide metrics...</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1rem' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
              padding: '0.85rem 1rem', height: 80, animation: 'pulse 1.5s ease-in-out infinite',
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
          <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Platform Overview</h1>
          <p style={{ fontSize: '0.6rem', color: error ? 'var(--accent-red)' : 'var(--text-muted)', marginTop: 2 }}>
            {error || `Live system-wide metrics · Last updated ${lastUpdated}`}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--neon-green)', fontSize: '0.65rem' }}>
            <Activity size={14} />
            LIVE
          </div>
          {stats.main_node_id && (
            <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              Main Node: {stats.main_node_id.slice(0, 16)}...
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1rem' }}>
        <StatCard label="TOTAL USERS" value={stats.total_users.toLocaleString()} icon={<Users size={16} color="var(--neon-cyan)" />} color="var(--neon-cyan)" />
        <StatCard label="ONLINE NOW" value={stats.online_users.toLocaleString()} icon={<Activity size={16} color="var(--neon-green)" />} color="var(--neon-green)" />
        <StatCard label="ACTIVE SESSIONS" value={stats.active_sessions.toLocaleString()} icon={<Zap size={16} color="var(--accent-yellow)" />} color="var(--accent-yellow)" />
        <StatCard label="NEW TODAY" value={stats.new_users_today.toLocaleString()} icon={<TrendingUp size={16} color="var(--accent-purple)" />} color="var(--accent-purple)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1rem' }}>
        <StatCard label="WALLET BALANCE" value={`$${stats.total_wallet_value.toLocaleString()}`} icon={<DollarSign size={16} color="var(--neon-green)" />} color="var(--neon-green)" />
        <StatCard label="TOTAL TRANSACTIONS" value={transactions.length.toLocaleString()} icon={<Clock size={16} color="var(--accent-blue)" />} color="var(--accent-blue)" />
        <StatCard label="ACTIVE GAMES" value={stats.active_games.toLocaleString()} icon={<Gamepad2 size={16} color="var(--accent-red)" />} color="var(--accent-red)" />
        <StatCard label="ACTIVE JOBS" value={stats.active_jobs.toLocaleString()} icon={<Briefcase size={16} color="var(--accent-purple)" />} color="var(--accent-purple)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1rem' }}>
        <StatCard label="ACTIVE NODES" value={`${onlineNodes} / ${nodes.length}`} icon={<Wifi size={16} color="var(--neon-cyan)" />} color="var(--neon-cyan)" />
        <StatCard label="SERVER COUNT" value={servers.length.toLocaleString()} icon={<Server size={16} color="var(--accent-orange)" />} color="var(--accent-orange)" />
        <StatCard label="TXN VOLUME" value={`$${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} icon={<Globe size={16} color="var(--accent-yellow)" />} color="var(--accent-yellow)" />
        <StatCard label="NETWORK PEERS" value={stats.active_bandwidth_providers.toLocaleString()} icon={<Shield size={16} color="var(--accent-blue)" />} color="var(--accent-blue)" />
      </div>

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '0.6rem 0.75rem', borderBottom: '1px solid var(--border)', fontSize: '0.65rem',
          fontWeight: 700, color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between',
        }}>
          <span>NODE TOPOLOGY</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.55rem' }}>{nodes.length} registered · {onlineNodes} online</span>
        </div>
        {nodes.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
            No nodes discovered yet
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.5rem', padding: '0.75rem' }}>
            {nodes.slice(0, 12).map(n => (
              <div key={n.id} style={{
                background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6,
                padding: '0.6rem 0.75rem', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: n.online ? 'var(--neon-green)' : 'var(--accent-red)',
                  boxShadow: n.online ? '0 0 6px var(--neon-green)' : 'none',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.6rem', fontFamily: 'monospace', color: 'var(--neon-cyan)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {n.id.slice(0, 18)}...
                  </div>
                  <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', marginTop: 1 }}>{n.address}</div>
                </div>
                <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>
                  {n.online ? `trust ${n.trust_score.toFixed(1)}` : 'offline'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
