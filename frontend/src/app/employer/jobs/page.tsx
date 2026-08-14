'use client';

import React from 'react';
import NextLink from 'next/link';
import { Box, Button, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import CompanyDashboardShell from '../../../components/company/CompanyDashboardShell';
import CompanyJobs from '../../../components/company/CompanyJobs';

export default function EmployerJobsPage() {
  return (
    <CompanyDashboardShell
      title="Jobs Management"
      description="Create, monitor, and manage open job listings for your organization."
      requires="job:view"
      actions={({ companyId, can }) =>
        can('job:create') ? (
          <Button
            component={NextLink}
            href={`/jobs/new?company=${companyId}`}
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            sx={{ borderRadius: '10px', textTransform: 'none' }}
          >
            Post New Job
          </Button>
        ) : null
      }
    >
      {({ membership, can }) => (
        <Stack spacing={3}>
          <CompanyJobs
            identifier={membership.company.id}
            variant="manage"
            showStatusFilter={true}
            pageSize={10}
            canViewJobAnalytics={can('analytics:job:view')}
          />
        </Stack>
      )}
    </CompanyDashboardShell>
  );
}
