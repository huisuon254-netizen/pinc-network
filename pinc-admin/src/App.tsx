import { ThemeContextProvider, useTheme, THEMES, LAYOUTS, THEME_LABELS, LAYOUT_LABELS } from './contexts/ThemeContext';
import { useAdminStore } from './store/adminStore';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';

import './styles/admin-theme.css';
import './styles/layouts.css';

function AdminToolbar() {
  const { theme, layout, setTheme, setLayout, toggleSidebar, toggleDrawer } = useTheme();

  return (
    <header className="app-toolbar toolbar">
      <div className="toolbar-left">
        <span className="admin-toolbar-compact">
          <button
            className="hamburger-btn"
            onClick={layout === 'compact-top' ? toggleDrawer : toggleSidebar}
            aria-label="Toggle navigation"
            title="Toggle menu"
          >
            ☰
          </button>
        </span>
        <span className="toolbar-title">⬡ PINC Admin</span>
      </div>
      <div className="toolbar-right">
        <div className="theme-switcher" role="group" aria-label="Theme selector">
          {THEMES.map(t => (
            <button
              key={t}
              className={`theme-btn ${theme === t ? 'active' : ''}`}
              onClick={() => setTheme(t)}
              title={t}
            >
              {THEME_LABELS[t]}
            </button>
          ))}
        </div>
        <div className="layout-switcher" role="group" aria-label="Layout selector">
          {LAYOUTS.map(l => (
            <button
              key={l}
              className={`layout-btn ${layout === l ? 'active' : ''}`}
              onClick={() => setLayout(l)}
              title={l}
            >
              {LAYOUT_LABELS[l]}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

function AppShell() {
  const screen = useAdminStore(s => s.screen);
  const { layout, closeDrawer } = useTheme();

  if (screen === 'login') {
    return <LoginScreen />;
  }

  return (
    <div className="app-root">
      <AdminToolbar />
      <div className="app-main-area">
        <AdminDashboard />
        {layout === 'compact-top' && (
          <div
            className="drawer-overlay"
            onClick={closeDrawer}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeContextProvider>
      <AppShell />
    </ThemeContextProvider>
  );
}
