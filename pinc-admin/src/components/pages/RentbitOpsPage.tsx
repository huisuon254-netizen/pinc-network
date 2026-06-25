import { useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { Server, Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function RentbitOpsPage() {
  const { servers, loadServers } = useAdminStore();

  useEffect(() => { loadServers(); const t = setInterval(loadServers, 10000); return () => clearInterval(t); }, []);

  const healthColor = (h: string) => h === 'green' ? 'var(--neon-green)' : h === 'yellow' ? 'var(--accent-yellow)' : 'var(--accent-red)';
  const healthIcon = (h: string) => h === 'green' ? <CheckCircle size={12} /> : h === 'yellow' ? <AlertTriangle size={12} /> : <XCircle size={12} />;

  return (
    <div style={{ padding: '1.25rem', maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>RENTBIT Operations Center</h1>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>Server infrastructure monitoring</p>
        </div>
        <button onClick={loadServers} style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.75rem',
          background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)',
          borderRadius: 6, color: 'var(--accent-orange)', cursor: 'pointer', fontSize: '0.65rem',
        }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
        {[
          { label: 'TOTAL SERVERS', value: servers.length, color: 'var(--accent-orange)' },
          { label: 'HEALTHY', value: servers.filter(s => s.health === 'green').length, color: 'var(--neon-green)' },
          { label: 'DEGRADED', value: servers.filter(s => s.health === 'yellow').length, color: 'var(--accent-yellow)' },
          { label: 'CRITICAL', value: servers.filter(s => s.health === 'red').length, color: 'var(--accent-red)' },
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

      {/* Servers Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.6rem' }}>
        {servers.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
            padding: '2rem', textAlign: 'center', gridColumn: '1 / -1',
          }}>
            <Server size={24} style={{ color: 'var(--text-muted)', marginBottom: 6 }} />
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No servers registered</div>
          </div>
        ) : servers.map(s => (
          <div key={s.id} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
            padding: '0.85rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--neon-cyan)' }}>{s.id.slice(0, 10)}...</div>
                <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: 2 }}>Tier: {s.tier}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: healthColor(s.health) }}>
                {healthIcon(s.health)}
                <span style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase' }}>{s.health}</span>
              </div>
            </div>

            {[
              { label: 'CPU', value: s.cpu_usage, color: s.cpu_usage > 80 ? 'var(--accent-red)' : 'var(--neon-green)' },
              { label: 'RAM', value: s.ram_usage, color: s.ram_usage > 80 ? 'var(--accent-red)' : 'var(--neon-green)' },
              { label: 'DISK', value: s.storage_usage, color: s.storage_usage > 80 ? 'var(--accent-red)' : 'var(--neon-green)' },
            ].map(bar => (
              <div key={bar.label} style={{ marginBottom: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', marginBottom: 2 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{bar.label}</span>
                  <span style={{ color: bar.color }}>{bar.value.toFixed(0)}%</span>
                </div>
                <div style={{ width: '100%', height: 4, background: 'var(--bg-tertiary)', borderRadius: 2 }}>
                  <div style={{ width: `${bar.value}%`, height: '100%', background: bar.color, borderRadius: 2, transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.55rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Uptime: <span style={{ color: 'var(--neon-green)' }}>{s.uptime_pct.toFixed(1)}%</span></span>
              <span style={{ color: 'var(--text-muted)' }}>Revenue: <span style={{ color: 'var(--accent-yellow)' }}>${s.revenue.toFixed(2)}</span></span>
            </div>

            <div style={{ display: 'flex', gap: 4, marginTop: '0.5rem' }}>
              <button style={{ flex: 1, padding: '0.3rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 4, color: 'var(--accent-yellow)', cursor: 'pointer', fontSize: '0.55rem' }}>Suspend</button>
              <button style={{ flex: 1, padding: '0.3rem', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: 4, color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '0.55rem' }}>Verify</button>
              <button style={{ flex: 1, padding: '0.3rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 4, color: 'var(--accent-red)', cursor: 'pointer', fontSize: '0.55rem' }}>Disable</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
