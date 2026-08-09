'use client';

/**
 * Recruiter management.
 *
 * A recruiter here is a member of this company holding a recruiting role — the
 * same row the People screen manages, not a second recruiter record. Their
 * recruiter profile and their pipelines stay where they already live.
 */
import React from 'react';
import { Skeleton } from '@mui/material';

import CompanyDashboardShell from '../../../../components/company/CompanyDashboardShell';
import CompanyRecruiters from '../../../../components/company/CompanyRecruiters';

export default function CompanyDashboardRecruitersPage() {
  return (
    <React.Suspense fallback={<Skeleton variant="rounded" height={520} sx={{ m: 4 }} />}>
      <CompanyDashboardShell
        title="Recruiters"
        description="Who may hire for this company, and what access each of them has."
        requires="recruiter:view"
      >
        {({ membership }) => <CompanyRecruiters membership={membership} />}
      </CompanyDashboardShell>
    </React.Suspense>
  );
}
