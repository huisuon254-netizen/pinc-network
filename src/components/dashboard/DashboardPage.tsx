import { useState, useEffect } from 'react';
import Sidebar, { type FullDashTab } from '../sidebar/Sidebar';
import { useAppStore } from '../../store/appStore';
import NodeHome from './NodeHome';
import TreificPage from '../treific/TreificPage';
import SaraiPage from '../sarai/SaraiPage';
import StarteranPage from '../starteran/StarteranPage';
import RentbitPage from '../rentbit/RentbitPage';
import OpenMaestroPage from '../openmaestro/OpenMaestroPage';
import ZeroFlipperPage from '../zeroflipper/ZeroFlipperPage';
import SecurityPage from '../security/SecurityPage';
import ContactsPage from '../contacts/ContactsPage';
import NotificationsPage from '../notifications/NotificationsPage';
import NetWorldPage from '../networld/NetWorldPage';

export default function DashboardPage() {
  const [activePage, setActivePage] = useState<FullDashTab>('identity');
  const store = useAppStore();

  useEffect(() => {
    store.refreshNodeStatus?.();
    store.refreshNetwork?.();
    const t = setInterval(() => store.refreshNodeStatus?.(), 15000);
    return () => clearInterval(t);
  }, [store]);

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
      case 'security':      return <SecurityPage />;
      case 'notifications': return <NotificationsPage />;
      case 'networld':      return <NetWorldPage />;
      default:              return <NodeHome />;
    }
  };

  const nodeStatus = store.nodeStatus;
  const identity = store.identity;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <Sidebar activePage={activePage} setActivePage={setActivePage}
        nodeId={identity?.node_id} online={nodeStatus?.online} peerCount={nodeStatus?.peer_count} />
      <main style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {renderContent()}
      </main>
    </div>
  );
}
