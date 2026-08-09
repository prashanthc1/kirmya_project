'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Container, Grid, Box, Typography, Button, Stack, Paper, Chip } from '@mui/material';
import { AutoAwesome, PlayArrow, Add, ArrowBack, Event } from '@mui/icons-material';
import { QuestionCard } from '@/components/interview-prep/QuestionCard';
import { QuestionGeneratorModal } from '@/components/interview-prep/QuestionGeneratorModal';
import { PrepTaskList } from '@/components/interview-prep/PrepTaskList';
import { AddTaskModal } from '@/components/interview-prep/AddTaskModal';
import { PostInterviewForm } from '@/components/interview-prep/PostInterviewForm';
import { ThankYouDraftModal } from '@/components/interview-prep/ThankYouDraftModal';
import { CompanyResearchCard } from '@/components/interview-prep/CompanyResearchCard';
import { InterviewPrepAPI } from '@/features/interview-prep/api';
import { InterviewPreparation, InterviewQuestion, PreparationTask, InterviewNote } from '@/features/interview-prep/types';
import Link from 'next/link';

export default function WorkspaceDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [prep, setPrep] = useState<InterviewPreparation | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [tasks, setTasks] = useState<PreparationTask[]>([]);
  const [note, setNote] = useState<InterviewNote | null>(null);
  const [genModalOpen, setGenModalOpen] = useState(false);
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const [thankYouModalOpen, setThankYouModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchWorkspace = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [pData, qList, tList] = await Promise.all([
        InterviewPrepAPI.getPreparation(id),
        InterviewPrepAPI.listQuestions(id),
        InterviewPrepAPI.listTasks(id),
      ]);
      setPrep(pData);
      setQuestions(qList);
      setTasks(tList);
      try {
        const n = await InterviewPrepAPI.getNote(id);
        setNote(n);
      } catch (err) {
        // ignore note 404
      }
    } catch (err) {
      console.error('Failed to load prep workspace', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspace();
  }, [id]);

  const handleGenerateQuestions = async (req: any) => {
    await InterviewPrepAPI.generateQuestions(req);
    await fetchWorkspace();
  };

  const handleUpdatePractice = async (qId: string, userAns: string, star: { s: string; t: string; a: string; r: string }) => {
    await InterviewPrepAPI.updateQuestionPractice(qId, {
      user_answer: userAns,
      star_situation: star.s,
      star_task: star.t,
      star_action: star.a,
      star_result: star.r,
      is_practiced: true,
    });
    await fetchWorkspace();
  };

  const handleAddTask = async (title: string, category: string) => {
    await InterviewPrepAPI.createTask({ preparation_id: id, title, category });
    await fetchWorkspace();
  };

  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    await InterviewPrepAPI.toggleTaskCompletion(taskId, isCompleted);
    await fetchWorkspace();
  };

  const handleDeleteTask = async (taskId: string) => {
    await InterviewPrepAPI.deleteTask(taskId);
    await fetchWorkspace();
  };

  const handleSaveNote = async (req: any) => {
    const saved = await InterviewPrepAPI.saveNote(req);
    setNote(saved);
  };

  if (!prep && !loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textCenter: 'center' }}>
        <Typography variant="h5" color="error">Preparation Workspace Not Found</Typography>
        <Button component={Link} href="/dashboard/interview-prep" sx={{ mt: 2, color: '#60A5FA' }}>Return to Dashboard</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Top Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 4,
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          color: '#fff',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Button component={Link} href="/dashboard/interview-prep" startIcon={<ArrowBack />} sx={{ color: '#94A3B8', textTransform: 'none' }}>
            Back to All Preparations
          </Button>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} justifyContent="space-between" alignItems={{ md: 'center' }}>
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
              <Typography variant="h4" fontWeight={700} sx={{ color: '#F8FAFC' }}>
                {prep?.company_name} - {prep?.job_title}
              </Typography>
              <Chip label={prep?.status} color="success" size="small" />
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} mt={1}>
              <Chip label={prep?.interview_type} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: '#CBD5E1' }} />
              <Chip label={prep?.interview_round} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: '#CBD5E1' }} />
              <Chip label={prep?.experience_level} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: '#CBD5E1' }} />
            </Stack>
          </Box>

          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<AutoAwesome />}
              onClick={() => setGenModalOpen(true)}
              sx={{ borderColor: 'rgba(96, 165, 250, 0.4)', color: '#60A5FA', borderRadius: 2.5, textTransform: 'none', fontWeight: 600 }}
            >
              Generate AI Questions
            </Button>

            <Button
              component={Link}
              href={`/dashboard/interview-prep/mock?prep_id=${id}`}
              variant="contained"
              startIcon={<PlayArrow />}
              sx={{
                background: 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)',
                color: '#fff',
                fontWeight: 600,
                borderRadius: 2.5,
                textTransform: 'none',
                px: 3,
              }}
            >
              Start AI Mock Session
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={4}>
        {/* Left Column: Targeted Question Library & Post-Interview Debrief */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={4}>
            {/* Question Library */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h5" fontWeight={700} sx={{ color: '#F8FAFC' }}>
                  Preparation Question Library ({questions.length})
                </Typography>
                <Button size="small" startIcon={<Add />} onClick={() => setGenModalOpen(true)} sx={{ color: '#60A5FA', textTransform: 'none' }}>
                  Generate More
                </Button>
              </Stack>

              <Stack spacing={2}>
                {questions.map((q) => (
                  <QuestionCard key={q.id} question={q} onUpdatePractice={handleUpdatePractice} />
                ))}

                {questions.length === 0 && !loading && (
                  <Typography variant="body2" sx={{ color: '#64748B', textAlign: 'center', py: 3 }}>
                    No target questions generated yet. Click &apos;Generate AI Questions&apos; above.
                  </Typography>
                )}
              </Stack>
            </Box>

            {/* Post-Interview Debrief Form */}
            <PostInterviewForm
              preparationId={id}
              onSaveNote={handleSaveNote}
              onOpenThankYou={() => setThankYouModalOpen(true)}
            />
          </Stack>
        </Grid>

        {/* Right Column: Tasks Checklist & Company Insights */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={4}>
            <PrepTaskList
              tasks={tasks}
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
              onOpenAddTask={() => setAddTaskModalOpen(true)}
            />

            <CompanyResearchCard companyName={prep?.company_name || 'Target Company'} />
          </Stack>
        </Grid>
      </Grid>

      {/* Modals */}
      <QuestionGeneratorModal
        open={genModalOpen}
        onClose={() => setGenModalOpen(false)}
        preparationId={id}
        defaultCompany={prep?.company_name}
        defaultJobTitle={prep?.job_title}
        onGenerate={handleGenerateQuestions}
      />

      <AddTaskModal
        open={addTaskModalOpen}
        onClose={() => setAddTaskModalOpen(false)}
        onAdd={handleAddTask}
      />

      <ThankYouDraftModal
        open={thankYouModalOpen}
        onClose={() => setThankYouModalOpen(false)}
        thankYouDraft={note?.thank_you_draft || ''}
      />
    </Container>
  );
}
