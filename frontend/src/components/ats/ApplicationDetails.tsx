'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Avatar,
  Button,
  Stack,
  Tabs,
  Tab,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MessageIcon from '@mui/icons-material/Message';
import DescriptionIcon from '@mui/icons-material/Description';
import EventIcon from '@mui/icons-material/Event';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import RateReviewIcon from '@mui/icons-material/RateReview';
import HistoryIcon from '@mui/icons-material/History';
import GlassCard from '../landing/GlassCard';
import ApplicationTimeline from './ApplicationTimeline';
import NotesPanel from './NotesPanel';
import FeedbackForm from './FeedbackForm';
import OfferManager from './OfferManager';
import InterviewScheduler from '../recruiter/InterviewScheduler';
import { atsApi } from '../../features/ats/api';
import { JobApplicationDTO, AIEvaluationResponse } from '../../features/ats/types';

interface ApplicationDetailsProps {
  applicationId: string;
}

export const ApplicationDetails: React.FC<ApplicationDetailsProps> = ({ applicationId }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [application, setApplication] = useState<JobApplicationDTO | null>(null);
  const [aiEval, setAiEval] = useState<AIEvaluationResponse | null>(null);
  const [tab, setTab] = useState(0);

  const [openOfferModal, setOpenOfferModal] = useState(false);
  const [openScheduleModal, setOpenScheduleModal] = useState(false);

  useEffect(() => {
    atsApi.getApplicationDetail(applicationId).then((res) => setApplication(res)).catch(() => {});
    atsApi.getAIEvaluation(applicationId).then((res) => setAiEval(res)).catch(() => {});
  }, [applicationId]);

  if (!application) return null;

  return (
    <Box>
      {/* Header Banner */}
      <GlassCard sx={{ p: { xs: 3, md: 4 }, mb: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Button startIcon={<ArrowBackIcon />} component="a" href="/recruiter/applications" sx={{ fontWeight: 700 }}>
            Back to Applications
          </Button>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} justifyContent="space-between" alignItems="flex-start">
          <Stack direction="row" spacing={2.5} alignItems="center">
            <Avatar src={application.candidateAvatar} sx={{ width: 72, height: 72, bgcolor: 'primary.main', fontWeight: 800, fontSize: '1.8rem' }}>
              {application.candidateName[0]}
            </Avatar>

            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.5 }}>
                <Typography variant="h4" sx={{ fontWeight: 900 }}>
                  {application.candidateName}
                </Typography>

                <Chip
                  icon={<AutoAwesomeIcon sx={{ fontSize: '14px !important', color: '#10b981 !important' }} />}
                  label={`${application.aiMatchScore}% AI MATCH`}
                  color="success"
                  sx={{ fontWeight: 900 }}
                />

                <Chip label={`STAGE: ${application.currentStage}`} color="primary" sx={{ fontWeight: 800 }} />
              </Stack>

              <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                Applied for: <strong>{application.jobTitle}</strong>
              </Typography>

              <Typography variant="caption" color="text.secondary">
                {application.candidateLocation} • {application.experienceYears} Years Experience • Assigned to: {application.assignedRecruiter}
              </Typography>
            </Box>
          </Stack>

          {/* Quick Action Buttons */}
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Button variant="outlined" startIcon={<DescriptionIcon />} component="a" href="https://kirmya.com/resumes/sarah-chen.pdf" target="_blank" sx={{ borderRadius: '10px', fontWeight: 700 }}>
              Resume
            </Button>
            <Button variant="outlined" startIcon={<EventIcon />} onClick={() => setOpenScheduleModal(true)} sx={{ borderRadius: '10px', fontWeight: 700 }}>
              Schedule Interview
            </Button>
            <Button variant="contained" startIcon={<LocalOfferIcon />} onClick={() => setOpenOfferModal(true)} sx={{ borderRadius: '10px', fontWeight: 800, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
              Issue Job Offer
            </Button>
          </Stack>
        </Stack>
      </GlassCard>

      {/* Sub-tabs */}
      <Tabs value={tab} onChange={(_, val) => setTab(val)} sx={{ mb: 3, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', '& .MuiTab-root': { fontWeight: 800, textTransform: 'none' } }}>
        <Tab label="Candidate Summary & AI Analysis" />
        <Tab label="Application Audit Timeline" />
        <Tab label="Recruiter & Team Notes" />
        <Tab label="Interview Evaluation & Feedback" />
      </Tabs>

      {/* Tab 0: Summary & AI Analysis */}
      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <GlassCard sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Candidate Work Profile &amp; Experience
              </Typography>

              <Typography variant="body1" sx={{ lineHeight: 1.6, mb: 3 }}>
                Senior Microservices Architect with 8+ years hands-on experience building fault-tolerant Golang backend services, PostgreSQL database clusters, and Docker/Kubernetes deployments.
              </Typography>

              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                Top Core Skills:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
                {application.skills.map((sk) => (
                  <Chip key={sk} label={sk} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                ))}
              </Stack>
            </GlassCard>
          </Grid>

          <Grid item xs={12} md={5}>
            {aiEval && (
              <GlassCard sx={{ p: 3, mb: 3, border: '1px solid rgba(168, 85, 247, 0.4)' }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <AutoAwesomeIcon sx={{ color: '#a855f7' }} />
                  <Typography variant="h6" sx={{ fontWeight: 900, color: '#a855f7' }}>
                    AI Hiring Evaluation
                  </Typography>
                </Stack>

                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                  AI Recommendation: <Chip label={aiEval.recommendation} color="success" size="small" sx={{ fontWeight: 900 }} />
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
                  {aiEval.summaryOverview}
                </Typography>

                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>
                  Key Strengths:
                </Typography>
                <Stack spacing={0.5} sx={{ mb: 2 }}>
                  {aiEval.strengths.map((str) => (
                    <Typography key={str} variant="caption" sx={{ fontWeight: 700, color: '#10b981', display: 'block' }}>
                      ✓ {str}
                    </Typography>
                  ))}
                </Stack>

                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>
                  Risk Factors &amp; Notice:
                </Typography>
                <Stack spacing={0.5}>
                  {aiEval.riskFactors.map((rf) => (
                    <Typography key={rf} variant="caption" sx={{ fontWeight: 600, color: '#f59e0b', display: 'block' }}>
                      ⚠ {rf}
                    </Typography>
                  ))}
                </Stack>
              </GlassCard>
            )}
          </Grid>
        </Grid>
      )}

      {/* Tab 1: Application Audit Timeline */}
      {tab === 1 && <ApplicationTimeline applicationId={applicationId} />}

      {/* Tab 2: Recruiter Notes */}
      {tab === 2 && <NotesPanel applicationId={applicationId} />}

      {/* Tab 3: Feedback Form */}
      {tab === 3 && <FeedbackForm interviewId="int-123" applicationId={applicationId} />}

      {/* Modals */}
      <OfferManager
        open={openOfferModal}
        onClose={() => setOpenOfferModal(false)}
        applicationId={application.id}
        jobId={application.jobId}
        candidateId={application.candidateId}
        candidateName={application.candidateName}
      />
    </Box>
  );
};

export default ApplicationDetails;
