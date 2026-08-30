'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Skeleton,
  Stack,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import RateReviewIcon from '@mui/icons-material/RateReview';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import AddIcon from '@mui/icons-material/Add';
import GroupIcon from '@mui/icons-material/Group';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import AuthenticatedLayout from '../../components/shell/AuthenticatedLayout';
import { interviewApi } from '../../features/interview/api';
import {
  Interview,
  CandidateAvailability,
  ReminderItem,
  CreateInterviewPayload,
  SubmitFeedbackPayload,
  SetAvailabilityPayload,
} from '../../features/interview/types';
import ScheduleModal from '../../features/interview/components/ScheduleModal';
import CalendarView from '../../features/interview/components/CalendarView';
import AvailabilityManager from '../../features/interview/components/AvailabilityManager';
import FeedbackFormModal from '../../features/interview/components/FeedbackFormModal';
import RemindersPanel from '../../features/interview/components/RemindersPanel';
import { useAuthContext } from '../../context/AuthContext';
import { tokens } from '../../theme/tokens';

export const dynamic = 'force-dynamic';

export default function InterviewsPage() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState(0);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [availabilityList, setAvailabilityList] = useState<CandidateAvailability[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');

  const candidateId = user?.id || '11111111-1111-1111-1111-111111111111';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resInterviews, resAvail, resReminders] = await Promise.allSettled([
        interviewApi.listInterviews(),
        interviewApi.getCandidateAvailability(candidateId),
        interviewApi.getReminders(),
      ]);

      if (resInterviews.status === 'fulfilled') {
        setInterviews(resInterviews.value?.data || []);
      }

      if (resAvail.status === 'fulfilled') {
        setAvailabilityList(resAvail.value?.data || []);
      }

      if (resReminders.status === 'fulfilled') {
        setReminders(resReminders.value?.reminders || []);
      }
    } catch (err) {
      console.error('Error fetching interview data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const handleScheduleSubmit = async (payload: CreateInterviewPayload) => {
    await interviewApi.scheduleInterview(payload);
    await fetchData();
  };

  const handleFeedbackSubmit = async (roundId: string, payload: SubmitFeedbackPayload) => {
    await interviewApi.submitFeedback(roundId, payload);
    await fetchData();
  };

  const handleSaveAvailability = async (payload: SetAvailabilityPayload) => {
    await interviewApi.setAvailability(payload);
    await fetchData();
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Chip label="Scheduled" color="primary" size="small" sx={{ fontWeight: 800 }} />;
      case 'in_progress':
        return <Chip label="In Progress" color="warning" size="small" sx={{ fontWeight: 800 }} />;
      case 'completed':
        return <Chip label="Completed" color="success" size="small" sx={{ fontWeight: 800 }} />;
      case 'feedback_pending':
        return <Chip label="Feedback Pending" color="secondary" size="small" sx={{ fontWeight: 800 }} />;
      case 'cancelled':
        return <Chip label="Cancelled" color="error" size="small" sx={{ fontWeight: 800 }} />;
      default:
        return <Chip label={status} size="small" sx={{ fontWeight: 800 }} />;
    }
  };

  return (
    <AuthenticatedLayout>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        {/* Header Banner */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            mb: 3,
            borderRadius: `${tokens.radius.lg}px`,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={2}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 0.5 }}>
                Technical Interview & Scheduling Hub
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Coordinate candidate interviews, manage multi-round technical evaluations, and collect feedback.
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setScheduleModalOpen(true)}
              sx={{
                borderRadius: `${tokens.radius.sm}px`,
                fontWeight: 700,
                textTransform: 'none',
                px: 2.5,
              }}
            >
              Schedule New Interview
            </Button>
          </Stack>
        </Paper>

        {/* Navigation Tabs */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: `${tokens.radius.lg}px`,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            mb: 3,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 700,
                fontSize: '0.875rem',
                textTransform: 'none',
                minHeight: 48,
              },
            }}
          >
            <Tab icon={<EventIcon fontSize="small" />} iconPosition="start" label={`Interviews (${interviews.length})`} />
            <Tab icon={<CalendarMonthIcon fontSize="small" />} iconPosition="start" label="Calendar Schedule" />
            <Tab icon={<EventAvailableIcon fontSize="small" />} iconPosition="start" label={`Availability (${availabilityList.length})`} />
            <Tab icon={<NotificationsActiveIcon fontSize="small" />} iconPosition="start" label={`Alerts & Reminders (${reminders.length})`} />
          </Tabs>
        </Paper>

        {/* Tab 0: Interviews List */}
        {activeTab === 0 && (
          <Box>
            {loading ? (
              <Stack spacing={2}>
                <Skeleton variant="rounded" height={100} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
                <Skeleton variant="rounded" height={100} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
              </Stack>
            ) : interviews.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  p: 6,
                  textAlign: 'center',
                  borderRadius: `${tokens.radius.lg}px`,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <EventIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  No Interviews Scheduled
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2.5 }}>
                  You do not have any interviews scheduled. Click below to schedule a new technical interview.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setScheduleModalOpen(true)}
                  sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700, textTransform: 'none' }}
                >
                  Schedule Interview
                </Button>
              </Paper>
            ) : (
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                  borderRadius: `${tokens.radius.lg}px`,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Interview Title</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Candidate / Position</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Scheduled Time</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {interviews.map((iv) => (
                      <TableRow key={iv.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {iv.title}
                          </Typography>
                          {iv.location_type && (
                            <Typography variant="caption" color="text.secondary">
                              {iv.location_type}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {iv.candidate_name || 'Candidate'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {iv.job_title || 'Position'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {new Date(iv.scheduled_start).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </Typography>
                        </TableCell>
                        <TableCell>{getStatusChip(iv.status)}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            {iv.meeting_link && (
                              <Tooltip title="Join Video Meeting">
                                <IconButton
                                  component="a"
                                  href={iv.meeting_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  color="primary"
                                  size="small"
                                >
                                  <VideoCallIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Submit Scorecard">
                              <IconButton
                                color="secondary"
                                size="small"
                                onClick={() => {
                                  setSelectedRoundId(iv.id);
                                  setFeedbackModalOpen(true);
                                }}
                              >
                                <RateReviewIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* Tab 1: Calendar */}
        {activeTab === 1 && (
          <CalendarView
            interviews={interviews}
            onOpenFeedback={(roundId) => {
              setSelectedRoundId(roundId);
              setFeedbackModalOpen(true);
            }}
          />
        )}

        {/* Tab 2: Availability */}
        {activeTab === 2 && (
          <AvailabilityManager
            candidateId={candidateId}
            availabilityList={availabilityList}
            onSaveAvailability={handleSaveAvailability}
          />
        )}

        {/* Tab 3: Reminders */}
        {activeTab === 3 && (
          <RemindersPanel
            reminders={reminders}
            onOpenFeedback={(roundId) => {
              setSelectedRoundId(roundId || '');
              setFeedbackModalOpen(true);
            }}
          />
        )}

        {/* Modals */}
        <ScheduleModal
          open={scheduleModalOpen}
          onClose={() => setScheduleModalOpen(false)}
          onSchedule={handleScheduleSubmit}
        />

        <FeedbackFormModal
          open={feedbackModalOpen}
          roundId={selectedRoundId}
          onClose={() => setFeedbackModalOpen(false)}
          onSubmitFeedback={handleFeedbackSubmit}
        />
      </Container>
    </AuthenticatedLayout>
  );
}
