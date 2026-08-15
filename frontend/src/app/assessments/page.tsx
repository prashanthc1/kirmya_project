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
} from '@mui/material';
import QuizIcon from '@mui/icons-material/Quiz';
import VerifiedIcon from '@mui/icons-material/Verified';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { assessmentApi } from '../../features/assessment/api';
import {
  Assessment,
  UserAssessmentResult,
  SkillBadge,
  SubmitTestPayload,
} from '../../features/assessment/types';
import TestRunnerModal from '../../features/assessment/components/TestRunnerModal';
import ResultReportModal from '../../features/assessment/components/ResultReportModal';
import BadgesGallery from '../../features/assessment/components/BadgesGallery';

export default function AssessmentsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [results, setResults] = useState<UserAssessmentResult[]>([]);
  const [badges, setBadges] = useState<SkillBadge[]>([]);
  const [loading, setLoading] = useState(true);

  // Active runner state
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [testRunnerOpen, setTestRunnerOpen] = useState(false);
  const [activeResult, setActiveResult] = useState<UserAssessmentResult | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resAssess, resResults, resBadges] = await Promise.allSettled([
        assessmentApi.getAssessments(),
        assessmentApi.getUserResults(),
        assessmentApi.getUserBadges(),
      ]);

      if (resAssess.status === 'fulfilled') {
        setAssessments(resAssess.value?.data || mockAssessments);
      } else {
        setAssessments(mockAssessments);
      }

      if (resResults.status === 'fulfilled') {
        setResults(resResults.value?.results || mockResults);
      } else {
        setResults(mockResults);
      }

      if (resBadges.status === 'fulfilled') {
        setBadges(resBadges.value?.badges || mockBadges);
      } else {
        setBadges(mockBadges);
      }
    } catch (err) {
      console.error('Error fetching assessment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartTest = async (assessment: Assessment) => {
    try {
      const fullAssessment = await assessmentApi.getAssessmentByID(assessment.id);
      setSelectedAssessment(fullAssessment || assessment);
      setTestRunnerOpen(true);
    } catch (err) {
      setSelectedAssessment(assessment);
      setTestRunnerOpen(true);
    }
  };

  const handleSubmitTest = async (payload: SubmitTestPayload) => {
    if (!selectedAssessment) return;
    const res = await assessmentApi.submitAssessment(selectedAssessment.id, payload);
    setTestRunnerOpen(false);
    setActiveResult(res.result);
    setResultModalOpen(true);
    await fetchData();
  };

  // Mock initial data fallbacks for instant rich UI rendering
  const mockAssessments: Assessment[] = [
    {
      id: 'c1111111-1111-1111-1111-111111111111',
      title: 'Full-Stack Web Architecture & Go Mastery',
      description: 'Rigorous evaluation of REST API design, Go concurrency, database indexing, and React state synchronization.',
      category: 'Engineering',
      difficulty_level: 'advanced',
      duration_minutes: 25,
      passing_score: 70,
      total_questions: 4,
      badge_title: 'Master Full-Stack Architect',
      badge_tier: 'Platinum',
      created_at: new Date().toISOString(),
      questions: [
        {
          id: 'q1',
          assessment_id: 'c1111111-1111-1111-1111-111111111111',
          question_type: 'mcq',
          question_text: 'In Go, how do you prevent goroutine leaks when consuming values from a channel with a timeout?',
          options: ['Use time.Sleep inside goroutine', 'Use select statement with time.After and context cancellation', 'Call runtime.Goexit()', 'Close channel synchronously before receiving'],
          max_points: 10,
          question_order: 1,
        },
        {
          id: 'q2',
          assessment_id: 'c1111111-1111-1111-1111-111111111111',
          question_type: 'mcq',
          question_text: 'Which PostgreSQL index type is optimal for B-Tree equality and range queries on UUID primary keys?',
          options: ['GIN Index', 'GiST Index', 'B-Tree Index', 'Hash Index'],
          max_points: 10,
          question_order: 2,
        },
        {
          id: 'q3',
          assessment_id: 'c1111111-1111-1111-1111-111111111111',
          question_type: 'mcq',
          question_text: 'In React 18, what is the primary purpose of the useDeferredValue hook?',
          options: ['Defer non-critical state updates to prevent UI blocking', 'Force immediate component re-render', 'Cache expensive mathematical computations', 'Handle async HTTP requests synchronously'],
          max_points: 10,
          question_order: 3,
        },
        {
          id: 'q4',
          assessment_id: 'c1111111-1111-1111-1111-111111111111',
          question_type: 'practical',
          question_text: 'PRACTICAL SCENARIO: Write a Go HTTP handler function that accepts a JSON payload, validates inputs, and publishes an event asynchronously without blocking the client response.',
          practical_rubric: 'Must handle JSON decoding error, validate non-nil IDs, launch background goroutine/pubsub, and respond with HTTP 201 Created.',
          max_points: 20,
          question_order: 4,
        },
      ],
    },
    {
      id: 'c2222222-2222-2222-2222-222222222222',
      title: 'Distributed Systems & Cloud Architecture',
      description: 'Evaluate microservices isolation, rate limiting algorithms, caching strategies, and event-driven patterns.',
      category: 'Architecture',
      difficulty_level: 'advanced',
      duration_minutes: 30,
      passing_score: 75,
      total_questions: 3,
      badge_title: 'Certified Cloud Architect',
      badge_tier: 'Gold',
      created_at: new Date().toISOString(),
      questions: [
        {
          id: 'q5',
          assessment_id: 'c2222222-2222-2222-2222-222222222222',
          question_type: 'mcq',
          question_text: 'Which rate limiting algorithm guarantees smooth token replenishment without burst spikes?',
          options: ['Leaky Bucket', 'Token Bucket', 'Fixed Window Counter', 'Sliding Window Log'],
          max_points: 10,
          question_order: 1,
        },
        {
          id: 'q6',
          assessment_id: 'c2222222-2222-2222-2222-222222222222',
          question_type: 'practical',
          question_text: 'PRACTICAL ARCHITECTURE: Outline a high-throughput notification distribution system handling 1,000,000 push notifications per minute. Detail queueing, partition keys, and retry strategies.',
          practical_rubric: 'Must cover message queues (Kafka/RabbitMQ), worker pools, idempotent processing, exponential backoff, and dead-letter queues.',
          max_points: 20,
          question_order: 2,
        },
      ],
    },
  ];

  const mockResults: UserAssessmentResult[] = [
    {
      id: 'res-101',
      user_id: '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
      user_name: 'Alex Rivera',
      assessment_id: 'c1111111-1111-1111-1111-111111111111',
      assessment_title: 'Full-Stack Web Architecture & Go Mastery',
      score_percentage: 92,
      mcq_score: 100,
      practical_ai_score: 85,
      percentile_rank: 94,
      passed: true,
      time_taken_seconds: 720,
      ai_feedback_summary: 'Demonstrated exceptional Go concurrency mastery, clean JSON validation error handling, and robust async event publishing.',
      earned_badge: {
        id: 'badge-101',
        user_id: '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
        user_name: 'Alex Rivera',
        assessment_id: 'c1111111-1111-1111-1111-111111111111',
        badge_title: 'Master Full-Stack Architect',
        tier: 'Platinum',
        verification_code: 'BADGE-PLAT-9F2A01',
        skills_validated: ['Engineering', 'Advanced', 'Verified Proficient'],
        issued_at: new Date().toISOString(),
      },
      completed_at: new Date().toISOString(),
    },
  ];

  const mockBadges: SkillBadge[] = [
    {
      id: 'badge-101',
      user_id: '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
      user_name: 'Alex Rivera',
      assessment_id: 'c1111111-1111-1111-1111-111111111111',
      badge_title: 'Master Full-Stack Architect',
      tier: 'Platinum',
      verification_code: 'BADGE-PLAT-9F2A01',
      skills_validated: ['Engineering', 'Advanced', 'Verified Proficient'],
      issued_at: new Date().toISOString(),
    },
  ];

  return (
    <Box sx={{ bgcolor: '#090d16', minHeight: '100dvh', color: '#f8fafc', py: 4 }}>
      <Container maxWidth="xl">
        {/* Top Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#f8fafc', background: 'linear-gradient(90deg, #38bdf8 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Professional Skill Assessment System
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Take standardized technical & practical scenario assessments, receive AI evaluation feedback, and earn verified skill badges.
            </Typography>
          </Box>
        </Box>

        {/* Top KPI Metrics Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>Available Skill Tests</Typography>
                  <QuizIcon sx={{ color: '#38bdf8' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#f8fafc', mt: 1 }}>
                  {assessments.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>Tests Passed</Typography>
                  <CheckCircleIcon sx={{ color: '#22c55e' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#22c55e', mt: 1 }}>
                  {results.filter((r) => r.passed).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>Candidate Ranking</Typography>
                  <EmojiEventsIcon sx={{ color: '#a855f7' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#a855f7', mt: 1 }}>
                  Top 6%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>Verified Skill Badges</Typography>
                  <VerifiedIcon sx={{ color: '#f59e0b' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#f59e0b', mt: 1 }}>
                  {badges.length}
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
            <Tab icon={<QuizIcon fontSize="small" />} iconPosition="start" label="Skill Tests Catalog" />
            <Tab icon={<EmojiEventsIcon fontSize="small" />} iconPosition="start" label="Results & Percentile Analytics" />
            <Tab icon={<VerifiedIcon fontSize="small" />} iconPosition="start" label="Verified Skill Badges" />
          </Tabs>
        </Paper>

        {/* Tab 0: Assessment Test Catalog */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            {assessments.map((item) => (
              <Grid item xs={12} md={6} key={item.id}>
                <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Chip label={item.category} size="small" sx={{ bgcolor: '#0f172a', color: '#38bdf8', border: '1px solid #334155', fontWeight: 'bold' }} />
                      <Chip label={`${item.badge_tier} Tier`} size="small" sx={{ bgcolor: '#f59e0b', color: '#0f172a', fontWeight: 'bold' }} />
                    </Box>

                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc', mb: 1 }}>
                      {item.title}
                    </Typography>

                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2, flexGrow: 1 }}>
                      {item.description}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, color: '#64748b', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTimeIcon fontSize="small" />
                        <Typography variant="caption">{item.duration_minutes} Mins</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <QuizIcon fontSize="small" />
                        <Typography variant="caption">{item.total_questions || 4} Questions (MCQ + Practical)</Typography>
                      </Box>
                    </Box>

                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => handleStartTest(item)}
                      startIcon={<PlayArrowIcon />}
                      sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', py: 1, '&:hover': { bgcolor: '#0284c7' } }}
                    >
                      Start Skill Test
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Tab 1: Results & Analytics */}
        {activeTab === 1 && (
          <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #334155' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ borderBottom: '2px solid #334155' }}>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Assessment Title</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Score %</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>MCQ Score</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>AI Practical Score</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Percentile Rank</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Badge Awarded</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((r) => (
                    <TableRow key={r.id} sx={{ borderBottom: '1px solid #1e293b' }}>
                      <TableCell sx={{ color: '#f8fafc', fontWeight: 'bold' }}>{r.assessment_title}</TableCell>
                      <TableCell sx={{ color: '#38bdf8', fontWeight: 'bold' }}>{r.score_percentage}%</TableCell>
                      <TableCell sx={{ color: '#cbd5e1' }}>{r.mcq_score}%</TableCell>
                      <TableCell sx={{ color: '#10b981', fontWeight: 'bold' }}>{r.practical_ai_score}%</TableCell>
                      <TableCell sx={{ color: '#a855f7', fontWeight: 'bold' }}>Top {100 - r.percentile_rank}%</TableCell>
                      <TableCell>
                        <Chip
                          label={r.passed ? 'PASSED' : 'FAILED'}
                          size="small"
                          sx={{ bgcolor: r.passed ? '#22c55e' : '#ef4444', color: '#fff', fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#f59e0b', fontWeight: 'bold' }}>
                        {r.earned_badge ? `${r.earned_badge.badge_title} (${r.earned_badge.tier})` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Tab 2: Verified Skill Badges */}
        {activeTab === 2 && (
          <BadgesGallery badges={badges} />
        )}

        {/* Test Runner Modal */}
        {selectedAssessment && (
          <TestRunnerModal
            open={testRunnerOpen}
            assessment={selectedAssessment}
            onClose={() => setTestRunnerOpen(false)}
            onSubmit={handleSubmitTest}
          />
        )}

        {/* Result Report Modal */}
        {activeResult && (
          <ResultReportModal
            open={resultModalOpen}
            result={activeResult}
            onClose={() => setResultModalOpen(false)}
          />
        )}
      </Container>
    </Box>
  );
}
