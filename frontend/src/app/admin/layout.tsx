'use client';

import React from 'react';
import AppShell from '../../components/shell/AppShell';
import RequirePermission from '../../components/shell/RequirePermission';
import { canAccessPlatformAdmin } from '../../shared/permissions';
import { STATIC_CONTEXTS } from '../../shared/navigation/contexts';

/**
 * Kirmya platform administration.
 *
 * Kept apart from the professional application on purpose: nothing in the
 * global navigation links here, and the console is reached by URL or by an
 * account menu entry that only an administrator is shown. Its own navigation
 * never appears anywhere else.
 *
 * The permission check is on the route, not only on the link. Hiding a menu
 * item stops a normal user stumbling in; this stops them typing the address.
 * The API re-checks every request behind it, so a viewer who forges client
 * state gets a console whose every call fails.
 */
export default function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell variant="standard" maxWidth="max" context={STATIC_CONTEXTS.platformAdmin}>
      <RequirePermission
        allow={viewer => canAccessPlatformAdmin(viewer)}
        label="Kirmya administration"
      >
        {children}
      </RequirePermission>
    </AppShell>
  );
}
