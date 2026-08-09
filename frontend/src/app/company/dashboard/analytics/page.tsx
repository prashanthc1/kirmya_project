'use client';

/**
 * Company analytics.
 *
 * Everything here is aggregated from this company's own rows. No individual
 * candidate is identified, and the assistant below reports measurements rather
 * than writing prose about them.
 */
import React from 'react';
import { Skeleton, Stack } from '@mui/material';

import CompanyDashboardShell from '../../../../components/company/CompanyDashboardShell';
import CompanyAnalytics from '../../../../components/company/CompanyAnalytics';
import AICompanyAssistant from '../../../../components/company/AICompanyAssistant';

export default function CompanyDashboardAnalyticsPage() {
  return (
    <React.Suspense fallback={<Skeleton variant="rounded" height={520} sx={{ m: 4 }} />}>
      <CompanyDashboardShell
        title="Analytics"
        description="How this company's page and its jobs performed over a period you choose."
        requires="analytics:view"
      >
        {({ companyId, can }) => (
          <Stack spacing={3}>
            <CompanyAnalytics companyId={companyId} />
            {can('ai:insights') && <AICompanyAssistant companyId={companyId} />}
          </Stack>
        )}
      </CompanyDashboardShell>
    </React.Suspense>
  );
}
