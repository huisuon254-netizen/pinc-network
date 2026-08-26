import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../store/appStore';

export type ThemeId = 'light-luxe' | 'onyx-gold' | 'dark-tech' | 'cyber-wave' | 'matrix-green';

export const THEME_IDS: ThemeId[] = ['light-luxe', 'onyx-gold', 'dark-tech', 'cyber-wave', 'matrix-green'];

export const THEME_META: Record<ThemeId, { label: string; desc: string; accent: string; preview: string }> = {
  'light-luxe':  { label: 'Silver Luxe',   desc: 'Bright Silver · Gold Shine', accent: '#D4AF37', preview: 'linear-gradient(135deg,#f4f6f9 0%,#e6e9ef 40%,#D4AF37 100%)' },
  'onyx-gold':   { label: 'Onyx Gold',     desc: 'Shiny Black · Gold · Emerald', accent: '#D4AF37', preview: 'linear-gradient(145deg,#0d0d0f 0%,#1a1a20 55%,#D4AF37 85%,#10b981 100%)' },
  'dark-tech':   { label: 'Dark Tech',     desc: 'Charcoal · Cyan Grid',       accent: '#00d4ff', preview: 'linear-gradient(135deg,#0a0a0f 0%,#00d4ff22 100%)' },
  'cyber-wave':  { label: 'Cyber Vibrant', desc: 'Midnight Blue · Purple Waves', accent: '#a855f7', preview: 'linear-gradient(135deg,#080c1e 0%,#7c3aed 50%,#ec4899 100%)' },
  'matrix-green':{ label: 'Matrix Green',  desc: 'Olive · Circuitry',          accent: '#39ff14', preview: 'linear-gradient(135deg,#0d1a0f 0%,#6b8c3e 50%,#39ff14 100%)' },
};

const STORAGE_KEY = 'sarai-theme';
const DEFAULT_THEME: ThemeId = 'light-luxe';

function isThemeId(v: string): v is ThemeId {
  return (THEME_IDS as string[]).includes(v);
}

function getInitialTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isThemeId(stored)) return stored;
    // also try persisted appStore appearance theme
    const persisted = localStorage.getItem('pinc-settings');
    if (persisted) {
      const parsed = JSON.parse(persisted);
      const t = parsed?.state?.settings?.appearance?.theme;
      if (t && isThemeId(t)) return t;
    }
  } catch {}
  return DEFAULT_THEME;
}

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  themes: typeof THEME_META;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => getInitialTheme());

  const setTheme = useCallback((id: ThemeId) => {
    setThemeState(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch {}
    document.documentElement.setAttribute('data-theme', id);
    // sync to appStore appearance
    try {
      useAppStore.getState().updateSettings('appearance', { theme: id } as any);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }, [theme]);

  // hydrate from appStore if it already has a different theme (on mount)
  useEffect(() => {
    const storeTheme = useAppStore.getState().settings?.appearance?.theme as ThemeId | undefined;
    if (storeTheme && isThemeId(storeTheme) && storeTheme !== theme) {
      setThemeState(storeTheme);
      document.documentElement.setAttribute('data-theme', storeTheme);
    }
    // subscribe to store theme changes (external)
    const unsub = useAppStore.subscribe((state) => {
      const t = (state.settings?.appearance as any)?.theme as string | undefined;
      if (t && isThemeId(t) && t !== useAppStore.getState().settings.appearance.theme) { /* noop */ }
      // we watch actual state; if store theme diverges from local theme, sync local
      if (t && isThemeId(t) && t !== theme) {
        // avoid loop – only update if truly different source
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sync when store settings appearance theme changes (poll via subscribe)
  useEffect(() => {
    return useAppStore.subscribe((s, prev) => {
      const nextTheme = (s.settings?.appearance as any)?.theme as ThemeId | undefined;
      const prevTheme = (prev.settings?.appearance as any)?.theme as ThemeId | undefined;
      if (nextTheme && isThemeId(nextTheme) && nextTheme !== prevTheme && nextTheme !== theme) {
        setThemeState(nextTheme);
        document.documentElement.setAttribute('data-theme', nextTheme);
        try { localStorage.setItem(STORAGE_KEY, nextTheme); } catch {}
      }
    });
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme, themes: THEME_META }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
}

export function getStoredTheme(): ThemeId {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && isThemeId(v)) return v;
  } catch {}
  return DEFAULT_THEME;
}
