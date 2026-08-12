'use client';

import React, { useEffect } from 'react';
import NextLink from 'next/link';
import { Box, Container, Typography, Button, Stack } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

import BrandMark from '../components/brand/BrandMark';

/**
 * Route-level error boundary. Reports on the same telemetry contract as
 * shared/monitoring/error_boundary.tsx so route crashes land beside component
 * crashes, distinguished by event_type.
 */
export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Route Error]', error);

    const payload = {
      event_type: 'CLIENT_ROUTE_CRASH',
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
    <Box
      sx={{
        bgcolor: 'background.default',
        color: 'text.primary',
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        py: { xs: 8, md: 12 },
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ maxWidth: 620 }}>
          <BrandMark size={48} />

          <Typography
            variant="body2"
            sx={{ mt: 4, mb: 1.5, color: 'text.secondary', fontWeight: 600, letterSpacing: '0.04em' }}
          >
            Something broke
          </Typography>

          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.1rem', md: '2.9rem' },
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: '-0.03em',
              mb: 2,
              textWrap: 'balance',
            }}
          >
            This page didn&apos;t load.
          </Typography>

          <Typography
            variant="body1"
            sx={{ color: 'text.secondary', fontSize: '1.05rem', mb: 4, maxWidth: 520 }}
          >
            The error has been logged. Trying again usually clears it — if it keeps happening,
            your work is safe and you can carry on from the dashboard.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
            <Button
              variant="contained"
              size="large"
              onClick={reset}
              startIcon={<RefreshIcon />}
              sx={{ px: 4, borderRadius: '12px' }}
            >
              Try again
            </Button>
            <Button
              component={NextLink}
              href="/dashboard"
              variant="outlined"
              size="large"
              sx={{ px: 4, borderRadius: '12px' }}
            >
              Go to dashboard
            </Button>
          </Stack>

          {error.digest && (
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
              }}
            >
              Reference: {error.digest}
            </Typography>
          )}
        </Box>
      </Container>
    </Box>
  );
}
