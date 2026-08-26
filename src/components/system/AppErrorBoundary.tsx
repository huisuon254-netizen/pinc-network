import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: string | null;
}

export default class AppErrorBoundary extends React.Component<Props, State> {
  state: State = {
    error: null,
  };

  static getDerivedStateFromError(error: unknown): State {
    return {
      error: error instanceof Error ? error.stack || error.message : String(error),
    };
  }

  componentDidCatch(error: Error) {
    console.error('PINC render failure:', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 760,
              background: 'var(--bg-card)',
              border: '1px solid var(--neon-red)',
              borderRadius: 12,
              padding: '1.5rem',
              boxShadow: '0 0 24px rgba(255, 34, 85, 0.14)',
            }}
          >
            <div
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--neon-red)',
                marginBottom: '0.5rem',
              }}
            >
              PINC UI Error
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              The app hit a frontend render error. The details are shown below instead of a blank window.
            </div>
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: '0.75rem',
                lineHeight: 1.5,
                color: 'var(--text-primary)',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {this.state.error}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
