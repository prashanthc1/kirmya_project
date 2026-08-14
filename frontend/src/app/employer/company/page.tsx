'use client';

import React from 'react';
import { Box, CircularProgress, Alert, Stack } from '@mui/material';

import CompanyDashboardShell from '../../../components/company/CompanyDashboardShell';
import CompanyBranding from '../../../components/company/CompanyBranding';
import CompanyAbout from '../../../components/company/CompanyAbout';
import { useCompany } from '../../../features/company/hooks';
import GlassPanel from '../../../components/company/GlassPanel';

export default function EmployerCompanyPage() {
  return (
    <CompanyDashboardShell
      title="Company Profile & Employer Branding"
      description="Manage your organization profile, logo, cover image, social links, and public branding assets."
      requires={['company:edit', 'branding:edit']}
    >
      {({ companyId, can }) => {
        const { data: company, isLoading, isError, error } = useCompany(companyId);
        const canEdit = can('company:edit') || can('branding:edit');

        if (isLoading) {
          return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          );
        }

        if (isError || !company) {
          return (
            <Alert severity="error" sx={{ borderRadius: '16px' }}>
              {(error as Error)?.message || 'Failed to load company profile.'}
            </Alert>
          );
        }

        return (
          <Stack spacing={3}>
            {/* Branding assets and media */}
            <CompanyBranding company={company} canEdit={canEdit} />

            {/* Overview & details summary */}
            <GlassPanel title="Organization Overview">
              <CompanyAbout company={company} />
            </GlassPanel>
          </Stack>
        );
      }}
    </CompanyDashboardShell>
  );
}
