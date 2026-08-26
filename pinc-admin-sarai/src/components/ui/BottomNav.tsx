import React from 'react';

export interface BottomNavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

interface BottomNavProps {
  items: BottomNavItem[];
  activeId: string;
  onChange: (id: string) => void;
  style?: React.CSSProperties;
}

export default function BottomNav({ items, activeId, onChange, style }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation" style={style}>
      {items.map((it) => {
        const active = it.id === activeId;
        return (
          <button
            key={it.id}
            className={active ? 'active' : ''}
            onClick={() => onChange(it.id)}
            aria-current={active ? 'page' : undefined}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {it.icon}
            <span>{it.label}</span>
            {it.badge !== undefined && it.badge > 0 && (
              <span style={{
                minWidth: 16, height: 16, borderRadius: 999, background: 'var(--neon-red)', color: '#fff',
                fontSize: '0.6rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', marginLeft: 2,
              }}>{it.badge > 99 ? '99+' : it.badge}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

// Floating translucent bottom nav variant that hides on desktop if sidebar present — caller controls visibility via CSS
export function BottomNavSpacer({ height = 72 }: { height?: number }) {
  return <div aria-hidden style={{ height, flexShrink: 0 }} />;
}
