'use client';

import React from 'react';
import {
  Box,
  Grid,
  Stack,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  LinearProgress,
  Divider,
  useTheme,
} from '@mui/material';
import Link from 'next/link';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import TuneIcon from '@mui/icons-material/Tune';

import { AuthenticatedLayout } from '../../components/shell';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../shared/routes';
import { tokens } from '../../theme/tokens';
import { LoadingState } from '../../components/common';
import { PersonalizedFeedStream } from '../../components/recommendations';

export default function FeedPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user, loading: authLoading } = useAuth();

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

        {/* Center Column: Personalized Feed Stream */}
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
                Explore real-time opportunities, peer connections, and community discussions curated for your career journey.
              </Typography>

              <Stack direction="row" spacing={1.5} flexWrap="wrap">
                <Chip
                  icon={<AutoAwesomeIcon sx={{ fontSize: 16 }} />}
                  label="Multi-Factor AI Ranking Active"
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

            {/* Canonical Personalized Feed Component */}
            <PersonalizedFeedStream initialLimit={15} showTabs={true} />
          </Stack>
        </Grid>

        {/* Right Column: AI Tools & Recommendations Shortcuts */}
        <Grid item xs={12} md={3}>
          <Stack spacing={2.5}>
            {/* Preferences Management Card */}
            <Card elevation={1} sx={{ p: 2.5, borderRadius: `${tokens.radius.lg}px` }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'secondary.main' }}>
                  <TuneIcon sx={{ fontSize: 20 }} />
                </Avatar>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Personalization Config
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.85rem' }}>
                Refine target job titles, preferred locations, and expected compensation to tune recommendations.
              </Typography>
              <Button
                component={Link}
                href="/jobs/recommendations"
                variant="outlined"
                size="small"
                fullWidth
                sx={{ borderRadius: `${tokens.radius.sm}px` }}
              >
                Tune Preferences
              </Button>
            </Card>

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

            {/* Communities Action */}
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
