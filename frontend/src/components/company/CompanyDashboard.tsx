'use client';

/**
 * Company back-office overview.
 *
 * Every figure here is a count the server computed from the company's own rows.
 * Nothing is estimated, projected or filled in when a number is missing — an
 * absent section says so rather than showing a zero that looks like a
 * measurement.
 *
 * The candidate-facing modules are not duplicated: applications, interviews and
 * hires are counts, and acting on any of them links into the existing recruiter
 * screens.
 */
import React from 'react';
import NextLink from 'next/link';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';

import { useCompanyDashboard } from '../../features/company/hooks';
import { CompanyPermission } from '../../features/company/types';
import { AutoGrid, StatTile, VerificationStatusChip } from './CompanyBadges';
import GlassPanel from './GlassPanel';

const numberFormat = new Intl.NumberFormat();

interface CompanyDashboardProps {
  companyId: string;
  slug: string;
  can: (permission: CompanyPermission) => boolean;
}

export const CompanyDashboard: React.FC<CompanyDashboardProps> = ({ companyId, slug, can }) => {
  const theme = useTheme();
  const { data, isLoading, isError, error } = useCompanyDashboard(companyId);

  if (isLoading) {
    return (
      <Stack spacing={3}>
        <AutoGrid min={200}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} variant="rounded" height={116} sx={{ borderRadius: '16px' }} />
          ))}
        </AutoGrid>
        <Skeleton variant="rounded" height={240} sx={{ borderRadius: '16px' }} />
      </Stack>
    );
  }

  if (isError || !data) {
    return (
      <Alert severity="error" sx={{ borderRadius: '16px' }}>
        {error?.message || 'The dashboard could not be loaded.'}
      </Alert>
    );
  }

  const completion = Math.max(0, Math.min(100, data.profileCompletion));

  return (
    <Stack spacing={3}>
      <GlassPanel>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
        >
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Profile completion
              </Typography>
              <VerificationStatusChip status={data.verificationStatus} />
            </Stack>
            <LinearProgress
              variant="determinate"
              value={completion}
              aria-label="Profile completion"
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
              {completion}% of the profile fields the public page uses are filled in.
            </Typography>
          </Box>

          {can('company:edit') && (
            <Button
              component={NextLink}
              href={`/company/dashboard/profile?company=${slug}`}
              variant="outlined"
              size="small"
              sx={{ textTransform: 'none', flexShrink: 0 }}
            >
              Edit profile
            </Button>
          )}
        </Stack>

        {data.verificationStatus !== 'verified' && can('verification:submit') && (
          <Alert
            severity="info"
            sx={{ mt: 2, borderRadius: '12px' }}
            action={
              <Button
                component={NextLink}
                href={`/company/dashboard/verification?company=${slug}`}
                size="small"
                color="inherit"
              >
                Open
              </Button>
            }
          >
            This company is not verified. Kirmya administrators review the documents; the badge
            appears only after they approve.
          </Alert>
        )}
      </GlassPanel>

      <AutoGrid min={200}>
        <StatTile
          label="Profile views"
          value={numberFormat.format(data.profileViews)}
          icon={<VisibilityOutlinedIcon fontSize="small" color="primary" />}
        />
        <StatTile
          label="Job views"
          value={numberFormat.format(data.jobViews)}
          icon={<WorkOutlineIcon fontSize="small" color="primary" />}
        />
        <StatTile
          label="Active jobs"
          value={numberFormat.format(data.activeJobs)}
          icon={<WorkOutlineIcon fontSize="small" color="primary" />}
        />
        <StatTile
          label="Applications"
          value={numberFormat.format(data.applications)}
          icon={<DescriptionOutlinedIcon fontSize="small" color="primary" />}
        />
        <StatTile
          label="Candidates"
          value={numberFormat.format(data.candidates)}
          caption="Distinct people who applied"
          icon={<PeopleAltOutlinedIcon fontSize="small" color="primary" />}
        />
        <StatTile
          label="Interviews"
          value={numberFormat.format(data.interviews)}
          icon={<EventAvailableOutlinedIcon fontSize="small" color="primary" />}
        />
        <StatTile
          label="Hires"
          value={numberFormat.format(data.hires)}
          icon={<HowToRegOutlinedIcon fontSize="small" color="primary" />}
        />
        <StatTile
          label="Followers"
          value={numberFormat.format(data.followers)}
          icon={<FavoriteBorderIcon fontSize="small" color="primary" />}
        />
      </AutoGrid>

      {data.pendingApprovals > 0 && can('people:approve') && (
        <Alert
          severity="warning"
          icon={<PendingActionsOutlinedIcon />}
          sx={{ borderRadius: '16px' }}
          action={
            <Button
              component={NextLink}
              href={`/company/dashboard/people?company=${slug}&status=pending`}
              size="small"
              color="inherit"
            >
              Review
            </Button>
          }
        >
          {data.pendingApprovals}{' '}
          {data.pendingApprovals === 1 ? 'person is' : 'people are'} waiting for a decision on their
          request to be listed as an employee.
        </Alert>
      )}

      <GlassPanel>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1.5 }}
          spacing={2}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Recruiter activity
          </Typography>
          {can('recruiter:view') && (
            <Button
              component={NextLink}
              href={`/company/dashboard/recruiters?company=${slug}`}
              size="small"
              sx={{ textTransform: 'none' }}
            >
              Manage recruiters
            </Button>
          )}
        </Stack>
        <Divider sx={{ mb: 1 }} />

        {data.recruiterActivity.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
            No recruiter activity has been recorded for this company yet.
          </Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" aria-label="Recruiter activity">
              <TableHead>
                <TableRow>
                  <TableCell>Recruiter</TableCell>
                  <TableCell align="right">Jobs posted</TableCell>
                  <TableCell align="right">Applications reviewed</TableCell>
                  <TableCell align="right">Interviews</TableCell>
                  <TableCell align="right">Hires</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.recruiterActivity.map((row) => (
                  <TableRow key={row.userId} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{row.name || 'Unnamed recruiter'}</TableCell>
                    <TableCell align="right">{numberFormat.format(row.jobsPosted)}</TableCell>
                    <TableCell align="right">
                      {numberFormat.format(row.applicationsReviewed)}
                    </TableCell>
                    <TableCell align="right">{numberFormat.format(row.interviews)}</TableCell>
                    <TableCell align="right">{numberFormat.format(row.hires)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </GlassPanel>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {can('job:view') && (
          <Chip
            component={NextLink}
            href={`/company/dashboard/jobs?company=${slug}`}
            clickable
            label="Jobs"
            sx={{ borderColor: theme.palette.divider }}
            variant="outlined"
          />
        )}
        {can('team:view') && (
          <Chip
            component={NextLink}
            href={`/company/dashboard/people?company=${slug}`}
            clickable
            label="People"
            variant="outlined"
          />
        )}
        {can('analytics:view') && (
          <Chip
            component={NextLink}
            href={`/company/dashboard/analytics?company=${slug}`}
            clickable
            label="Analytics"
            variant="outlined"
          />
        )}
      </Stack>
    </Stack>
  );
};

export default CompanyDashboard;
