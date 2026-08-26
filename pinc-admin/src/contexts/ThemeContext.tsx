import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemeName = 'dark-cyber' | 'light-pro' | 'matrix-green';
export type LayoutName = 'classic-side' | 'compact-top' | 'dash-grid';

export const THEMES: ThemeName[] = ['dark-cyber', 'light-pro', 'matrix-green'];
export const LAYOUTS: LayoutName[] = ['classic-side', 'compact-top', 'dash-grid'];

export const THEME_LABELS: Record<ThemeName, string> = {
  'dark-cyber': 'Dark Cyber',
  'light-pro': 'Light Pro',
  'matrix-green': 'Matrix',
};

export const LAYOUT_LABELS: Record<LayoutName, string> = {
  'classic-side': 'Classic',
  'compact-top': 'Compact',
  'dash-grid': 'Dashboard',
};

export const THEME_DESCRIPTIONS: Record<ThemeName, string> = {
  'dark-cyber': 'Deep navy cyberpunk with blue accents',
  'light-pro': 'Clean light theme with emerald accents',
  'matrix-green': 'Terminal green with monospace font',
};

export const LAYOUT_DESCRIPTIONS: Record<LayoutName, string> = {
  'classic-side': 'Sidebar + main (default)',
  'compact-top': 'Top nav only, mobile-friendly',
  'dash-grid': '12-column widget grid',
};

const THEME_STORAGE_KEY = 'pinc-admin-theme';
const LAYOUT_STORAGE_KEY = 'pinc-admin-layout';
const SIDEBAR_STORAGE_KEY = 'pinc-admin-sidebar-open';

interface ThemeContextValue {
  theme: ThemeName;
  layout: LayoutName;
  sidebarOpen: boolean;
  drawerOpen: boolean;
  setTheme: (theme: ThemeName) => void;
  setLayout: (layout: LayoutName) => void;
  toggleSidebar: () => void;
  toggleDrawer: () => void;
  closeDrawer: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function persistToStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function applyThemeClass(theme: ThemeName) {
  if (typeof document === 'undefined') return;
  const body = document.body;
  THEMES.forEach(t => {
    body.classList.remove(`theme-${t}`);
  });
  body.classList.add(`theme-${theme}`);
}

function applyLayoutClass(layout: LayoutName) {
  if (typeof document === 'undefined') return;
  const body = document.body;
  LAYOUTS.forEach(l => {
    body.classList.remove(`layout-${l}`);
  });
  body.classList.add(`layout-${layout}`);
}

function applySidebarClass(open: boolean) {
  if (typeof document === 'undefined') return;
  const body = document.body;
  if (open) body.classList.add('sidebar-open');
  else body.classList.remove('sidebar-open');
}

function applyDrawerClass(open: boolean) {
  if (typeof document === 'undefined') return;
  const body = document.body;
  if (open) body.classList.add('drawer-open');
  else body.classList.remove('drawer-open');
}

export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const saved = loadFromStorage<ThemeName | null>(THEME_STORAGE_KEY, null);
    return saved && THEMES.includes(saved) ? saved : 'dark-cyber';
  });

  const [layout, setLayoutState] = useState<LayoutName>(() => {
    const saved = loadFromStorage<LayoutName | null>(LAYOUT_STORAGE_KEY, null);
    return saved && LAYOUTS.includes(saved) ? saved : 'classic-side';
  });

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() =>
    loadFromStorage<boolean>(SIDEBAR_STORAGE_KEY, true),
  );

  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  useEffect(() => {
    applyLayoutClass(layout);
  }, [layout]);

  useEffect(() => {
    applySidebarClass(sidebarOpen);
    persistToStorage(SIDEBAR_STORAGE_KEY, sidebarOpen);
  }, [sidebarOpen]);

  useEffect(() => {
    applyDrawerClass(drawerOpen);
  }, [drawerOpen]);

  const setTheme = useCallback((next: ThemeName) => {
    setThemeState(next);
    persistToStorage(THEME_STORAGE_KEY, next);
  }, []);

  const setLayout = useCallback((next: LayoutName) => {
    setLayoutState(next);
    persistToStorage(LAYOUT_STORAGE_KEY, next);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const toggleDrawer = useCallback(() => {
    setDrawerOpen(prev => !prev);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const value: ThemeContextValue = {
    theme,
    layout,
    sidebarOpen,
    drawerOpen,
    setTheme,
    setLayout,
    toggleSidebar,
    toggleDrawer,
    closeDrawer,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme() must be used within a <ThemeContextProvider>');
  }
  return ctx;
}
