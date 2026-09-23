'use client';

import React, { useEffect } from 'react';
import { apiUrl } from '../shared/api_base';

/**
 * Root-level Global Error Boundary for Next.js App Router.
 * Handles crashes occurring within root layout.js/tsx.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Root Global Crash]', error);

    const payload = {
      event_type: 'CLIENT_ROOT_GLOBAL_CRASH',
      error_message: error.message,
      stack_trace: error.stack,
      digest: error.digest,
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: new Date().toISOString(),
    };

    const telemetryUrl = apiUrl('/telemetry/client-errors');
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(telemetryUrl, JSON.stringify(payload));
    }
  }, [error]);

  return (
    <html lang="en">
      <head>
        <title>Application Error | Kirmya</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          button { font-family: inherit; min-height: 44px; touch-action: manipulation; }
          button:focus-visible { outline: 2px solid #80bfff; outline-offset: 3px; }
          button:active { transform: scale(.97); }
          @media (prefers-reduced-motion: reduce) { button:active { transform: none; } }
          @media (prefers-contrast: more) { main { border-color: #f5f5f7 !important; } }
        `}</style>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backgroundColor: '#161617',
          color: '#f5f5f7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100dvh',
        }}
      >
        <main
          style={{
            maxWidth: '32.5rem',
            width: '90%',
            padding: '2.5rem',
            backgroundColor: '#242426',
            borderRadius: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#EF4444',
              fontSize: '24px',
              marginBottom: '1.5rem',
            }}
          >
            <span aria-hidden="true">!</span>
          </div>

          <h1
            style={{
              fontSize: '1.6rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 0.75rem 0',
              color: '#FFFFFF',
            }}
          >
            Application Encountered an Error
          </h1>

          <p
            style={{
              fontSize: '0.95rem',
              lineHeight: 1.6,
              color: '#b8b8be',
              margin: '0 0 2rem 0',
            }}
          >
            We encountered an unexpected issue while loading the application. The error has been logged automatically.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => reset()}
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#80bfff',
                color: '#1d1d1f',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: 'transparent',
                color: '#E5E7EB',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              Go to Home
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
