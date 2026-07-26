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
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import GroupIcon from '@mui/icons-material/Group';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Interview } from '../types';

interface CalendarViewProps {
  interviews: Interview[];
  onSelectInterview: (interview: Interview) => void;
  onOpenFeedback: (roundId: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  interviews,
  onSelectInterview,
  onOpenFeedback,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return { bg: '#0284c7', color: '#fff' };
      case 'in_progress':
        return { bg: '#eab308', color: '#000' };
      case 'completed':
        return { bg: '#22c55e', color: '#fff' };
      case 'feedback_pending':
        return { bg: '#f97316', color: '#fff' };
      case 'cancelled':
        return { bg: '#ef4444', color: '#fff' };
      default:
        return { bg: '#64748b', color: '#fff' };
    }
  };

  // Helper for generating days of current month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
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

  // Helper to filter interviews for a specific day
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

  return (
    <Box sx={{ width: '100%' }}>
      {/* Calendar Header Controls */}
      <Paper sx={{ p: 2, mb: 2, bgcolor: '#1e293b', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ color: '#f8fafc' }}>
            {monthNames[month]} {year}
          </Typography>
          <Box sx={{ display: 'flex', ml: 2 }}>
            <IconButton onClick={handlePrev} sx={{ color: '#94a3b8' }}>
              <ChevronLeftIcon />
            </IconButton>
            <Button size="small" onClick={handleToday} startIcon={<TodayIcon />} sx={{ color: '#38bdf8' }}>
              Today
            </Button>
            <IconButton onClick={handleNext} sx={{ color: '#94a3b8' }}>
              <ChevronRightIcon />
            </IconButton>
          </Box>
        </Box>

        <ButtonGroup size="small" variant="outlined">
          <Button
            onClick={() => setViewMode('month')}
            sx={{ bgcolor: viewMode === 'month' ? '#38bdf8' : 'transparent', color: viewMode === 'month' ? '#0f172a' : '#94a3b8', borderColor: '#334155' }}
          >
            Month
          </Button>
          <Button
            onClick={() => setViewMode('week')}
            sx={{ bgcolor: viewMode === 'week' ? '#38bdf8' : 'transparent', color: viewMode === 'week' ? '#0f172a' : '#94a3b8', borderColor: '#334155' }}
          >
            Week
          </Button>
          <Button
            onClick={() => setViewMode('day')}
            sx={{ bgcolor: viewMode === 'day' ? '#38bdf8' : 'transparent', color: viewMode === 'day' ? '#0f172a' : '#94a3b8', borderColor: '#334155' }}
          >
            Day
          </Button>
        </ButtonGroup>
      </Paper>

      {/* Month View Grid */}
      <Paper sx={{ p: 2, bgcolor: '#0f172a', border: '1px solid #334155' }}>
        <Grid container spacing={1} sx={{ mb: 1 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Grid item xs={12 / 7} key={day} sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#94a3b8' }}>
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={1}>
          {dayCells.map((day, index) => {
            if (day === null) {
              return (
                <Grid item xs={12 / 7} key={`empty-${index}`}>
                  <Box sx={{ minHeight: 110, bgcolor: '#1e293b22', borderRadius: 1, border: '1px solid #1e293b' }} />
                </Grid>
              );
            }

            const dayInterviews = getInterviewsForDay(day);
            const isToday =
              new Date().getDate() === day &&
              new Date().getMonth() === month &&
              new Date().getFullYear() === year;

            return (
              <Grid item xs={12 / 7} key={day}>
                <Box
                  sx={{
                    minHeight: 110,
                    bgcolor: isToday ? '#1e293b' : '#0f172a',
                    borderRadius: 1,
                    p: 1,
                    border: isToday ? '2px solid #38bdf8' : '1px solid #1e293b',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: '#1e293b' },
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight={isToday ? 'bold' : 'normal'}
                    sx={{ color: isToday ? '#38bdf8' : '#64748b', display: 'block', mb: 0.5 }}
                  >
                    {day}
                  </Typography>

                  {dayInterviews.map((item) => {
                    const statusStyle = getStatusColor(item.status);
                    const timeStr = new Date(item.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <Tooltip key={item.id} title={`${item.title} (${timeStr})`}>
                        <Box
                          onClick={() => {
                            setSelectedInterview(item);
                            onSelectInterview(item);
                          }}
                          sx={{
                            mb: 0.5,
                            p: 0.5,
                            borderRadius: 0.8,
                            bgcolor: statusStyle.bg,
                            color: statusStyle.color,
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            '&:hover': { opacity: 0.9, transform: 'scale(1.02)' },
                          }}
                        >
                          {timeStr} - {item.title}
                        </Box>
                      </Tooltip>
                    );
                  })}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Selected Interview Detail Dialog */}
      {selectedInterview && (
        <Dialog open={Boolean(selectedInterview)} onClose={() => setSelectedInterview(null)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ bgcolor: '#1e293b', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">{selectedInterview.title}</Typography>
            <Chip
              label={selectedInterview.status.replace('_', ' ').toUpperCase()}
              sx={{ bgcolor: getStatusColor(selectedInterview.status).bg, color: '#fff', fontWeight: 'bold' }}
            />
          </DialogTitle>
          <DialogContent dividers sx={{ bgcolor: '#0f172a', color: '#f8fafc', p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="#94a3b8">Scheduled Time</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <AccessTimeIcon sx={{ color: '#38bdf8', fontSize: 18 }} />
                  <Typography variant="body1" fontWeight="bold">
                    {new Date(selectedInterview.scheduled_start).toLocaleString()} - {new Date(selectedInterview.scheduled_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="#94a3b8">Meeting Link</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <VideoCallIcon sx={{ color: '#38bdf8', fontSize: 18 }} />
                  {selectedInterview.meeting_link ? (
                    <a href={selectedInterview.meeting_link} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>
                      Join Meeting Room
                    </a>
                  ) : (
                    <Typography variant="body2" color="#64748b">No link provided</Typography>
                  )}
                </Box>
              </Grid>

              {/* Rounds */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#38bdf8', mb: 1 }}>
                  Interview Rounds ({selectedInterview.rounds?.length || 0})
                </Typography>
                {selectedInterview.rounds?.map((round, idx) => (
                  <Paper key={round.id || idx} sx={{ p: 2, mb: 1, bgcolor: '#1e293b', border: '1px solid #334155' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#f8fafc' }}>
                        Round {round.round_number}: {round.round_name}
                      </Typography>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => {
                          setSelectedInterview(null);
                          onOpenFeedback(round.id);
                        }}
                        sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}
                      >
                        Submit / View Feedback
                      </Button>
                    </Box>
                    <Typography variant="body2" color="#94a3b8">{round.instructions || 'Standard evaluation round.'}</Typography>
                  </Paper>
                ))}
              </Grid>

              {/* Panel Members */}
              <Grid item xs={12} sx={{ mt: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#38bdf8', mb: 1 }}>
                  Panel Members ({selectedInterview.participants?.length || 0})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedInterview.participants?.map((p, idx) => (
                    <Chip
                      key={p.id || idx}
                      icon={<GroupIcon sx={{ color: '#38bdf8 !important' }} />}
                      label={`${p.user_name || 'Panelist'} (${p.role}) - ${p.rsvp_status.toUpperCase()}`}
                      sx={{ bgcolor: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' }}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ bgcolor: '#1e293b', p: 2 }}>
            <Button onClick={() => setSelectedInterview(null)} sx={{ color: '#94a3b8' }}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};
export default CalendarView;
