import { useState, useEffect } from 'react';
import Sidebar, { type FullDashTab } from '../sidebar/Sidebar';
import { useAppStore } from '../../store/appStore';
import NodeHome from './NodeHome';
import TreificPage from '../treific/TreificPage';
import SaraiPage from '../sarai/SaraiPage';
import StarteranPage from '../starteran/StarteranPage';
import RentbitPage from '../rentbit/RentbitPage';
import WagerPage from '../wager/WagerPage';
import JobsPage from '../jobs/JobsPage';
import RankingsPage from '../rankings/RankingsPage';
import SecurityPage from '../security/SecurityPage';
import SettingsPage from '../settings/SettingsPage';
import ContactsPage from '../contacts/ContactsPage';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<FullDashTab>('home');
  const store = useAppStore();

  useEffect(() => {
    store.refreshNodeStatus?.();
    store.refreshNetwork?.();
    const t = setInterval(() => store.refreshNodeStatus?.(), 15000);
    return () => clearInterval(t);
  }, [store]);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':       return <NodeHome />;
      case 'treific':    return <TreificPage />;
      case 'sarai':      return <SaraiPage />;
      case 'starteran':  return <StarteranPage />;
      case 'rentbit':    return <RentbitPage />;
      case 'wagers':     return <WagerPage />;
      case 'jobs':       return <JobsPage />;
      case 'rankings':   return <RankingsPage />;
      case 'security':   return <SecurityPage />;
      case 'contacts':   return <ContactsPage />;
      case 'settings':   return <SettingsPage />;
      default:           return <NodeHome />;
    }
  };

  const nodeStatus = store.nodeStatus;
  const identity = store.identity;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab}
        nodeId={identity?.node_id} online={nodeStatus?.online} peerCount={nodeStatus?.peer_count} />
      <main style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {renderContent()}
      </main>
    </div>
  );
}
