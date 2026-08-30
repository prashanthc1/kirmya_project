'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Skeleton,
  Stack,
} from '@mui/material';

import { AppHeader } from '../../../components/shell/AppHeader';
import { MobileDrawer } from '../../../components/shell/MobileDrawer';
import { MobileBottomNav } from '../../../components/shell/MobileBottomNav';
import { Footer } from '../../../components/landing/Footer';
import { JobDetailView } from '../../../components/jobs';
import { ErrorState } from '../../../components/common';
import { jobsApi } from '../../../features/jobs/api';
import { JobDetail } from '../../../features/jobs/types';
import { tokens } from '../../../theme/tokens';
import { ROUTES } from '../../../shared/routes';

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const jobId = resolvedParams.id;
  const router = useRouter();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const fetchJob = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await jobsApi.getJobById(jobId);
      setJob(data);

      // Check if saved
      const savedList = await jobsApi.getSavedJobs().catch(() => []);
      if (Array.isArray(savedList)) {
        setIsSaved(savedList.some((j) => j.id === jobId));
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  return (
    <Box sx={{ bgcolor: 'background.default', color: 'text.primary', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader onMobileNavOpen={() => setMobileDrawerOpen(true)} />
      <MobileDrawer open={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} />

      <Box component="main" id="main-content" sx={{ flexGrow: 1, py: { xs: 3, md: 5 } }}>
        <Container maxWidth="lg">
          {loading && (
            <Stack spacing={3}>
              <Skeleton variant="rounded" height={220} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
              <Skeleton variant="rounded" height={300} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
            </Stack>
          )}

          {!loading && error && (
            <ErrorState
              title="Job Posting Not Found"
              message="This job posting may have expired or is no longer accepting applications."
              actionLabel="Explore Other Jobs"
              onRetry={() => router.push(ROUTES.JOBS)}
            />
          )}

          {!loading && !error && job && (
            <JobDetailView
              job={job}
              isSaved={isSaved}
              onSaveToggle={(saved) => setIsSaved(saved)}
            />
          )}
        </Container>
      </Box>

      <MobileBottomNav />
      <Footer />
    </Box>
  );
}
