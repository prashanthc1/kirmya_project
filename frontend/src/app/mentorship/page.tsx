'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  Paper,
  Stack,
  Chip,
  Avatar,
  Card,
  CardContent,
  Tab,
  Tabs,
  CircularProgress,
} from '@mui/material';
import ExploreIcon from '@mui/icons-material/Explore';
import SchoolIcon from '@mui/icons-material/School';
import EventIcon from '@mui/icons-material/Event';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TuneIcon from '@mui/icons-material/Tune';
import Link from 'next/link';
import { mentorshipApi } from '../../features/mentorship/api';
import { Mentorship, MentorshipRequest, MentorProfile } from '../../features/mentorship/types';
import MentorshipGoalsCard from '../../components/mentorship/MentorshipGoalsCard';
import MentorshipSessionsCard from '../../components/mentorship/MentorshipSessionsCard';
import MentorProfileEditor from '../../components/mentorship/MentorProfileEditor';

export default function MentorshipDashboardPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [mentorships, setMentorships] = useState<Mentorship[]>([]);
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [userMentorProfile, setUserMentorProfile] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [mList, rList, mentorProf] = await Promise.all([
          mentorshipApi.getMentorships(),
          mentorshipApi.getMentorshipRequests(),
          mentorshipApi.getMentorById('mentor-1'),
        ]);
        setMentorships(mList);
        setRequests(rList);
        setUserMentorProfile(mentorProf);
      } catch (err) {
        console.error('Failed to load mentorship dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeMentorship = mentorships[0];

  const handleUpdateGoal = async (goalId: string, updates: any) => {
    if (!activeMentorship) return;
    await mentorshipApi.updateGoal(activeMentorship.id, goalId, updates);
    const updated = await mentorshipApi.getMentorshipById(activeMentorship.id);
    setMentorships([updated, ...mentorships.slice(1)]);
  };

  const handleAddGoal = async (newGoal: any) => {
    if (!activeMentorship) return;
    await mentorshipApi.createGoal(activeMentorship.id, newGoal);
    const updated = await mentorshipApi.getMentorshipById(activeMentorship.id);
    setMentorships([updated, ...mentorships.slice(1)]);
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!activeMentorship) return;
    await mentorshipApi.deleteGoal(activeMentorship.id, goalId);
    const updated = await mentorshipApi.getMentorshipById(activeMentorship.id);
    setMentorships([updated, ...mentorships.slice(1)]);
  };

  const handleScheduleSession = async (sessionData: any) => {
    if (!activeMentorship) return;
    await mentorshipApi.scheduleSession(activeMentorship.id, sessionData);
    const updated = await mentorshipApi.getMentorshipById(activeMentorship.id);
    setMentorships([updated, ...mentorships.slice(1)]);
  };

  const handleUpdateSessionStatus = async (sessionId: string, status: any) => {
    if (!activeMentorship) return;
    await mentorshipApi.updateSession(activeMentorship.id, sessionId, { status });
    const updated = await mentorshipApi.getMentorshipById(activeMentorship.id);
    setMentorships([updated, ...mentorships.slice(1)]);
  };

  const handleSaveMentorProfile = async (updates: any) => {
    const updated = await mentorshipApi.updateMentorProfile(updates);
    setUserMentorProfile(updated);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Hero Header */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          mb: 4,
          borderRadius: '24px',
          background: (theme) =>
            theme.palette.mode === 'light'
              ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
          backdropFilter: 'blur(16px)',
          border: (theme) =>
            theme.palette.mode === 'light'
              ? '1px solid rgba(99, 102, 241, 0.2)'
              : '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Chip
              icon={<SchoolIcon sx={{ fontSize: 18 }} />}
              label="Career Guidance & Mentorship Hub"
              color="primary"
              variant="filled"
              sx={{ fontWeight: 700, mb: 1.5, px: 1 }}
            />
            <Typography variant="h3" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.02em' }}>
              Accelerate Your Professional Growth
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 650, mb: 3 }}>
              Connect 1-on-1 with industry veterans, set career milestones, schedule architecture reviews, and unlock personalized mentorship.
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button
                component={Link}
                href="/mentorship/mentors"
                variant="contained"
                size="large"
                startIcon={<ExploreIcon />}
                sx={{
                  borderRadius: '14px',
                  fontWeight: 700,
                  px: 3,
                  py: 1.25,
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.35)',
                }}
              >
                Find a Mentor
              </Button>
              {activeMentorship && (
                <Button
                  component={Link}
                  href={`/mentorship/${activeMentorship.id}`}
                  variant="outlined"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ borderRadius: '14px', fontWeight: 700, px: 3, py: 1.25 }}
                >
                  Enter Mentorship Workspace
                </Button>
              )}
            </Stack>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                p: 3,
                borderRadius: '20px',
                background: (theme) =>
                  theme.palette.mode === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                display: 'inline-block',
                textAlign: 'left',
                width: '100%',
                maxWidth: 320,
              }}
            >
              <Typography variant="subtitle2" color="text.secondary" fontWeight={700} gutterBottom>
                CURRENT ACTIVE MENTORSHIP
              </Typography>
              {activeMentorship ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                  <Avatar
                    src={activeMentorship.mentor_profile?.avatar}
                    sx={{ width: 48, height: 48 }}
                  />
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {activeMentorship.mentor_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {activeMentorship.goals.filter((g) => g.status === 'completed').length} /{' '}
                      {activeMentorship.goals.length} Goals Completed
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No active mentorship currently. Browse mentors to get started!
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            '& .MuiTab-root': {
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '1rem',
            },
          }}
        >
          <Tab icon={<SchoolIcon />} iconPosition="start" label="Mentorship Workspace" />
          <Tab icon={<EventIcon />} iconPosition="start" label="Requests & Invites" />
          <Tab icon={<TuneIcon />} iconPosition="start" label="Become a Mentor / Preferences" />
        </Tabs>
      </Box>

      {/* Tab 0: Workspace (Goals & Sessions) */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {activeMentorship ? (
            <>
              <Grid item xs={12} md={6}>
                <MentorshipGoalsCard
                  goals={activeMentorship.goals}
                  onAddGoal={handleAddGoal}
                  onUpdateGoal={handleUpdateGoal}
                  onDeleteGoal={handleDeleteGoal}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <MentorshipSessionsCard
                  sessions={activeMentorship.sessions}
                  onScheduleSession={handleScheduleSession}
                  onUpdateSessionStatus={handleUpdateSessionStatus}
                />
              </Grid>
            </>
          ) : (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '20px' }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  No Active Mentorship Found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Find an experienced mentor in your field to start setting goals and booking sessions.
                </Typography>
                <Button component={Link} href="/mentorship/mentors" variant="contained">
                  Browse Available Mentors
                </Button>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Tab 1: Requests */}
      {activeTab === 1 && (
        <Box sx={{ maxWidth: 800 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Pending & Past Mentorship Requests
          </Typography>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {requests.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No mentorship requests submitted yet.
              </Typography>
            ) : (
              requests.map((req) => (
                <Card key={req.id} sx={{ borderRadius: '16px', p: 1 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={req.mentor_avatar} />
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700}>
                            Request to {req.mentor_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Submitted on {new Date(req.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={req.status}
                        color={req.status === 'accepted' ? 'success' : req.status === 'pending' ? 'warning' : 'default'}
                        sx={{ textTransform: 'capitalize', fontWeight: 700 }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1, bgcolor: 'action.hover', p: 1.5, borderRadius: '8px' }}>
                      "{req.note}"
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                      {req.requested_topics.map((t) => (
                        <Chip key={t} label={t} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              ))
            )}
          </Stack>
        </Box>
      )}

      {/* Tab 2: Mentor Profile Editor */}
      {activeTab === 2 && (
        <Box sx={{ maxWidth: 900 }}>
          {userMentorProfile && (
            <MentorProfileEditor
              profile={userMentorProfile}
              onSave={handleSaveMentorProfile}
            />
          )}
        </Box>
      )}
    </Container>
  );
}
