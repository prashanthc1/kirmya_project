'use client';

import React from 'react';
import { Box, Typography, Paper, Stack, useTheme } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventIcon from '@mui/icons-material/Event';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import HistoryIcon from '@mui/icons-material/History';

interface ApplicationTimelineProps {
  applicationId: string;
}

export const ApplicationTimeline: React.FC<ApplicationTimelineProps> = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const events = [
    { title: 'Application Submitted', date: 'Jul 28, 2026 at 10:15 AM', user: 'Candidate (Sarah Chen)', note: 'Submitted via Kirmya Job Board', icon: <CheckCircleIcon sx={{ color: '#6366f1' }} /> },
    { title: 'Screening Passed & Shortlisted', date: 'Jul 29, 2026 at 02:30 PM', user: 'Recruiter (Rashid Al-Maktoum)', note: '96% AI match rating verified.', icon: <CheckCircleIcon sx={{ color: '#10b981' }} /> },
    { title: 'Technical Interview Scheduled', date: 'Jul 30, 2026 at 11:00 AM', user: 'Hiring Manager (Amira Al-Farsi)', note: 'Scheduled for Aug 5, 2026.', icon: <EventIcon sx={{ color: '#f59e0b' }} /> },
    { title: 'Job Offer Issued', date: 'Aug 01, 2026 at 04:45 PM', user: 'HR Director', note: 'Offer package sent via email.', icon: <LocalOfferIcon sx={{ color: '#8b5cf6' }} /> },
  ];

  return (
    <Box sx={{ py: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
        <HistoryIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 900 }}>
          Application Activity &amp; Audit History
        </Typography>
      </Stack>

      <Stack spacing={2.5}>
        {events.map((ev, idx) => (
          <Paper
            key={idx}
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '14px',
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              {ev.icon}
              <Box sx={{ flexGrow: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {ev.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {ev.date}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
                  By: {ev.user}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.85rem', mt: 0.8 }}>
                  "{ev.note}"
                </Typography>
              </Box>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

export default ApplicationTimeline;
