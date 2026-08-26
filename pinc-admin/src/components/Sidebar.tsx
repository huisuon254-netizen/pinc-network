import {
  LayoutDashboard, Network, Server, Activity, MessageSquare,
  Wallet, Swords, Briefcase, Map, ShieldCheck, Crown, Bell,
  BarChart3, Settings, Zap, Trophy, Target, LogOut, ChevronDown,
  WalletCards, Receipt, CreditCard, SlidersHorizontal
} from 'lucide-react';

export type AdminSection =
  | 'dashboard' | 'network' | 'rentbit' | 'traffic' | 'treific'
  | 'sarai' | 'wagers' | 'challenges' | 'jobs' | 'globalmap'
  | 'security' | 'premium' | 'notifications' | 'analytics'
  | 'superadmin' | 'owner' | 'openmaestro'
  | 'fees' | 'wallets' | 'payments' | 'transactions';

interface NavGroup {
  label: string;
  items: { id: AdminSection; label: string; icon: React.ReactNode; color?: string }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'OVERVIEW',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} /> },
      { id: 'globalmap', label: 'Global Map', icon: <Map size={14} />, color: 'var(--neon-cyan)' },
      { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={14} />, color: 'var(--accent-purple)' },
    ],
  },
  {
    label: 'FINANCIAL',
    items: [
      { id: 'fees', label: 'Fees & Transactions', icon: <SlidersHorizontal size={14} />, color: 'var(--neon-cyan)' },
      { id: 'transactions', label: 'Transaction Records', icon: <Receipt size={14} />, color: 'var(--accent-blue)' },
      { id: 'payments', label: 'Payment Sources', icon: <CreditCard size={14} />, color: 'var(--neon-green)' },
    ],
  },
  {
    label: 'CRYPTO',
    items: [
      { id: 'wallets', label: 'Wallet Management', icon: <WalletCards size={14} />, color: 'var(--accent-yellow)' },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { id: 'network', label: 'Network Ops', icon: <Network size={14} />, color: 'var(--neon-green)' },
      { id: 'rentbit', label: 'RENTBIT Ops', icon: <Server size={14} />, color: 'var(--accent-orange)' },
      { id: 'traffic', label: 'Traffic Monitor', icon: <Activity size={14} />, color: 'var(--neon-cyan)' },
    ],
  },
  {
    label: 'PLATFORM',
    items: [
      { id: 'treific', label: 'TREIFIC Admin', icon: <MessageSquare size={14} />, color: 'var(--accent-blue)' },
      { id: 'sarai', label: 'SARAI Control', icon: <Wallet size={14} />, color: 'var(--neon-green)' },
      { id: 'wagers', label: 'WAGERS Control', icon: <Swords size={14} />, color: 'var(--accent-red)' },
      { id: 'challenges', label: 'Challenge Center', icon: <Target size={14} />, color: 'var(--accent-yellow)' },
      { id: 'jobs', label: 'Jobs Admin', icon: <Briefcase size={14} />, color: 'var(--accent-purple)' },
    ],
  },
  {
    label: 'SECURITY',
    items: [
      { id: 'security', label: 'Security Ops', icon: <ShieldCheck size={14} />, color: 'var(--accent-red)' },
      { id: 'premium', label: 'Premium Mgmt', icon: <Crown size={14} />, color: 'var(--accent-yellow)' },
      { id: 'notifications', label: 'Notifications', icon: <Bell size={14} />, color: 'var(--accent-blue)' },
    ],
  },
  {
    label: 'OPENMAESTRO',
    items: [
      { id: 'openmaestro', label: 'Challenges', icon: <Trophy size={14} />, color: 'var(--accent-yellow)' },
    ],
  },
  {
    label: 'ADMIN',
    items: [
      { id: 'superadmin', label: 'Super Admin', icon: <Zap size={14} />, color: 'var(--accent-red)' },
      { id: 'owner', label: 'Owner Dashboard', icon: <Trophy size={14} />, color: 'var(--neon-yellow)' },
    ],
  },
];

interface Props {
  active: AdminSection;
  setActive: (s: AdminSection) => void;
  username: string;
  role: string;
  onLogout: () => void;
}

export default function Sidebar({ active, setActive, username, role, onLogout }: Props) {
  return (
    <div style={{
      width: 200, minWidth: 200, height: '100vh', background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6, background: 'rgba(239,68,68,0.15)',
            border: '1px solid var(--accent-red)', display: 'flex', alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ShieldCheck size={14} color="var(--accent-red)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--accent-red)', letterSpacing: '0.1em' }}>PINC</div>
            <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.15em' }}>ADMIN</div>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-primary)' }}>{username}</div>
        <div style={{
          fontSize: '0.55rem', color: 'var(--accent-red)', letterSpacing: '0.08em',
          marginTop: 2, textTransform: 'uppercase',
        }}>{role}</div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0.5rem 0' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: '0.5rem' }}>
            <div style={{
              padding: '0.3rem 1rem', fontSize: '0.5rem', fontWeight: 700,
              color: 'var(--text-muted)', letterSpacing: '0.15em',
            }}>{group.label}</div>
            {group.items.map(item => {
              const isActive = active === item.id;
              return (
                <button key={item.id} onClick={() => setActive(item.id)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 7,
                  padding: '0.45rem 1rem', background: isActive ? 'rgba(239,68,68,0.06)' : 'transparent',
                  border: 'none', borderLeft: isActive ? '2px solid var(--accent-red)' : '2px solid transparent',
                  color: isActive ? (item.color || 'var(--text-primary)') : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '0.65rem', textAlign: 'left',
                  transition: 'all 0.1s',
                }}>
                  <span style={{ flexShrink: 0 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid var(--border)' }}>
        <button onClick={onLogout} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 7,
          padding: '0.45rem 0.75rem', background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6,
          color: 'var(--accent-red)', cursor: 'pointer', fontSize: '0.65rem',
        }}>
          <LogOut size={13} /> Logout
        </button>
      </div>
    </div>
  );
}
