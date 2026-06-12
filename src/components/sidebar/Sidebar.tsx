import {
  Shield, HardDrive, Network, MessageSquare, Settings,
  Briefcase, Wallet, Swords, Users, Brain, Globe, Zap, Server,
  Languages, ShieldCheck, Gauge
} from 'lucide-react';

export type FullDashTab =
  | 'home' | 'vault' | 'network' | 'distributed'
  | 'messages' | 'marketplace' | 'payment' | 'reputation'
  | 'social' | 'wager' | 'ai' | 'admin' | 'settings'
  | 'language' | 'role' | 'resources';

interface NavItem { id: FullDashTab; label: string; icon: React.ReactNode; phase: number; }

const NAV: NavItem[] = [
  { id:'home',        label:'NODE',         icon:<Shield size={15}/>,       phase:1  },
  { id:'vault',       label:'VAULT',        icon:<HardDrive size={15}/>,    phase:1  },
  { id:'network',     label:'NETWORK',      icon:<Network size={15}/>,      phase:3  },
  { id:'distributed', label:'DISTRIB',      icon:<Globe size={15}/>,        phase:4  },
  { id:'messages',    label:'MESSAGES',     icon:<MessageSquare size={15}/>,phase:5  },
  { id:'marketplace', label:'JOBS',         icon:<Briefcase size={15}/>,    phase:6  },
  { id:'payment',     label:'WALLET',       icon:<Wallet size={15}/>,       phase:7  },
  { id:'reputation',  label:'REPUTATION',   icon:<Zap size={15}/>,          phase:8  },
  { id:'social',      label:'SOCIAL',       icon:<Users size={15}/>,        phase:9  },
  { id:'wager',       label:'WAGERS',       icon:<Swords size={15}/>,       phase:10 },
  { id:'ai',          label:'AI ENGINE',    icon:<Brain size={15}/>,        phase:11 },
  { id:'admin',       label:'INFRA',        icon:<Server size={15}/>,       phase:12 },
  { id:'resources',   label:'RESOURCES',    icon:<Gauge size={15}/>,        phase:1  },
  { id:'role',        label:'ROLE',         icon:<ShieldCheck size={15}/>,  phase:1  },
  { id:'language',    label:'LANGUAGE',     icon:<Languages size={15}/>,    phase:1  },
  { id:'settings',    label:'SETTINGS',     icon:<Settings size={15}/>,     phase:0  },
];

const ACTIVE_PHASES = [1, 2, 3]; // phases that are live

interface Props {
  activeTab: FullDashTab;
  setActiveTab: (t: FullDashTab) => void;
  nodeId?: string;
  online?: boolean;
  peerCount?: number;
  vaultCount?: number;
}

export default function Sidebar({ activeTab, setActiveTab, nodeId, online, peerCount, vaultCount }: Props) {
  return (
    <div style={{
      width:190, minWidth:190, height:'100vh', background:'var(--bg-secondary)',
      borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column',
      padding:'1.25rem 0', overflowY:'auto',
    }}>
      {/* Logo */}
      <div style={{ padding:'0 1rem', marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'1.1rem', fontWeight:900, color:'var(--electric-blue)', letterSpacing:'0.15em' }} className="glow-blue">PINC</div>
        <div style={{ fontSize:'0.5rem', color:'var(--text-muted)', letterSpacing:'0.2em', marginTop:'1px' }}>v3.0 · ALL PHASES</div>
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
          const phaseColor = item.phase <= 3 ? 'var(--neon-green)' : item.phase <= 6 ? 'var(--neon-yellow)' : item.phase <= 10 ? 'var(--soft-purple)' : 'var(--text-muted)';

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
              {item.phase > 0 && (
                <span style={{
                  fontSize:'0.5rem', padding:'1px 4px', borderRadius:'2px',
                  border:`1px solid ${phaseColor}44`, color:phaseColor,
                  background:`${phaseColor}11`,
                }}>P{item.phase}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom stats */}
      <div style={{ padding:'0.875rem 1rem', borderTop:'1px solid var(--border)', fontSize:'0.62rem' }}>
        {[['PEERS', String(peerCount ?? 0), 'var(--text-secondary)'],
          ['FILES', String(vaultCount ?? 0), 'var(--text-secondary)'],
          ['PHASE', '3 / 15', 'var(--electric-blue)']].map(([l,v,c]) => (
          <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:'3px' }}>
            <span style={{ color:'var(--text-muted)' }}>{l}</span>
            <span style={{ color:c, fontFamily:'monospace' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
