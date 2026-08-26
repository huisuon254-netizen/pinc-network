import React from 'react';

type PillProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  size?: 'sm' | 'md';
};

export default function Pill({ active, size = 'md', children, className = '', style, ...rest }: PillProps) {
  const pad = size === 'sm' ? '0.3rem 0.7rem' : '0.45rem 1rem';
  const fs = size === 'sm' ? '0.68rem' : '0.75rem';
  return (
    <button
      className={`pill ${active ? 'pill-active' : ''} ${className}`}
      style={{
        padding: pad,
        fontSize: fs,
        fontWeight: active ? 700 : 600,
        letterSpacing: '0.05em',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.35rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        color: active ? undefined : 'var(--text-secondary)',
        background: active ? undefined : 'var(--bg-card)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function PillGroup({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'inline-flex', gap: '0.4rem', padding: '4px', borderRadius: 999, background: 'var(--bg-secondary)', border: '1px solid var(--border)', backdropFilter: 'blur(8px)', ...style }}>
      {children}
    </div>
  );
}
