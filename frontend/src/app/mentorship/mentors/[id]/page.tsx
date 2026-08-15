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
  Divider,
  Rating,
  CircularProgress,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Link from 'next/link';
import { mentorshipApi } from '../../../../features/mentorship/api';
import { MentorProfile } from '../../../../features/mentorship/types';
import MentorshipRequestModal from '../../../../components/mentorship/MentorshipRequestModal';

export default function MentorDetailPage() {
  const params = useParams();
  const mentorId = (params?.id as string) || 'mentor-1';

  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  useEffect(() => {
    async function fetchMentor() {
      try {
        setLoading(true);
        const data = await mentorshipApi.getMentorById(mentorId);
        setMentor(data);
      } catch (err) {
        console.error('Failed to fetch mentor:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMentor();
  }, [mentorId]);

  const handleSendRequest = async (payload: any) => {
    await mentorshipApi.createMentorshipRequest(payload);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!mentor) {
    return (
      <Container maxWidth="md" sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="h5">Mentor profile not found</Typography>
        <Button component={Link} href="/mentorship/mentors" sx={{ mt: 2 }} variant="contained">
          Back to Mentors
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
        <Typography component={Link} href="/mentorship" color="inherit" sx={{ textDecoration: 'none' }}>
          Mentorship
        </Typography>
        <Typography component={Link} href="/mentorship/mentors" color="inherit" sx={{ textDecoration: 'none' }}>
          Mentors
        </Typography>
        <Typography color="text.primary" fontWeight={600}>
          {mentor.name}
        </Typography>
      </Breadcrumbs>

      <Grid container spacing={4}>
        {/* Main Info */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: '24px',
              background: (theme) =>
                theme.palette.mode === 'light'
                  ? 'rgba(255, 255, 255, 0.85)'
                  : 'rgba(30, 41, 59, 0.85)',
              backdropFilter: 'blur(16px)',
              border: (theme) =>
                theme.palette.mode === 'light'
                  ? '1px solid rgba(255, 255, 255, 0.6)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
              mb: 4,
            }}
          >
            <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', sm: 'nowrap' }, mb: 3 }}>
              <Avatar
                src={mentor.avatar}
                alt={mentor.name}
                sx={{
                  width: 100,
                  height: 100,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  border: '3px solid rgba(255,255,255,0.8)',
                }}
              />
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                      {mentor.name}
                    </Typography>
                    <Typography variant="h6" color="text.secondary" fontWeight={500}>
                      {mentor.title} at {mentor.company}
                    </Typography>
                  </Box>
                  <Chip
                    label={mentor.availability.toUpperCase()}
                    color={mentor.availability === 'available' ? 'success' : 'warning'}
                    sx={{ fontWeight: 700, borderRadius: '8px' }}
                  />
                </Box>

                <Stack direction="row" spacing={2} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                  {mentor.location && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOnIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {mentor.location}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <WorkOutlineIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {mentor.experience_years} Years Experience
                    </Typography>
                  </Box>
                  {mentor.linkedin_url && (
                    <Box
                      component="a"
                      href={mentor.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#0077b5', textDecoration: 'none' }}
                    >
                      <LinkedInIcon fontSize="small" />
                      <Typography variant="body2" fontWeight={600}>
                        LinkedIn
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* About & Bio */}
            <Typography variant="h6" fontWeight={700} gutterBottom>
              About & Mentorship Philosophy
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, mb: 4 }}>
              {mentor.bio}
            </Typography>

            {/* Topics */}
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Core Mentorship Topics
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1, mb: 4 }}>
              {mentor.topics.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  color="primary"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    py: 2,
                    px: 1,
                    borderRadius: '12px',
                  }}
                />
              ))}
            </Stack>

            {/* Skills */}
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Technical Stack & Expertise
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
              {mentor.skills.map((s) => (
                <Chip key={s} label={s} variant="outlined" sx={{ fontWeight: 600, borderRadius: '10px' }} />
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* Action Sidebar Card */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: '24px',
              background: (theme) =>
                theme.palette.mode === 'light'
                  ? 'rgba(255, 255, 255, 0.9)'
                  : 'rgba(30, 41, 59, 0.9)',
              backdropFilter: 'blur(20px)',
              border: (theme) =>
                theme.palette.mode === 'light'
                  ? '1px solid rgba(99, 102, 241, 0.2)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
              position: 'sticky',
              top: 24,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
              Mentorship Offerings
            </Typography>

            <Box sx={{ my: 2.5, display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography variant="h3" fontWeight={800} color="primary.main">
                {mentor.pricing_model === 'free' || mentor.rate === 0 ? 'Free' : `$${mentor.rate}`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {mentor.pricing_model === 'free' || mentor.rate === 0 ? 'Mentorship' : '/ session'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <StarRoundedIcon sx={{ color: '#f59e0b', fontSize: 24 }} />
              <Typography variant="h6" fontWeight={700}>
                {mentor.rating.toFixed(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ({mentor.total_reviews} reviews)
              </Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Stack spacing={1.5} sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon color="success" fontSize="small" />
                <Typography variant="body2">
                  Capacity: {mentor.capacity?.current_mentees || 0}/{mentor.capacity?.max_mentees || 5} Mentees Active
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon color="success" fontSize="small" />
                <Typography variant="body2">
                  Formats: {mentor.preferred_formats.join(', ').replace(/_/g, ' ')}
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={mentor.availability === 'unavailable'}
              startIcon={<SendIcon />}
              onClick={() => setRequestModalOpen(true)}
              sx={{
                borderRadius: '14px',
                fontWeight: 700,
                py: 1.5,
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.35)',
              }}
            >
              Request Mentorship
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Mentorship Request Modal */}
      <MentorshipRequestModal
        open={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        mentor={mentor}
        onSubmit={handleSendRequest}
      />
    </Container>
  );
}
