'use client';

import React from 'react';
import { Box, Container, Grid, Typography, Stack, useTheme } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DescriptionIcon from '@mui/icons-material/Description';
import TuneIcon from '@mui/icons-material/Tune';
import EditNoteIcon from '@mui/icons-material/EditNote';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import MapIcon from '@mui/icons-material/Map';
import BarChartIcon from '@mui/icons-material/BarChart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ChatIcon from '@mui/icons-material/Chat';
import PeopleIcon from '@mui/icons-material/People';
import GroupsIcon from '@mui/icons-material/Groups';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import ConnectWithoutContactIcon from '@mui/icons-material/ConnectWithoutContact';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import GlassCard from './GlassCard';

export const FeaturesSection: React.FC = () => {
  const theme = useTheme();

  const features = [
    { title: 'AI Job Matching', desc: 'Neural match scoring between your profile and live job descriptions.', icon: <AutoAwesomeIcon sx={{ color: '#6366f1' }} /> },
    { title: 'Resume Builder', desc: 'Create executive-ready, ATS-compliant CVs in under 5 minutes.', icon: <DescriptionIcon sx={{ color: '#ec4899' }} /> },
    { title: 'Resume Optimizer', desc: 'Scan and rewrite bullet points to pass corporate ATS screeners.', icon: <TuneIcon sx={{ color: '#10b981' }} /> },
    { title: 'Cover Letter Generator', desc: 'Generate tailored cover letters customized for each position.', icon: <EditNoteIcon sx={{ color: '#f59e0b' }} /> },
    { title: 'Interview Preparation', desc: 'Simulated AI mock interviews with instant voice and answer feedback.', icon: <QuestionAnswerIcon sx={{ color: '#06b6d4' }} /> },
    { title: 'Career Roadmap', desc: 'AI-guided career progression timelines and milestone tracking.', icon: <MapIcon sx={{ color: '#8b5cf6' }} /> },
    { title: 'Skill Gap Analysis', desc: 'Identify high-value missing skills required to unlock senior roles.', icon: <BarChartIcon sx={{ color: '#3b82f6' }} /> },
    { title: 'Salary Insights', desc: 'Real-time compensation benchmarks across countries and job titles.', icon: <AttachMoneyIcon sx={{ color: '#10b981' }} /> },
    { title: 'Messaging', desc: 'Direct, encrypted 1-on-1 messaging with peers and recruiters.', icon: <ChatIcon sx={{ color: '#6366f1' }} /> },
    { title: 'Professional Networking', desc: 'Build meaningful connections with industry leaders and advocates.', icon: <PeopleIcon sx={{ color: '#ec4899' }} /> },
    { title: 'Communities', desc: 'Join active career guilds, industry groups, and discussion forums.', icon: <GroupsIcon sx={{ color: '#f59e0b' }} /> },
    { title: 'Job Alerts', desc: 'Instant notifications when high-match opportunities go live.', icon: <NotificationsActiveIcon sx={{ color: '#06b6d4' }} /> },
    { title: 'Application Tracking', desc: 'Kanban-style tracking board for submitted applications.', icon: <TrackChangesIcon sx={{ color: '#8b5cf6' }} /> },
    { title: 'Recruiter Connections', desc: 'Direct access to verified corporate recruiters and talent leads.', icon: <ConnectWithoutContactIcon sx={{ color: '#3b82f6' }} /> },
    { title: 'Referral Requests', desc: 'Request internal employee referrals to bypass cold applications.', icon: <CardGiftcardIcon sx={{ color: '#10b981' }} /> },
    { title: 'Saved Jobs', desc: 'Bookmark interesting job postings to apply when ready.', icon: <BookmarkIcon sx={{ color: '#ec4899' }} /> },
  ];

  return (
    <Box id="features" sx={{ py: 12, position: 'relative' }}>
      <Container maxWidth="xl">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              letterSpacing: 2,
              color: 'primary.main',
              textTransform: 'uppercase',
              display: 'block',
              mb: 1,
            }}
          >
            COMPLETE CAREER ECOSYSTEM
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, color: 'text.primary' }}>
            Everything You Need To Fast-Track Your Career
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 680, mx: 'auto', fontSize: '1.05rem' }}>
            Comprehensive suite of AI tools, networking features, and referral channels designed for modern job seekers.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {features.map((feature, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <GlassCard sx={{ height: '100%', p: 3 }}>
                <Stack spacing={1.5}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      bgcolor: 'rgba(99, 102, 241, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.86rem', lineHeight: 1.6 }}>
                    {feature.desc}
                  </Typography>
                </Stack>
              </GlassCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default FeaturesSection;
