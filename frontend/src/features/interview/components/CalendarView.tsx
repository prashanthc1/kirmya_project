'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  ButtonGroup,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Tooltip,
  Stack,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import GroupIcon from '@mui/icons-material/Group';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Interview } from '../types';
import { tokens } from '../../../theme/tokens';

interface CalendarViewProps {
  interviews: Interview[];
  onSelectInterview?: (interview: Interview) => void;
  onOpenFeedback?: (roundId: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  interviews = [],
  onSelectInterview,
  onOpenFeedback,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'primary';
      case 'in_progress':
        return 'warning';
      case 'completed':
        return 'success';
      case 'feedback_pending':
        return 'secondary';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getInterviewsForDay = (day: number) => {
    return interviews.filter((item) => {
      const d = new Date(item.scheduled_start);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const dayCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    dayCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    dayCells.push(d);
  }

  const isToday = (d: number | null) => {
    if (!d) return false;
    const now = new Date();
    return now.getFullYear() === year && now.getMonth() === month && now.getDate() === d;
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Calendar Header Controls */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: `${tokens.radius.lg}px`,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {monthNames[month]} {year}
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ ml: 2 }}>
            <IconButton onClick={handlePrev} size="small">
              <ChevronLeftIcon />
            </IconButton>
            <Button size="small" onClick={handleToday} startIcon={<TodayIcon />} sx={{ fontWeight: 700 }}>
              Today
            </Button>
            <IconButton onClick={handleNext} size="small">
              <ChevronRightIcon />
            </IconButton>
          </Stack>
        </Stack>

        <ButtonGroup size="small" variant="outlined">
          <Button
            onClick={() => setViewMode('month')}
            variant={viewMode === 'month' ? 'contained' : 'outlined'}
            sx={{ fontWeight: 700 }}
          >
            Month
          </Button>
          <Button
            onClick={() => setViewMode('week')}
            variant={viewMode === 'week' ? 'contained' : 'outlined'}
            sx={{ fontWeight: 700 }}
          >
            Week
          </Button>
        </ButtonGroup>
      </Paper>

      {/* Calendar Grid View */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: `${tokens.radius.lg}px`,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Days of Week Header */}
        <Grid container spacing={1} sx={{ mb: 1, textAlign: 'center' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dw) => (
            <Grid item xs={12 / 7} key={dw}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
                {dw}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* Day Cells */}
        <Grid container spacing={1}>
          {dayCells.map((day, idx) => {
            const dayInterviews = day ? getInterviewsForDay(day) : [];
            const today = isToday(day);

            return (
              <Grid item xs={12 / 7} key={idx}>
                <Paper
                  variant="outlined"
                  sx={{
                    minHeight: 96,
                    p: 1,
                    borderRadius: `${tokens.radius.md}px`,
                    bgcolor: today
                      ? (theme) => (theme.palette.mode === 'dark' ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.05)')
                      : day === null
                      ? 'action.hover'
                      : 'background.paper',
                    borderColor: today ? 'primary.main' : 'divider',
                    opacity: day === null ? 0.3 : 1,
                  }}
                >
                  {day && (
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: today ? 900 : 700,
                        color: today ? 'primary.main' : 'text.primary',
                        display: 'block',
                        mb: 0.5,
                      }}
                    >
                      {day}
                    </Typography>
                  )}

                  <Stack spacing={0.5}>
                    {dayInterviews.map((iv) => (
                      <Chip
                        key={iv.id}
                        label={iv.title}
                        size="small"
                        color={getStatusColor(iv.status) as any}
                        onClick={() => setSelectedInterview(iv)}
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          '& .MuiChip-label': { px: 0.5 },
                        }}
                      />
                    ))}
                  </Stack>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Selected Interview Details Dialog */}
      <Dialog
        open={Boolean(selectedInterview)}
        onClose={() => setSelectedInterview(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedInterview && (
          <>
            <DialogTitle sx={{ fontWeight: 800 }}>
              {selectedInterview.title}
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <AccessTimeIcon color="action" fontSize="small" />
                  <Typography variant="body2">
                    {new Date(selectedInterview.scheduled_start).toLocaleString()} –{' '}
                    {new Date(selectedInterview.scheduled_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Stack>

                {selectedInterview.candidate_name && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <GroupIcon color="action" fontSize="small" />
                    <Typography variant="body2">
                      Candidate: <strong>{selectedInterview.candidate_name}</strong>
                    </Typography>
                  </Stack>
                )}

                {selectedInterview.notes && (
                  <Typography variant="body2" color="text.secondary">
                    {selectedInterview.notes}
                  </Typography>
                )}

                {selectedInterview.meeting_link && (
                  <Button
                    component="a"
                    href={selectedInterview.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="contained"
                    startIcon={<VideoCallIcon />}
                    sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700, textTransform: 'none' }}
                  >
                    Join Video Call
                  </Button>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedInterview(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default CalendarView;
