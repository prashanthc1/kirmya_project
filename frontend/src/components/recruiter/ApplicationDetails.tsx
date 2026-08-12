'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Avatar,
  Chip,
  Button,
  Stack,
  Divider,
  Tab,
  Tabs,
  useTheme,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RecruiterNotes from './RecruiterNotes';
import CandidateResume from './CandidateResume';

interface Props {
  applicationId: string;
}

export const ApplicationDetails: React.FC<Props> = ({ applicationId }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [activeTab, setActiveTab] = useState(0);

  const application = {
    id: applicationId,
    jobTitle: 'Senior Go Backend Architect',
    candidateName: 'Sarah Chen',
    candidateAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    candidateEmail: 'sarah.chen@example.com',
    appliedDate: '2026-08-01',
    currentStage: 'Shortlisted',
    coverLetter:
      'Dear Hiring Manager,\n\nI am thrilled to apply for the Senior Go Backend Architect position at Kirmya. Over the past 8+ years, I have architected resilient microservices in Go and optimized PostgreSQL performance for enterprise scale.\n\nBest regards,\nSarah Chen',
    answers: [
      { question: 'Years of Golang Experience?', answer: '8 Years' },
      { question: 'Notice Period?', answer: 'Immediate (Layoff Support)' },
      { question: 'Are you located in or willing to relocate to Dubai?', answer: 'Yes, currently residing in Dubai.' },
    ],
    timeline: [
      { stage: 'Applied', date: '2026-08-01 10:00', notes: 'Application submitted via platform.' },
      { stage: 'Review', date: '2026-08-01 14:30', notes: 'Reviewed by Recruiter Rashid Al-Maktoum.' },
      { stage: 'Shortlisted', date: '2026-08-02 09:15', notes: 'Moved to Shortlisted stage.' },
    ],
  };

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
            <Avatar src={application.candidateAvatar} sx={{ width: 64, height: 64, borderRadius: '16px' }}>
              {application.candidateName[0]}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                {application.candidateName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Applying for <strong>{application.jobTitle}</strong> • Applied {application.appliedDate}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip label={`Current Stage: ${application.currentStage}`} color="primary" sx={{ fontWeight: 900 }} />
          </Stack>
        </Stack>

        <Divider sx={{ my: 2.5 }} />

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Application & Answers" sx={{ fontWeight: 800 }} />
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
              <Typography variant="body1" whiteSpace="pre-line" color="text.secondary">
                {application.coverLetter}
              </Typography>
            </Card>

            <Card sx={{ borderRadius: '20px', p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'primary.main' }}>
                Custom Screening Answers
              </Typography>
              <Stack spacing={2}>
                {application.answers.map((ans, i) => (
                  <Box key={i} sx={{ p: 2, borderRadius: '14px', bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block' }}>
                      {ans.question}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {ans.answer}
                    </Typography>
                  </Box>
                ))}
              </Stack>
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
                Application Date: <strong>{application.appliedDate}</strong>
              </Typography>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && <CandidateResume candidateId={applicationId} candidateName={application.candidateName} />}

      {activeTab === 2 && (
        <Card sx={{ borderRadius: '20px', p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
            Recorded Application Stage Transitions
          </Typography>
          <Stack spacing={2.5} sx={{ pl: 2, borderLeft: '3px solid #6366f1' }}>
            {application.timeline.map((item, i) => (
              <Box key={i} sx={{ position: 'relative', pl: 2 }}>
                <CheckCircleIcon color="primary" sx={{ position: 'absolute', left: -27, top: 0, bgcolor: 'background.paper', borderRadius: '50%' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  {item.stage}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {item.date}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>{item.notes}</Typography>
              </Box>
            ))}
          </Stack>
        </Card>
      )}

      {activeTab === 3 && <RecruiterNotes candidateId={applicationId} candidateName={application.candidateName} />}
    </Box>
  );
};

export default ApplicationDetails;
