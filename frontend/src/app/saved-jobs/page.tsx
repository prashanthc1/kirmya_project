'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stack,
  Skeleton,
} from '@mui/material';
import { useRouter } from 'next/navigation';

import { AuthenticatedLayout } from '../../components/shell';
import { JobCard } from '../../components/jobs';
import { EmptyState, ErrorState } from '../../components/common';
import { jobsApi } from '../../features/jobs/api';
import { JobSummary } from '../../features/jobs/types';
import { ROUTES } from '../../shared/routes';
import { tokens } from '../../theme/tokens';

export const dynamic = 'force-dynamic';

export default function SavedJobsPage() {
  const router = useRouter();
  const [savedJobs, setSavedJobs] = useState<JobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchSavedJobs = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await jobsApi.getSavedJobs();
      setSavedJobs(Array.isArray(data) ? data : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const handleRemove = (jobId: string) => {
    setSavedJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  return (
    <AuthenticatedLayout maxWidth="standard">
      <Stack spacing={3}>
        {/* Heading */}
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 0.5 }}>
            Saved Jobs
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Keep track of open positions you are considering for application.
          </Typography>
        </Box>

        {loading && (
          <Stack spacing={2}>
            <Skeleton variant="rounded" height={120} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
            <Skeleton variant="rounded" height={120} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
          </Stack>
        )}

        {!loading && error && (
          <ErrorState
            title="Unable to load saved jobs"
            message="We couldn't retrieve your saved jobs right now. Please try again."
            onRetry={fetchSavedJobs}
          />
        )}

        {!loading && !error && savedJobs.length === 0 && (
          <EmptyState
            title="You haven't saved any jobs yet"
            description="When browsing open opportunities, tap the bookmark icon on any job card to save it for later."
            actionLabel="Search Open Roles"
            onAction={() => router.push(ROUTES.JOBS)}
          />
        )}

        {!loading && !error && savedJobs.length > 0 && (
          <Stack spacing={2}>
            {savedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isSaved={true}
                onSaveToggle={(isSaved) => {
                  if (!isSaved) handleRemove(job.id);
                }}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </AuthenticatedLayout>
  );
}
