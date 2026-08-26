import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Globe, Check, ArrowRight, Search } from 'lucide-react';
import { SUPPORTED_LANGUAGES, useI18n, type Language } from '../../i18n';
import { useAppStore } from '../../store/appStore';
import GlassCard from '../ui/GlassCard';
import Pill from '../ui/Pill';

export default function LanguageOnboardingScreen() {
  const { language, setLanguage, t } = useI18n();
  const setScreen = useAppStore(s => s.setScreen);
  const setHasCompletedOnboarding = useAppStore(s => s.setHasCompletedOnboarding);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Language>(language);

  const filtered = useMemo(() => {
    if (!query.trim()) return SUPPORTED_LANGUAGES;
    const q = query.toLowerCase();
    return SUPPORTED_LANGUAGES.filter(l =>
      l.label.toLowerCase().includes(q) ||
      l.nativeLabel.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
    );
  }, [query]);

  const handleContinue = async () => {
    setLanguage(selected);
    setHasCompletedOnboarding(true);
    try { localStorage.setItem('sarai-onboarded', 'true'); } catch {}
    try { const { invoke } = await import('@tauri-apps/api/core'); await invoke('cmd_set_onboarding_complete', { completed: true }); } catch {}
    // AUTH ENFORCEMENT: after language, ALWAYS create the account (setup) before dashboard
    const identity = useAppStore.getState().identity;
    setScreen(identity ? 'dashboard' : 'setup');
  };

  const handleSelect = (code: Language) => {
    setSelected(code);
    // preview change immediately
    setLanguage(code);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.25rem', position: 'relative',
    }}>
      <GlassCard style={{ width: '100%', maxWidth: 720, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--theme-accent-soft)', border: `1px solid var(--border)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-accent)' }}>
            <Globe size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>{t('onboarding.choose_language')}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Select the language SARAI will use. You can change it anytime in Settings.</div>
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', border: '1px solid var(--border)', borderRadius: 999, padding: '0.25rem 0.6rem', background: 'var(--bg-secondary)' }}>
            33 languages
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search languages…  e.g. Español, العربية, Hindi"
            className="pinc-input"
            style={{ paddingLeft: '2.2rem', borderRadius: 999, background: 'var(--bg-secondary)', fontSize: '0.8rem' }}
          />
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))',
          gap: '0.5rem',
          maxHeight: '52vh',
          overflowY: 'auto',
          paddingRight: 2,
        }}>
          {filtered.map((lang) => {
            const active = selected === lang.code;
            return (
              <motion.button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                whileTap={{ scale: 0.98 }}
                style={{
                  textAlign: 'left',
                  padding: '0.7rem 0.75rem',
                  borderRadius: 12,
                  border: active ? `1px solid var(--theme-accent)` : '1px solid var(--border)',
                  background: active ? 'var(--theme-accent-soft)' : 'var(--bg-card)',
                  backdropFilter: 'blur(10px)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  transition: 'all 0.18s',
                  boxShadow: active ? 'var(--theme-glow)' : 'none',
                }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: 999, flexShrink: 0,
                  background: active ? 'var(--theme-accent)' : 'var(--bg-secondary)',
                  color: active ? '#0a0a0f' : 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.04em',
                }}>
                  {lang.code.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: active ? 'var(--text-primary)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {lang.nativeLabel}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: active ? 'var(--text-secondary)' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {lang.label} · {lang.code}
                  </div>
                </div>
                {active && <Check size={14} style={{ color: 'var(--theme-accent)', flexShrink: 0 }} />}
              </motion.button>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '1.2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No languages match “{query}”
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.9rem', marginTop: '0.2rem' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Selected <span style={{ color: 'var(--theme-accent)', fontWeight: 700 }}>{SUPPORTED_LANGUAGES.find(l=>l.code===selected)?.nativeLabel}</span>
            <span style={{ margin: '0 0.35rem', opacity: 0.5 }}>·</span>
            <span>{SUPPORTED_LANGUAGES.find(l=>l.code===selected)?.label}</span>
          </div>
          <Pill active style={{ padding: '0.65rem 1.25rem', fontSize: '0.8rem', borderRadius: 999, boxShadow: 'var(--theme-glow)' }} onClick={handleContinue}>
            {t('onboarding.continue')} <ArrowRight size={14} />
          </Pill>
        </div>
        <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--neon-green)', display: 'inline-block' }} /> Powered by <span style={{ color: 'var(--theme-accent)', fontWeight: 700 }}>PINC Platform</span>
        </div>
      </GlassCard>
    </div>
  );
}
