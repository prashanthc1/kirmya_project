'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NextLink from 'next/link';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  InputAdornment,
  Link as MuiLink,
  MenuItem,
  Pagination,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PaymentsIcon from '@mui/icons-material/Payments';

import BrandMark from '../../components/brand/BrandMark';
import { jobsApi } from '../../features/jobs/api';
import { JobListPage, JobSummary } from '../../features/jobs/types';

const WORK_MODES = ['onsite', 'hybrid', 'remote'];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'];
const PAGE_SIZE = 20;

function relativeDate(iso?: string): string {
  if (!iso) return '';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

function JobRow({ job }: { job: JobSummary }) {
  const meta = [job.employment_type, job.work_mode, job.experience_level].filter(Boolean);

  return (
    <Box
      component="article"
      sx={{
        py: 3,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'auto 1fr' },
        gap: { xs: 1.5, sm: 2.5 },
        alignItems: 'start',
      }}
    >
      <Avatar
        src={job.company_logo || undefined}
        variant="rounded"
        sx={{ width: 48, height: 48, bgcolor: 'action.selected', color: 'text.secondary', fontWeight: 700 }}
      >
        {(job.company_name || '·').charAt(0)}
      </Avatar>

      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, flexWrap: 'wrap' }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.3 }}>
            {job.title}
          </Typography>
          {job.is_featured && (
            <Chip
              label="Featured"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
            />
          )}
        </Stack>

        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.25 }}>
          {job.company_handle ? (
            <MuiLink component={NextLink} href={`/company/${job.company_handle}`} underline="hover" color="inherit">
              {job.company_name}
            </MuiLink>
          ) : (
            job.company_name || 'Independent posting'
          )}
          {job.department ? ` · ${job.department}` : ''}
        </Typography>

        <Stack
          direction="row"
          spacing={2.5}
          sx={{ flexWrap: 'wrap', rowGap: 0.75, mb: 1.5, color: 'text.secondary' }}
        >
          {job.location && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <LocationOnIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2">{job.location}</Typography>
            </Stack>
          )}
          {job.salary_range && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <PaymentsIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2">{job.salary_range}</Typography>
            </Stack>
          )}
          {meta.length > 0 && <Typography variant="body2">{meta.join(' · ')}</Typography>}
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1, alignItems: 'center' }}>
          {job.skills.slice(0, 5).map((skill) => (
            <Chip key={skill} label={skill} size="small" variant="outlined" sx={{ fontSize: '0.72rem' }} />
          ))}
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {relativeDate(job.published_at || job.created_at)}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}

