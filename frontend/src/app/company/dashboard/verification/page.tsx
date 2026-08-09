'use client';

/**
 * Company verification.
 *
 * Submitting a claim here starts a review; it does not verify anything. Only a
 * Kirmya administrator can approve one, and the badge follows their decision.
 */
import React from 'react';
import { Skeleton } from '@mui/material';

import CompanyDashboardShell from '../../../../components/company/CompanyDashboardShell';
import CompanyVerification from '../../../../components/company/CompanyVerification';

export default function CompanyDashboardVerificationPage() {
  return (
    <React.Suspense fallback={<Skeleton variant="rounded" height={520} sx={{ m: 4 }} />}>
      <CompanyDashboardShell
        title="Verification"
        description="Prove the company is who it says it is. A Kirmya administrator reviews every claim."
        requires="verification:view"
      >
        {({ companyId, can }) => (
          <CompanyVerification companyId={companyId} canSubmit={can('verification:submit')} />
        )}
      </CompanyDashboardShell>
    </React.Suspense>
  );
}
