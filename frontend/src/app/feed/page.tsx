'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Stack,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Button,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  Divider,
  useTheme,
  Skeleton,
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RefreshIcon from '@mui/icons-material/Refresh';

import { AuthenticatedLayout } from '../../components/shell';
import { useAuth } from '../../hooks/useAuth';
import { jobsApi } from '../../features/jobs/api';
import { JobSummary } from '../../features/jobs/types';
import { ROUTES } from '../../shared/routes';
import { tokens } from '../../theme/tokens';
import { EmptyState, ErrorState, LoadingState } from '../../components/common';

export default function FeedPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [recommendedJobs, setRecommendedJobs] = useState<JobSummary[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState(false);

  const fetchJobs = async () => {
    setJobsLoading(true);
    setJobsError(false);
    try {
      const data = await jobsApi.search({ limit: 4 });
      setRecommendedJobs(data.data || []);
    } catch {
      setJobsError(true);
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  if (authLoading) {
    return (
      <AuthenticatedLayout maxWidth="wide">
        <LoadingState message="Loading your personal feed..." />
      </AuthenticatedLayout>
    );
  }

  const greetingName = user?.firstName?.trim() || 'there';
  const profileCompletion = user?.jobTitle ? 85 : 50;

  return (
    <AuthenticatedLayout maxWidth="wide">
      <Grid container spacing={3}>
        {/* Left Column: Profile Summary & Quick Nav (Desktop) */}
        <Grid item xs={12} md={3}>
          <Stack spacing={2.5}>
            {/* Profile Summary Card */}
            <Card elevation={1} sx={{ borderRadius: `${tokens.radius.lg}px` }}>
              <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    mx: 'auto',
                    mb: 1.5,
                    bgcolor: theme.palette.primary.main,
                    fontSize: '1.5rem',
                    fontWeight: 700,
                  }}
                >
                  {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {user?.jobTitle || 'Job Seeker / Professional'}
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                {/* Profile Completion Progress */}
                <Box sx={{ textAlign: 'left', mb: 1.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Profile Strength
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {profileCompletion}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={profileCompletion}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>

                <Button
                  component={Link}
                  href={ROUTES.PROFILE}
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{ borderRadius: `${tokens.radius.sm}px` }}
                >
                  Complete Profile
                </Button>
              </CardContent>
            </Card>

            {/* Quick Links Menu */}
            <Card elevation={1} sx={{ borderRadius: `${tokens.radius.lg}px` }}>
              <CardContent sx={{ p: 1 }}>
                <Stack spacing={0.5}>
                  {[
                    { label: 'My Applications', href: ROUTES.APPLICATIONS, icon: <AssignmentOutlinedIcon fontSize="small" /> },
                    { label: 'Saved Jobs', href: ROUTES.SAVED_JOBS, icon: <BookmarkBorderIcon fontSize="small" /> },
                    { label: 'Job Alerts', href: ROUTES.JOB_ALERTS, icon: <NotificationsNoneIcon fontSize="small" /> },
                    { label: 'Resumes & Documents', href: ROUTES.RESUME, icon: <DescriptionOutlinedIcon fontSize="small" /> },
                    { label: 'Network & Referrals', href: ROUTES.NETWORK, icon: <PeopleOutlineIcon fontSize="small" /> },
                  ].map((link, idx) => (
                    <Button
                      key={idx}
                      component={Link}
                      href={link.href}
                      startIcon={link.icon}
                      fullWidth
                      sx={{
                        justifyContent: 'flex-start',
                        color: 'text.secondary',
                        px: 1.5,
                        py: 1,
                        borderRadius: `${tokens.radius.sm}px`,
                        '&:hover': {
                          color: 'text.primary',
                          bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.04)',
                        },
                      }}
                    >
                      {link.label}
                    </Button>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Center Column: Personalized Greeting & Recommended Jobs Stream */}
        <Grid item xs={12} md={6}>
          <Stack spacing={3}>
            {/* Welcome Banner Card */}
            <Card
              elevation={1}
              sx={{
                p: 3,
                borderRadius: `${tokens.radius.lg}px`,
                background: isDark
                  ? 'linear-gradient(135deg, rgba(129, 140, 248, 0.12) 0%, rgba(30, 41, 59, 0.9) 100%)'
                  : 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, #ffffff 100%)',
              }}
            >
              <Typography variant="h5" component="h1" sx={{ fontWeight: 800, mb: 0.5 }}>
                Welcome back, {greetingName}.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Explore opportunities tailored to your career transition goals.
              </Typography>

              <Stack direction="row" spacing={1.5} flexWrap="wrap">
                <Chip
                  icon={<AutoAwesomeIcon sx={{ fontSize: 16 }} />}
                  label="AI Job Matching Active"
                  color="primary"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
                <Chip
                  label="Verified Employers"
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              </Stack>
            </Card>

            {/* Recommended Jobs Section */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Recommended Jobs For You
                </Typography>
                <Button
                  component={Link}
                  href={ROUTES.JOBS}
                  endIcon={<ArrowForwardIcon />}
                  size="small"
                  sx={{ fontWeight: 600 }}
                >
                  View All
                </Button>
              </Stack>

              {jobsLoading ? (
                <Stack spacing={2}>
                  <Skeleton variant="rounded" height={130} />
                  <Skeleton variant="rounded" height={130} />
                  <Skeleton variant="rounded" height={130} />
                </Stack>
              ) : jobsError ? (
                <ErrorState
                  title="Unable to load recommended jobs"
                  message="We had trouble reaching the job service. Please try again."
                  onRetry={fetchJobs}
                />
              ) : recommendedJobs.length === 0 ? (
                <EmptyState
                  title="No active job postings right now"
                  description="New openings are posted daily. Check back shortly or explore the full job board."
                  actionLabel="Search All Jobs"
                  onAction={() => router.push(ROUTES.JOBS)}
                />
              ) : (
                <Stack spacing={2}>
                  {recommendedJobs.map((job) => (
                    <Card
                      key={job.id}
                      elevation={1}
                      sx={{
                        borderRadius: `${tokens.radius.lg}px`,
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
                        sx={{ p: 2.5 }}
                      >
                        <Stack spacing={1.5}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                {job.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {job.company_name || 'Verified Company'}
                              </Typography>
                            </Box>
                            <Chip
                              label={job.employment_type || 'Full-time'}
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                          </Stack>

                          <Stack direction="row" spacing={2} alignItems="center" color="text.secondary">
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <LocationOnOutlinedIcon sx={{ fontSize: 16 }} />
                              <Typography variant="caption">{job.location || 'Remote'}</Typography>
                            </Stack>
                            {job.salary_range && (
                              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                {job.salary_range}
                              </Typography>
                            )}
                          </Stack>
                        </Stack>
                      </CardActionArea>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>
          </Stack>
        </Grid>

        {/* Right Column: AI Tools & Action Rail */}
        <Grid item xs={12} md={3}>
          <Stack spacing={2.5}>
            {/* AI Career Assistant Launcher */}
            <Card
              elevation={1}
              sx={{
                p: 2.5,
                borderRadius: `${tokens.radius.lg}px`,
                border: `1px solid ${isDark ? 'rgba(129, 140, 248, 0.25)' : 'rgba(99, 102, 241, 0.2)'}`,
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
                  <AutoAwesomeIcon sx={{ fontSize: 20 }} />
                </Avatar>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  AI Career Assistant
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.85rem' }}>
                Analyze your resume against ATS criteria, generate targeted cover letters, and run mock interview simulations.
              </Typography>
              <Button
                component={Link}
                href={ROUTES.RESUME}
                variant="contained"
                size="small"
                fullWidth
                sx={{ borderRadius: `${tokens.radius.sm}px` }}
              >
                Launch Optimizer
              </Button>
            </Card>

            {/* Communities & Networking Action */}
            <Card elevation={1} sx={{ p: 2.5, borderRadius: `${tokens.radius.lg}px` }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Peer Communities
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.85rem' }}>
                Join industry discussion groups, participate in hiring events, and request warm referrals.
              </Typography>
              <Button
                component={Link}
                href={ROUTES.COMMUNITIES}
                variant="outlined"
                size="small"
                fullWidth
                sx={{ borderRadius: `${tokens.radius.sm}px` }}
              >
                Browse Communities
              </Button>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </AuthenticatedLayout>
  );
}
