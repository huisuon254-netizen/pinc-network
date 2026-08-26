import { useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { ShieldCheck, AlertTriangle, Lock, UserX, Eye, RefreshCw } from 'lucide-react';

export default function SecurityOpsPage() {
  const { securityEvents, securityThreatStats, loadSecurityEvents, loadSecurityThreatStats } = useAdminStore();

  useEffect(() => {
    loadSecurityEvents();
    loadSecurityThreatStats();
    const t = setInterval(() => { loadSecurityEvents(); loadSecurityThreatStats(); }, 10000);
    return () => clearInterval(t);
  }, []);

  const sevColor = (s: string) => s === 'critical' ? 'var(--accent-red)' : s === 'high' ? 'var(--accent-orange)' : s === 'medium' ? 'var(--accent-yellow)' : 'var(--neon-green)';

  return (
    <div style={{ padding: '1.25rem', maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Security Operations Center</h1>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>Threat monitoring and identity protection</p>
        </div>
        <button onClick={() => { loadSecurityEvents(); loadSecurityThreatStats(); }} style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.75rem',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 6, color: 'var(--accent-red)', cursor: 'pointer', fontSize: '0.65rem',
        }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>IDENTITY MONITORING</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
        {[
          { label: 'FAILED LOGINS', value: securityThreatStats.failed_logins, color: 'var(--accent-red)' },
          { label: 'FAILED RECOVERIES', value: securityThreatStats.failed_recoveries, color: 'var(--accent-orange)' },
          { label: 'DEVICE LINK ATTEMPTS', value: securityThreatStats.device_link_attempts, color: 'var(--accent-yellow)' },
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

      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>THREAT MONITORING</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
        {[
          { label: 'BOT NETWORKS', value: securityThreatStats.bot_networks, color: 'var(--accent-red)' },
          { label: 'SPAM NETWORKS', value: securityThreatStats.spam_networks, color: 'var(--accent-orange)' },
          { label: 'FAKE NODES', value: securityThreatStats.fake_nodes, color: 'var(--accent-yellow)' },
          { label: 'FAKE SERVERS', value: securityThreatStats.fake_servers, color: 'var(--accent-purple)' },
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

      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>QUICK ACTIONS</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: '1rem' }}>
        {[
          { label: 'Freeze Identity', icon: <Lock size={12} />, color: 'var(--accent-red)' },
          { label: 'Suspend User', icon: <UserX size={12} />, color: 'var(--accent-orange)' },
          { label: 'Restrict Features', icon: <Eye size={12} />, color: 'var(--accent-yellow)' },
        ].map(a => (
          <button key={a.label} style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.75rem',
            background: `${a.color}12`, border: `1px solid ${a.color}40`,
            borderRadius: 6, color: a.color, cursor: 'pointer', fontSize: '0.6rem',
          }}>
            {a.icon} {a.label}
          </button>
        ))}
      </div>

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
        overflow: 'hidden',
      }}>
        <div style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid var(--border)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          SECURITY EVENTS
        </div>
        {securityEvents.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
            No recent security events
          </div>
        ) : securityEvents.map(e => (
          <div key={e.id} style={{
            padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: sevColor(e.severity),
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-primary)' }}>{e.description}</div>
              <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', marginTop: 1 }}>{new Date(e.timestamp * 1000).toLocaleString()}</div>
            </div>
            <span style={{
              padding: '2px 8px', borderRadius: 10, fontSize: '0.5rem',
              background: `${sevColor(e.severity)}15`, color: sevColor(e.severity),
            }}>{e.severity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
