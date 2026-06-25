import { useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { Activity, Phone, Video, FileUp, BarChart3, Globe } from 'lucide-react';

export default function TrafficMonitorPage() {
  const { trafficStats, loadTrafficStats } = useAdminStore();
  useEffect(() => { loadTrafficStats(); const t = setInterval(loadTrafficStats, 5000); return () => clearInterval(t); }, []);

  return (
    <div style={{ padding: '1.25rem', maxWidth: 1100 }}>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Traffic Monitoring Center</h1>
        <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>Infrastructure metrics only — no content access</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
        {[
          { label: 'MSG/MIN', value: trafficStats.messages_per_minute, icon: <Activity size={14} color="var(--neon-cyan)" />, color: 'var(--neon-cyan)' },
          { label: 'VOICE CALLS', value: trafficStats.voice_calls_active, icon: <Phone size={14} color="var(--neon-green)" />, color: 'var(--neon-green)' },
          { label: 'VIDEO CALLS', value: trafficStats.video_calls_active, icon: <Video size={14} color="var(--accent-purple)" />, color: 'var(--accent-purple)' },
          { label: 'FILE XFER', value: trafficStats.file_transfers_active, icon: <FileUp size={14} color="var(--accent-orange)" />, color: 'var(--accent-orange)' },
          { label: 'DATA (GB)', value: trafficStats.total_data_usage_gb.toFixed(1), icon: <BarChart3 size={14} color="var(--accent-yellow)" />, color: 'var(--accent-yellow)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
            padding: '0.75rem 0.85rem', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: `${s.color}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Network Load */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
        padding: '1rem', marginBottom: '1rem',
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>GLOBAL NETWORK LOAD</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ height: 20, background: 'var(--bg-tertiary)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{
                width: `${trafficStats.global_load}%`, height: '100%',
                background: trafficStats.global_load > 80 ? 'var(--accent-red)' : trafficStats.global_load > 50 ? 'var(--accent-yellow)' : 'var(--neon-green)',
                borderRadius: 10, transition: 'width 0.5s',
              }} />
            </div>
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', minWidth: 50, textAlign: 'right' }}>
            {trafficStats.global_load.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Regional Load */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem',
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>REGIONAL LOAD</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
          {Object.entries(trafficStats.regional_load).length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
              No regional data
            </div>
          ) : Object.entries(trafficStats.regional_load).map(([region, load]) => (
            <div key={region} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '0.4rem 0.6rem',
              background: 'var(--bg-tertiary)', borderRadius: 6,
            }}>
              <Globe size={12} color="var(--text-muted)" />
              <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', flex: 1 }}>{region}</span>
              <div style={{ width: 60, height: 4, background: 'var(--bg-secondary)', borderRadius: 2 }}>
                <div style={{ width: `${load}%`, height: '100%', background: load > 80 ? 'var(--accent-red)' : 'var(--neon-green)', borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', minWidth: 30, textAlign: 'right' }}>{load.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
