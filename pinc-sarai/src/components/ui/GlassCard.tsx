import React from 'react';

type GlassCardProps = React.HTMLAttributes<HTMLDivElement> & {
  hover?: boolean;
  padding?: string | number;
  radius?: string | number;
};

export default function GlassCard({ children, className = '', style, hover = true, padding, radius, ...rest }: GlassCardProps) {
  return (
    <div
      className={`glass-card ${className}`}
      style={{
        borderRadius: radius ?? 16,
        padding: padding ?? '1rem',
        ...(style as any),
      }}
      {...rest}
    >
      {children}
      <style>{`
        .glass-card { transition: border-color .2s, box-shadow .2s, transform .2s; }
        ${hover ? `.glass-card:hover { transform: translateY(-1px); }` : ''}
      `}</style>
    </div>
  );
}

export function GlassCardHeader({ title, subtitle, icon, action }: { title: string; subtitle?: string; icon?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: subtitle ? '0.35rem' : '0.75rem', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
        {icon && <span style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--theme-accent-soft)', color: 'var(--theme-accent)', border: `1px solid ${'var(--border)'}`, flexShrink: 0 }}>{icon}</span>}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
          {subtitle && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 1 }}>{subtitle}</div>}
        </div>
      </div>
      {action}
    </div>
  );
}
