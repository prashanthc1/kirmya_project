'use client';

import React from 'react';
import { Stack } from '@mui/material';

import CompanyDashboardShell from '../../../components/company/CompanyDashboardShell';
import EmployerSettings from '../../../components/company/EmployerSettings';

export default function EmployerSettingsPage() {
  return (
    <CompanyDashboardShell
      title="Employer Recruitment Settings"
      description="Configure organization notification rules, application pipelines, auto-acknowledgements, and data exports."
      requires="settings:edit"
    >
      {({ companyId, can }) => (
        <Stack spacing={3}>
          <EmployerSettings companyId={companyId} readOnly={!can('settings:edit')} />
        </Stack>
      )}
    </CompanyDashboardShell>
  );
}
