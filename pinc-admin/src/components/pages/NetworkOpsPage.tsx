import { useEffect, useState } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { Wifi, WifiOff, Shield, RefreshCw, Trash2, Scan, Activity, TrendingUp, Globe } from 'lucide-react';

export default function NetworkOpsPage() {
  const { nodes, loadNodes } = useAdminStore();
  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all');

  useEffect(() => { loadNodes(); const t = setInterval(loadNodes, 8000); return () => clearInterval(t); }, []);

  const filtered = nodes.filter(n => filter === 'all' || (filter === 'online' && n.online) || (filter === 'offline' && !n.online));
  const onlineCount = nodes.filter(n => n.online).length;

  return (
    <div style={{ padding: '1.25rem', maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Network Operations Center</h1>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>STARTERAN node monitoring</p>
        </div>
        <button onClick={loadNodes} style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.75rem',
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 6, color: 'var(--accent-green)', cursor: 'pointer', fontSize: '0.65rem',
        }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
        {[
          { label: 'TOTAL NODES', value: nodes.length, color: 'var(--neon-cyan)' },
          { label: 'ONLINE', value: onlineCount, color: 'var(--neon-green)' },
          { label: 'OFFLINE', value: nodes.length - onlineCount, color: 'var(--accent-red)' },
          { label: 'TOTAL BW', value: `${nodes.reduce((a, n) => a + n.bandwidth_mbps, 0).toFixed(0)} Mbps`, color: 'var(--accent-yellow)' },
          { label: 'AVG TRUST', value: nodes.length ? (nodes.reduce((a, n) => a + n.trust_score, 0) / nodes.length).toFixed(1) : '0', color: 'var(--accent-purple)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
            padding: '0.7rem 0.85rem',
          }}>
            <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{s.label}</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: '0.75rem' }}>
        {(['all', 'online', 'offline'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '0.3rem 0.7rem', fontSize: '0.6rem', textTransform: 'uppercase',
            background: filter === f ? 'rgba(37,99,235,0.15)' : 'transparent',
            border: `1px solid ${filter === f ? 'var(--accent-blue)' : 'var(--border)'}`,
            borderRadius: 4, color: filter === f ? 'var(--accent-blue)' : 'var(--text-muted)',
            cursor: 'pointer', letterSpacing: '0.05em',
          }}>{f}</button>
        ))}
      </div>

      {/* Nodes Table */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.65rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['NODE ID', 'STATUS', 'CPU', 'RAM', 'BANDWIDTH', 'TRUST', 'LAST SEEN', 'ACTIONS'].map(h => (
                <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', fontSize: '0.55rem' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No nodes found</td></tr>
            ) : filtered.map(n => (
              <tr key={n.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', color: 'var(--neon-cyan)' }}>{n.id.slice(0, 12)}...</td>
                <td style={{ padding: '0.5rem 0.75rem' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px',
                    borderRadius: 10, fontSize: '0.55rem', fontWeight: 600,
                    background: n.online ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                    color: n.online ? 'var(--neon-green)' : 'var(--neon-red)',
                  }}>
                    {n.online ? <Wifi size={10} /> : <WifiOff size={10} />}
                    {n.online ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </td>
                <td style={{ padding: '0.5rem 0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 50, height: 4, background: 'var(--bg-tertiary)', borderRadius: 2 }}>
                      <div style={{ width: `${n.cpu_usage}%`, height: '100%', background: n.cpu_usage > 80 ? 'var(--accent-red)' : 'var(--neon-green)', borderRadius: 2 }} />
                    </div>
                    <span style={{ color: 'var(--text-secondary)' }}>{n.cpu_usage.toFixed(0)}%</span>
                  </div>
                </td>
                <td style={{ padding: '0.5rem 0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 50, height: 4, background: 'var(--bg-tertiary)', borderRadius: 2 }}>
                      <div style={{ width: `${n.ram_usage}%`, height: '100%', background: n.ram_usage > 80 ? 'var(--accent-red)' : 'var(--neon-green)', borderRadius: 2 }} />
                    </div>
                    <span style={{ color: 'var(--text-secondary)' }}>{n.ram_usage.toFixed(0)}%</span>
                  </div>
                </td>
                <td style={{ padding: '0.5rem 0.75rem', color: 'var(--accent-yellow)' }}>{n.bandwidth_mbps} Mbps</td>
                <td style={{ padding: '0.5rem 0.75rem', color: 'var(--accent-purple)' }}>{n.trust_score.toFixed(1)}</td>
                <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-muted)' }}>{new Date(n.last_seen * 1000).toLocaleTimeString()}</td>
                <td style={{ padding: '0.5rem 0.75rem' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button title="Suspend" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--accent-yellow)', cursor: 'pointer', padding: 3 }}><Shield size={11} /></button>
                    <button title="Force Scan" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--accent-blue)', cursor: 'pointer', padding: 3 }}><Scan size={11} /></button>
                    <button title="Remove" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--accent-red)', cursor: 'pointer', padding: 3 }}><Trash2 size={11} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
