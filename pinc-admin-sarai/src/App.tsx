import AdminDashboard from './components/admin/AdminDashboard';
import ThemeBackground from './components/theme/ThemeBackground';

export default function App() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      <ThemeBackground />
      <div style={{ position: 'relative', zIndex: 1, height: '100vh', overflow: 'auto' }}>
        <AdminDashboard />
      </div>
    </div>
  );
}
