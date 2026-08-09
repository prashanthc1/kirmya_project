'use client';

/**
 * Team management.
 *
 * The table and the invitation list are two views of the same relationship: an
 * invitation becomes a membership when it is accepted, so they sit together
 * rather than on separate screens.
 */
import React from 'react';
import { Skeleton, Stack } from '@mui/material';

import CompanyDashboardShell from '../../../../components/company/CompanyDashboardShell';
import CompanyTeam from '../../../../components/company/CompanyTeam';
import CompanyInvitations from '../../../../components/company/CompanyInvitations';

export default function CompanyDashboardPeoplePage() {
  return (
    <React.Suspense fallback={<Skeleton variant="rounded" height={520} sx={{ m: 4 }} />}>
      <CompanyDashboardShell
        title="People"
        description="Everyone associated with this company, and what each of them may do here."
        requires="team:view"
      >
        {({ membership }) => (
          <Stack spacing={3}>
            <CompanyTeam membership={membership} />
            <CompanyInvitations membership={membership} />
          </Stack>
        )}
      </CompanyDashboardShell>
    </React.Suspense>
  );
}
