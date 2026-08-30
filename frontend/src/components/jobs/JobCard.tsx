'use client';

import React from 'react';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
  Chip,
  Avatar,
  Link as MuiLink,
  useTheme,
} from '@mui/material';
import Link from 'next/link';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';

import { JobSummary } from '../../features/jobs/types';
import { ROUTES } from '../../shared/routes';
import { tokens } from '../../theme/tokens';
import SavedJobButton from './SavedJobButton';

export interface JobCardProps {
  job: JobSummary;
  isSaved?: boolean;
  onSaveToggle?: (isSaved: boolean) => void;
  compact?: boolean;
}

function formatRelativeTime(iso?: string): string {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 mo ago' : `${months} mos ago`;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  isSaved = false,
  onSaveToggle,
  compact = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const metadata = [
    job.work_mode && job.work_mode.charAt(0).toUpperCase() + job.work_mode.slice(1),
    job.employment_type,
    job.experience_level,
  ].filter(Boolean);

  return (
    <Card
      component="article"
      elevation={1}
      sx={{
        borderRadius: `${tokens.radius.lg}px`,
        position: 'relative',
        transition: 'transform 150ms ease, box-shadow 150ms ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[2],
        },
      }}
    >
      <CardActionArea
        component={Link}
        href={ROUTES.JOB_DETAIL(job.id)}
        sx={{ p: compact ? 2 : 2.5 }}
      >
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Stack spacing={1.5}>
            {/* Header: Logo, Title & Save Action */}
            <Stack direction="row" spacing={2} alignItems="flex-start" justifyContent="space-between">
              <Stack direction="row" spacing={1.75} alignItems="center" sx={{ minWidth: 0 }}>
                <Avatar
                  src={job.company_logo || undefined}
                  variant="rounded"
                  sx={{
                    width: compact ? 40 : 48,
                    height: compact ? 40 : 48,
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)',
                    color: 'text.primary',
                    fontWeight: 700,
                    borderRadius: `${tokens.radius.md}px`,
                  }}
                >
                  {(job.company_name || 'K').charAt(0).toUpperCase()}
                </Avatar>

                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography
                      variant="h6"
                      component="h2"
                      sx={{
                        fontWeight: 700,
                        fontSize: compact ? '1rem' : '1.1rem',
                        lineHeight: 1.25,
                        color: 'text.primary',
                      }}
                    >
                      {job.title}
                    </Typography>
                    {job.is_featured && (
                      <Chip
                        label="Featured"
                        size="small"
                        color="primary"
                        sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                      />
                    )}
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    {job.company_name || 'Verified Employer'}
                    {job.department ? ` • ${job.department}` : ''}
                  </Typography>
                </Box>
              </Stack>

              {/* Bookmark Save Action */}
              <Box onClick={(e) => e.stopPropagation()} sx={{ flexShrink: 0, ml: 1 }}>
                <SavedJobButton
                  jobId={job.id}
                  jobTitle={job.title}
                  initialSaved={isSaved}
                  onToggle={onSaveToggle}
                />
              </Box>
            </Stack>

            {/* Metadata Row: Location, Salary, Employment type */}
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              flexWrap="wrap"
              sx={{ color: 'text.secondary', fontSize: '0.85rem' }}
            >
              {job.location && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <LocationOnOutlinedIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption">{job.location}</Typography>
                </Stack>
              )}
              {job.salary_range && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <PaymentsOutlinedIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {job.salary_range}
                  </Typography>
                </Stack>
              )}
              {metadata.length > 0 && (
                <Typography variant="caption">{metadata.join(' • ')}</Typography>
              )}
            </Stack>

            {/* Skills & Relative Date Footer */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="space-between"
              sx={{ pt: 0.5 }}
            >
              <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ rowGap: 0.5, minWidth: 0 }}>
                {job.skills?.slice(0, 4).map((skill) => (
                  <Chip
                    key={skill}
                    label={skill}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontSize: '0.72rem',
                      height: 22,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.1)',
                    }}
                  />
                ))}
              </Stack>

              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                {formatRelativeTime(job.published_at || job.created_at)}
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default JobCard;
