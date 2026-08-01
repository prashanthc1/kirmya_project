'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Grid, Button, Typography, Paper, useTheme } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import EventIcon from '@mui/icons-material/Event';
import MessageIcon from '@mui/icons-material/Message';
import BarChartIcon from '@mui/icons-material/BarChart';

export const QuickActions: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();

  const actions = [
    { label: 'Post New Job', icon: <AddCircleIcon />, route: '/recruiter/jobs/create', color: '#6366f1' },
    { label: 'Search Candidates', icon: <PersonSearchIcon />, route: '/recruiter/candidates', color: '#10b981' },
    { label: 'Review ATS Pipeline', icon: <ViewKanbanIcon />, route: '/recruiter/applications', color: '#f59e0b' },
    { label: 'Schedule Interview', icon: <EventIcon />, route: '/recruiter/interviews', color: '#ec4899' },
    { label: 'Candidate Messages', icon: <MessageIcon />, route: '/recruiter/messages', color: '#06b6d4' },
    { label: 'Hiring Analytics', icon: <BarChartIcon />, route: '/recruiter/analytics', color: '#8b5cf6' },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 4 }}>
      {actions.map((act) => (
        <Grid item xs={6} sm={4} md={2} key={act.label}>
          <Paper
            elevation={0}
            onClick={() => router.push(act.route)}
            sx={{
              p: 2,
              borderRadius: '16px',
              bgcolor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, background-color 0.2s ease',
              '&:hover': {
                transform: 'translateY(-3px)',
                bgcolor: 'rgba(99, 102, 241, 0.1)',
              },
            }}
          >
            <Button
              size="large"
              sx={{ color: act.color, minWidth: 0, p: 1, mb: 0.5, borderRadius: '12px' }}
            >
              {act.icon}
            </Button>
            <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.82rem', lineHeight: 1.2 }}>
              {act.label}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default QuickActions;
