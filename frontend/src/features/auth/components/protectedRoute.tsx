'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../../hooks/useAuth';

/**
 * Holds a page until the session bootstrap has settled, then either renders it
 * or sends the visitor to sign in.
 *
 * The guard branches on the explicit status rather than on `!isAuthenticated`.
 * Those are different questions before the first refresh completes: on every
 * reload there is a moment where the app has a valid session cookie and no user
 * object yet, and a guard that cannot tell "not yet" from "not signed in"
 * redirects straight through it. That is the login flash on refresh.
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  /**
   * One redirect per mount. Without this, a re-render between calling push and
   * the route actually changing fires a second navigation to the same URL, and
   * with a returnUrl that grows each time the two can trade places indefinitely.
   */
  const redirected = useRef(false);

  useEffect(() => {
    if (status !== 'unauthenticated' || redirected.current) return;
    redirected.current = true;

    const returnUrl = pathname && pathname !== '/' ? `?returnUrl=${encodeURIComponent(pathname)}` : '';
    router.replace(`/login${returnUrl}`);
  }, [status, pathname, router]);

  if (status === 'authenticated') {
    return <>{children}</>;
  }

  // Both `loading` and the brief window before the redirect lands show the same
  // neutral placeholder: nothing about the page is known to be safe to render,
  // and flashing a signed-out shell would be a worse answer than waiting.
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: 'background.default',
      }}
      role="status"
      aria-live="polite"
      aria-label={status === 'loading' ? 'Restoring your session' : 'Redirecting to sign in'}
    >
      <CircularProgress size={44} color="primary" />
    </Box>
  );
}
