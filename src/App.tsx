import { useEffect } from 'react';
import { useAppStore } from './store/appStore';
import SplashScreen from './components/splash/SplashScreen';
import LoginScreen from './components/login/LoginScreen';
import DashboardPage from './components/dashboard/DashboardPage';

export default function App() {
  const { screen, initialize } = useAppStore();

  useEffect(() => {
    initialize();
  }, []);

  if (screen === 'splash') return <SplashScreen />;
  if (screen === 'login')  return <LoginScreen />;
  return <DashboardPage />;
}
