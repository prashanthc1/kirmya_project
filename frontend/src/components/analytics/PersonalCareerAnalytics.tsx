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
  Button,
  useTheme,
} from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SchoolIcon from '@mui/icons-material/School';
import ShieldIcon from '@mui/icons-material/Shield';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

import analyticsApi from '../../features/analytics/services/analyticsApi';
import { LearningAnalytics, UserPersonalAnalytics } from '../../features/analytics/types';
import UserConsentToggleModal from './UserConsentToggleModal';

export const PersonalCareerAnalytics: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [analytics, setAnalytics] = useState<UserPersonalAnalytics>({
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

  const [learning, setLearning] = useState<LearningAnalytics>({
    courses_enrolled_count: 12,
    courses_completed_count: 8,
    total_learning_hours: 45.5,
    certificates_issued_count: 5,
    skill_assessments_passed: 14,
  });

  const [consentOpen, setConsentOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [usrData, learnData] = await Promise.all([
      analyticsApi.getUserAnalytics(),
      analyticsApi.getLearningAnalytics(),
    ]);

    if (usrData) setAnalytics(usrData);
    if (learnData) setLearning(learnData);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
            Personal Career Growth &amp; Job Search Analytics
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Track profile visibility, application responses, interview rates, offer rate, and learning progress.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<ShieldIcon />}
          onClick={() => setConsentOpen(true)}
          sx={{ borderRadius: 3, fontWeight: 800 }}
        >
          Privacy Preferences
        </Button>
      </Stack>

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
                INTERVIEW INVITATION RATE
              </Typography>
            </Stack>
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, color: '#f59e0b' }}>
              {analytics.interview_invitation_rate}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              High candidate response velocity
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <LocalOfferIcon sx={{ color: '#ec4899' }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                OFFER CONVERSION RATE
              </Typography>
            </Stack>
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, color: '#ec4899' }}>
              {analytics.offer_rate}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Offer rate from interviews
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Learning & Profile Completeness Row */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, borderRadius: '24px' }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
              Profile Completeness &amp; Quality Index
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="body2" fontWeight={700}>Profile Strength Score</Typography>
                <Typography variant="body2" fontWeight={900} color="primary">{analytics.profile_completeness}%</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={analytics.profile_completeness} sx={{ height: 12, borderRadius: 6 }} />
            </Box>
            <Typography variant="caption" color="text.secondary">
              Profiles with &gt;90% completeness receive 3.5x more recruiter outreach messages!
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, borderRadius: '24px' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <SchoolIcon color="info" />
              <Typography variant="h6" fontWeight={800}>
                Learning &amp; Upskilling Progress
              </Typography>
            </Stack>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 1.5, textAlign: 'center', borderRadius: 3 }}>
                  <Typography variant="caption" color="text.secondary">Enrolled</Typography>
                  <Typography variant="h6" fontWeight={900}>{learning.courses_enrolled_count}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 1.5, textAlign: 'center', borderRadius: 3 }}>
                  <Typography variant="caption" color="text.secondary">Completed</Typography>
                  <Typography variant="h6" fontWeight={900} color="success.main">{learning.courses_completed_count}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 1.5, textAlign: 'center', borderRadius: 3 }}>
                  <Typography variant="caption" color="text.secondary">Certificates</Typography>
                  <Typography variant="h6" fontWeight={900} color="primary.main">{learning.certificates_issued_count}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 1.5, textAlign: 'center', borderRadius: 3 }}>
                  <Typography variant="caption" color="text.secondary">Hours</Typography>
                  <Typography variant="h6" fontWeight={900} color="warning.main">{learning.total_learning_hours}h</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>

      {/* User Consent Toggle Modal */}
      <UserConsentToggleModal
        open={consentOpen}
        onClose={() => setConsentOpen(false)}
      />
    </Box>
  );
};

export default PersonalCareerAnalytics;
