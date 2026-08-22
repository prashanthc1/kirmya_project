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
  TextField,
  Chip,
  LinearProgress,
  Divider,
  Alert,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import DescriptionIcon from '@mui/icons-material/Description';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import SearchIcon from '@mui/icons-material/Search';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SpeedIcon from '@mui/icons-material/Speed';

import { careerAIApi } from '../../features/career_ai/api';
import {
  AIRecommendation,
  AIUsageLog,
  UserContext,
} from '../../features/career_ai/types';

export default function CareerAssistantPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [usageLogs, setUsageLogs] = useState<AIUsageLog[]>([]);
  const [totalTokens, setTotalTokens] = useState<number>(1450);
  const [loading, setLoading] = useState(false);

  // Form Inputs
  const [currentRole, setCurrentRole] = useState('Senior Software Engineer');
  const [targetRole, setTargetRole] = useState('Staff Engineer / Engineering Manager');
  const [yearsExp, setYearsExp] = useState(5);
  const [skills, setSkills] = useState('Go, React, TypeScript, PostgreSQL, Docker, Microservices');
  const [resumeText, setResumeText] = useState('Engineered backend services in Go. Built React user interfaces. Managed PostgreSQL databases and improved response times.');
  const [focusArea, setFocusArea] = useState('system_design');

  const fetchData = async () => {
    try {
      const [resRecs, resUsage] = await Promise.allSettled([
        careerAIApi.getUserRecommendations(),
        careerAIApi.getUserUsage(),
      ]);

      if (resRecs.status === 'fulfilled') {
        setRecommendations(resRecs.value?.data || mockRecs);
      } else {
        setRecommendations(mockRecs);
      }

      if (resUsage.status === 'fulfilled') {
        setUsageLogs(resUsage.value?.logs || mockLogs);
        setTotalTokens(resUsage.value?.total_tokens || 1450);
      } else {
        setUsageLogs(mockLogs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateCareerAdvice = async () => {
    try {
      setLoading(true);
      const userCtx: UserContext = {
        current_role: currentRole,
        target_role: targetRole,
        years_exp: Number(yearsExp),
        current_skills: skills.split(',').map((s) => s.trim()),
      };
      await careerAIApi.generateCareerAdvice({ user_context: userCtx });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeResume = async () => {
    try {
      setLoading(true);
      await careerAIApi.analyzeResume({ resume_text: resumeText, target_role: targetRole });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleIdentifySkillGaps = async () => {
    try {
      setLoading(true);
      await careerAIApi.identifySkillGaps({
        current_skills: skills.split(',').map((s) => s.trim()),
        target_role: targetRole,
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateJobGuidance = async () => {
    try {
      setLoading(true);
      await careerAIApi.generateJobGuidance({ target_role: targetRole });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInterviewPrep = async () => {
    try {
      setLoading(true);
      await careerAIApi.generateInterviewPrep({ target_role: targetRole, focus_area: focusArea });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Mock initial fallbacks for immediate presentation
  const mockRecs: AIRecommendation[] = [
    {
      id: 'rec-101',
      session_id: 'sess-1',
      user_id: '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
      category: 'career_trajectory',
      title: 'Accelerated Career Trajectory: Staff Engineer / Engineering Manager',
      content_text: 'Based on your 5 years of experience in Senior Software Engineer, transitioning into Staff Engineer / Engineering Manager is highly achievable. Focus on demonstrating high-scale system ownership, cross-functional engineering leadership, and cloud-native architecture.',
      priority_score: 9,
      action_items: [
        'Audit your top 3 project accomplishments and quantify revenue or performance impact.',
        "Complete Kirmya's System Design & Distributed Architecture Assessment.",
        'Connect with 5 hiring engineering managers at target growth-stage companies.',
      ],
      bookmarked: false,
      created_at: new Date().toISOString(),
    },
  ];

  const mockLogs: AIUsageLog[] = [
    {
      id: 'log-1',
      user_id: '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
      provider_name: 'gemini-pro',
      model_name: 'gemini-1.5-pro',
      request_type: 'career_advice',
      prompt_tokens: 340,
      completion_tokens: 180,
      total_tokens: 520,
      latency_ms: 145,
      created_at: new Date().toISOString(),
    },
  ];

  return (
    <Box sx={{ bgcolor: '#090d16', minHeight: '100dvh', color: '#f8fafc', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header & Telemetry Bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#f8fafc', background: 'linear-gradient(90deg, #38bdf8 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AI-Ready Career Assistant Studio
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Empowering professionals recovering from job loss to accelerate career growth using provider-independent AI intelligence.
            </Typography>
          </Box>

          {/* AI Provider & Telemetry Badge */}
          <Paper sx={{ p: 1.5, px: 2, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoAwesomeIcon sx={{ color: '#a855f7' }} />
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Active Provider:</Typography>
              <Chip label="Gemini / OpenAI Ready" size="small" sx={{ bgcolor: '#a855f7', color: '#fff', fontWeight: 'bold' }} />
            </Box>
            <Divider orientation="vertical" flexItem sx={{ borderColor: '#334155' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <SpeedIcon fontSize="small" sx={{ color: '#38bdf8' }} />
              <Typography variant="caption" fontWeight="bold" sx={{ color: '#38bdf8' }}>
                {totalTokens} Tokens Used
              </Typography>
            </Box>
          </Paper>
        </Box>

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: '#1e293b', '& .MuiLinearProgress-bar': { bgcolor: '#38bdf8' } }} />}

        {/* Tab Navigation */}
        <Paper sx={{ mb: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 1.5 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            textColor="inherit"
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-indicator': { bgcolor: '#38bdf8' },
              '& .MuiTab-root': { color: '#94a3b8', fontWeight: 'bold', textTransform: 'none' },
              '& .Mui-selected': { color: '#38bdf8' },
            }}
          >
            <Tab icon={<RocketLaunchIcon fontSize="small" />} iconPosition="start" label="Career Trajectory" />
            <Tab icon={<DescriptionIcon fontSize="small" />} iconPosition="start" label="Resume Critique" />
            <Tab icon={<EqualizerIcon fontSize="small" />} iconPosition="start" label="Skill Gap Bridge" />
            <Tab icon={<SearchIcon fontSize="small" />} iconPosition="start" label="Job Search Strategy" />
            <Tab icon={<RecordVoiceOverIcon fontSize="small" />} iconPosition="start" label="Mock Interview Prep" />
          </Tabs>
        </Paper>

        <Grid container spacing={3}>
          {/* Left Form Control Panel */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #334155' }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#38bdf8', mb: 2 }}>
                User Context Builder
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Current Role"
                    fullWidth
                    size="small"
                    value={currentRole}
                    onChange={(e) => setCurrentRole(e.target.value)}
                    sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Target Desired Role"
                    fullWidth
                    size="small"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Years of Experience"
                    type="number"
                    fullWidth
                    size="small"
                    value={yearsExp}
                    onChange={(e) => setYearsExp(Number(e.target.value))}
                    sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Current Technical & Soft Skills"
                    multiline
                    rows={2}
                    fullWidth
                    size="small"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    sx={{ textarea: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                  />
                </Grid>

                {activeTab === 1 && (
                  <Grid item xs={12}>
                    <TextField
                      label="Paste Resume Text for AI Critique"
                      multiline
                      rows={4}
                      fullWidth
                      size="small"
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      sx={{ textarea: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                    />
                  </Grid>
                )}

                {activeTab === 4 && (
                  <Grid item xs={12}>
                    <TextField
                      label="Interview Focus Area"
                      fullWidth
                      size="small"
                      value={focusArea}
                      onChange={(e) => setFocusArea(e.target.value)}
                      sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                    />
                  </Grid>
                )}

                <Grid item xs={12}>
                  {activeTab === 0 && (
                    <Button fullWidth variant="contained" onClick={handleGenerateCareerAdvice} disabled={loading} startIcon={<RocketLaunchIcon />} sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}>
                      Generate Career Strategy
                    </Button>
                  )}
                  {activeTab === 1 && (
                    <Button fullWidth variant="contained" onClick={handleAnalyzeResume} disabled={loading} startIcon={<DescriptionIcon />} sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}>
                      Critique & Fix Resume
                    </Button>
                  )}
                  {activeTab === 2 && (
                    <Button fullWidth variant="contained" onClick={handleIdentifySkillGaps} disabled={loading} startIcon={<EqualizerIcon />} sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}>
                      Analyze Skill Gaps
                    </Button>
                  )}
                  {activeTab === 3 && (
                    <Button fullWidth variant="contained" onClick={handleGenerateJobGuidance} disabled={loading} startIcon={<SearchIcon />} sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}>
                      Generate Job Search Plan
                    </Button>
                  )}
                  {activeTab === 4 && (
                    <Button fullWidth variant="contained" onClick={handleGenerateInterviewPrep} disabled={loading} startIcon={<RecordVoiceOverIcon />} sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}>
                      Generate Mock Interview Guide
                    </Button>
                  )}
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Right Recommendations Feed */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #334155', minHeight: 450 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#38bdf8', mb: 2 }}>
                Generated AI Insights & Action Items ({recommendations.length})
              </Typography>
              <Divider sx={{ borderColor: '#334155', mb: 2 }} />

              {recommendations.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5, color: '#64748b' }}>
                  <AutoAwesomeIcon sx={{ fontSize: 48, mb: 1, color: '#334155' }} />
                  <Typography variant="body1">No recommendations generated yet.</Typography>
                  <Typography variant="caption">Use the panel on the left to trigger AI career analysis.</Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {recommendations.map((rec) => (
                    <Grid item xs={12} key={rec.id}>
                      <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Chip
                              label={rec.category.replace('_', ' ').toUpperCase()}
                              size="small"
                              sx={{ bgcolor: '#0f172a', color: '#38bdf8', border: '1px solid #334155', fontWeight: 'bold' }}
                            />
                            <Chip
                              label={`Priority Score: ${rec.priority_score}/10`}
                              size="small"
                              sx={{ bgcolor: '#f59e0b', color: '#0f172a', fontWeight: 'bold' }}
                            />
                          </Box>

                          <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc', mb: 1 }}>
                            {rec.title}
                          </Typography>

                          <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 2, lineHeight: 1.6 }}>
                            {rec.content_text}
                          </Typography>

                          {rec.action_items && rec.action_items.length > 0 && (
                            <Box sx={{ bgcolor: '#0f172a', p: 2, borderRadius: 1.5, border: '1px solid #334155' }}>
                              <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#38bdf8', mb: 1 }}>
                                Recommended Action Items:
                              </Typography>
                              {rec.action_items.map((item, idx) => (
                                <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.8 }}>
                                  <CheckCircleOutlineIcon sx={{ color: '#22c55e', fontSize: 18, mt: 0.2 }} />
                                  <Typography variant="body2" sx={{ color: '#e2e8f0' }}>{item}</Typography>
                                </Box>
                              ))}
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
