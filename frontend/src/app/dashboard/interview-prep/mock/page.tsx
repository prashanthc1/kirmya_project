'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Container, Paper, Box, Typography, Button, Stack, TextField, CircularProgress, Chip } from '@mui/material';
import { AutoAwesome, Send, ArrowBack, PlayArrow, CheckCircle, Mic } from '@mui/icons-material';
import { SpeechToTextButton } from '@/components/interview-prep/SpeechToTextButton';
import { AudioVisualizer } from '@/components/interview-prep/AudioVisualizer';
import { MockFeedbackReport } from '@/components/interview-prep/MockFeedbackReport';
import { InterviewPrepAPI } from '@/features/interview-prep/api';
import { MockInterviewSession, MockInterviewAnswer } from '@/features/interview-prep/types';
import Link from 'next/link';

function MockInterviewRoomContent() {
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams?.get('session_id');
  const prepIdParam = searchParams?.get('prep_id');

  const [session, setSession] = useState<MockInterviewSession | null>(null);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [audioTranscript, setAudioTranscript] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [latestFeedback, setLatestFeedback] = useState<MockInterviewAnswer | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  const mockQuestions = [
    "Tell me about a time you solved a complex technical problem under intense pressure.",
    "Describe a situation where you had a major disagreement with a lead or teammate. How did you resolve it?",
    "How do you ensure zero-downtime microservices deployments while maintaining code quality?",
    "Give an example of how you mentor team members and foster a collaborative environment.",
    "Why are you interested in this position, and how does your experience align with our team goals?",
  ];

  useEffect(() => {
    async function initSession() {
      setLoading(true);
      try {
        if (sessionIdParam) {
          const existing = await InterviewPrepAPI.getMockSession(sessionIdParam);
          setSession(existing);
          if (existing.status.toLowerCase() === 'completed') {
            setSessionComplete(true);
          }
        } else {
          const newS = await InterviewPrepAPI.startMockSession({
            preparation_id: prepIdParam || undefined,
            title: 'AI Practice Mock Session',
            interview_type: 'Behavioral',
            difficulty: 'Intermediate',
            total_questions: 3,
          });
          setSession(newS);
        }
      } catch (err) {
        console.error('Failed to initialize mock session', err);
      } finally {
        setLoading(false);
      }
    }
    initSession();
  }, [sessionIdParam, prepIdParam]);

  const handleSubmitAnswer = async () => {
    if (!session || submitting) return;
    const finalAns = candidateAnswer || audioTranscript;
    if (!finalAns.trim()) return;

    setSubmitting(true);
    try {
      const qText = mockQuestions[currentPromptIndex % mockQuestions.length];
      const evaluated = await InterviewPrepAPI.submitMockAnswer(session.id, {
        question_text: qText,
        candidate_answer: finalAns,
        audio_transcript: audioTranscript,
      });

      setLatestFeedback(evaluated);
      setCandidateAnswer('');
      setAudioTranscript('');

      if (currentPromptIndex + 1 >= (session.total_questions || 3)) {
        const completedS = await InterviewPrepAPI.completeMockSession(session.id);
        setSession(completedS);
        setSessionComplete(true);
      } else {
        setCurrentPromptIndex((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Failed to submit answer', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress sx={{ color: '#3B82F6' }} />
        <Typography variant="body1" sx={{ color: '#94A3B8', mt: 2 }}>
          Initializing AI Mock Interview Room...
        </Typography>
      </Container>
    );
  }

  const currentQuestionText = mockQuestions[currentPromptIndex % mockQuestions.length];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        component={Link}
        href="/dashboard/interview-prep"
        startIcon={<ArrowBack />}
        sx={{ color: '#94A3B8', textTransform: 'none', mb: 3 }}
      >
        Exit Mock Room
      </Button>

      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 4,
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          color: '#fff',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <AutoAwesome sx={{ color: '#60A5FA' }} />
            <Typography variant="h5" fontWeight={700}>
              Interactive AI Mock Interview Session
            </Typography>
          </Stack>

          <Chip
            label={`Question ${Math.min(currentPromptIndex + 1, session?.total_questions || 3)} of ${session?.total_questions || 3}`}
            sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', fontWeight: 700 }}
          />
        </Stack>

        {!sessionComplete ? (
          <Stack spacing={3}>
            {/* Active AI Prompt Card */}
            <Box sx={{ p: 3, borderRadius: 3, bgcolor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Typography variant="caption" fontWeight={700} sx={{ color: '#60A5FA', display: 'block', mb: 1 }}>
                AI INTERVIEWER QUESTION PROMPT
              </Typography>
              <Typography variant="h6" fontWeight={600} sx={{ color: '#F8FAFC' }}>
                "{currentQuestionText}"
              </Typography>
            </Box>

            {/* Answer Input Controls */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#CBD5E1' }}>
                  Your Response (Speech or Type)
                </Typography>
                <SpeechToTextButton
                  onTranscript={(txt) => setAudioTranscript((prev) => prev ? `${prev} ${txt}` : txt)}
                  disabled={submitting}
                />
              </Stack>

              {audioTranscript && <AudioVisualizer />}

              <TextField
                multiline
                rows={5}
                fullWidth
                placeholder="Type your response here or speak using the mic button above..."
                value={candidateAnswer || audioTranscript}
                onChange={(e) => {
                  setCandidateAnswer(e.target.value);
                  setAudioTranscript('');
                }}
                disabled={submitting}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    bgcolor: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: 3,
                  },
                }}
              />
            </Box>

            <Button
              variant="contained"
              onClick={handleSubmitAnswer}
              disabled={submitting || (!candidateAnswer.trim() && !audioTranscript.trim())}
              startIcon={<Send />}
              sx={{
                py: 1.5,
                background: 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)',
                color: '#fff',
                fontWeight: 700,
                borderRadius: 2.5,
                fontSize: '1rem',
                textTransform: 'none',
              }}
            >
              {submitting ? 'Evaluating Response...' : 'Submit Response & Get Feedback'}
            </Button>
          </Stack>
        ) : (
          <Box textAlign="center" py={4}>
            <CheckCircle sx={{ fontSize: '4rem', color: '#34D399', mb: 2 }} />
            <Typography variant="h4" fontWeight={700} sx={{ color: '#F8FAFC', mb: 1 }}>
              Mock Session Completed!
            </Typography>
            <Typography variant="body1" sx={{ color: '#94A3B8', mb: 3 }}>
              Great job! Your response metrics have been computed and added to your readiness index.
            </Typography>

            <Button
              component={Link}
              href="/dashboard/interview-prep"
              variant="contained"
              sx={{ background: '#3B82F6', color: '#fff', borderRadius: 2.5, px: 4 }}
            >
              Return to Preparation Dashboard
            </Button>
          </Box>
        )}
      </Paper>

      {/* Latest Evaluation Feedback Report */}
      {latestFeedback && (
        <Box mt={4}>
          <MockFeedbackReport answer={latestFeedback} />
        </Box>
      )}
    </Container>
  );
}

export default function MockInterviewRoomPage() {
  return (
    <Suspense
      fallback={
        <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
          <CircularProgress sx={{ color: '#3B82F6' }} />
        </Container>
      }
    >
      <MockInterviewRoomContent />
    </Suspense>
  );
}
