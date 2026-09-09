'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Card,
  Grid,
  Avatar,
  Chip,
  Stack,
  Divider,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RecruiterNotes from './RecruiterNotes';
import CandidateResume from './CandidateResume';
import { recruiterApi } from '../../features/recruiter/api';

interface Props {
  applicationId: string;
}

/*
 * One candidate's application, from the API.
 *
 * This component took an `applicationId` and used it only as a React key. Every
 * application any recruiter opened was the same object compiled into the file:
 * "Sarah Chen", sarah.chen@example.com, a stock portrait, a Senior Go Backend
 * Architect application dated 1 August, a written cover letter signed in her
 * name, three screening answers including "Immediate (Layoff Support)", and a
 * three-step stage history crediting "Recruiter Rashid Al-Maktoum".
 *
 * `GET /recruiter/applications/:id` and `/history` serve the real thing.
 *
 * Screening answers are not among what they serve, so that card is gone rather
 * than filled in - a recruiter reading invented answers to their own screening
 * questions is worse than a recruiter seeing none.
 */
export const ApplicationDetails: React.FC<Props> = ({ applicationId }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [activeTab, setActiveTab] = useState(0);

  const {
    data: application,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['recruiter', 'application', applicationId],
    queryFn: () => recruiterApi.getApplicationDetail(applicationId),
    enabled: Boolean(applicationId),
  });

  const { data: history = [], isError: historyFailed } = useQuery({
    queryKey: ['recruiter', 'application', applicationId, 'history'],
    queryFn: () => recruiterApi.getStageHistory(applicationId),
    enabled: Boolean(applicationId) && activeTab === 2,
  });

  if (isLoading) {
    return (
      <Box sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 2 }} role="status" aria-live="polite">
        <CircularProgress size={22} />
        <Typography variant="body2" color="text.secondary">
          Loading this application…
        </Typography>
      </Box>
    );
  }

  if (isError || !application) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          This application could not be loaded.
          {error instanceof Error ? ` ${error.message}` : ''}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Card
        sx={{
          borderRadius: '24px',
          p: 3,
          mb: 3,
          background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar src={application.candidateAvatar || undefined} sx={{ width: 64, height: 64, borderRadius: '16px' }}>
              {application.candidateName?.[0] ?? '?'}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                {application.candidateName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Applying for <strong>{application.jobTitle}</strong> • Applied {application.appliedAt}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip label={`Current Stage: ${application.currentStage}`} color="primary" sx={{ fontWeight: 900 }} />
          </Stack>
        </Stack>

        <Divider sx={{ my: 2.5 }} />

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Application" sx={{ fontWeight: 800 }} />
          <Tab label="Resume & ATS" sx={{ fontWeight: 800 }} />
          <Tab label="Stage Timeline" sx={{ fontWeight: 800 }} />
          <Tab label="Internal Recruiter Notes" sx={{ fontWeight: 800 }} />
        </Tabs>
      </Card>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: '20px', p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, color: 'primary.main' }}>
                Cover Letter
              </Typography>
              {application.coverLetter ? (
                <Typography variant="body1" whiteSpace="pre-line" color="text.secondary">
                  {application.coverLetter}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  This candidate did not submit a cover letter.
                </Typography>
              )}
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: '20px', p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Applicant Quick Details
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Email: <strong>{application.candidateEmail}</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Application Date: <strong>{application.appliedAt}</strong>
              </Typography>
              {application.candidateLocation && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Location: <strong>{application.candidateLocation}</strong>
                </Typography>
              )}
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <CandidateResume candidateId={application.candidateId} candidateName={application.candidateName} />
      )}

      {activeTab === 2 && (
        <Card sx={{ borderRadius: '20px', p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
            Recorded Application Stage Transitions
          </Typography>

          {historyFailed && (
            <Alert severity="error" sx={{ mb: 2 }}>
              The stage history could not be loaded.
            </Alert>
          )}

          {!historyFailed && history.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              This application has not moved between stages yet.
            </Typography>
          )}

          <Stack spacing={2.5} sx={{ pl: 2, borderLeft: history.length ? '3px solid #6366f1' : 'none' }}>
            {history.map((item) => (
              <Box key={item.id} sx={{ position: 'relative', pl: 2 }}>
                <CheckCircleIcon color="primary" sx={{ position: 'absolute', left: -27, top: 0, bgcolor: 'background.paper', borderRadius: '50%' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  {item.fromStage ? `${item.fromStage} → ${item.toStage}` : item.toStage}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {item.movedAt}
                  {item.movedByName ? ` • ${item.movedByName}` : ''}
                </Typography>
                {item.notes && (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {item.notes}
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        </Card>
      )}

      {activeTab === 3 && (
        <RecruiterNotes candidateId={application.candidateId} candidateName={application.candidateName} />
      )}
    </Box>
  );
};

export default ApplicationDetails;
