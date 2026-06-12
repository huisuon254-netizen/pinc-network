import { motion } from 'framer-motion';
import { Globe, Check } from 'lucide-react';
import { useAppStore } from '../../store/appStore';

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'sw', name: 'Swahili', native: 'Kiswahili' },
];

interface Props {
  onSelect?: () => void;
  compact?: boolean;
}

export default function LanguageSelector({ onSelect, compact }: Props) {
  const { settings, saveSettings } = useAppStore();
  const current = settings?.language ?? 'en';

  const handleSelect = async (code: string) => {
    if (!settings) return;
    await saveSettings({ ...settings, language: code });
    onSelect?.();
  };

  return (
    <div className="pinc-card" style={{ padding: compact ? '1rem' : '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: compact ? '0.75rem' : '1.25rem' }}>
        <Globe size={compact ? 14 : 16} style={{ color: 'var(--electric-blue)' }} />
        <span style={{ fontSize: compact ? '0.7rem' : '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>
          SELECT LANGUAGE
        </span>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: compact ? '1fr 1fr' : 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '0.5rem',
      }}>
        {LANGUAGES.map(lang => {
          const selected = current === lang.code;
          return (
            <motion.button
              key={lang.code}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(lang.code)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: compact ? '0.5rem 0.6rem' : '0.6rem 0.75rem',
                background: selected ? 'rgba(0,212,255,0.1)' : 'var(--bg-tertiary)',
                border: `1px solid ${selected ? 'var(--electric-blue)' : 'var(--border)'}`,
                borderRadius: '4px', cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', color: selected ? 'var(--electric-blue)' : 'var(--text-primary)', fontWeight: selected ? 600 : 400 }}>
                  {lang.native}
                </div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                  {lang.name}
                </div>
              </div>
              {selected && <Check size={13} style={{ color: 'var(--electric-blue)', flexShrink: 0 }} />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
