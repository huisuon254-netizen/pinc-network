import { X } from 'lucide-react';
import {
  Shield, ShieldCheck, Wallet, Wifi, Server,
  Globe, Bell, Users, User, MessageCircle,
  ShoppingBag, Trophy
} from 'lucide-react';
import brandLogoImg from '../../assets/brand/brand_logo.jpg';

export type FullDashTab =
  | 'identity' | 'contacts' | 'treific' | 'starteran' | 'rentbit'
  | 'sarai' | 'zeroflipper' | 'openmaestro' | 'settings'
  | 'notifications';

export interface NavItem { id: FullDashTab; label: string; icon: React.ReactNode; }

const NAV: NavItem[] = [
  { id:'identity',     label:'IDENTITY',     icon:<User size={15}/> },
  { id:'contacts',     label:'CONTACTS',     icon:<Users size={15}/> },
  { id:'treific',      label:'TREIFIC',      icon:<MessageCircle size={15}/> },
  { id:'starteran',    label:'STARTERAN',    icon:<Wifi size={15}/> },
  { id:'rentbit',      label:'RENTBIT',      icon:<Server size={15}/> },
  { id:'sarai',        label:'SARAI',        icon:<Wallet size={15}/> },
  { id:'zeroflipper',  label:'ZEROFLIPPER',  icon:<ShoppingBag size={15}/> },
  { id:'openmaestro',  label:'OPENMAESTRO',  icon:<Trophy size={15}/> },
  { id:'settings',     label:'SETTINGS',     icon:<ShieldCheck size={15}/> },
  { id:'notifications',label:'NOTIFICATIONS',icon:<Bell size={15}/> },
];

interface Props {
  activePage: FullDashTab;
  setActivePage: (t: FullDashTab) => void;
  nodeId?: string;
  online?: boolean;
  peerCount?: number;
}

export default function Sidebar({ activePage, setActivePage, nodeId, online, peerCount }: Props) {
  return (
    <div className="sidebar-inner">
      <div className="sidebar-header">
        <img src={brandLogoImg} alt="PINC" style={{ height: 34, width: '100%', objectFit: 'contain' }} />
        <div className="sidebar-version">v3.0</div>
      </div>

      {nodeId && (
        <div className="sidebar-node">
          <div className="sidebar-node-label">NODE ID</div>
          <div className="sidebar-node-id">{nodeId}</div>
          <div className="sidebar-node-status">
            <div className={`sidebar-dot ${online ? 'online' : 'offline'}`} />
            <span>{online ? 'ONLINE' : 'LOCAL'}</span>
          </div>
        </div>
      )}

      <nav className="sidebar-nav">
        {NAV.map(item => {
          const active = activePage === item.id;
          return (
            <button key={item.id} onClick={() => setActivePage(item.id)}
              className={`sidebar-nav-item ${active ? 'active' : ''}`}>
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span className="sidebar-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
