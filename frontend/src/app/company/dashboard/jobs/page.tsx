'use client';

/**
 * The company's jobs, seen from the inside.
 *
 * These are the platform's own job rows — this screen lists and links to them,
 * it does not implement a second jobs board. Creating and editing a job stays
 * in the recruiter tools that already own it.
 */
import React from 'react';
import NextLink from 'next/link';
import { Button, Skeleton, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import CompanyDashboardShell from '../../../../components/company/CompanyDashboardShell';
import CompanyJobs from '../../../../components/company/CompanyJobs';
import { JobAnalyticsDialog } from '../../../../components/company/CompanyJobAnalytics';
import { CompanyJob } from '../../../../features/company/types';

const JobsPanel: React.FC<{
  companyId: string;
  slug: string;
  canViewJobAnalytics: boolean;
}> = ({ companyId, slug, canViewJobAnalytics }) => {
  const [selected, setSelected] = React.useState<CompanyJob | null>(null);

  return (
    <Stack spacing={3}>
      <CompanyJobs
        identifier={slug}
        variant="manage"
        pageSize={10}
        canViewJobAnalytics={canViewJobAnalytics}
        onViewAnalytics={setSelected}
        emptyMessage="No jobs have been posted for this company yet."
      />

      <JobAnalyticsDialog
        companyId={companyId}
        jobId={selected?.id ?? null}
        jobTitle={selected?.title}
        onClose={() => setSelected(null)}
      />
    </Stack>
  );
};

export default function CompanyDashboardJobsPage() {
  return (
    <React.Suspense fallback={<Skeleton variant="rounded" height={520} sx={{ m: 4 }} />}>
      <CompanyDashboardShell
        title="Jobs"
        description="Every role posted under this company, with how each one is performing."
        requires="job:view"
        actions={({ can }) =>
          can('job:create') ? (
            <Button
              component={NextLink}
              href="/recruiter/jobs/create"
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ textTransform: 'none' }}
            >
              Post a job
            </Button>
          ) : null
        }
      >
        {({ companyId, membership, can }) => (
          <JobsPanel
            companyId={companyId}
            slug={membership.company.slug}
            canViewJobAnalytics={can('analytics:job:view')}
          />
        )}
      </CompanyDashboardShell>
    </React.Suspense>
  );
}
