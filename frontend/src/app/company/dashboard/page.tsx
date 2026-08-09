'use client';

/** The company back-office overview. */
import React from 'react';
import { Skeleton } from '@mui/material';

import CompanyDashboardShell from '../../../components/company/CompanyDashboardShell';
import CompanyDashboard from '../../../components/company/CompanyDashboard';

export default function CompanyDashboardPage() {
  return (
    <React.Suspense fallback={<Skeleton variant="rounded" height={520} sx={{ m: 4 }} />}>
      <CompanyDashboardShell
        title="Overview"
        description="Where this company stands today, drawn from its own records."
        requires="company:view"
      >
        {({ companyId, membership, can }) => (
          <CompanyDashboard companyId={companyId} slug={membership.company.slug} can={can} />
        )}
      </CompanyDashboardShell>
    </React.Suspense>
  );
}
