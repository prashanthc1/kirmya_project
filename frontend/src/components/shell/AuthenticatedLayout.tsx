'use client';

import React from 'react';
import AppShell, { AppShellProps } from './AppShell';
import ProtectedRoute from '../../features/auth/components/protectedRoute';

export interface AuthenticatedLayoutProps extends AppShellProps {
  /**
   * Whether the page requires a signed-in user. Defaults to true, which is what
   * "authenticated layout" has always claimed and never enforced.
   *
   * Set it false only for a page that is genuinely public discovery — one listed
   * in the sitemap, or otherwise meant to be reachable and indexable by a
   * visitor who has never signed in. Everything else keeps the guard.
   */
  requireAuth?: boolean;
}

/**
 * Authenticated Layout Wrapper
 *
 * Used across authenticated candidate, recruiter, company, and admin views.
 *
 * It now actually authenticates. This component wrapped AppShell and nothing
 * else, and AppShell has no auth logic, so every "authenticated" page rendered
 * for anyone who typed its URL — the data calls came back 401 and the page
 * showed an empty state instead of sending the visitor to sign in. That also
 * meant signing out left the previous page perfectly readable until something
 * happened to refetch.
 *
 * ProtectedRoute existed for this and was imported by no page at all.
 */
export const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({
  requireAuth = true,
  ...props
}) => {
  const shell = <AppShell {...props} showBottomNav={true} />;

  if (!requireAuth) {
    return shell;
  }

  return <ProtectedRoute>{shell}</ProtectedRoute>;
};

export default AuthenticatedLayout;
