'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Button,
  Stack,
  Divider,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import DescriptionIcon from '@mui/icons-material/Description';
import MessageIcon from '@mui/icons-material/Message';
import { recruiterApi } from '../../features/recruiter/api';
import CandidateResume from './CandidateResume';
import CandidateMatch from './CandidateMatch';
import RecruiterNotes from './RecruiterNotes';

interface Props {
  candidateId: string;
}

export const CandidateProfile: React.FC<Props> = ({ candidateId }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [tabIndex, setTabIndex] = useState(0);

  /*
   * One candidate, from the API.
   *
   * This component took a `candidateId` and used it only to pass down to its
   * child tabs. The profile itself was a literal: "Sarah Chen", a stock
   * portrait, "Staff Software Engineer at CloudScale", 8 years, a "Verified
   * Profile" badge, a "96% MATCH" chip, eight skills, two AWS/Kubernetes
   * certifications, two jobs with quantified achievements ("Reduced P99
   * PostgreSQL query latency by 45%") and a degree from the American
   * University of Sharjah. Every recruiter opening any candidate saw it.
   *
   * `GET /recruiter/candidates/:id` serves what the platform actually holds:
   * name, headline, location and stated skills. It does not serve an about
   * text, work history, education, certifications, a verification status or a
   * match score, so those sections are gone rather than filled in. A match
   * against a specific job is the AI Job Match Scorecard tab's question, and
   * it is answered per job.
   */
  const {
    data: candidate,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['recruiter', 'candidate', candidateId],
    queryFn: () => recruiterApi.getCandidate(candidateId),
    enabled: Boolean(candidateId),
  });

  if (isLoading) {
    return (
      <Box sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 2 }} role="status" aria-live="polite">
        <CircularProgress size={22} />
        <Typography variant="body2" color="text.secondary">Loading this candidate…</Typography>
      </Box>
    );
  }

  if (isError || !candidate) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          This candidate could not be loaded.
          {error instanceof Error ? ` ${error.message}` : ''}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, md: 3 } }}>
      {/* Header Banner Card */}
      <Card
        sx={{
          borderRadius: '24px',
          background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          p: 3,
          mb: 3,
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
          <Stack direction="row" spacing={3} alignItems="center">
            <Avatar sx={{ width: 88, height: 88, borderRadius: '20px' }}>
              {candidate.name[0]}
            </Avatar>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography variant="h4" sx={{ fontWeight: 900 }}>
                  {candidate.name}
                </Typography>
              </Stack>
              <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 600, mt: 0.5 }}>
                {candidate.headline}
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 1 }} flexWrap="wrap">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationOnIcon fontSize="small" color="action" />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>{candidate.location}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <WorkIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    {candidate.resumeAvailable ? 'Resume on file' : 'No resume on file'}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<DescriptionIcon />}
              onClick={() => setTabIndex(1)}
              sx={{ borderRadius: '12px', fontWeight: 800 }}
            >
              View Resume
            </Button>
            <Button
              variant="contained"
              startIcon={<MessageIcon />}
              sx={{
                borderRadius: '12px',
                fontWeight: 800,
                px: 3,
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              }}
            >
              Message Candidate
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2.5 }} />

        <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)}>
          <Tab label="Professional Profile" sx={{ fontWeight: 800 }} />
          <Tab label="Resume & ATS Analysis" sx={{ fontWeight: 800 }} />
          <Tab label="AI Job Match Scorecard" sx={{ fontWeight: 800 }} />
          <Tab label="Recruiter Internal Notes" sx={{ fontWeight: 800 }} />
        </Tabs>
      </Card>

      {/* Tab Panels */}
      {tabIndex === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: '20px', p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Key Technical Skills
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
                {(candidate.skills ?? []).map((sk) => (
                  <Chip key={sk} label={sk} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                ))}
              </Stack>

            </Card>
          </Grid>
        </Grid>
      )}

      {tabIndex === 1 && <CandidateResume candidateId={candidateId} candidateName={candidate.name} />}
      {tabIndex === 2 && <CandidateMatch candidateId={candidateId} candidateName={candidate.name} />}
      {tabIndex === 3 && <RecruiterNotes candidateId={candidateId} candidateName={candidate.name} />}
    </Box>
  );
};

export default CandidateProfile;
