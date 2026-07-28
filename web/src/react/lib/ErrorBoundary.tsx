import React from 'react';

interface Props {
  children: React.ReactNode;
  /** Optional custom fallback. Receives the error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render/lifecycle errors in a React island so one crashing island
 * shows a recoverable fallback instead of blanking the whole page.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[island] render error:', error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) return this.props.fallback(error, this.reset);

    return (
      <div
        role="alert"
        style={{
          padding: '40px 24px',
          textAlign: 'center',
          color: 'var(--text-primary, #333)',
          maxWidth: 420,
          margin: '0 auto',
        }}
      >
        <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
          Something went wrong loading this view.
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-muted, #888)', marginBottom: 16 }}>
          {error.message || 'Unexpected error'}
        </p>
        <button
          onClick={this.reset}
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            border: 0,
            background: 'var(--accent, #1E5FA8)',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </div>
    );
  }
}
