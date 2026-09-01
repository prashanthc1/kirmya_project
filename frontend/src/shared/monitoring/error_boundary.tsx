import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Uncaught React Error]', error, errorInfo);

    const payload = {
      event_type: 'CLIENT_UI_CRASH',
      error_message: error.message,
      stack_trace: error.stack,
      component_stack: errorInfo.componentStack,
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: new Date().toISOString(),
    };

    const telemetryUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/telemetry/client-errors`;
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(telemetryUrl, JSON.stringify(payload));
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100dvh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            backgroundColor: '#0f172a',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
          role="alert"
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              backgroundColor: '#1e293b',
              borderRadius: '16px',
              padding: '2.5rem',
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#f8fafc',
                marginBottom: '0.75rem',
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                fontSize: '0.95rem',
                color: '#94a3b8',
                lineHeight: 1.6,
                marginBottom: '2rem',
              }}
            >
              An unexpected error occurred while rendering this view. Our engineering team has been notified automatically.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => (window.location.href = '/')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'transparent',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Go Home
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
                }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
