'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Stack,
  Chip,
  Paper,
  LinearProgress,
  useTheme,
} from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import analyticsApi from '../../features/analytics/services/analyticsApi';

export const PersonalCareerAnalytics: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [analytics, setAnalytics] = useState<any>({
    profile_views_count: 142,
    search_appearances_count: 88,
    applications_count: 24,
    applications_this_week: 4,
    applications_this_month: 12,
    saved_jobs_count: 18,
    interview_invitation_rate: 33.3,
    offer_rate: 12.5,
    profile_completeness: 92,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await analyticsApi.getUserAnalytics();
    if (data) setAnalytics(data);
  };

  return (

    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
        Personal Career Growth &amp; Job Search Analytics
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Track profile visibility, application responses, interview rates, and skill alignment.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <VisibilityIcon sx={{ color: '#6366f1' }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                PROFILE VIEWS
              </Typography>
            </Stack>
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, color: '#6366f1' }}>
              {analytics.profile_views_count}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Appeared in {analytics.search_appearances_count} search results
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <WorkIcon sx={{ color: '#10b981' }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                APPLICATIONS SUBMITTED
              </Typography>
            </Stack>
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, color: '#10b981' }}>
              {analytics.applications_count}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {analytics.applications_this_week} this week • {analytics.applications_this_month} this month
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <EmojiEventsIcon sx={{ color: '#f59e0b' }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                INTERVIEW RATE
              </Typography>
            </Stack>
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, color: '#f59e0b' }}>
              {analytics.interview_invitation_rate}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Top 10% candidate response velocity
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <BookmarkIcon sx={{ color: '#ec4899' }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                PROFILE COMPLETENESS
              </Typography>
            </Stack>
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, color: '#ec4899' }}>
              {analytics.profile_completeness}%
            </Typography>
            <LinearProgress variant="determinate" value={analytics.profile_completeness} sx={{ height: 8, borderRadius: 4 }} />
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PersonalCareerAnalytics;