function ResultsSkeleton() {
  return (
    <Box role="status" aria-busy="true" aria-label="Loading jobs">
      {Array.from({ length: 5 }).map((_, i) => (
        <Box key={i} sx={{ py: 3, display: 'flex', gap: 2.5 }}>
          <Skeleton variant="rounded" width={48} height={48} />
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" width="38%" height={28} />
            <Skeleton variant="text" width="24%" height={20} />
            <Skeleton variant="text" width="52%" height={20} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

function JobsBoard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // The URL is the source of truth so results stay shareable and crawlable.
  const urlQuery = searchParams.get('q') ?? '';
  const urlLocation = searchParams.get('location') ?? '';
  const urlWorkMode = searchParams.get('work_mode') ?? '';
  const urlEmployment = searchParams.get('employment_type') ?? '';
  const urlPage = Number(searchParams.get('page') ?? '1') || 1;

  // Draft state for the inputs, committed to the URL on submit.
  const [draftQuery, setDraftQuery] = useState(urlQuery);
  const [draftLocation, setDraftLocation] = useState(urlLocation);

  const [result, setResult] = useState<JobListPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setDraftQuery(urlQuery);
    setDraftLocation(urlLocation);
  }, [urlQuery, urlLocation]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    jobsApi
      .search({
        q: urlQuery,
        location: urlLocation,
        work_mode: urlWorkMode,
        employment_type: urlEmployment,
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
  }, [urlQuery, urlLocation, urlWorkMode, urlEmployment, urlPage]);

  const pushParams = useCallback(
    (next: Record<string, string | number>) => {
      const params = new URLSearchParams();
      const merged = {
        q: urlQuery,
        location: urlLocation,
        work_mode: urlWorkMode,
        employment_type: urlEmployment,
        page: 1,
        ...next,
      };
      Object.entries(merged).forEach(([key, value]) => {
        const str = String(value ?? '').trim();
        if (str && !(key === 'page' && str === '1')) params.set(key, str);
      });
      const qs = params.toString();
      router.push(qs ? `/jobs?${qs}` : '/jobs');
    },
    [router, urlQuery, urlLocation, urlWorkMode, urlEmployment],
  );

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    pushParams({ q: draftQuery.trim(), location: draftLocation.trim(), page: 1 });
  };

  const hasFilters = Boolean(urlQuery || urlLocation || urlWorkMode || urlEmployment);
  const total = result?.total ?? 0;

  return (
    <Box sx={{ bgcolor: 'background.default', color: 'text.primary', minHeight: '100dvh' }}>
      <Box component="header" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg" sx={{ py: 2 }}>
          <MuiLink
            component={NextLink}
            href="/"
            underline="none"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.25, color: 'text.primary' }}
          >
            <BrandMark size={34} />
            <Typography sx={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.15rem' }}>
              Kirmya
            </Typography>
          </MuiLink>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Typography
          variant="h1"
          sx={{ fontSize: { xs: '1.9rem', md: '2.4rem' }, fontWeight: 800, letterSpacing: '-0.03em', mb: 1 }}
        >
          Open roles
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
          Every active posting on Kirmya. No account needed to browse.
        </Typography>

        <Box component="form" onSubmit={submit} sx={{ mb: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <TextField
              fullWidth
              value={draftQuery}
              onChange={(e) => setDraftQuery(e.target.value)}
              placeholder="Job title, skill, or company"
              inputProps={{ 'aria-label': 'Search job titles, skills and companies' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              value={draftLocation}
              onChange={(e) => setDraftLocation(e.target.value)}
              placeholder="Location"
              inputProps={{ 'aria-label': 'Filter by location' }}
              sx={{ minWidth: { md: 200 } }}
            />
            <Button type="submit" variant="contained" size="large" sx={{ px: 4, flexShrink: 0 }}>
              Search
            </Button>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ mb: 1, flexWrap: 'wrap', rowGap: 1.5 }}>
          <TextField
            select
            size="small"
            label="Work mode"
            value={urlWorkMode}
            onChange={(e) => pushParams({ work_mode: e.target.value, page: 1 })}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">Any</MenuItem>
            {WORK_MODES.map((m) => (
              <MenuItem key={m} value={m} sx={{ textTransform: 'capitalize' }}>
                {m}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Employment type"
            value={urlEmployment}
            onChange={(e) => pushParams({ employment_type: e.target.value, page: 1 })}
            sx={{ minWidth: 190 }}
          >
            <MenuItem value="">Any</MenuItem>
            {EMPLOYMENT_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
          {hasFilters && (
            <Button onClick={() => router.push('/jobs')} sx={{ alignSelf: 'center' }}>
              Clear filters
            </Button>
          )}
        </Stack>

        <Divider sx={{ mt: 2 }} />

        {loading && <ResultsSkeleton />}

        {!loading && error && (
          <Alert
            severity="error"
            sx={{ mt: 3 }}
            action={
              <Button color="inherit" size="small" onClick={() => pushParams({})}>
                Retry
              </Button>
            }
          >
            We couldn&apos;t load job listings. Check your connection and try again.
          </Alert>
        )}

        {!loading && !error && total === 0 && (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              No roles match that search.
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              {hasFilters
                ? 'Try a broader title, or clear the filters to see everything open.'
                : 'There are no active postings right now. Check back shortly.'}
            </Typography>
            {hasFilters && (
              <Button variant="outlined" onClick={() => router.push('/jobs')}>
                Clear filters
              </Button>
            )}
          </Box>
        )}

        {!loading && !error && total > 0 && result && (
          <>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2.5 }}>
              {total} {total === 1 ? 'role' : 'roles'}
            </Typography>

            <Stack divider={<Divider />} sx={{ mt: 0.5 }}>
              {result.data.map((job) => (
                <JobRow key={job.id} job={job} />
              ))}
            </Stack>

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
                />
              </Stack>
            )}
          </>
        )}
      </Container>
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
