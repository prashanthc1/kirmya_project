'use client';

import React, { useEffect } from 'react';

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

    const telemetryUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/telemetry/client-errors`;
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(telemetryUrl, JSON.stringify(payload));
    }
  }, [error]);

  return (
    <html lang="en">
      <head>
        <title>Application Error | Kirmya</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backgroundColor: '#0A0D14',
          color: '#F9FAFB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100dvh',
        }}
      >
        <div
          style={{
            maxWidth: '520px',
            width: '90%',
            padding: '2.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
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
            ⚠️
          </div>

          <h1
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
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
              color: '#9CA3AF',
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
                backgroundColor: '#3B82F6',
                color: '#FFFFFF',
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
        </div>
      </body>
    </html>
  );
}
