import { useState, useEffect } from 'react';
import Sidebar, { type FullDashTab } from '../sidebar/Sidebar';
import { useAppStore } from '../../store/appStore';

// Phase 1-3 (live)
import NodeHome from './NodeHome';
import VaultPage from '../vault/VaultPage';
import NetworkPage from '../network/NetworkPage';
import SettingsPage from '../settings/SettingsPage';

// Phase 4+
import DistributedVaultPage from '../distributed/DistributedVaultPage';
import MessagingPage from '../messaging/MessagingPage';
import FullMarketplacePage from '../marketplace/MarketplacePage';
import PaymentPage from '../payment/PaymentPage';
import ReputationPage from '../reputation/ReputationPage';
import SocialPage from '../social/SocialPage';
import WagerPage from '../wager/WagerPage';
import AiPage from '../ai/AiPage';
import AdminPage from '../admin/AdminPage';

// System config
import LanguageSelector from '../language/LanguageSelector';
import RoleSelector from '../roles/RoleSelector';
import ResourcePage from '../resources/ResourcePage';

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
      case 'home':        return <NodeHome />;
      case 'vault':       return <VaultPage />;
      case 'network':     return <NetworkPage />;
      case 'distributed': return <DistributedVaultPage />;
      case 'messages':    return <MessagingPage />;
      case 'marketplace': return <FullMarketplacePage />;
      case 'payment':     return <PaymentPage />;
      case 'reputation':  return <ReputationPage />;
      case 'social':      return <SocialPage />;
      case 'wager':       return <WagerPage />;
      case 'ai':          return <AiPage />;
      case 'admin':       return <AdminPage />;
      case 'language':    return <div style={{ padding:'2rem', maxWidth:'700px' }}><LanguageSelector /></div>;
      case 'role':        return <div style={{ padding:'2rem', maxWidth:'700px' }}><RoleSelector /></div>;
      case 'resources':   return <ResourcePage />;
      case 'settings':    return <SettingsPage />;
      default:            return <NodeHome />;
    }
  };

  const nodeStatus = store.nodeStatus;
  const identity = store.identity;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        nodeId={identity?.node_id}
        online={nodeStatus?.online}
        peerCount={nodeStatus?.peer_count}
        vaultCount={nodeStatus?.vault_file_count}
      />
      <main style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {renderContent()}
      </main>
    </div>
  );
}
