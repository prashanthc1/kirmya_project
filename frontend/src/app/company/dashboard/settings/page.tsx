'use client';

/** Company settings and the activity log. */
import React from 'react';
import { Alert, Skeleton, Stack } from '@mui/material';

import CompanyDashboardShell from '../../../../components/company/CompanyDashboardShell';
import CompanySettings from '../../../../components/company/CompanySettings';
import { useCompany } from '../../../../features/company/hooks';
import { CompanyMembership } from '../../../../features/company/types';

const SettingsPanel: React.FC<{ membership: CompanyMembership }> = ({ membership }) => {
  // The settings component works on the full record; the membership carries
  // only the summary the switcher needs.
  const { data: company, isLoading, isError, error } = useCompany(membership.company.slug);

  if (isLoading) {
    return (
      <Stack spacing={3}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={160} sx={{ borderRadius: '20px' }} />
        ))}
      </Stack>
    );
  }

  if (isError || !company) {
    return (
      <Alert severity="error" sx={{ borderRadius: '16px' }}>
        {error?.message || 'These settings could not be loaded.'}
      </Alert>
    );
  }

  return <CompanySettings company={company} membership={membership} />;
};

export default function CompanyDashboardSettingsPage() {
  return (
    <React.Suspense fallback={<Skeleton variant="rounded" height={520} sx={{ m: 4 }} />}>
      <CompanyDashboardShell
        title="Settings"
        description="How this company behaves on Kirmya, and a record of who changed what."
        requires="settings:edit"
      >
        {({ membership }) => <SettingsPanel membership={membership} />}
      </CompanyDashboardShell>
    </React.Suspense>
  );
}
