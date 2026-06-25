import { useState } from 'react';
import { Zap, Shield, Settings, ToggleLeft, ToggleRight, AlertTriangle, CheckCircle } from 'lucide-react';

interface Feature {
  id: string; name: string; enabled: boolean; description: string; requiresRestart: boolean;
}

const DEFAULT_FEATURES: Feature[] = [
  { id: 'p2p_network', name: 'P2P Network', enabled: true, description: 'Peer-to-peer networking layer', requiresRestart: true },
  { id: 'ghost_origin', name: 'Ghost Origin', enabled: true, description: 'Anonymous routing protection', requiresRestart: false },
  { id: 'ai_agents', name: 'AI Agents', enabled: true, description: 'Machine learning inference', requiresRestart: true },
  { id: 'wager_system', name: 'Wager System', enabled: true, description: 'Competitive gaming and betting', requiresRestart: false },
  { id: 'rentbit_marketplace', name: 'RENTBIT Marketplace', enabled: true, description: 'Server rental marketplace', requiresRestart: false },
  { id: 'starteran_sharing', name: 'STARTERAN Sharing', enabled: true, description: 'Bandwidth sharing network', requiresRestart: false },
  { id: 'admin_panel', name: 'Admin Panel', enabled: true, description: 'This admin interface', requiresRestart: false },
  { id: 'debug_mode', name: 'Debug Mode', enabled: false, description: 'Enable verbose logging', requiresRestart: false },
];

export default function SuperAdminPage() {
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [globalFees, setGlobalFees] = useState({ platform_fee: 2.5, escrow_fee: 2.5, listing_fee: 5.0 });

  const toggleFeature = (id: string) => {
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  };

  return (
    <div style={{ padding: '1.25rem', maxWidth: 1100 }}>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-red)' }}>Super Admin Panel</h1>
        <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>Highest-level platform configuration</p>
      </div>

      {/* Warning */}
      <div style={{
        background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: 8, padding: '0.6rem 0.85rem', marginBottom: '1rem',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <AlertTriangle size={14} color="var(--accent-red)" />
        <span style={{ fontSize: '0.65rem', color: 'var(--accent-red)' }}>Changes here affect the entire platform. All actions are logged.</span>
      </div>

      {/* Feature Flags */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
        padding: '1rem', marginBottom: '1rem',
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={14} /> FEATURE FLAGS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
          {features.map(f => (
            <div key={f.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0.75rem',
              background: 'var(--bg-tertiary)', borderRadius: 6,
            }}>
              <button onClick={() => toggleFeature(f.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: f.enabled ? 'var(--neon-green)' : 'var(--text-muted)',
              }}>
                {f.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-primary)' }}>{f.name}</div>
                <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>{f.description}</div>
              </div>
              {f.requiresRestart && (
                <span style={{ fontSize: '0.45rem', color: 'var(--accent-yellow)', padding: '1px 4px', background: 'rgba(245,158,11,0.1)', borderRadius: 3 }}>RESTART</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Global Fee Configuration */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
        padding: '1rem',
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Settings size={14} /> GLOBAL FEE CONFIGURATION
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          {[
            { key: 'platform_fee', label: 'Platform Fee (%)' },
            { key: 'escrow_fee', label: 'Escrow Fee (%)' },
            { key: 'listing_fee', label: 'Listing Fee (%)' },
          ].map(f => (
            <div key={f.key} style={{
              padding: '0.5rem 0.75rem', background: 'var(--bg-tertiary)', borderRadius: 6,
            }}>
              <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginBottom: 4 }}>{f.label}</div>
              <input type="number" step="0.1" min="0" max="50"
                value={(globalFees as any)[f.key]}
                onChange={e => setGlobalFees(prev => ({ ...prev, [f.key]: parseFloat(e.target.value) || 0 }))}
                style={{
                  width: '100%', padding: '0.4rem', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)', borderRadius: 4, color: 'var(--accent-yellow)',
                  fontSize: '0.8rem', fontWeight: 700,
                }} />
            </div>
          ))}
        </div>
        <button style={{
          marginTop: '0.75rem', padding: '0.4rem 1rem', background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, color: 'var(--accent-red)',
          cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600,
        }}>Apply Global Changes</button>
      </div>
    </div>
  );
}
