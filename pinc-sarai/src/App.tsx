import { useEffect } from 'react';
import { useAppStore } from './store/appStore';
import SaraiPage from './components/sarai/SaraiPage';
import ThemeBackground from './components/theme/ThemeBackground';
import LanguageOnboardingScreen from './components/onboarding/LanguageOnboardingScreen';
import AccountSetupScreen from './components/onboarding/AccountSetupScreen';
import SettingsPage from './components/settings/SettingsPage';
import LockScreen from './components/settings/LockScreen';

export default function App() {
  const { initialize, screen, isLocked, activeTab } = useAppStore();
  useEffect(() => { initialize(); }, [initialize]);

  // lock screen overlays everything except splash/language/setup
  if (isLocked && screen !== 'splash' && screen !== 'language' && screen !== 'setup') {
    return (
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        <ThemeBackground />
        <LockScreen />
      </div>
    );
  }

  if (screen === 'splash') {
    return (
      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <ThemeBackground />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 1 }}>
          <img src="/assets/images/sarai-logo.png" alt="SARAI" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)', boxShadow: 'var(--theme-glow)' }} onError={e => (e.currentTarget.style.display = 'none')} />
          <div style={{ width: 42, height: 2, borderRadius: 999, background: 'var(--theme-accent)', boxShadow: 'var(--theme-glow)', opacity: 0.9 }} />
          <div style={{ fontFamily: 'monospace', fontSize: '1.35rem', fontWeight: 800, color: 'var(--theme-accent)', letterSpacing: '0.16em', textShadow: 'var(--theme-glow)' }}>SARAI</div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.18em' }}>ALL TRANSACTIONS. SECURELY.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--neon-green)', display: 'inline-block', boxShadow: '0 0 8px var(--neon-green)' }} />
            Powered by <span style={{ color: 'var(--theme-accent)', fontWeight: 700 }}>PINC Platform</span>
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', opacity: 0.7 }}>Loading decentralized wallet…</div>
        </div>
      </div>
    );
  }

  if (screen === 'language') {
    return (
      <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
        <ThemeBackground />
        <LanguageOnboardingScreen />
      </div>
    );
  }

  if (screen === 'setup') {
    return (
      <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
        <ThemeBackground />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <AccountSetupScreen />
        </div>
      </div>
    );
  }

  if (screen === 'login') {
    return (
      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem', overflow: 'hidden' }}>
        <ThemeBackground />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1.75rem', borderRadius: 20, background: 'var(--bg-card)', backdropFilter: 'blur(16px)', border: '1px solid var(--border)', boxShadow: '0 16px 48px rgba(0,0,0,0.22)', maxWidth: 360, width: '100%' }}>
          <img src="/assets/images/sarai-logo.png" alt="SARAI" style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)', boxShadow: '0 0 24px rgba(212,175,55,0.25)' }} onError={e => (e.currentTarget.style.display = 'none')} />
          <div style={{ fontFamily: 'monospace', fontSize: '1.45rem', fontWeight: 800, color: 'var(--theme-accent)', letterSpacing: '0.14em', textShadow: 'var(--theme-glow)' }}>SARAI</div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.18em' }}>ALL TRANSACTIONS. SECURELY.</div>
          <button onClick={() => useAppStore.getState().setScreen('setup')} className="pinc-btn pinc-btn-primary" style={{ width: '100%', marginTop: '0.25rem', borderRadius: 999, padding: '0.7rem', fontWeight: 800, letterSpacing: '0.06em', boxShadow: 'var(--theme-glow)' }}>Create / Enter SARAI ID</button>
          <button onClick={() => useAppStore.getState().setScreen('language')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.68rem', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>Change language</button>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--neon-green)', display: 'inline-block' }} /> Powered by <span style={{ color: 'var(--theme-accent)', fontWeight: 700 }}>PINC Platform</span>
          </div>
        </div>
      </div>
    );
  }

  // dashboard
  const showSettings = activeTab === 'settings';
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <ThemeBackground />
      <div style={{ flex: 1, overflow: 'auto', position: 'relative', zIndex: 1 }}>
        {showSettings ? <SettingsPage /> : <SaraiPage />}
      </div>
      <footer style={{ position: 'relative', zIndex: 1, padding: '0.45rem 1rem', background: 'rgba(16,16,28,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><img src="/assets/images/sarai-logo.png" alt="" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }} onError={e => (e.currentTarget.style.display = 'none')} /> SARAI v3.0</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => useAppStore.getState().setActiveTab(showSettings ? 'dashboard' : 'settings')} style={{ background: showSettings ? 'var(--theme-accent)' : 'var(--bg-card)', color: showSettings ? '#0a0a0f' : 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 999, padding: '0.3rem 0.65rem', fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer' }}>
            {showSettings ? 'Back to Wallet' : 'Settings'}
          </button>
          <span>Powered by <span style={{ color: 'var(--theme-accent)', fontWeight: 700 }}>PINC Platform</span></span>
        </span>
      </footer>
    </div>
  );
}