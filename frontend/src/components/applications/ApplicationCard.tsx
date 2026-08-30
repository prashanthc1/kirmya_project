'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Box,
  Stack,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EventIcon from '@mui/icons-material/Event';
import Link from 'next/link';

import { ApplicationSummary, ApplicationStage } from '../../features/applications/types';
import { tokens } from '../../theme/tokens';

interface ApplicationCardProps {
  application: ApplicationSummary;
  onViewDetails?: (app: ApplicationSummary) => void;
  onMessageRecruiter?: (app: ApplicationSummary) => void;
  onWithdraw?: (app: ApplicationSummary) => void;
  onToggleSave?: (app: ApplicationSummary) => void;
}

export const getStatusChipProps = (status: ApplicationStage) => {
  switch (status) {
    case 'Applied':
      return { label: 'Applied', color: 'info' as const, variant: 'filled' as const };
    case 'Viewed':
      return { label: 'Under Review', color: 'secondary' as const, variant: 'filled' as const };
    case 'Shortlisted':
      return { label: 'Shortlisted', color: 'primary' as const, variant: 'filled' as const };
    case 'Interview':
      return { label: 'Interview Scheduled', color: 'warning' as const, variant: 'filled' as const };
    case 'Offer':
      return { label: 'Job Offer Received', color: 'success' as const, variant: 'filled' as const };
    case 'Accepted':
      return { label: 'Offer Accepted', color: 'success' as const, variant: 'filled' as const };
    case 'Rejected':
      return { label: 'Not Selected', color: 'error' as const, variant: 'outlined' as const };
    case 'Withdrawn':
      return { label: 'Withdrawn', color: 'default' as const, variant: 'outlined' as const };
    default:
      return { label: status || 'In Progress', color: 'default' as const, variant: 'filled' as const };
  }
};

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  onViewDetails,
  onWithdraw,
}) => {
  const chipProps = getStatusChipProps(application.current_status);
  const formattedDate = application.applied_at
    ? new Date(application.applied_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <Card
      elevation={0}
      data-testid={`application-card-${application.id}`}
      sx={{
        mb: 2,
        borderRadius: `${tokens.radius.lg}px`,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 8px 24px rgba(0,0,0,0.3)'
              : '0 8px 24px rgba(99, 102, 241, 0.08)',
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
        >
          {/* Left: Avatar & Meta */}
          <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
            <Avatar
              src={application.company_logo}
              alt={application.company_name}
              sx={{
                width: 48,
                height: 48,
                borderRadius: `${tokens.radius.md}px`,
                bgcolor: 'primary.main',
                fontWeight: 800,
                fontSize: '1.25rem',
              }}
            >
              {application.company_name ? application.company_name[0].toUpperCase() : 'C'}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                component={Link}
                href={`/dashboard/applications/${application.id}`}
                sx={{
                  fontWeight: 800,
                  color: 'text.primary',
                  textDecoration: 'none',
                  letterSpacing: '-0.01em',
                  display: 'block',
                  '&:hover': { color: 'primary.main' },
                }}
              >
                {application.job_title}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mt: 0.25 }}>
                {application.company_name}
              </Typography>

              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mt: 1 }}>
                {application.location && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <LocationOnOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {application.location}
                    </Typography>
                  </Stack>
                )}

                {application.salary_range && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <AttachMoneyIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {application.salary_range}
                    </Typography>
                  </Stack>
                )}

                <Stack direction="row" spacing={0.5} alignItems="center">
                  <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Applied {formattedDate}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Stack>

          {/* Right: Status & Actions */}
          <Stack
            direction={{ xs: 'row', sm: 'column' }}
            alignItems={{ xs: 'center', sm: 'flex-end' }}
            justifyContent="space-between"
            spacing={1.5}
            sx={{ width: { xs: '100%', sm: 'auto' }, pt: { xs: 1, sm: 0 } }}
          >
            <Chip
              {...chipProps}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: '0.75rem',
                borderRadius: `${tokens.radius.pill}px`,
                px: 0.5,
              }}
            />

            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title="View Job Details">
                <IconButton
                  component={Link}
                  href={`/jobs/${application.job_id}`}
                  size="small"
                  sx={{ border: '1px solid', borderColor: 'divider' }}
                >
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Button
                component={Link}
                href={`/dashboard/applications/${application.id}`}
                variant="outlined"
                size="small"
                endIcon={<ArrowForwardIcon fontSize="small" />}
                sx={{
                  borderRadius: `${tokens.radius.sm}px`,
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: '0.8rem',
                }}
              >
                Track Status
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default ApplicationCard;
