'use client';

/**
 * One job row on a company page.
 *
 * Jobs belong to the Jobs module — nothing here creates, edits or applies to
 * one. The public card links out to the shared job page; the management card
 * links into the existing recruiter screens for the same job.
 */
import React from 'react';
import NextLink from 'next/link';
import {
  Box,
  Button,
  Chip,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PaymentsIcon from '@mui/icons-material/Payments';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import StarIcon from '@mui/icons-material/Star';
import InsightsIcon from '@mui/icons-material/Insights';

import { CompanyJob } from '../../features/company/types';

interface CompanyJobCardProps {
  job: CompanyJob;
  /** Management cards show status, traffic and links into the recruiter tools. */
  variant?: 'public' | 'manage';
  /** Overrides the public destination when a host page owns job navigation. */
  href?: string;
  canViewJobAnalytics?: boolean;
  onViewAnalytics?: (job: CompanyJob) => void;
}

const STATUS_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  draft: 'default',
  pending_approval: 'warning',
  published: 'success',
  active: 'success',
  paused: 'warning',
  closed: 'error',
  archived: 'default',
  expired: 'error',
};

const numberFormat = new Intl.NumberFormat();

const relativeDate = (value?: string): string => {
  if (!value) return '';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '';
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
};

export const CompanyJobCard: React.FC<CompanyJobCardProps> = ({
  job,
  variant = 'public',
  href,
  canViewJobAnalytics = false,
  onViewAnalytics,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isManage = variant === 'manage';
  const target = href ?? `/jobs/${job.id}`;

  const facts = [
    job.location && { icon: <LocationOnIcon fontSize="small" />, text: job.location },
    job.department && { icon: <ApartmentIcon fontSize="small" />, text: job.department },
    job.salaryRange && { icon: <PaymentsIcon fontSize="small" />, text: job.salaryRange },
  ].filter(Boolean) as Array<{ icon: React.ReactNode; text: string }>;

  const tags = [job.workMode, job.employmentType, job.experienceLevel].filter(Boolean);
  const posted = relativeDate(job.publishedAt || job.createdAt);

  return (
    <Box
      component="article"
      sx={{
        p: 2.5,
        borderRadius: '16px',
        border: '1px solid',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.12)',
        bgcolor: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(12px)',
        transition: 'border-color 160ms ease, transform 160ms ease',
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
      >
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography
              variant="subtitle1"
              component={isManage ? 'h3' : NextLink}
              {...(isManage ? {} : { href: target })}
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                textDecoration: 'none',
                '&:hover': { color: isManage ? 'text.primary' : 'primary.main' },
              }}
            >
              {job.title}
            </Typography>
            {job.isFeatured && (
              <Tooltip title="Featured job">
                <StarIcon fontSize="small" color="warning" aria-label="Featured" role="img" />
              </Tooltip>
            )}
            {isManage && job.status && (
              <Chip
                size="small"
                label={job.status.replace(/_/g, ' ')}
                color={STATUS_COLORS[job.status] ?? 'default'}
                variant={STATUS_COLORS[job.status] ? 'filled' : 'outlined'}
                sx={{ textTransform: 'capitalize' }}
              />
            )}
          </Stack>

          {facts.length > 0 && (
            <Stack
              direction="row"
              spacing={2}
              flexWrap="wrap"
              useFlexGap
              sx={{ mt: 1, color: 'text.secondary' }}
            >
              {facts.map((fact) => (
                <Stack key={fact.text} direction="row" spacing={0.5} alignItems="center">
                  {fact.icon}
                  <Typography variant="body2">{fact.text}</Typography>
                </Stack>
              ))}
            </Stack>
          )}

          {tags.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
              {tags.map((tag) => (
                <Chip key={tag} size="small" variant="outlined" label={tag} />
              ))}
            </Stack>
          )}

          {job.skills?.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
              {job.skills.slice(0, 6).map((skill) => (
                <Chip key={skill} size="small" color="primary" variant="outlined" label={skill} />
              ))}
              {job.skills.length > 6 && (
                <Chip size="small" variant="outlined" label={`+${job.skills.length - 6}`} />
              )}
            </Stack>
          )}

          <Stack
            direction="row"
            spacing={2}
            flexWrap="wrap"
            useFlexGap
            sx={{ mt: 1.5, color: 'text.secondary' }}
          >
            {posted && <Typography variant="caption">Posted {posted}</Typography>}
            {isManage && (
              <>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <VisibilityIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption">
                    {numberFormat.format(job.viewsCount)} views
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <PeopleAltIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption">
                    {numberFormat.format(job.applicationsCount)} applications
                  </Typography>
                </Stack>
              </>
            )}
          </Stack>
        </Box>

        <Stack
          direction={{ xs: 'row', sm: 'column', md: 'row' }}
          spacing={1}
          sx={{ flexShrink: 0 }}
        >
          {isManage ? (
            <>
              <Button
                component={NextLink}
                href={`/recruiter/applications/${job.id}`}
                size="small"
                variant="outlined"
              >
                Applications
              </Button>
              {canViewJobAnalytics && (
                <Button
                  size="small"
                  variant="text"
                  startIcon={<InsightsIcon />}
                  onClick={() => onViewAnalytics?.(job)}
                >
                  Analytics
                </Button>
              )}
            </>
          ) : (
            <Button component={NextLink} href={target} size="small" variant="contained">
              View job
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
};

export default CompanyJobCard;
