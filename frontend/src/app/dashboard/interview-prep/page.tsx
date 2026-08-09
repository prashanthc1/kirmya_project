'use client';

import React, { useState, useEffect } from 'react';
import { Container, Grid, Box, Typography, Button, Stack, Paper } from '@mui/material';
import { PrepHeader } from '@/components/interview-prep/PrepHeader';
import { PrepWorkspaceCard } from '@/components/interview-prep/PrepWorkspaceCard';
import { CreatePrepModal } from '@/components/interview-prep/CreatePrepModal';
import { ReadinessScoreMeter } from '@/components/interview-prep/ReadinessScoreMeter';
import { MockSessionCard } from '@/components/interview-prep/MockSessionCard';
import { AICoachChatWindow } from '@/components/interview-prep/AICoachChatWindow';
import { InterviewDayModeModal } from '@/components/interview-prep/InterviewDayModeModal';
import { InterviewPrepAPI } from '@/features/interview-prep/api';
import { InterviewPreparation, MockInterviewSession, InterviewReadinessScore } from '@/features/interview-prep/types';

export default function InterviewPrepDashboardPage() {
  const [preps, setPreps] = useState<InterviewPreparation[]>([]);
  const [sessions, setSessions] = useState<MockInterviewSession[]>([]);
  const [readiness, setReadiness] = useState<InterviewReadinessScore | undefined>();
  const [createOpen, setCreateOpen] = useState(false);
  const [warmupOpen, setWarmupOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prepList, sessionList, score] = await Promise.all([
        InterviewPrepAPI.listPreparations(),
        InterviewPrepAPI.listMockSessions(),
        InterviewPrepAPI.getReadinessScore(),
      ]);
      setPreps(prepList);
      setSessions(sessionList);
      setReadiness(score);
    } catch (err) {
      console.error('Failed to load interview prep dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePrep = async (req: any) => {
    await InterviewPrepAPI.createPreparation(req);
    await fetchData();
  };

  const handleDeletePrep = async (id: string) => {
    await InterviewPrepAPI.deletePreparation(id);
    await fetchData();
  };

  const handleSendMessage = async (msg: string, topic?: string) => {
    await InterviewPrepAPI.chatAICoach({ message: msg, topic });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PrepHeader
        readinessScore={readiness?.overall_readiness}
        onOpenCreate={() => setCreateOpen(true)}
        onOpenWarmup={() => setWarmupOpen(true)}
      />

      <Grid container spacing={4}>
        {/* Main Left Column: Workspaces & Recent Practice */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={4}>
            {/* Active Preparation Workspaces */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                <Typography variant="h5" fontWeight={700} sx={{ color: '#F8FAFC' }}>
                  Target Preparation Workspaces
                </Typography>
                <Button
                  onClick={() => setCreateOpen(true)}
                  sx={{ color: '#60A5FA', fontWeight: 600, textTransform: 'none' }}
                >
                  + Add Workspace
                </Button>
              </Stack>

              <Grid container spacing={2.5}>
                {preps.map((prep) => (
                  <Grid item xs={12} sm={6} key={prep.id}>
                    <PrepWorkspaceCard prep={prep} onDelete={handleDeletePrep} />
                  </Grid>
                ))}

                {preps.length === 0 && !loading && (
                  <Grid item xs={12}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 4,
                        textAlign: 'center',
                        borderRadius: 4,
                        background: 'rgba(30, 41, 59, 0.5)',
                        border: '1px border-dashed rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <Typography variant="h6" fontWeight={600} sx={{ color: '#94A3B8', mb: 1 }}>
                        No Active Interview Preparation Workspaces
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748B', mb: 2.5 }}>
                        Create a job-specific workspace to generate AI interview questions, track preparation tasks, and boost your readiness score.
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={() => setCreateOpen(true)}
                        sx={{
                          background: 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)',
                          borderRadius: 2.5,
                        }}
                      >
                        Create Your First Workspace
                      </Button>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>

            {/* Recent AI Mock Sessions */}
            <Box>
              <Typography variant="h5" fontWeight={700} sx={{ color: '#F8FAFC', mb: 2.5 }}>
                Recent AI Mock Sessions
              </Typography>
              <Grid container spacing={2.5}>
                {sessions.slice(0, 2).map((s) => (
                  <Grid item xs={12} sm={6} key={s.id}>
                    <MockSessionCard session={s} />
                  </Grid>
                ))}
                {sessions.length === 0 && !loading && (
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ color: '#64748B' }}>
                      No mock sessions started yet. Click &apos;Start AI Mock Interview&apos; to practice.
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Stack>
        </Grid>

        {/* Right Sidebar: Readiness Index & AI Coach */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={4}>
            <ReadinessScoreMeter score={readiness} />
            <AICoachChatWindow onSendMessage={handleSendMessage} />
          </Stack>
        </Grid>
      </Grid>

      {/* Modals */}
      <CreatePrepModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={handleCreatePrep} />
      <InterviewDayModeModal open={warmupOpen} onClose={() => setWarmupOpen(false)} />
    </Container>
  );
}
