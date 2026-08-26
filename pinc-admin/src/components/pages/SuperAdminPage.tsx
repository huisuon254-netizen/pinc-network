import { useState, useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { Zap, Settings, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react';

export default function SuperAdminPage() {
  const { superAdminFeatures, globalFees, loadSuperAdminData, toggleFeature, applyGlobalChanges } = useAdminStore();
  const [editableFees, setEditableFees] = useState(globalFees);

  useEffect(() => {
    loadSuperAdminData();
  }, []);

  useEffect(() => {
    setEditableFees(globalFees);
  }, [globalFees]);

  return (
    <div style={{ padding: '1.25rem', maxWidth: 1100 }}>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-red)' }}>Super Admin Panel</h1>
        <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>Highest-level platform configuration</p>
      </div>

      <div style={{
        background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: 8, padding: '0.6rem 0.85rem', marginBottom: '1rem',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <AlertTriangle size={14} color="var(--accent-red)" />
        <span style={{ fontSize: '0.65rem', color: 'var(--accent-red)' }}>Changes here affect the entire platform. All actions are logged.</span>
      </div>

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
        padding: '1rem', marginBottom: '1rem',
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={14} /> FEATURE FLAGS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
          {superAdminFeatures.map(f => (
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
                value={(editableFees as any)[f.key]}
                onChange={e => setEditableFees(prev => ({ ...prev, [f.key]: parseFloat(e.target.value) || 0 }))}
                style={{
                  width: '100%', padding: '0.4rem', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)', borderRadius: 4, color: 'var(--accent-yellow)',
                  fontSize: '0.8rem', fontWeight: 700,
                }} />
            </div>
          ))}
        </div>
        <button onClick={() => applyGlobalChanges(editableFees.platform_fee, editableFees.escrow_fee, editableFees.listing_fee)} style={{
          marginTop: '0.75rem', padding: '0.4rem 1rem', background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, color: 'var(--accent-red)',
          cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600,
        }}>Apply Global Changes</button>
      </div>
    </div>
  );
}
