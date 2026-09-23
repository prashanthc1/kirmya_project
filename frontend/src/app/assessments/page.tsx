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
        setAssessments(resAssess.value?.data ?? []);
      } else {
        setAssessments([]);
      }

      if (resResults.status === 'fulfilled') {
        setResults(resResults.value?.results ?? []);
      } else {
        setResults([]);
      }

      if (resBadges.status === 'fulfilled') {
        setBadges(resBadges.value?.badges ?? []);
      } else {
        setBadges([]);
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
    try {
      if (!selectedAssessment) return;
      const res = await assessmentApi.submitAssessment(selectedAssessment.id, payload);
      setTestRunnerOpen(false);
      setActiveResult(res.result);
      setResultModalOpen(true);
      await fetchData();
  
    } catch (error) {
      // The request failed, so nothing is shown as having happened.
      console.error('page.tsx: handleSubmitTest failed', error);
    }
  };

  // Mock initial data fallbacks for instant rich UI rendering



  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100dvh', color: 'text.primary', py: 4 }}>
      <Container maxWidth="xl">
        {/* Top Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ color: 'text.primary',    }}>
              Professional Skill Assessment System
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Take standardized technical & practical scenario assessments, receive AI evaluation feedback, and earn verified skill badges.
            </Typography>
          </Box>
        </Box>

        {/* Top KPI Metrics Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Available Skill Tests</Typography>
                  <QuizIcon sx={{ color: 'primary.main' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'text.primary', mt: 1 }}>
                  {assessments.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Tests Passed</Typography>
                  <CheckCircleIcon sx={{ color: 'success.main' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'success.main', mt: 1 }}>
                  {results.filter((r) => r.passed).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Candidate Ranking</Typography>
                  <EmojiEventsIcon sx={{ color: 'primary.main' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'primary.main', mt: 1 }}>
                  Top 6%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Verified Skill Badges</Typography>
                  <VerifiedIcon sx={{ color: 'warning.main' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'warning.main', mt: 1 }}>
                  {badges.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tab Navigation */}
        <Paper sx={{ mb: 3, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            textColor="inherit"
            indicatorColor="primary"
            sx={{
              '& .MuiTabs-indicator': { bgcolor: 'primary.main' },
              '& .MuiTab-root': { color: 'text.secondary', fontWeight: 'bold', textTransform: 'none' },
              '& .Mui-selected': { color: 'primary.main' },
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
                <Card sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Chip label={item.category} size="small" sx={{ bgcolor: 'background.default', color: 'primary.main', border: 1, borderColor: 'divider', fontWeight: 'bold' }} />
                      <Chip label={`${item.badge_tier} Tier`} size="small" sx={{ bgcolor: 'warning.main', color: 'warning.contrastText', fontWeight: 'bold' }} />
                    </Box>

                    <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary', mb: 1 }}>
                      {item.title}
                    </Typography>

                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, flexGrow: 1 }}>
                      {item.description}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, color: 'text.secondary', mb: 2 }}>
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
                      sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold', py: 1, '&:hover': { bgcolor: 'primary.main' } }}
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
          <Paper sx={{ p: 3, bgcolor: 'background.default', border: 1, borderColor: 'divider' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ borderBottom: '2px solid #334155' }}>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Assessment Title</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Score %</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>MCQ Score</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>AI Practical Score</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Percentile Rank</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Badge Awarded</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((r) => (
                    <TableRow key={r.id} sx={{ borderBottom: '1px solid #1e293b' }}>
                      <TableCell sx={{ color: 'text.primary', fontWeight: 'bold' }}>{r.assessment_title}</TableCell>
                      <TableCell sx={{ color: 'primary.main', fontWeight: 'bold' }}>{r.score_percentage}%</TableCell>
                      <TableCell sx={{ color: 'text.primary' }}>{r.mcq_score}%</TableCell>
                      <TableCell sx={{ color: 'success.main', fontWeight: 'bold' }}>{r.practical_ai_score}%</TableCell>
                      <TableCell sx={{ color: 'primary.main', fontWeight: 'bold' }}>Top {100 - r.percentile_rank}%</TableCell>
                      <TableCell>
                        <Chip
                          label={r.passed ? 'PASSED' : 'FAILED'}
                          size="small"
                          sx={{ bgcolor: r.passed ? '#22c55e' : '#ef4444', color: 'text.primary', fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'warning.main', fontWeight: 'bold' }}>
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
