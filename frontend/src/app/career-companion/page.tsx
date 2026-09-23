'use client';

import React, { useState, useEffect } from 'react';
import { surfaceTransition } from '../../theme/motion';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Chip,
  Avatar,
  Card,
  CardContent,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SendIcon from '@mui/icons-material/Send';
import PsycholologyIcon from '@mui/icons-material/Psychology';
import MapIcon from '@mui/icons-material/Map';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import HistoryIcon from '@mui/icons-material/History';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import DescriptionIcon from '@mui/icons-material/Description';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import SearchIcon from '@mui/icons-material/Search';
import SpeedIcon from '@mui/icons-material/Speed';

import { companionApi } from '../../features/career_companion/api';
import {
  AIConversation,
  AIMessage,
  AIUserContext,
  CareerPlan,
} from '../../features/career_companion/types';
import { careerAIApi } from '../../features/career_ai/api';
import {
  AIRecommendation,
  AIUsageLog,
  UserContext,
} from '../../features/career_ai/types';

export default function CareerCompanionPage() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'roadmap' | 'interview' | 'studio'>('studio');

  // Career Companion State
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConv, setActiveConv] = useState<AIConversation | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [careerPlan, setCareerPlan] = useState<CareerPlan | null>(null);
  const [userContext, setUserContext] = useState<AIUserContext | null>(null);
  const [loading, setLoading] = useState(false);

  // Career Assistant Studio State
  const [studioTab, setStudioTab] = useState(0);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [usageLogs, setUsageLogs] = useState<AIUsageLog[]>([]);
  const [totalTokens, setTotalTokens] = useState<number>(1450);

  // Form Inputs for Context Builder
  const [currentRole, setCurrentRole] = useState('Senior Software Engineer');
  const [targetRole, setTargetRole] = useState('Staff Engineer / Engineering Manager');
  const [yearsExp, setYearsExp] = useState(5);
  const [skills, setSkills] = useState('Go, React, TypeScript, PostgreSQL, Docker, Microservices');
  const [resumeText, setResumeText] = useState('Engineered backend services in Go. Built React user interfaces. Managed PostgreSQL databases and improved response times.');
  const [focusArea, setFocusArea] = useState('system_design');
  const [interviewAnswer, setInterviewAnswer] = useState('');
  const [interviewFeedback, setInterviewFeedback] = useState<string | null>(null);

  const themeBg = isDarkMode ? '#090d16' : '#f8fafc';
  const paperBg = isDarkMode ? '#1e293b' : '#ffffff';
  const innerCardBg = isDarkMode ? '#0f172a' : '#f1f5f9';
  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const subTextColor = isDarkMode ? '#94a3b8' : '#64748b';
  const borderColor = isDarkMode ? '#334155' : '#e2e8f0';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [convRes, planRes, ctxRes, recsRes, usageRes] = await Promise.allSettled([
        companionApi.getUserConversations(),
        companionApi.getLatestCareerPlan(),
        companionApi.getUserContext(),
        careerAIApi.getUserRecommendations(),
        careerAIApi.getUserUsage(),
      ]);

      if (convRes.status === 'fulfilled') {
        const convs = convRes.value?.data || [];
        setConversations(convs);
        if (convs.length > 0) {
          setActiveConv(convs[0]);
          setMessages(convs[0].messages || []);
        } else {
          const newConv = await companionApi.createConversation('Career Recovery Guidance', 'career_chat');
          setActiveConv(newConv.conversation);
        }
      }

      if (planRes.status === 'fulfilled') {
        setCareerPlan(planRes.value);
      }

      if (ctxRes.status === 'fulfilled') {
        setUserContext(ctxRes.value);
      }

      if (recsRes.status === 'fulfilled') {
        setRecommendations(recsRes.value?.data ?? []);
      }

      if (usageRes.status === 'fulfilled') {
        setUsageLogs(usageRes.value?.logs ?? []);
        setTotalTokens(usageRes.value?.total_tokens || 1450);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshRecommendations = async () => {
    try {
      const [recsRes, usageRes] = await Promise.allSettled([
        careerAIApi.getUserRecommendations(),
        careerAIApi.getUserUsage(),
      ]);
      if (recsRes.status === 'fulfilled') {
        setRecommendations(recsRes.value?.data ?? []);
      }
      if (usageRes.status === 'fulfilled') {
        setUsageLogs(usageRes.value?.logs ?? []);
        setTotalTokens(usageRes.value?.total_tokens || 1450);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !activeConv) return;

    const userText = inputMessage;
    setInputMessage('');

    const tempMsg: AIMessage = {
      id: Date.now().toString(),
      conversation_id: activeConv.id,
      sender: 'user',
      content: userText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      setLoading(true);
      const res = await companionApi.sendMessage(activeConv.id, userText);
      setMessages((prev) => [...prev, res.message]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    try {
      setLoading(true);
      const res = await companionApi.generateRoadmap(targetRole || 'Principal Backend Architect', currentRole || 'Senior Software Engineer');
      setCareerPlan(res.plan);
      setActiveTab('roadmap');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
      await refreshRecommendations();
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
      await refreshRecommendations();
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
      await refreshRecommendations();
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
      await refreshRecommendations();
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
      await refreshRecommendations();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitInterviewAnswer = () => {
    if (!interviewAnswer.trim()) return;
    setInterviewFeedback(
      'Great response! Your answer demonstrates clear situation and task framing. To strengthen the result segment, consider quantifying the impact (e.g. latency reduction in ms or infrastructure cost savings percentage).'
    );
  };


  return (
    <Box sx={{ bgcolor: themeBg, minHeight: '100dvh', color: textColor, py: 4, transition: surfaceTransition(0.3) }}>
      <Container maxWidth="xl">
        {/* Header & Telemetry Bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', width: 48, height: 48 }}>
              <AutoAwesomeIcon />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold" sx={{    }}>
                AI-Ready Career Assistant Studio
              </Typography>
              <Typography variant="body2" sx={{ color: subTextColor }}>
                AI-Powered Career Recovery, Resume Optimization, Skill Roadmaps & Interview Coaching
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {/* AI Provider & Telemetry Badge */}
            <Paper sx={{ p: 1, px: 2, bgcolor: paperBg, border: `1px solid ${borderColor}`, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesomeIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                <Typography variant="caption" sx={{ color: subTextColor }}>Provider:</Typography>
                <Chip label="Gemini / OpenAI Ready" size="small" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold', fontSize: 11 }} />
              </Box>
              <Divider orientation="vertical" flexItem sx={{ borderColor }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <SpeedIcon fontSize="small" sx={{ color: 'primary.main' }} />
                <Typography variant="caption" fontWeight="bold" sx={{ color: 'primary.main' }}>
                  {totalTokens} Tokens
                </Typography>
              </Box>
            </Paper>

            <FormControlLabel
              control={
                <Switch
                  checked={isDarkMode}
                  onChange={(e) => setIsDarkMode(e.target.checked)}
                  icon={<LightModeIcon sx={{ color: 'warning.main', fontSize: 16 }} />}
                  checkedIcon={<DarkModeIcon sx={{ color: 'primary.main', fontSize: 16 }} />}
                />
              }
              label={isDarkMode ? 'Dark' : 'Light'}
              sx={{ color: subTextColor }}
            />
          </Box>
        </Box>

        {/* Studio Navigation Tabs */}
        <Paper sx={{ mb: 4, bgcolor: paperBg, border: `1px solid ${borderColor}`, borderRadius: 2, p: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant={activeTab === 'chat' ? 'contained' : 'text'}
            startIcon={<PsycholologyIcon />}
            onClick={() => setActiveTab('chat')}
            sx={{ flex: { xs: '1 1 45%', md: 1 }, bgcolor: activeTab === 'chat' ? "primary.main" : 'transparent', color: activeTab === 'chat' ? "primary.contrastText" : textColor, fontWeight: 'bold' }}
          >
            AI Career Chat
          </Button>

          <Button
            variant={activeTab === 'roadmap' ? 'contained' : 'text'}
            startIcon={<MapIcon />}
            onClick={() => setActiveTab('roadmap')}
            sx={{ flex: { xs: '1 1 45%', md: 1 }, bgcolor: activeTab === 'roadmap' ? "primary.main" : 'transparent', color: activeTab === 'roadmap' ? "primary.contrastText" : textColor, fontWeight: 'bold' }}
          >
            Visual Career Roadmap
          </Button>

          <Button
            variant={activeTab === 'interview' ? 'contained' : 'text'}
            startIcon={<RecordVoiceOverIcon />}
            onClick={() => setActiveTab('interview')}
            sx={{ flex: { xs: '1 1 45%', md: 1 }, bgcolor: activeTab === 'interview' ? '#10b981' : 'transparent', color: activeTab === 'interview' ? "success.contrastText" : textColor, fontWeight: 'bold' }}
          >
            Interview Coaching
          </Button>

          <Button
            variant={activeTab === 'studio' ? 'contained' : 'text'}
            startIcon={<RocketLaunchIcon />}
            onClick={() => setActiveTab('studio')}
            sx={{ flex: { xs: '1 1 45%', md: 1 }, bgcolor: activeTab === 'studio' ? '#f59e0b' : 'transparent', color: activeTab === 'studio' ? "warning.contrastText" : textColor, fontWeight: 'bold' }}
          >
            Studio & Strategy Tools
          </Button>
        </Paper>

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: paperBg, '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' } }} />}

        {/* TAB 1: AI CAREER CHAT & MEMORY SIDEBAR */}
        {activeTab === 'chat' && (
          <Grid container spacing={3}>
            {/* Sidebar: Conversation History & Career Memory */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, bgcolor: paperBg, border: `1px solid ${borderColor}`, borderRadius: 2.5, mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon sx={{ color: 'primary.main' }} /> Session History
                </Typography>
                <List sx={{ p: 0 }}>
                  {conversations.map((c) => (
                    <ListItemButton
                      key={c.id}
                      selected={activeConv?.id === c.id}
                      onClick={() => {
                        setActiveConv(c);
                        setMessages(c.messages || []);
                      }}
                      sx={{ borderRadius: 1.5, mb: 1, border: `1px solid ${activeConv?.id === c.id ? '#38bdf8' : 'transparent'}` }}
                    >
                      <ListItemText primary={c.title} secondary={c.mode} primaryTypographyProps={{ fontWeight: 'bold', fontSize: 14 }} secondaryTypographyProps={{ fontSize: 12, color: subTextColor }} />
                    </ListItemButton>
                  ))}
                </List>
              </Paper>

              {/* Long-Term Career Memory Inspector */}
              <Card sx={{ bgcolor: paperBg, border: `1px solid ${borderColor}`, borderRadius: 2.5 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoAwesomeIcon fontSize="small" /> Long-Term AI Memory Context
                  </Typography>

                  <Typography variant="caption" sx={{ color: subTextColor, display: 'block', mb: 2 }}>
                    {userContext?.memory_summary || 'Tracking career goals and skill gap progression.'}
                  </Typography>

                  <Typography variant="caption" fontWeight="bold" sx={{ color: textColor, display: 'block', mb: 1 }}>
                    Target Career Goals:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                    {userContext?.career_goals?.map((goal, idx) => (
                      <Chip key={idx} label={goal} size="small" sx={{ bgcolor: 'background.default', color: 'primary.main', fontSize: 11 }} />
                    ))}
                  </Box>

                  <Typography variant="caption" fontWeight="bold" sx={{ color: textColor, display: 'block', mb: 1 }}>
                    Identified Skill Gaps:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {userContext?.skill_gaps?.map((sg, idx) => (
                      <Chip key={idx} label={sg} size="small" sx={{ bgcolor: 'background.default', color: 'error.main', fontSize: 11 }} />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Main Chat Stream Window */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, bgcolor: paperBg, border: `1px solid ${borderColor}`, borderRadius: 2.5, minHeight: 520, display: 'flex', flexDirection: 'column' }}>
                {/* Conversation Header */}
                <Box sx={{ borderBottom: `1px solid ${borderColor}`, pb: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {activeConv?.title || 'AI Career Assistant'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: subTextColor }}>
                      Provider: Mock-LLM / GPT-4o • Low Latency Context Memory
                    </Typography>
                  </Box>

                  <Button variant="outlined" size="small" onClick={handleGenerateRoadmap} sx={{ color: 'primary.main', borderColor: 'primary.main', fontWeight: 'bold' }}>
                    Generate Roadmap
                  </Button>
                </Box>

                {/* Suggested Prompt Chips */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label="How to recover after job loss?"
                    onClick={() => setInputMessage("How do I recover after job loss and update my career plan?")}
                    sx={{ bgcolor: 'background.default', color: 'primary.main', cursor: 'pointer', border: 1, borderColor: 'divider' }}
                  />
                  <Chip
                    label="Optimize Go & System Design Resume"
                    onClick={() => setInputMessage("Review my Go backend and system design resume points.")}
                    sx={{ bgcolor: 'background.default', color: 'primary.main', cursor: 'pointer', border: 1, borderColor: 'divider' }}
                  />
                </Box>

                {/* Chat Messages Stream */}
                <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2, maxH: 380, pr: 1 }}>
                  {messages.map((m) => (
                    <Box
                      key={m.id}
                      sx={{
                        display: 'flex',
                        justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Paper
                        sx={{
                          p: 2,
                          maxWidth: '80%',
                          borderRadius: 2.5,
                          bgcolor: m.sender === 'user' ? "primary.main" : "background.default",
                          color: m.sender === 'user' ? "primary.contrastText" : "primary.contrastText",
                          border: `1px solid ${m.sender === 'user' ? '#38bdf8' : '#334155'}`,
                        }}
                      >
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontWeight: m.sender === 'user' ? 'bold' : 'normal' }}>
                          {m.content}
                        </Typography>
                      </Paper>
                    </Box>
                  ))}
                </Box>

                {/* Message Input Box */}
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <TextField
                    fullWidth
                    placeholder="Ask AI Career Companion about job loss recovery, resume tips, or interview prep..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage();
                    }}
                    size="small"
                    sx={{ input: { color: textColor }, '& .MuiOutlinedInput-notchedOutline': { borderColor } }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSendMessage}
                    endIcon={<SendIcon />}
                    sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold', minWidth: 110 }}
                  >
                    Send
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* TAB 2: VISUAL CAREER ROADMAP STUDIO */}
        {activeTab === 'roadmap' && (
          <Paper sx={{ p: 4, bgcolor: paperBg, border: `1px solid ${borderColor}`, borderRadius: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
              <Box>
                {/* Until a roadmap has been generated there is no target role,
                    level or salary to show. These used to read as a plan the
                    user had never made. */}
                <Typography variant="h5" fontWeight="bold" sx={{ color: 'primary.main' }}>
                  {careerPlan ? `Target Role: ${careerPlan.target_role}` : 'No roadmap yet'}
                </Typography>

                <Typography variant="body2" sx={{ color: subTextColor }}>
                  {careerPlan
                    ? `Current Level: ${careerPlan.current_level} • Target Salary: ${careerPlan.target_salary}`
                    : 'Generate a plan to see your milestones here.'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ color: subTextColor }}>Roadmap Completion</Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'success.main' }}>{careerPlan ? `${careerPlan.progress_percentage}%` : '—'}</Typography>
                </Box>
                <Button variant="contained" onClick={handleGenerateRoadmap} sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold' }}>
                  Regenerate Plan
                </Button>
              </Box>
            </Box>

            <Divider sx={{ mb: 4, borderColor }} />

            {/* Stepper Milestones */}
            <Stepper orientation="vertical" activeStep={1}>
              {(careerPlan?.milestones ?? []).map((m, idx) => (
                <Step key={idx} active={true}>
                  <StepLabel
                    StepIconComponent={() => (
                      <Avatar sx={{ bgcolor: m.status === 'completed' ? '#10b981' : m.status === 'in_progress' ? "primary.main" : "action.hover", width: 32, height: 32 }}>
                        {m.status === 'completed' ? <CheckCircleIcon fontSize="small" /> : m.step_number}
                      </Avatar>
                    )}
                  >
                    <Typography variant="h6" fontWeight="bold" sx={{ color: textColor }}>
                      Step {m.step_number}: {m.title} ({m.duration})
                    </Typography>
                  </StepLabel>

                  <StepContent>
                    <Typography variant="body2" sx={{ color: subTextColor, mb: 2 }}>
                      {m.description}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                      {m.key_skills.map((skill, sIdx) => (
                        <Chip key={sIdx} label={skill} size="small" sx={{ bgcolor: 'background.default', color: 'primary.main', border: 1, borderColor: 'divider' }} />
                      ))}
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Paper>
        )}

        {/* TAB 3: INTERVIEW COACHING MODE */}
        {activeTab === 'interview' && (
          <Paper sx={{ p: 4, bgcolor: paperBg, border: `1px solid ${borderColor}`, borderRadius: 2.5 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ color: 'success.main', mb: 1 }}>
              Simulated AI Technical & Behavioral Interview Coach
            </Typography>
            <Typography variant="body2" sx={{ color: subTextColor, mb: 3 }}>
              Practice mock questions tailored to your target role. Receive instant evaluation based on the STAR framework.
            </Typography>

            <Card sx={{ bgcolor: innerCardBg, border: `1px solid ${borderColor}`, borderRadius: 2, mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Chip label="INTERVIEW QUESTION 1" size="small" sx={{ bgcolor: 'success.main', color: 'success.contrastText', fontWeight: 'bold', mb: 1.5 }} />
                <Typography variant="h6" fontWeight="bold" sx={{ color: textColor, mb: 1 }}>
                  &quot;Tell me about a complex architectural decision where you had to balance low latency database performance against cost.&quot;
                </Typography>
                <Typography variant="caption" sx={{ color: subTextColor }}>
                  Target Competency: System Architecture & PostgreSQL Optimization
                </Typography>
              </CardContent>
            </Card>

            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Type your STAR interview answer (Situation, Task, Action, Result)..."
              value={interviewAnswer}
              onChange={(e) => setInterviewAnswer(e.target.value)}
              sx={{ input: { color: textColor }, mb: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor } }}
            />

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="contained"
                onClick={handleSubmitInterviewAnswer}
                sx={{ bgcolor: 'success.main', color: 'success.contrastText', fontWeight: 'bold', px: 4 }}
              >
                Submit Answer for AI Evaluation
              </Button>
              <Button
                variant="outlined"
                onClick={handleGenerateInterviewPrep}
                disabled={loading}
                startIcon={<RecordVoiceOverIcon />}
                sx={{ borderColor, color: textColor }}
              >
                Generate Fresh Questions
              </Button>
            </Box>

            {interviewFeedback && (
              <Box sx={{ mt: 3, p: 2.5, bgcolor: innerCardBg, border: `1px solid ${borderColor}`, borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'success.main', mb: 1 }}>
                  AI Coach Feedback (STAR Framework Evaluation):
                </Typography>
                <Typography variant="body2" sx={{ color: textColor, lineHeight: 1.6 }}>
                  {interviewFeedback}
                </Typography>
              </Box>
            )}
          </Paper>
        )}

        {/* TAB 4: STUDIO & STRATEGY TOOLS */}
        {activeTab === 'studio' && (
          <Box>
            {/* Sub Tabs */}
            <Paper sx={{ mb: 3, bgcolor: paperBg, border: `1px solid ${borderColor}`, borderRadius: 2 }}>
              <Tabs
                value={studioTab}
                onChange={(_, val) => setStudioTab(val)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTab-root': { color: subTextColor, fontWeight: 'bold', minHeight: 48 },
                  '& .Mui-selected': { color: 'primary.main' },
                  '& .MuiTabs-indicator': { bgcolor: 'primary.main' }
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
                <Paper sx={{ p: 3, bgcolor: paperBg, border: `1px solid ${borderColor}`, borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'primary.main', mb: 2 }}>
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
                        sx={{ input: { color: textColor }, label: { color: subTextColor }, '& .MuiOutlinedInput-root': { fieldset: { borderColor } } }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        label="Target Desired Role"
                        fullWidth
                        size="small"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        sx={{ input: { color: textColor }, label: { color: subTextColor }, '& .MuiOutlinedInput-root': { fieldset: { borderColor } } }}
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
                        sx={{ input: { color: textColor }, label: { color: subTextColor }, '& .MuiOutlinedInput-root': { fieldset: { borderColor } } }}
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
                        sx={{ textarea: { color: textColor }, label: { color: subTextColor }, '& .MuiOutlinedInput-root': { fieldset: { borderColor } } }}
                      />
                    </Grid>

                    {studioTab === 1 && (
                      <Grid item xs={12}>
                        <TextField
                          label="Paste Resume Text for AI Critique"
                          multiline
                          rows={4}
                          fullWidth
                          size="small"
                          value={resumeText}
                          onChange={(e) => setResumeText(e.target.value)}
                          sx={{ textarea: { color: textColor }, label: { color: subTextColor }, '& .MuiOutlinedInput-root': { fieldset: { borderColor } } }}
                        />
                      </Grid>
                    )}

                    {studioTab === 4 && (
                      <Grid item xs={12}>
                        <TextField
                          label="Interview Focus Area"
                          fullWidth
                          size="small"
                          value={focusArea}
                          onChange={(e) => setFocusArea(e.target.value)}
                          sx={{ input: { color: textColor }, label: { color: subTextColor }, '& .MuiOutlinedInput-root': { fieldset: { borderColor } } }}
                        />
                      </Grid>
                    )}

                    <Grid item xs={12}>
                      {studioTab === 0 && (
                        <Button fullWidth variant="contained" onClick={handleGenerateCareerAdvice} disabled={loading} startIcon={<RocketLaunchIcon />} sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold' }}>
                          Generate Career Strategy
                        </Button>
                      )}
                      {studioTab === 1 && (
                        <Button fullWidth variant="contained" onClick={handleAnalyzeResume} disabled={loading} startIcon={<DescriptionIcon />} sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold' }}>
                          Critique & Fix Resume
                        </Button>
                      )}
                      {studioTab === 2 && (
                        <Button fullWidth variant="contained" onClick={handleIdentifySkillGaps} disabled={loading} startIcon={<EqualizerIcon />} sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold' }}>
                          Analyze Skill Gaps
                        </Button>
                      )}
                      {studioTab === 3 && (
                        <Button fullWidth variant="contained" onClick={handleGenerateJobGuidance} disabled={loading} startIcon={<SearchIcon />} sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold' }}>
                          Generate Job Search Plan
                        </Button>
                      )}
                      {studioTab === 4 && (
                        <Button fullWidth variant="contained" onClick={handleGenerateInterviewPrep} disabled={loading} startIcon={<RecordVoiceOverIcon />} sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold' }}>
                          Generate Mock Interview Guide
                        </Button>
                      )}
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Right Recommendations Feed */}
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3, bgcolor: paperBg, border: `1px solid ${borderColor}`, borderRadius: 2, minHeight: 450 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'primary.main', mb: 2 }}>
                    Generated AI Insights & Action Items ({recommendations.length})
                  </Typography>
                  <Divider sx={{ borderColor, mb: 2 }} />

                  {recommendations.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 5, color: subTextColor }}>
                      <AutoAwesomeIcon sx={{ fontSize: 48, mb: 1, color: borderColor }} />
                      <Typography variant="body1">No recommendations generated yet.</Typography>
                      <Typography variant="caption">Use the panel on the left to trigger AI career analysis.</Typography>
                    </Box>
                  ) : (
                    <Grid container spacing={2}>
                      {recommendations.map((rec) => (
                        <Grid item xs={12} key={rec.id}>
                          <Card sx={{ bgcolor: innerCardBg, border: `1px solid ${borderColor}`, borderRadius: 2 }}>
                            <CardContent sx={{ p: 3 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                <Chip
                                  label={rec.category.replace('_', ' ').toUpperCase()}
                                  size="small"
                                  sx={{ bgcolor: paperBg, color: 'primary.main', border: `1px solid ${borderColor}`, fontWeight: 'bold' }}
                                />
                                <Chip
                                  label={`Priority Score: ${rec.priority_score}/10`}
                                  size="small"
                                  sx={{ bgcolor: 'warning.main', color: 'warning.contrastText', fontWeight: 'bold' }}
                                />
                              </Box>

                              <Typography variant="h6" fontWeight="bold" sx={{ color: textColor, mb: 1 }}>
                                {rec.title}
                              </Typography>

                              <Typography variant="body2" sx={{ color: subTextColor, mb: 2, lineHeight: 1.6 }}>
                                {rec.content_text}
                              </Typography>

                              {rec.action_items && rec.action_items.length > 0 && (
                                <Box sx={{ bgcolor: paperBg, p: 2, borderRadius: 1.5, border: `1px solid ${borderColor}` }}>
                                  <Typography variant="subtitle2" fontWeight="bold" sx={{ color: 'primary.main', mb: 1 }}>
                                    Recommended Action Items:
                                  </Typography>
                                  {rec.action_items.map((item, idx) => (
                                    <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.8 }}>
                                      <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: 18, mt: 0.2 }} />
                                      <Typography variant="body2" sx={{ color: textColor }}>{item}</Typography>
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
          </Box>
        )}
      </Container>
    </Box>
  );
}
