'use client';

/**
 * Job listing for a company.
 *
 * Reads the company's jobs through the company API, which serves whatever the
 * caller is allowed to see: anonymous visitors get published jobs only, while a
 * member holding `job:view` also sees drafts and closed roles. The status
 * filter is therefore a convenience, not the access control.
 */
import React from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  MenuItem,
  Pagination,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { useCompanyJobs } from '../../features/company/hooks';
import { CompanyJob } from '../../features/company/types';
import CompanyJobCard from './CompanyJobCard';

interface CompanyJobsProps {
  identifier: string;
  variant?: 'public' | 'manage';
  /** Management views offer the status filter; public views do not. */
  showStatusFilter?: boolean;
  pageSize?: number;
  canViewJobAnalytics?: boolean;
  onViewAnalytics?: (job: CompanyJob) => void;
  emptyMessage?: string;
}

const MANAGE_STATUSES = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
];

export const CompanyJobs: React.FC<CompanyJobsProps> = ({
  identifier,
  variant = 'public',
  showStatusFilter = variant === 'manage',
  pageSize = 10,
  canViewJobAnalytics = false,
  onViewAnalytics,
  emptyMessage,
}) => {
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState('');

  const query = React.useMemo(
    () => ({ page, limit: pageSize, ...(status ? { status } : {}) }),
    [page, pageSize, status]
  );

  const { data, isLoading, isFetching, isError, error } = useCompanyJobs(identifier, query, {
    placeholderData: (previous) => previous,
  });

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  if (isLoading) {
    return (
      <Stack spacing={2}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={140} sx={{ borderRadius: '16px' }} />
        ))}
      </Stack>
    );
  }

  if (isError) {
    return <Alert severity="error">{error?.message || 'Jobs could not be loaded.'}</Alert>;
  }

  const jobs = data?.items ?? [];

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 2.5 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {data?.total ?? 0} {(data?.total ?? 0) === 1 ? 'job' : 'jobs'}
          </Typography>
          {isFetching && <CircularProgress size={14} />}
        </Stack>

        {showStatusFilter && (
          <TextField
            select
            size="small"
            label="Status"
            value={status}
            onChange={(event) => handleStatusChange(event.target.value)}
            sx={{ minWidth: 200 }}
          >
            {MANAGE_STATUSES.map((option) => (
              <MenuItem key={option.value || 'all'} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Stack>

      {jobs.length === 0 ? (
        <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          {emptyMessage ?? 'No open roles right now.'}
        </Typography>
      ) : (
        <Stack spacing={2}>
          {jobs.map((job) => (
            <CompanyJobCard
              key={job.id}
              job={job}
              variant={variant}
              canViewJobAnalytics={canViewJobAnalytics}
              onViewAnalytics={onViewAnalytics}
            />
          ))}
        </Stack>
      )}

      {(data?.totalPages ?? 0) > 1 && (
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Pagination
            count={data?.totalPages ?? 1}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            shape="rounded"
          />
        </Stack>
      )}
    </Box>
  );
};

export default CompanyJobs;
