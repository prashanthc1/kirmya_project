'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  Avatar,
  Chip,
  Paper,
  Stack,
  Breadcrumbs,
  CircularProgress,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SchoolIcon from '@mui/icons-material/School';
import RateReviewIcon from '@mui/icons-material/RateReview';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import { mentorshipApi } from '../../../features/mentorship/api';
import { Mentorship } from '../../../features/mentorship/types';
import MentorshipGoalsCard from '../../../components/mentorship/MentorshipGoalsCard';
import MentorshipSessionsCard from '../../../components/mentorship/MentorshipSessionsCard';
import MentorshipFeedbackModal from '../../../components/mentorship/MentorshipFeedbackModal';

export default function MentorshipWorkspacePage() {
  const params = useParams();
  const mentorshipId = (params?.id as string) || 'm-100';

  const [mentorship, setMentorship] = useState<Mentorship | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  const fetchMentorship = async () => {
    try {
      setLoading(true);
      const data = await mentorshipApi.getMentorshipById(mentorshipId);
      setMentorship(data);
    } catch (err) {
      console.error('Failed to fetch active mentorship workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentorship();
  }, [mentorshipId]);

  const handleUpdateGoal = async (goalId: string, updates: any) => {
    await mentorshipApi.updateGoal(mentorshipId, goalId, updates);
    fetchMentorship();
  };

  const handleAddGoal = async (newGoal: any) => {
    await mentorshipApi.createGoal(mentorshipId, newGoal);
    fetchMentorship();
  };

  const handleDeleteGoal = async (goalId: string) => {
    await mentorshipApi.deleteGoal(mentorshipId, goalId);
    fetchMentorship();
  };

  const handleScheduleSession = async (sessionData: any) => {
    await mentorshipApi.scheduleSession(mentorshipId, sessionData);
    fetchMentorship();
  };

  const handleUpdateSessionStatus = async (sessionId: string, status: any) => {
    await mentorshipApi.updateSession(mentorshipId, sessionId, { status });
    fetchMentorship();
  };

  const handleSubmitFeedback = async (feedbackData: any) => {
    await mentorshipApi.submitFeedback(feedbackData);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!mentorship) {
    return (
      <Container maxWidth="md" sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="h5">Mentorship workspace not found</Typography>
        <Button component={Link} href="/mentorship" sx={{ mt: 2 }} variant="contained">
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
        <Typography component={Link} href="/mentorship" color="inherit" sx={{ textDecoration: 'none' }}>
          Mentorship
        </Typography>
        <Typography color="text.primary" fontWeight={600}>
          Workspace ({mentorship.mentor_name})
        </Typography>
      </Breadcrumbs>

      {/* Mentorship Workspace Banner Header */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: '24px',
          background: (theme) =>
            theme.palette.mode === 'light'
              ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.12) 100%)'
              : 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.25) 100%)',
          backdropFilter: 'blur(16px)',
          border: (theme) =>
            theme.palette.mode === 'light'
              ? '1px solid rgba(99, 102, 241, 0.2)'
              : '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              src={mentorship.mentor_profile?.avatar}
              alt={mentorship.mentor_name}
              sx={{ width: 72, height: 72, border: '3px solid white', boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }}
            />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <Typography variant="h4" fontWeight={800}>
                  Mentorship Workspace with {mentorship.mentor_name}
                </Typography>
                <Chip
                  label={mentorship.status.toUpperCase()}
                  color="success"
                  sx={{ fontWeight: 700, borderRadius: '8px' }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Started {new Date(mentorship.started_at).toLocaleDateString()} • {mentorship.mentor_profile?.title} at {mentorship.mentor_profile?.company}
              </Typography>
            </Box>
          </Box>

          <Button
            variant="outlined"
            startIcon={<RateReviewIcon />}
            onClick={() => setFeedbackModalOpen(true)}
            sx={{
              borderRadius: '12px',
              fontWeight: 700,
              px: 3,
              borderColor: 'primary.main',
              bgcolor: (theme) => (theme.palette.mode === 'light' ? '#fff' : 'transparent'),
            }}
          >
            Leave Feedback
          </Button>
        </Box>
      </Paper>

      {/* Grid of Goals and Sessions */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <MentorshipGoalsCard
            goals={mentorship.goals}
            onAddGoal={handleAddGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <MentorshipSessionsCard
            sessions={mentorship.sessions}
            onScheduleSession={handleScheduleSession}
            onUpdateSessionStatus={handleUpdateSessionStatus}
          />
        </Grid>
      </Grid>

      {/* Feedback Modal */}
      <MentorshipFeedbackModal
        open={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        mentorshipId={mentorship.id}
        targetName={mentorship.mentor_name}
        onSubmit={handleSubmitFeedback}
      />
    </Container>
  );
}
