'use client';

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import { ReminderItem } from '../types';
import { tokens } from '../../../theme/tokens';

interface RemindersPanelProps {
  reminders: ReminderItem[];
  onOpenFeedback?: (roundId?: string) => void;
}

export const RemindersPanel: React.FC<RemindersPanelProps> = ({
  reminders = [],
  onOpenFeedback,
}) => {
  const getBadgeColor = (minutes: number) => {
    if (minutes <= 15 && minutes >= -30) {
      return { color: 'error' as const, label: 'STARTS NOW / SOON' };
    }
    if (minutes <= 120 && minutes > 15) {
      return { color: 'warning' as const, label: 'IN UNDER 2 HOURS' };
    }
    return { color: 'info' as const, label: 'UPCOMING' };
  };

  const formatCountdown = (minutes: number) => {
    if (minutes < 0) return `Started ${Math.abs(minutes)}m ago`;
    if (minutes < 60) return `In ${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `In ${hours}h ${mins}m`;
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          mb: 3,
          borderRadius: `${tokens.radius.lg}px`,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <NotificationsActiveIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Interview Reminders & Real-Time Alerts
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Automated real-time notifications triggered before scheduled rounds. Direct links to join video calls and submit post-interview scorecards.
        </Typography>
      </Paper>

      {reminders.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 5,
            textAlign: 'center',
            borderRadius: `${tokens.radius.lg}px`,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <NotificationsActiveIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            No Upcoming Reminders
          </Typography>
          <Typography variant="body2" color="text.secondary">
            All scheduled interviews are up to date and confirmed.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {reminders.map((rem, idx) => {
            const statusInfo = getBadgeColor(rem.minutes_remaining);
            const startFormatted = new Date(rem.scheduled_start).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            });

            return (
              <Grid item xs={12} md={6} key={rem.interview_id || idx}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: `${tokens.radius.lg}px`,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'border-color 0.2s ease, transform 0.2s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                      <Chip
                        label={statusInfo.label}
                        size="small"
                        color={statusInfo.color}
                        sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                      />
                      <Stack direction="row" spacing={0.5} alignItems="center" color="primary.main">
                        <AccessTimeIcon fontSize="small" />
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {formatCountdown(rem.minutes_remaining)}
                        </Typography>
                      </Stack>
                    </Stack>

                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                      {rem.title}
                    </Typography>

                    <Stack direction="row" spacing={1} alignItems="center" color="text.secondary" sx={{ mb: 2 }}>
                      <PersonIcon fontSize="small" />
                      <Typography variant="body2">
                        Role: <strong>{rem.role}</strong> • {startFormatted}
                      </Typography>
                    </Stack>

                    {rem.meeting_link && (
                      <Button
                        component="a"
                        href={rem.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="contained"
                        fullWidth
                        startIcon={<VideoCallIcon />}
                        sx={{
                          borderRadius: `${tokens.radius.sm}px`,
                          fontWeight: 700,
                          textTransform: 'none',
                        }}
                      >
                        Join Video Meeting
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default RemindersPanel;
