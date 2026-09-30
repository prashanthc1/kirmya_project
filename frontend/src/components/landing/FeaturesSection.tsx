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
    { title: 'Resume Builder', desc: 'Create executive-ready, ATS-compliant CVs in under 5 minutes.', icon: <DescriptionIcon sx={{ color: 'primary.main' }} /> },
    { title: 'Cover Letters', desc: 'Write a tailored cover letter for each position from ready-made templates.', icon: <EditNoteIcon sx={{ color: 'primary.main' }} /> },
    { title: 'Salary Insights', desc: 'Real-time compensation benchmarks across countries and job titles.', icon: <AttachMoneyIcon sx={{ color: 'primary.main' }} /> },
    { title: 'Communities', desc: 'Join active career guilds, industry groups, and discussion forums.', icon: <GroupsIcon sx={{ color: 'primary.main' }} /> },
    { title: 'Job Alerts', desc: 'Instant notifications when high-match opportunities go live.', icon: <NotificationsActiveIcon sx={{ color: 'primary.main' }} /> },
    { title: 'Application Tracking', desc: 'Kanban-style tracking board for submitted applications.', icon: <TrackChangesIcon sx={{ color: 'primary.main' }} /> },
    { title: 'Referral Requests', desc: 'Request internal employee referrals to bypass cold applications.', icon: <CardGiftcardIcon sx={{ color: 'primary.main' }} /> },
    { title: 'Saved Jobs', desc: 'Bookmark interesting job postings to apply when ready.', icon: <BookmarkIcon sx={{ color: 'primary.main' }} /> },
  ];

  return (
    <Box id="features" sx={{ py: 12, position: 'relative' }}>
      <Container maxWidth="xl">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              letterSpacing: 2,
              color: 'primary.main',
              textTransform: 'uppercase',
              display: 'block',
              mb: 1,
            }}
          >
            COMPLETE CAREER ECOSYSTEM
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
            Everything You Need To Fast-Track Your Career
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 680, mx: 'auto', fontSize: '1.05rem' }}>
            Career tools, communities and referral channels designed for modern job seekers.
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
                      bgcolor: 'action.hover',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
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
