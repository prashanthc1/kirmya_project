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
  Divider,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RateReviewIcon from '@mui/icons-material/RateReview';
import PersonIcon from '@mui/icons-material/Person';
import { ReminderItem } from '../types';

interface RemindersPanelProps {
  reminders: ReminderItem[];
  onOpenFeedback: (roundId?: string) => void;
}

export const RemindersPanel: React.FC<RemindersPanelProps> = ({
  reminders,
  onOpenFeedback,
}) => {
  const getBadgeColor = (minutes: number) => {
    if (minutes <= 15 && minutes >= -30) {
      return { bg: '#ef4444', label: 'STARTS NOW / SOON' };
    }
    if (minutes <= 120 && minutes > 15) {
      return { bg: '#eab308', label: 'IN UNDER 2 HOURS' };
    }
    return { bg: '#38bdf8', label: 'UPCOMING' };
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
      <Paper sx={{ p: 3, mb: 3, bgcolor: '#1e293b', border: '1px solid #334155' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <NotificationsActiveIcon sx={{ color: '#38bdf8', fontSize: 28 }} />
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc' }}>
            Event-Driven Interview Reminders & Notifications
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
          Automated real-time notifications triggered before scheduled rounds. Direct links to join video calls and submit post-interview scorecards.
        </Typography>
      </Paper>

      {reminders.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', bgcolor: '#0f172a', border: '1px solid #334155' }}>
          <NotificationsActiveIcon sx={{ fontSize: 48, color: '#334155', mb: 1 }} />
          <Typography variant="h6" sx={{ color: '#94a3b8' }}>No upcoming reminders</Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>All scheduled interviews are up to date.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {reminders.map((rem, idx) => {
            const statusInfo = getBadgeColor(rem.minutes_remaining);
            const startFormatted = new Date(rem.scheduled_start).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

            return (
              <Grid item xs={12} md={6} key={rem.interview_id || idx}>
                <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Chip
                        label={statusInfo.label}
                        size="small"
                        sx={{ bgcolor: statusInfo.bg, color: '#fff', fontWeight: 'bold', fontSize: '0.7rem' }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#38bdf8' }}>
                        <AccessTimeIcon fontSize="small" />
                        <Typography variant="caption" fontWeight="bold">
                          {formatCountdown(rem.minutes_remaining)}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc', mb: 0.5 }}>
                      {rem.title}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#94a3b8', mb: 2 }}>
                      <PersonIcon fontSize="small" />
                      <Typography variant="body2">
                        Role: <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>{rem.role}</span> | {startFormatted}
                      </Typography>
                    </Box>

                    <Divider sx={{ borderColor: '#334155', mb: 2 }} />

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {rem.meeting_link && (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<VideoCallIcon />}
                          href={rem.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', '&:hover': { bgcolor: '#0284c7' } }}
                        >
                          Join Meeting
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<RateReviewIcon />}
                        onClick={() => onOpenFeedback(rem.round_id)}
                        sx={{ color: '#38bdf8', borderColor: '#38bdf8', fontWeight: 'bold' }}
                      >
                        Submit Scorecard
                      </Button>
                    </Box>
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
