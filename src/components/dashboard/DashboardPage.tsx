import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar, { type FullDashTab } from '../sidebar/Sidebar';
import { useAppStore } from '../../store/appStore';
import NodeHome from './NodeHome';
import TreificPage from '../treific/TreificPage';
import SaraiPage from '../sarai/SaraiPage';
import StarteranPage from '../starteran/StarteranPage';
import RentbitPage from '../rentbit/RentbitPage';
import OpenMaestroPage from '../openmaestro/OpenMaestroPage';
import ZeroFlipperPage from '../zeroflipper/ZeroFlipperPage';
import SettingsPage from '../settings/SettingsPage';
import ContactsPage from '../contacts/ContactsPage';
import NotificationsPage from '../notifications/NotificationsPage';

export default function DashboardPage() {
  const store = useAppStore();
  const { refreshNodeStatus, refreshNetwork, nodeStatus, identity, activeTab, setActiveTab } = store;
  const activePage = activeTab as FullDashTab;
  const setActivePage = (tab: FullDashTab) => setActiveTab(tab);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    refreshNodeStatus?.();
    refreshNetwork?.();
    const t = setInterval(() => refreshNodeStatus?.(), 15000);
    return () => clearInterval(t);
  }, [refreshNodeStatus, refreshNetwork]);

  const renderContent = () => {
    switch (activePage) {
      case 'identity':      return <NodeHome />;
      case 'contacts':      return <ContactsPage />;
      case 'treific':       return <TreificPage />;
      case 'starteran':     return <StarteranPage />;
      case 'rentbit':       return <RentbitPage />;
      case 'sarai':         return <SaraiPage />;
      case 'zeroflipper':   return <ZeroFlipperPage />;
      case 'openmaestro':   return <OpenMaestroPage />;
      case 'settings':      return <SettingsPage />;
      case 'notifications': return <NotificationsPage />;
      default:              return <NodeHome />;
    }
  };

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar activePage={activePage} setActivePage={(tab) => { setActivePage(tab); setSidebarOpen(false); }}
          nodeId={identity?.node_id} online={nodeStatus?.online} peerCount={nodeStatus?.peer_count} />
      </div>
      <main className="main-content">
        <button className="hamburger" onClick={() => setSidebarOpen(true)}>
          <Menu size={20} />
        </button>
        {renderContent()}
      </main>
    </div>
  );
}
