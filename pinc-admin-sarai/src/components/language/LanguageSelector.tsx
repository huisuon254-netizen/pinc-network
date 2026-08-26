import { useState, useMemo } from 'react';
import { SUPPORTED_LANGUAGES, useI18n, type Language } from '../../i18n';
import { Globe, Search, Check } from 'lucide-react';

interface LanguageSelectorProps {
  compact?: boolean;
  onChange?: (lang: Language) => void;
}

export default function LanguageSelector({ compact, onChange }: LanguageSelectorProps) {
  const { language, setLanguage } = useI18n();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return SUPPORTED_LANGUAGES;
    const q = query.toLowerCase();
    return SUPPORTED_LANGUAGES.filter(l =>
      l.label.toLowerCase().includes(q) ||
      l.nativeLabel.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
    );
  }, [query]);

  const current = SUPPORTED_LANGUAGES.find(l => l.code === language);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    onChange?.(code);
    setOpen(false);
  };

  if (compact) {
    return (
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(v => !v)}
          className="pill"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.45rem 0.8rem', borderRadius: 999, border: '1px solid var(--border)',
            background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
          }}
        >
          <Globe size={14} style={{ color: 'var(--theme-accent)' }} />
          <span>{current?.nativeLabel ?? language}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{language}</span>
        </button>
        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 320, maxHeight: 380,
            overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0.5rem',
            padding: '0.6rem', borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)',
            backdropFilter: 'blur(16px)', boxShadow: '0 16px 40px rgba(0,0,0,0.35)', zIndex: 30,
          }}>
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search…" className="pinc-input" style={{ paddingLeft: '1.8rem', fontSize: '0.75rem', borderRadius: 999 }} />
            </div>
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, paddingRight: 2 }}>
              {filtered.map(l => (
                <button key={l.code} onClick={()=>handleSelect(l.code)} style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.6rem', borderRadius: 8,
                  border: language===l.code? '1px solid var(--theme-accent)' : '1px solid transparent',
                  background: language===l.code? 'var(--theme-accent-soft)' : 'transparent',
                  cursor: 'pointer', textAlign: 'left',
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>{l.nativeLabel} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.68rem' }}>· {l.label}</span></span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{l.code}</span>
                  {language===l.code && <Check size={12} style={{ color: 'var(--theme-accent)' }} />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search languages…" className="pinc-input" style={{ paddingLeft: '2.1rem', borderRadius: 999, fontSize: '0.8rem' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: '0.4rem', maxHeight: 360, overflowY: 'auto', paddingRight: 4 }}>
        {filtered.map(l => {
          const active = language===l.code;
          return (
            <button key={l.code} onClick={()=>handleSelect(l.code)} style={{
              padding: '0.6rem 0.65rem', borderRadius: 10, textAlign: 'left',
              border: active ? '1px solid var(--theme-accent)' : '1px solid var(--border)',
              background: active ? 'var(--theme-accent-soft)' : 'var(--bg-card)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <span style={{ width: 26, height: 26, borderRadius: 999, background: active? 'var(--theme-accent)' : 'var(--bg-secondary)', color: active? '#0a0a0f' : 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800 }}>{l.code.slice(0,2).toUpperCase()}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.nativeLabel}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{l.label}</div>
              </span>
              {active && <Check size={12} style={{ color: 'var(--theme-accent)' }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
