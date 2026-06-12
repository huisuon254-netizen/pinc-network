import { useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n, SUPPORTED_LANGUAGES, Language } from '../../i18n';
import { Globe, Check } from 'lucide-react';

interface Props {
  onSelect?: () => void;
  compact?: boolean;
}

export default function LanguageSelector({ onSelect, compact }: Props) {
  const { language, setLanguage } = useI18n();
  const [selecting, setSelecting] = useState<string | null>(null);
  const current = language;

  const handleSelect = (code: string) => {
    if (selecting) return;
    setSelecting(code);
    try {
      setLanguage(code as Language);
      onSelect?.();
    } catch (e) {
      console.warn('Language set error:', e);
      setLanguage(code as Language);
      onSelect?.();
    } finally {
      setSelecting(null);
    }
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
        {SUPPORTED_LANGUAGES.map(lang => {
          const selected = current === lang.code;
          const isSelecting = selecting === lang.code;
          return (
            <motion.button
              key={lang.code}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(lang.code)}
              disabled={isSelecting}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: compact ? '0.5rem 0.6rem' : '0.6rem 0.75rem',
                background: selected ? 'rgba(0,212,255,0.1)' : 'var(--bg-tertiary)',
                border: `1px solid ${selected ? 'var(--electric-blue)' : 'var(--border)'}`,
                borderRadius: '4px', cursor: isSelecting ? 'wait' : 'pointer', textAlign: 'left',
                transition: 'all 0.15s', opacity: isSelecting ? 0.7 : 1,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', color: selected ? 'var(--electric-blue)' : 'var(--text-primary)', fontWeight: selected ? 600 : 400 }}>
                  {lang.nativeLabel}
                </div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                  {lang.label}
                </div>
              </div>
              {isSelecting ? (
                <div style={{ color: 'var(--electric-blue)', flexShrink: 0, fontSize: '0.7rem' }}>
                  Loading...
                </div>
              ) : selected ? (
                <Check size={13} style={{ color: 'var(--electric-blue)', flexShrink: 0 }} />
              ) : null}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
