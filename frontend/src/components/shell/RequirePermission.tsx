'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { routes } from '../../shared/routes';

export interface RequirePermissionProps {
  children: React.ReactNode;
  /**
   * Decides from the signed-in viewer. Called only once the session has
   * settled, so it never sees a half-loaded auth state.
   */
  allow: (viewer: { permissions: string[]; role?: string | null }) => boolean;
  /** What the viewer was trying to reach, for the refusal message. */
  label?: string;
}

/**
 * Gates a route on a permission rather than merely on being signed in.
 *
 * Hiding a link is a courtesy; this is the route half of the same rule, so
 * typing the URL is refused too. It is still not the security boundary — the
 * API re-checks every request, and a viewer who edits their client state
 * reaches a page whose data calls all fail. What this prevents is a signed-in
 * person wandering into a console that was never meant for them.
 *
 * Like ProtectedRoute it branches on the explicit auth status: `loading` is not
 * `denied`, and treating it as such would refuse every reload.
 */
export const RequirePermission: React.FC<RequirePermissionProps> = ({
  children,
  allow,
  label = 'this area',
}) => {
  const { status, user, permissions } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const redirected = useRef(false);

  const settled = status === 'authenticated' || status === 'unauthenticated';
  const permitted =
    status === 'authenticated' &&
    allow({ permissions: permissions ?? [], role: (user as { roleId?: string } | null)?.roleId });

  useEffect(() => {
    if (status !== 'unauthenticated' || redirected.current) return;
    redirected.current = true;
    const returnUrl = pathname && pathname !== '/' ? `?returnUrl=${encodeURIComponent(pathname)}` : '';
    router.replace(`/login${returnUrl}`);
  }, [status, pathname, router]);

  if (permitted) return <>{children}</>;

  if (!settled) {
    return (
      <Box
        sx={{ minHeight: '60dvh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        role="status"
        aria-live="polite"
        aria-label="Checking your access"
      >
        <CircularProgress size={44} />
      </Box>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Box sx={{ minHeight: '60dvh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        role="status" aria-live="polite" aria-label="Redirecting to sign in">
        <CircularProgress size={44} />
      </Box>
    );
  }

  // Signed in, and not permitted. Says so plainly and offers the way back
  // rather than bouncing, which would look like the link was broken.
  return (
    <Box
      sx={{
        minHeight: '60dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
        px: 3,
        textAlign: 'center',
      }}
    >
      <Typography variant="h5" component="h1" fontWeight={700}>
        You do not have access to {label}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 480 }}>
        Your account does not carry the permission this area requires. If you think that is wrong,
        ask an administrator of the workspace to grant it.
      </Typography>
      <Button component={Link} href={routes.feed()} variant="contained" sx={{ textTransform: 'none' }}>
        Back to your feed
      </Button>
    </Box>
  );
};

export default RequirePermission;
