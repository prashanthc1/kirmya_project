'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Container } from '@mui/material';

import { AppHeader } from '../../../components/shell/AppHeader';
import { MobileDrawer } from '../../../components/shell/MobileDrawer';
import { MobileBottomNav } from '../../../components/shell/MobileBottomNav';
import { Footer } from '../../../components/landing/Footer';
import { JobDetailView } from '../../../components/jobs';
import { ErrorState } from '../../../components/common';
import { jobsApi } from '../../../features/jobs/api';
import { JobDetail } from '../../../features/jobs/types';
import { ROUTES } from '../../../shared/routes';

/**
 * The interactive shell around a job posting.
 *
 * The posting itself arrives already rendered from the server component in
 * page.tsx — that is what puts it in the HTML a crawler receives. This layer
 * adds what needs a browser: the saved-job state, which requires the visitor's
 * session and must not be part of a cached public page.
 */
export default function JobDetailShell({ jobId, job: serverJob }: { jobId: string; job: JobDetail }) {
  const router = useRouter();

  const [job, setJob] = useState<JobDetail | null>(serverJob);
  const [isSaved, setIsSaved] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Only the saved state is fetched in the browser. The posting is already
  // here, so there is no loading skeleton over content the server rendered —
  // and a signed-out visitor never issues this request at all.
  useEffect(() => {
    let cancelled = false;
    jobsApi
      .getSavedJobs()
      .then((savedList) => {
        if (!cancelled && Array.isArray(savedList)) {
          setIsSaved(savedList.some((j) => j.id === jobId));
        }
      })
      .catch(() => {
        // Not signed in, or the call failed. The posting still renders; only
        // the bookmark indicator is unknown.
      });
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  return (
    <Box sx={{ bgcolor: 'background.default', color: 'text.primary', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader onMobileNavOpen={() => setMobileDrawerOpen(true)} />
      <MobileDrawer open={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} />

      <Box component="main" id="main-content" sx={{ flexGrow: 1, py: { xs: 3, md: 5 } }}>
        <Container maxWidth="lg">
          {job ? (
            <JobDetailView
              job={job}
              isSaved={isSaved}
              onSaveToggle={(saved) => setIsSaved(saved)}
            />
          ) : (
            <ErrorState
              title="Job Posting Not Found"
              message="This job posting may have expired or is no longer accepting applications."
              actionLabel="Explore Other Jobs"
              onRetry={() => router.push(ROUTES.JOBS)}
            />
          )}
        </Container>
      </Box>

      <MobileBottomNav />
      <Footer />
    </Box>
  );
}
