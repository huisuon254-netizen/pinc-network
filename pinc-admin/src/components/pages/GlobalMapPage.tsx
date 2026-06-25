import { useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { Map, Globe, Server, Wifi, Users, Activity } from 'lucide-react';

export default function GlobalMapPage() {
  const { stats, nodes, servers, loadDashboard } = useAdminStore();
  useEffect(() => { loadDashboard(); const t = setInterval(loadDashboard, 10000); return () => clearInterval(t); }, []);

  const regions = [
    { name: 'North America', x: 22, y: 30, users: Math.floor(stats.total_users * 0.35), nodes: Math.floor(nodes.length * 0.3), servers: Math.floor(servers.length * 0.25) },
    { name: 'Europe', x: 48, y: 22, users: Math.floor(stats.total_users * 0.28), nodes: Math.floor(nodes.length * 0.25), servers: Math.floor(servers.length * 0.3) },
    { name: 'Asia', x: 72, y: 32, users: Math.floor(stats.total_users * 0.22), nodes: Math.floor(nodes.length * 0.25), servers: Math.floor(servers.length * 0.25) },
    { name: 'South America', x: 28, y: 58, users: Math.floor(stats.total_users * 0.08), nodes: Math.floor(nodes.length * 0.1), servers: Math.floor(servers.length * 0.1) },
    { name: 'Africa', x: 52, y: 50, users: Math.floor(stats.total_users * 0.04), nodes: Math.floor(nodes.length * 0.05), servers: Math.floor(servers.length * 0.05) },
    { name: 'Oceania', x: 82, y: 62, users: Math.floor(stats.total_users * 0.03), nodes: Math.floor(nodes.length * 0.05), servers: Math.floor(servers.length * 0.05) },
  ];

  return (
    <div style={{ padding: '1.25rem', maxWidth: 1100 }}>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Global Map</h1>
        <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>Live worldwide platform overview</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
        {[
          { label: 'ACTIVE USERS', value: stats.online_users, color: 'var(--neon-cyan)' },
          { label: 'NODES', value: nodes.length, color: 'var(--neon-green)' },
          { label: 'SERVERS', value: servers.length, color: 'var(--accent-orange)' },
          { label: 'REGIONS', value: regions.length, color: 'var(--accent-purple)' },
          { label: 'BANDWIDTH', value: `${nodes.reduce((a, n) => a + n.bandwidth_mbps, 0)} Mbps`, color: 'var(--accent-yellow)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
            padding: '0.6rem 0.75rem',
          }}>
            <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{s.label}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Map */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
        padding: '1rem', height: 350, position: 'relative', overflow: 'hidden',
      }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', opacity: 0.06 }}>
          {Array.from({ length: 30 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={`${i * 3.33}%`} x2="100%" y2={`${i * 3.33}%`} stroke="var(--neon-cyan)" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 30 }).map((_, i) => (
            <line key={`v${i}`} x1={`${i * 3.33}%`} y1="0" x2={`${i * 3.33}%`} y2="100%" stroke="var(--neon-cyan)" strokeWidth="0.5" />
          ))}
        </svg>

        {regions.map((r, i) => (
          <div key={r.name} style={{
            position: 'absolute', left: `${r.x}%`, top: `${r.y}%`,
            transform: 'translate(-50%, -50%)', textAlign: 'center',
          }}>
            <div style={{
              width: 14, height: 14, borderRadius: '50%',
              background: `rgba(6,182,212,${0.3 + (r.users / stats.total_users) * 0.7})`,
              boxShadow: `0 0 ${8 + r.users}px rgba(6,182,212,0.4)`,
              margin: '0 auto', animation: `pulse 3s ease-in-out ${i * 0.5}s infinite`,
            }} />
            <div style={{
              marginTop: 4, padding: '3px 6px', background: 'var(--bg-tertiary)',
              borderRadius: 4, border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: '0.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{r.name}</div>
              <div style={{ fontSize: '0.45rem', color: 'var(--neon-cyan)' }}>{r.users} users</div>
              <div style={{ fontSize: '0.45rem', color: 'var(--neon-green)' }}>{r.nodes} nodes</div>
              <div style={{ fontSize: '0.45rem', color: 'var(--accent-orange)' }}>{r.servers} servers</div>
            </div>
          </div>
        ))}

        <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      </div>
    </div>
  );
}
