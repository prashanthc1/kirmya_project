'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import AppShell from '../../../../components/shell/AppShell';
import ProtectedRoute from '../../../../features/auth/components/protectedRoute';
import { communityAdminContext } from '../../../../shared/navigation/contexts';

/**
 * Community management workspace.
 *
 * Scoped to the community in the URL, so authority travels with the address
 * rather than with a global "is this person an admin" flag: holding a role in
 * one community grants nothing in another. Reached from the community's own
 * Manage action, never from the global navigation.
 *
 * `focused` shell: someone here is doing a job, not browsing, so the module
 * tabs and the mobile bottom bar step aside for the management navigation.
 *
 * The API enforces community authority on every one of these calls, and refuses
 * a member who is not staff. This layout keeps a signed-out visitor out; the
 * screens inside surface the API's refusal rather than pretending to succeed.
 */
export default function CommunityAdminLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const raw = params?.id;
  const slug = Array.isArray(raw) ? raw[0] : (raw ?? '');

  return (
    <ProtectedRoute>
      <AppShell variant="standard" maxWidth="wide" context={communityAdminContext(slug)}>
        {children}
      </AppShell>
    </ProtectedRoute>
  );
}
