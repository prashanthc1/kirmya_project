'use client';

import React from 'react';
import { Grid, Typography, Paper, useTheme } from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EventIcon from '@mui/icons-material/Event';
import RateReviewIcon from '@mui/icons-material/RateReview';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { RecruiterDashboardOverview } from '../../features/recruiter/types';

interface DashboardCardsProps {
  overview?: RecruiterDashboardOverview | null;
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({ overview }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const cards = [
    { label: 'Active Jobs', value: overview?.activeJobsCount || 4, color: '#6366f1', icon: <WorkIcon /> },
    { label: 'Total Applicants', value: overview?.totalApplicantsCount || 142, color: '#ec4899', icon: <PeopleIcon /> },
    { label: 'New Candidates', value: overview?.newCandidatesCount || 18, color: '#10b981', icon: <PersonAddIcon /> },
    { label: 'Interviews Scheduled', value: overview?.interviewsScheduled || 6, color: '#f59e0b', icon: <EventIcon /> },
    { label: 'Pending Reviews', value: overview?.pendingReviewsCount || 9, color: '#06b6d4', icon: <RateReviewIcon /> },
    { label: 'Offers Sent', value: overview?.offersSentCount || 4, color: '#8b5cf6', icon: <LocalOfferIcon /> },
    { label: 'Successful Hires', value: overview?.successfulHiresCount || 12, color: '#10b981', icon: <EmojiEventsIcon /> },
  ];

  return (
    <Grid container spacing={2.5} sx={{ mb: 4 }}>
      {cards.map((c, idx) => (
        <Grid item xs={12} sm={6} md={3} lg={1.71} key={idx}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '16px',
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
            }}
          >
            <Paper
              elevation={0}
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                bgcolor: `${c.color}15`,
                color: c.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.5,
              }}
            >
              {c.icon}
            </Paper>
            <Typography variant="h4" sx={{ fontWeight: 900, color: c.color, mb: 0.2 }}>
              {c.value}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              {c.label}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default DashboardCards;
