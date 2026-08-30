'use client';

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  Stack,
  Chip,
  Button,
  Grid,
  Skeleton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import CardGiftcardOutlinedIcon from '@mui/icons-material/CardGiftcardOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Link from 'next/link';

import { ApplicationSummary, ApplicationStatsDTO } from '../../features/applications/types';
import { ApplicationCard } from './ApplicationCard';
import { tokens } from '../../theme/tokens';

interface ApplicationDashboardProps {
  applications?: ApplicationSummary[];
  stats?: ApplicationStatsDTO;
  insights?: any;
  isLoading?: boolean;
  onSelectApplication?: (id: string) => Promise<any> | void;
  onWithdrawApplication?: (id: string) => void;
}

export const ApplicationDashboard: React.FC<ApplicationDashboardProps> = ({
  applications = [],
  stats,
  isLoading = false,
  onSelectApplication,
  onWithdrawApplication,
}) => {
  const [filterTab, setFilterTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate real metrics from applications
  const counts = useMemo(() => {
    const total = applications.length;
    const active = applications.filter((a) => a.current_status !== 'Rejected' && a.current_status !== 'Withdrawn').length;
    const interviews = applications.filter((a) => a.current_status === 'Interview').length;
    const offers = applications.filter((a) => a.current_status === 'Offer' || a.current_status === 'Accepted').length;
    return { total, active, interviews, offers };
  }, [applications]);

  // Filter applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Tab filter
      if (filterTab === 'Active' && (app.current_status === 'Rejected' || app.current_status === 'Withdrawn')) {
        return false;
      }
      if (filterTab === 'Interview' && app.current_status !== 'Interview') {
        return false;
      }
      if (filterTab === 'Offer' && app.current_status !== 'Offer' && app.current_status !== 'Accepted') {
        return false;
      }
      if (filterTab === 'Rejected' && app.current_status !== 'Rejected') {
        return false;
      }
      if (filterTab === 'Withdrawn' && app.current_status !== 'Withdrawn') {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesJob = app.job_title?.toLowerCase().includes(q);
        const matchesCompany = app.company_name?.toLowerCase().includes(q);
        const matchesLocation = app.location?.toLowerCase().includes(q);
        if (!matchesJob && !matchesCompany && !matchesLocation) return false;
      }

      return true;
    });
  }, [applications, filterTab, searchQuery]);

  return (
    <Box data-testid="application-dashboard" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header & Overview Stats */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: `${tokens.radius.lg}px`,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 1 }}>
          Applications & Pipeline Tracker
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640, mb: 3 }}>
          Track your active submissions, interview stages, and recruiter feedback in real time.
        </Typography>

        {/* Metrics Grid */}
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: `${tokens.radius.md}px`,
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Total Submissions
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>
                {counts.total}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: `${tokens.radius.md}px`,
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)',
              }}
            >
              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                In Progress / Active
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.5 }}>
                {counts.active}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: `${tokens.radius.md}px`,
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(234,179,8,0.08)' : 'rgba(234,179,8,0.04)',
              }}
            >
              <Typography variant="caption" color="warning.main" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Interviews
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'warning.main', mt: 0.5 }}>
                {counts.interviews}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: `${tokens.radius.md}px`,
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.04)',
              }}
            >
              <Typography variant="caption" color="success.main" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Offers Received
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'success.main', mt: 0.5 }}>
                {counts.offers}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* Filters & Search Controls */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: `${tokens.radius.lg}px`,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', md: 'center' }}
          spacing={2}
        >
          <Tabs
            value={filterTab}
            onChange={(e, v) => setFilterTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 40,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                minHeight: 40,
                px: 2,
              },
            }}
          >
            <Tab label={`All (${applications.length})`} value="All" />
            <Tab label={`Active (${counts.active})`} value="Active" />
            <Tab label={`Interviews (${counts.interviews})`} value="Interview" />
            <Tab label={`Offers (${counts.offers})`} value="Offer" />
            <Tab label="Not Selected" value="Rejected" />
            <Tab label="Withdrawn" value="Withdrawn" />
          </Tabs>

          <TextField
            size="small"
            placeholder="Search by job title or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')} aria-label="Clear search">
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
              sx: { borderRadius: `${tokens.radius.sm}px` },
            }}
            sx={{ width: { xs: '100%', md: 280 } }}
          />
        </Stack>
      </Paper>

      {/* Applications List */}
      {isLoading ? (
        <Stack spacing={2}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={120} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
          ))}
        </Stack>
      ) : filteredApplications.length > 0 ? (
        <Box>
          {filteredApplications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onViewDetails={() => onSelectApplication?.(app.id)}
              onWithdraw={() => onWithdrawApplication?.(app.id)}
            />
          ))}
        </Box>
      ) : (
        <Paper
          elevation={0}
          sx={{
            py: 8,
            px: 3,
            textAlign: 'center',
            borderRadius: `${tokens.radius.lg}px`,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <WorkOutlineIcon sx={{ fontSize: 52, color: 'text.secondary', mb: 1.5, opacity: 0.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            No Applications Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto', mt: 0.5, mb: 3 }}>
            {searchQuery
              ? `No submissions matched "${searchQuery}". Try adjusting your search query or filter.`
              : 'You haven’t submitted any applications under this category yet. Explore open engineering and leadership roles.'}
          </Typography>

          <Button
            component={Link}
            href="/jobs"
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700, textTransform: 'none' }}
          >
            Explore Open Roles
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default ApplicationDashboard;
