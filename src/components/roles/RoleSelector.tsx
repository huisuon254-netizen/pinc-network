import { motion } from 'framer-motion';
import { Shield, Wrench, User, Eye, Check } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import type { UserRole } from '../../types';
import { ROLE_PERMISSIONS } from '../../types';

const ROLES: { id: UserRole; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  { id: 'admin', label: 'ADMIN', desc: 'Full system control, manage users, allocate resources', icon: <Shield size={16} />, color: 'var(--neon-red)' },
  { id: 'operator', label: 'OPERATOR', desc: 'Manage nodes, relay traffic, view metrics', icon: <Wrench size={16} />, color: 'var(--neon-yellow)' },
  { id: 'user', label: 'USER', desc: 'Access Net World, marketplace, wallet, messaging', icon: <User size={16} />, color: 'var(--electric-blue)' },
  { id: 'guest', label: 'GUEST', desc: 'Read-only access to public information', icon: <Eye size={16} />, color: 'var(--text-muted)' },
];

interface Props {
  onSelect?: () => void;
  compact?: boolean;
}

export default function RoleSelector({ onSelect, compact }: Props) {
  const { role, setRole } = useAppStore();
  const perms = ROLE_PERMISSIONS[role];

  return (
    <div className="pinc-card" style={{ padding: compact ? '1rem' : '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: compact ? '0.75rem' : '1.25rem' }}>
        <Shield size={compact ? 14 : 16} style={{ color: 'var(--electric-blue)' }} />
        <span style={{ fontSize: compact ? '0.7rem' : '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>
          ROLE & PERMISSIONS
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
        {ROLES.map(r => {
          const selected = role === r.id;
          return (
            <motion.button
              key={r.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setRole(r.id); onSelect?.(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.7rem 0.75rem', textAlign: 'left',
                background: selected ? `${r.color}11` : 'var(--bg-tertiary)',
                border: `1px solid ${selected ? r.color : 'var(--border)'}`,
                borderRadius: '4px', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <span style={{ color: r.color, flexShrink: 0 }}>{r.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', color: selected ? r.color : 'var(--text-primary)', fontWeight: selected ? 600 : 400 }}>{r.label}</div>
                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>{r.desc}</div>
              </div>
              {selected && <Check size={13} style={{ color: r.color, flexShrink: 0 }} />}
            </motion.button>
          );
        })}
      </div>

      {/* Permissions summary */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
          ACTIVE PERMISSIONS
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {Object.entries(perms).map(([key, val]) => (
            <span key={key} style={{
              fontSize: '0.58rem', padding: '2px 6px', borderRadius: '2px',
              background: val ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${val ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
              color: val ? 'var(--electric-blue)' : 'var(--text-muted)',
            }}>
              {val ? '✓' : '✗'} {key.replace('can', '')}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
