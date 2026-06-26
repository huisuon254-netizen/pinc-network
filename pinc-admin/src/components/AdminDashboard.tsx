import { useEffect } from 'react';
import { useAdminStore, type AdminSection } from '../store/adminStore';
import Sidebar from './Sidebar';
import DashboardPage from './pages/DashboardPage';
import NetworkOpsPage from './pages/NetworkOpsPage';
import RentbitOpsPage from './pages/RentbitOpsPage';
import TrafficMonitorPage from './pages/TrafficMonitorPage';
import TreificAdminPage from './pages/TreificAdminPage';
import SaraiControlPage from './pages/SaraiControlPage';
import WagersControlPage from './pages/WagersControlPage';
import ChallengeCenterPage from './pages/ChallengeCenterPage';
import JobsAdminPage from './pages/JobsAdminPage';
import GlobalMapPage from './pages/GlobalMapPage';
import SecurityOpsPage from './pages/SecurityOpsPage';
import PremiumMgmtPage from './pages/PremiumMgmtPage';
import NotificationsPage from './pages/NotificationsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SuperAdminPage from './pages/SuperAdminPage';
import OwnerDashboardPage from './pages/OwnerDashboardPage';
import OpenMaestroPage from './pages/OpenMaestroPage';

const PAGES: Record<AdminSection, React.FC> = {
  dashboard: DashboardPage,
  network: NetworkOpsPage,
  rentbit: RentbitOpsPage,
  traffic: TrafficMonitorPage,
  treific: TreificAdminPage,
  sarai: SaraiControlPage,
  wagers: WagersControlPage,
  challenges: ChallengeCenterPage,
  jobs: JobsAdminPage,
  globalmap: GlobalMapPage,
  security: SecurityOpsPage,
  premium: PremiumMgmtPage,
  notifications: NotificationsPage,
  analytics: AnalyticsPage,
  superadmin: SuperAdminPage,
  owner: OwnerDashboardPage,
  openmaestro: OpenMaestroPage,
};

export default function AdminDashboard() {
  const { identity, activeSection, setActiveSection, logout, loadDashboard } = useAdminStore();

  useEffect(() => { loadDashboard(); }, []);

  const Page = PAGES[activeSection] || DashboardPage;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <Sidebar
        active={activeSection}
        setActive={setActiveSection}
        username={identity?.username || 'admin'}
        role={identity?.role || 'admin'}
        onLogout={logout}
      />
      <main style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <Page />
      </main>
    </div>
  );
}
