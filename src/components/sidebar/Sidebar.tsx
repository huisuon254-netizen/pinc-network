import {
  Shield, HardDrive, MessageSquare, Settings,
  Briefcase, Wallet, Swords, Globe, Zap, Server,
  ShieldCheck, Wifi, Trophy, Bell, Users
} from 'lucide-react';

export type FullDashTab =
  | 'home' | 'treific' | 'sarai' | 'starteran' | 'rentbit'
  | 'wagers' | 'jobs' | 'rankings' | 'security' | 'settings' | 'contacts';

export interface NavItem { id: FullDashTab; label: string; icon: React.ReactNode; }

const NAV: NavItem[] = [
  { id:'home',       label:'HOME',       icon:<Shield size={15}/> },
  { id:'treific',    label:'TREIFIC',    icon:<MessageSquare size={15}/> },
  { id:'sarai',      label:'SARAI',      icon:<Wallet size={15}/> },
  { id:'contacts',   label:'CONTACTS',   icon:<Users size={15}/> },
  { id:'starteran',  label:'STARTERAN',  icon:<Wifi size={15}/> },
  { id:'rentbit',    label:'RENTBIT',    icon:<Server size={15}/> },
  { id:'wagers',     label:'WAGERS',     icon:<Swords size={15}/> },
  { id:'jobs',       label:'JOBS',       icon:<Briefcase size={15}/> },
  { id:'rankings',   label:'RANKINGS',   icon:<Trophy size={15}/> },
  { id:'security',   label:'SECURITY',   icon:<ShieldCheck size={15}/> },
  { id:'settings',   label:'SETTINGS',   icon:<Settings size={15}/> },
];

interface Props {
  activeTab: FullDashTab;
  setActiveTab: (t: FullDashTab) => void;
  nodeId?: string;
  online?: boolean;
  peerCount?: number;
}

export default function Sidebar({ activeTab, setActiveTab, nodeId, online, peerCount }: Props) {
  return (
    <div style={{
      width:190, minWidth:190, height:'100vh', background:'var(--bg-secondary)',
      borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column',
      padding:'1.25rem 0', overflowY:'auto',
    }}>
      {/* Logo */}
      <div style={{ padding:'0 1rem', marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'1.1rem', fontWeight:900, color:'var(--electric-blue)', letterSpacing:'0.15em' }} className="glow-blue">PINC</div>
        <div style={{ fontSize:'0.5rem', color:'var(--text-muted)', letterSpacing:'0.2em', marginTop:'1px' }}>v3.0</div>
      </div>

      {/* Node ID */}
      {nodeId && (
        <div style={{ padding:'0.5rem 1rem', marginBottom:'1rem', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)' }}>
          <div style={{ fontSize:'0.58rem', color:'var(--text-muted)', marginBottom:'3px' }}>NODE ID</div>
          <div style={{ fontFamily:'monospace', fontSize:'0.7rem', color:'var(--neon-cyan)' }}>{nodeId}</div>
          <div style={{ display:'flex', alignItems:'center', gap:'5px', marginTop:'5px' }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background: online ? 'var(--neon-green)' : 'var(--neon-red)' }} />
            <span style={{ fontSize:'0.58rem', color: online ? 'var(--neon-green)' : 'var(--neon-red)' }}>
              {online ? 'ONLINE' : 'LOCAL'}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav style={{ flex:1 }}>
        {NAV.map(item => {
          const active = activeTab === item.id;

          return (
            <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
              width:'100%', display:'flex', alignItems:'center', gap:'8px', padding:'0.6rem 1rem',
              background: active ? 'rgba(0,212,255,0.08)' : 'transparent',
              border:'none', borderLeft: active ? '2px solid var(--electric-blue)' : '2px solid transparent',
              color: active ? 'var(--electric-blue)' : 'var(--text-secondary)',
              cursor:'pointer', fontSize:'0.7rem', fontFamily:'monospace', letterSpacing:'0.06em',
              textAlign:'left', transition:'all 0.12s',
            }}>
              <span style={{ flexShrink:0 }}>{item.icon}</span>
              <span style={{ flex:1 }}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}