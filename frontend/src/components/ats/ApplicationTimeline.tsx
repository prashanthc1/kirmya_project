'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Paper, Stack, Alert, CircularProgress, useTheme } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventIcon from '@mui/icons-material/Event';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import HistoryIcon from '@mui/icons-material/History';
import { applicationsApi } from '../../features/applications/api';

interface ApplicationTimelineProps {
  applicationId: string;
}

/*
 * The audit history of one application, from the API.
 *
 * This component took an `applicationId` and ignored it. Every application
 * anyone opened showed the same four events compiled into the file: submitted
 * by "Sarah Chen", shortlisted by "Rashid Al-Maktoum" at "96% AI match",
 * interviewed by "Amira Al-Farsi", offer issued. Dated to the day. Headed
 * "Application Activity & Audit History".
 *
 * `GET /applications/:id/timeline` has served this all along.
 */
function iconFor(status: string) {
  const s = status.toLowerCase();
  if (s.includes('offer')) return <LocalOfferIcon sx={{ color: '#8b5cf6' }} />;
  if (s.includes('interview')) return <EventIcon sx={{ color: '#f59e0b' }} />;
  return <CheckCircleIcon sx={{ color: '#6366f1' }} />;
}

export const ApplicationTimeline: React.FC<ApplicationTimelineProps> = ({ applicationId }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const {
    data: events = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['application', applicationId, 'timeline'],
    queryFn: () => applicationsApi.getApplicationTimeline(applicationId),
    enabled: Boolean(applicationId),
  });

  return (
    <Box sx={{ py: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
        <HistoryIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 900 }}>
          Application Activity &amp; Audit History
        </Typography>
      </Stack>

      {isLoading && (
        <Stack direction="row" spacing={2} alignItems="center" role="status" aria-live="polite">
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Loading this application&apos;s history…
          </Typography>
        </Stack>
      )}

      {isError && !isLoading && (
        <Alert severity="error">
          This application&apos;s history could not be loaded.
          {error instanceof Error ? ` ${error.message}` : ''}
        </Alert>
      )}

      {!isLoading && !isError && events.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Nothing has happened on this application yet.
        </Typography>
      )}

      <Stack spacing={2.5}>
        {events.map((ev) => (
          <Paper
            key={ev.id}
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '14px',
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              {iconFor(ev.status)}
              <Box sx={{ flexGrow: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {ev.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {ev.date}
                  </Typography>
                </Stack>
                {ev.moved_by && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
                    By: {ev.moved_by}
                  </Typography>
                )}
                {ev.description && (
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', mt: 0.8 }}>
                    {ev.description}
                  </Typography>
                )}
              </Box>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

export default ApplicationTimeline;
