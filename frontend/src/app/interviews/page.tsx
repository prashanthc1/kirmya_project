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

export default function InterviewsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [availabilityList, setAvailabilityList] = useState<CandidateAvailability[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');

  const candidateId = '11111111-1111-1111-1111-111111111111';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resInterviews, resAvail, resReminders] = await Promise.allSettled([
        interviewApi.listInterviews(),
        interviewApi.getCandidateAvailability(candidateId),
        interviewApi.getReminders(),
      ]);

      if (resInterviews.status === 'fulfilled') {
        setInterviews(resInterviews.value?.data || mockInitialInterviews);
      } else {
        setInterviews(mockInitialInterviews);
      }

      if (resAvail.status === 'fulfilled') {
        setAvailabilityList(resAvail.value?.data || mockInitialAvailability);
      } else {
        setAvailabilityList(mockInitialAvailability);
      }

      if (resReminders.status === 'fulfilled') {
        setReminders(resReminders.value?.reminders || mockInitialReminders);
      } else {
        setReminders(mockInitialReminders);
      }
    } catch (err) {
      console.error('Error fetching interview data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScheduleInterview = async (payload: CreateInterviewPayload) => {
    await interviewApi.scheduleInterview(payload);
    await fetchData();
  };

  const handleSubmitFeedback = async (roundId: string, payload: SubmitFeedbackPayload) => {
    await interviewApi.submitFeedback(roundId, payload);
    await fetchData();
  };

  const handleSaveAvailability = async (payload: SetAvailabilityPayload) => {
    await interviewApi.setAvailability(payload);
    await fetchData();
  };

  const handleOpenFeedbackForRound = (roundId?: string) => {
    setSelectedRoundId(roundId || 'round-1-default');
    setFeedbackModalOpen(true);
  };

  // Mock initial data fallbacks for instant rich presentation
  const mockInitialInterviews: Interview[] = [
    {
      id: 'inv-101',
      candidate_id: candidateId,
      candidate_name: 'Alex Rivera',
      candidate_email: 'alex.rivera@example.com',
      title: 'Senior Full Stack Engineer Technical Round',
      status: 'scheduled',
      scheduled_start: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      scheduled_end: new Date(Date.now() + 25 * 3600 * 1000).toISOString(),
      location_type: 'virtual',
      meeting_link: 'https://meet.google.com/abc-defg-hij',
      organizer_id: '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      rounds: [
        {
          id: 'round-101-1',
          interview_id: 'inv-101',
          round_number: 1,
          round_name: 'Round 1: Coding & Algorithms',
          round_type: 'technical',
          status: 'scheduled',
          scheduled_start: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          scheduled_end: new Date(Date.now() + 24.75 * 3600 * 1000).toISOString(),
          instructions: 'Data structures & algorithm challenge',
          created_at: new Date().toISOString(),
        },
        {
          id: 'round-101-2',
          interview_id: 'inv-101',
          round_number: 2,
          round_name: 'Round 2: System Architecture',
          round_type: 'system_design',
          status: 'scheduled',
          scheduled_start: new Date(Date.now() + 25 * 3600 * 1000).toISOString(),
          scheduled_end: new Date(Date.now() + 25.75 * 3600 * 1000).toISOString(),
          instructions: 'Distributed system design and DB indexing',
          created_at: new Date().toISOString(),
        },
      ],
      participants: [
        {
          id: 'p-1',
          interview_id: 'inv-101',
          user_id: candidateId,
          user_name: 'Alex Rivera',
          user_email: 'alex.rivera@example.com',
          role: 'candidate',
          rsvp_status: 'accepted',
          created_at: new Date().toISOString(),
        },
        {
          id: 'p-2',
          interview_id: 'inv-101',
          user_id: 'interviewer-1',
          user_name: 'Sarah Chen (Tech Lead)',
          user_email: 'sarah.chen@company.com',
          role: 'lead_interviewer',
          rsvp_status: 'accepted',
          created_at: new Date().toISOString(),
        },
      ],
    },
    {
      id: 'inv-102',
      candidate_id: 'cand-202',
      candidate_name: 'Elena Rostova',
      candidate_email: 'elena.r@example.com',
      title: 'Staff Backend Architect Interview',
      status: 'feedback_pending',
      scheduled_start: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      scheduled_end: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      location_type: 'virtual',
      meeting_link: 'https://meet.google.com/xyz-uvwx-rst',
      organizer_id: '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      rounds: [
        {
          id: 'round-102-1',
          interview_id: 'inv-102',
          round_number: 1,
          round_name: 'System Design Deep Dive',
          round_type: 'system_design',
          status: 'completed',
          scheduled_start: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          scheduled_end: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
          instructions: 'Microservices architecture review',
          created_at: new Date().toISOString(),
        },
      ],
      participants: [
        {
          id: 'p-3',
          interview_id: 'inv-102',
          user_id: 'cand-202',
          user_name: 'Elena Rostova',
          user_email: 'elena.r@example.com',
          role: 'candidate',
          rsvp_status: 'accepted',
          created_at: new Date().toISOString(),
        },
      ],
    },
  ];

  const mockInitialAvailability: CandidateAvailability[] = [
    {
      id: 'avail-1',
      candidate_id: candidateId,
      start_time: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
      end_time: new Date(Date.now() + 2.15 * 24 * 3600 * 1000).toISOString(),
      status: 'available',
      notes: 'Available for technical interviews in afternoon slot',
      created_at: new Date().toISOString(),
    },
    {
      id: 'avail-2',
      candidate_id: candidateId,
      start_time: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
      end_time: new Date(Date.now() + 3.2 * 24 * 3600 * 1000).toISOString(),
      status: 'available',
      notes: 'Morning slot open for panel discussion',
      created_at: new Date().toISOString(),
    },
  ];

  const mockInitialReminders: ReminderItem[] = [
    {
      interview_id: 'inv-101',
      round_id: 'round-101-1',
      title: 'Senior Full Stack Engineer Technical Round',
      round_name: 'Round 1: Coding & Algorithms',
      candidate_id: candidateId,
      scheduled_start: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      scheduled_end: new Date(Date.now() + 25 * 3600 * 1000).toISOString(),
      meeting_link: 'https://meet.google.com/abc-defg-hij',
      minutes_remaining: 1440,
      role: 'lead_interviewer',
    },
  ];

  return (
    <Box sx={{ bgcolor: '#090d16', minHeight: '100vh', color: '#f8fafc', py: 4 }}>
      <Container maxWidth="xl">
        {/* Top Header & Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#f8fafc', background: 'linear-gradient(90deg, #38bdf8 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Interview Management System
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Schedule multi-round interviews, track panel feedback, manage candidate availability, and view interactive calendar.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              onClick={() => setActiveTab(2)}
              startIcon={<EventAvailableIcon />}
              sx={{ color: '#38bdf8', borderColor: '#38bdf8', fontWeight: 'bold' }}
            >
              Candidate Availability
            </Button>
            <Button
              variant="contained"
              onClick={() => setScheduleModalOpen(true)}
              startIcon={<AddIcon />}
              sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', '&:hover': { bgcolor: '#0284c7' } }}
            >
              Schedule Interview
            </Button>
          </Box>
        </Box>

        {/* KPI Metric Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>Total Scheduled</Typography>
                  <EventIcon sx={{ color: '#38bdf8' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#f8fafc', mt: 1 }}>
                  {interviews.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>Feedback Pending</Typography>
                  <RateReviewIcon sx={{ color: '#f97316' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#f97316', mt: 1 }}>
                  {interviews.filter((i) => i.status === 'feedback_pending' || i.status === 'scheduled').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>Availability Windows</Typography>
                  <EventAvailableIcon sx={{ color: '#22c55e' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#22c55e', mt: 1 }}>
                  {availabilityList.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>Active Reminders</Typography>
                  <NotificationsActiveIcon sx={{ color: '#a855f7' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#a855f7', mt: 1 }}>
                  {reminders.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tab Navigation */}
        <Paper sx={{ mb: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 1.5 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            textColor="inherit"
            indicatorColor="primary"
            sx={{
              '& .MuiTabs-indicator': { bgcolor: '#38bdf8' },
              '& .MuiTab-root': { color: '#94a3b8', fontWeight: 'bold', textTransform: 'none' },
              '& .Mui-selected': { color: '#38bdf8' },
            }}
          >
            <Tab icon={<CalendarMonthIcon fontSize="small" />} iconPosition="start" label="Calendar View" />
            <Tab icon={<EventIcon fontSize="small" />} iconPosition="start" label="Scheduled Interviews List" />
            <Tab icon={<EventAvailableIcon fontSize="small" />} iconPosition="start" label="Candidate Availability" />
            <Tab icon={<NotificationsActiveIcon fontSize="small" />} iconPosition="start" label="Reminders & Alerts" />
          </Tabs>
        </Paper>

        {/* Tab 0: Calendar View */}
        {activeTab === 0 && (
          <CalendarView
            interviews={interviews}
            onSelectInterview={(item) => console.log('Selected interview:', item)}
            onOpenFeedback={handleOpenFeedbackForRound}
          />
        )}

        {/* Tab 1: Scheduled Interviews List */}
        {activeTab === 1 && (
          <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #334155' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ borderBottom: '2px solid #334155' }}>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Interview Title</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Candidate</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Scheduled Time</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Rounds</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {interviews.map((item) => (
                    <TableRow key={item.id} sx={{ borderBottom: '1px solid #1e293b', '&:hover': { bgcolor: '#1e293b55' } }}>
                      <TableCell sx={{ color: '#f8fafc', fontWeight: 'bold' }}>
                        {item.title}
                        {item.meeting_link && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <VideoCallIcon sx={{ color: '#38bdf8', fontSize: 16 }} />
                            <a href={item.meeting_link} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', fontSize: '0.75rem' }}>
                              Join Video Call
                            </a>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell sx={{ color: '#cbd5e1' }}>
                        {item.candidate_name || 'Alex Rivera'}
                      </TableCell>
                      <TableCell sx={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                        {new Date(item.scheduled_start).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.status.replace('_', ' ').toUpperCase()}
                          size="small"
                          sx={{
                            bgcolor: item.status === 'scheduled' ? '#0284c7' : '#f97316',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '0.7rem',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#cbd5e1' }}>
                        <Chip label={`${item.rounds?.length || 1} Round(s)`} size="small" sx={{ bgcolor: '#1e293b', color: '#38bdf8', border: '1px solid #334155' }} />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<RateReviewIcon />}
                          onClick={() => handleOpenFeedbackForRound(item.rounds?.[0]?.id)}
                          sx={{ color: '#38bdf8', borderColor: '#38bdf8', textTransform: 'none', fontWeight: 'bold' }}
                        >
                          Submit Scorecard
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Tab 2: Candidate Availability Manager */}
        {activeTab === 2 && (
          <AvailabilityManager
            candidateId={candidateId}
            availabilityList={availabilityList}
            onSaveAvailability={handleSaveAvailability}
            onScheduleForSlot={() => setScheduleModalOpen(true)}
          />
        )}

        {/* Tab 3: Reminders Panel */}
        {activeTab === 3 && (
          <RemindersPanel
            reminders={reminders}
            onOpenFeedback={handleOpenFeedbackForRound}
          />
        )}

        {/* Schedule Modal */}
        <ScheduleModal
          open={scheduleModalOpen}
          onClose={() => setScheduleModalOpen(false)}
          onSchedule={handleScheduleInterview}
        />

        {/* Feedback Modal */}
        <FeedbackFormModal
          open={feedbackModalOpen}
          roundId={selectedRoundId}
          onClose={() => setFeedbackModalOpen(false)}
          onSubmitFeedback={handleSubmitFeedback}
        />
      </Container>
    </Box>
  );
}
