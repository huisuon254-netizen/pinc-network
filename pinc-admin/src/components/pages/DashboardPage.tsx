import { useEffect } from 'react';
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
  const { stats, loadDashboard, nodes, servers } = useAdminStore();
  useEffect(() => { loadDashboard(); const t = setInterval(loadDashboard, 10000); return () => clearInterval(t); }, []);

  return (
    <div style={{ padding: '1.25rem', maxWidth: 1100 }}>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Platform Overview</h1>
        <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>Live system-wide metrics</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1rem' }}>
        <StatCard label="TOTAL USERS" value={stats.total_users} icon={<Users size={16} color="var(--neon-cyan)" />} color="var(--neon-cyan)" />
        <StatCard label="ONLINE NOW" value={stats.online_users} icon={<Activity size={16} color="var(--neon-green)" />} color="var(--neon-green)" />
        <StatCard label="ACTIVE SESSIONS" value={stats.active_sessions} icon={<Zap size={16} color="var(--accent-yellow)" />} color="var(--accent-yellow)" />
        <StatCard label="NEW TODAY" value={stats.new_users_today} icon={<TrendingUp size={16} color="var(--accent-purple)" />} color="var(--accent-purple)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1rem' }}>
        <StatCard label="WALLET VALUE" value={`$${stats.total_wallet_value.toLocaleString()}`} icon={<DollarSign size={16} color="var(--neon-green)" />} color="var(--neon-green)" />
        <StatCard label="SARAI VOLUME" value={`$${stats.total_sarai_volume.toLocaleString()}`} icon={<DollarSign size={16} color="var(--accent-blue)" />} color="var(--accent-blue)" />
        <StatCard label="ACTIVE GAMES" value={stats.active_games} icon={<Gamepad2 size={16} color="var(--accent-red)" />} color="var(--accent-red)" />
        <StatCard label="ACTIVE JOBS" value={stats.active_jobs} icon={<Briefcase size={16} color="var(--accent-purple)" />} color="var(--accent-purple)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1rem' }}>
        <StatCard label="ACTIVE SERVERS" value={stats.active_servers} icon={<Server size={16} color="var(--accent-orange)" />} color="var(--accent-orange)" />
        <StatCard label="ACTIVE NODES" value={stats.active_nodes} icon={<Wifi size={16} color="var(--neon-cyan)" />} color="var(--neon-cyan)" />
        <StatCard label="BANDWIDTH PROVS" value={stats.active_bandwidth_providers} icon={<Globe size={16} color="var(--accent-blue)" />} color="var(--accent-blue)" />
        <StatCard label="CHALLENGES" value={stats.active_challenges} icon={<Shield size={16} color="var(--accent-yellow)" />} color="var(--accent-yellow)" />
      </div>

      {/* Live Map Placeholder */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
        padding: '1.25rem', height: 280, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>LIVE WORLD MAP</div>
        <div style={{
          width: '100%', height: 'calc(100% - 24px)', background: 'var(--bg-tertiary)',
          borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Grid lines */}
          <svg width="100%" height="100%" style={{ position: 'absolute', opacity: 0.1 }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={`${i * 5}%`} x2="100%" y2={`${i * 5}%`} stroke="var(--neon-cyan)" strokeWidth="0.5" />
            ))}
            {Array.from({ length: 20 }).map((_, i) => (
              <line key={`v${i}`} x1={`${i * 5}%`} y1="0" x2={`${i * 5}%`} y2="100%" stroke="var(--neon-cyan)" strokeWidth="0.5" />
            ))}
          </svg>
          {/* Simulated dots */}
          {[
            { x: 25, y: 35, c: 'var(--neon-green)', l: 'US-East' },
            { x: 45, y: 25, c: 'var(--neon-cyan)', l: 'EU-West' },
            { x: 70, y: 40, c: 'var(--accent-yellow)', l: 'Asia' },
            { x: 55, y: 55, c: 'var(--accent-purple)', l: 'Africa' },
            { x: 30, y: 60, c: 'var(--accent-orange)', l: 'SA' },
            { x: 80, y: 30, c: 'var(--accent-pink)', l: 'Oceania' },
          ].map((dot, i) => (
            <div key={i} style={{
              position: 'absolute', left: `${dot.x}%`, top: `${dot.y}%`,
              transform: 'translate(-50%, -50%)',
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%', background: dot.c,
                boxShadow: `0 0 8px ${dot.c}`, animation: `pulse 2s ease-in-out ${i * 0.3}s infinite`,
              }} />
              <div style={{
                fontSize: '0.5rem', color: dot.c, textAlign: 'center', marginTop: 2,
                whiteSpace: 'nowrap',
              }}>{dot.l}</div>
            </div>
          ))}
          <style>{`@keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.5); } }`}</style>
        </div>
      </div>
    </div>
  );
}
