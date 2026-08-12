'use client';

import React from 'react';
import { Grid, Typography, Paper, useTheme } from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import DraftsIcon from '@mui/icons-material/Drafts';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import StarIcon from '@mui/icons-material/Star';
import EventIcon from '@mui/icons-material/Event';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface DashboardCardsProps {
  overview?: any;
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({ overview }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const cards = [
    { label: 'Active Jobs', value: overview?.activeJobsCount || 5, color: '#6366f1', icon: <WorkIcon /> },
    { label: 'Draft Jobs', value: overview?.draftJobsCount || 2, color: '#94a3b8', icon: <DraftsIcon /> },
    { label: 'Applications', value: overview?.totalApplicantsCount || 142, color: '#ec4899', icon: <PeopleIcon /> },
    { label: 'New Candidates', value: overview?.newCandidatesCount || 18, color: '#10b981', icon: <PersonAddIcon /> },
    { label: 'Shortlisted', value: overview?.shortlistedCount || 9, color: '#3b82f6', icon: <StarIcon /> },
    { label: 'Interviews', value: overview?.interviewsScheduled || 6, color: '#f59e0b', icon: <EventIcon /> },
    { label: 'Offers', value: overview?.offersCount || 3, color: '#8b5cf6', icon: <LocalOfferIcon /> },
    { label: 'Hires', value: overview?.successfulHiresCount || 12, color: '#10b981', icon: <EmojiEventsIcon /> },
    { label: 'Expiring Soon', value: overview?.expiringJobsCount || 1, color: '#ef4444', icon: <WarningAmberIcon /> },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 4 }}>
      {cards.map((c, idx) => (
        <Grid item xs={6} sm={4} md={2.4} lg={1.33} key={idx}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
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
                width: 34,
                height: 34,
                borderRadius: '10px',
                bgcolor: `${c.color}15`,
                color: c.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1,
              }}
            >
              {c.icon}
            </Paper>
            <Typography variant="h5" sx={{ fontWeight: 900, color: c.color, mb: 0.2 }}>
              {c.value}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
              {c.label}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default DashboardCards;
