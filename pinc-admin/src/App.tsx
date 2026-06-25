import { useAdminStore } from './store/adminStore';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const screen = useAdminStore(s => s.screen);
  if (screen === 'login') return <LoginScreen />;
  return <AdminDashboard />;
}
