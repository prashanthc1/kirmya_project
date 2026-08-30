'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  Divider,
  Pagination,
  Skeleton,
  Stack,
  Typography,
  Alert,
  Button,
  useTheme,
} from '@mui/material';

import { AppHeader } from '../../components/shell/AppHeader';
import { MobileDrawer } from '../../components/shell/MobileDrawer';
import { MobileBottomNav } from '../../components/shell/MobileBottomNav';
import { Footer } from '../../components/landing/Footer';
import { JobCard, JobSearchFilters, JobFilterValues } from '../../components/jobs';
import { EmptyState, ErrorState } from '../../components/common';
import { jobsApi } from '../../features/jobs/api';
import { JobListPage, JobSummary } from '../../features/jobs/types';
import { tokens } from '../../theme/tokens';
import { ROUTES } from '../../shared/routes';

const PAGE_SIZE = 20;

function ResultsSkeleton() {
  return (
    <Box role="status" aria-busy="true" aria-label="Loading job listings">
      <Stack spacing={2} sx={{ mt: 2 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={130} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
        ))}
      </Stack>
    </Box>
  );
}

function JobsBoard() {
  const router = useRouter();
  const theme = useTheme();
  const searchParams = useSearchParams();

  // Extract search params from URL
  const urlQuery = searchParams.get('q') ?? '';
  const urlLocation = searchParams.get('location') ?? '';
  const urlWorkMode = searchParams.get('work_mode') ?? '';
  const urlEmployment = searchParams.get('employment_type') ?? '';
  const urlSort = searchParams.get('sort') ?? '';
  const urlPage = Number(searchParams.get('page') ?? '1') || 1;

  const [result, setResult] = useState<JobListPage | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Fetch search results
  const fetchJobs = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    jobsApi
      .search({
        q: urlQuery,
        location: urlLocation,
        work_mode: urlWorkMode,
        employment_type: urlEmployment,
        sort: urlSort,
        page: urlPage,
        limit: PAGE_SIZE,
      })
      .then((res) => {
        if (!cancelled) setResult(res);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [urlQuery, urlLocation, urlWorkMode, urlEmployment, urlSort, urlPage]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Load saved jobs to sync bookmark icons
  useEffect(() => {
    jobsApi
      .getSavedJobs()
      .then((saved) => {
        if (Array.isArray(saved)) {
          setSavedJobIds(new Set(saved.map((j) => j.id)));
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveToggle = (jobId: string, isSaved: boolean) => {
    setSavedJobIds((prev) => {
      const next = new Set(prev);
      if (isSaved) {
        next.add(jobId);
      } else {
        next.delete(jobId);
      }
      return next;
    });
  };

  const pushParams = useCallback(
    (next: Partial<JobFilterValues & { page: number }>) => {
      const params = new URLSearchParams();
      const merged = {
        q: urlQuery,
        location: urlLocation,
        work_mode: urlWorkMode,
        employment_type: urlEmployment,
        sort: urlSort,
        page: 1,
        ...next,
      };

      Object.entries(merged).forEach(([key, value]) => {
        const str = String(value ?? '').trim();
        if (str && !(key === 'page' && str === '1')) {
          params.set(key, str);
        }
      });

      const qs = params.toString();
      router.push(qs ? `/jobs?${qs}` : '/jobs');
    },
    [router, urlQuery, urlLocation, urlWorkMode, urlEmployment, urlSort]
  );

  const total = result?.total ?? 0;
  const currentFilters: JobFilterValues = {
    q: urlQuery,
    location: urlLocation,
    work_mode: urlWorkMode,
    employment_type: urlEmployment,
    sort: urlSort,
  };

  return (
    <Box sx={{ bgcolor: 'background.default', color: 'text.primary', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Global Header */}
      <AppHeader onMobileNavOpen={() => setMobileDrawerOpen(true)} />
      <MobileDrawer open={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} />

      {/* Main Content Area */}
      <Box component="main" id="main-content" sx={{ flexGrow: 1, py: { xs: 3, md: 5 } }}>
        <Container maxWidth="lg">
          {/* Page Heading & Value Summary */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
                fontWeight: 800,
                letterSpacing: '-0.03em',
                mb: 0.75,
              }}
            >
              Explore Opportunities
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Discover verified roles matched to your career transition goals.
            </Typography>
          </Box>

          {/* Search & Filter Toolbar */}
          <JobSearchFilters
            initialValues={currentFilters}
            onSearch={(filters) => pushParams({ ...filters, page: 1 })}
            onClear={() => router.push('/jobs')}
          />

          <Divider sx={{ my: 3 }} />

          {/* Results State Management */}
          {loading && <ResultsSkeleton />}

          {!loading && error && (
            <ErrorState
              title="Unable to load job postings"
              message="We had trouble connecting to the jobs service. Please verify your connection and try again."
              onRetry={fetchJobs}
            />
          )}

          {!loading && !error && total === 0 && (
            <EmptyState
              title="No open roles found"
              description="Try broadening your search keywords or clearing some filters to see all available opportunities."
              actionLabel="View All Jobs"
              onAction={() => router.push('/jobs')}
            />
          )}

          {!loading && !error && total > 0 && result && (
            <>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontWeight: 500 }}>
                Showing {total} {total === 1 ? 'open role' : 'open roles'}
              </Typography>

              <Stack spacing={2}>
                {result.data.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isSaved={savedJobIds.has(job.id)}
                    onSaveToggle={(isSaved) => handleSaveToggle(job.id, isSaved)}
                  />
                ))}
              </Stack>

              {/* Pagination */}
              {result.total_pages > 1 && (
                <Stack alignItems="center" sx={{ mt: 5 }}>
                  <Pagination
                    count={result.total_pages}
                    page={result.page}
                    onChange={(_, value) => {
                      pushParams({ page: value });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    color="primary"
                    shape="rounded"
                  />
                </Stack>
              )}
            </>
          )}
        </Container>
      </Box>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Footer */}
      <Footer />
    </Box>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<ResultsSkeleton />}>
      <JobsBoard />
    </Suspense>
  );
}
