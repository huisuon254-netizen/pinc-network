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
    console.error('PINC Admin render failure:', error);
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
            background: '#0a0a0f',
            color: '#e0e0e0',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 760,
              background: '#12121e',
              border: '1px solid #ff2244',
              borderRadius: 12,
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#ff2244',
                marginBottom: '0.5rem',
              }}
            >
              PINC Admin UI Error
            </div>
            <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1rem' }}>
              The admin app hit a frontend render error.
            </div>
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: '0.75rem',
                lineHeight: 1.5,
                color: '#e0e0e0',
                fontFamily: 'monospace',
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
