'use client';

import React, { useState, useEffect } from 'react';
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
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';

import { companionApi } from '../../features/career_companion/api';
import {
  AIConversation,
  AIMessage,
  AIUserContext,
  CareerPlan,
} from '../../features/career_companion/types';

export default function CareerCompanionPage() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'roadmap' | 'interview'>('chat');

  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConv, setActiveConv] = useState<AIConversation | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [careerPlan, setCareerPlan] = useState<CareerPlan | null>(null);
  const [userContext, setUserContext] = useState<AIUserContext | null>(null);
  const [loading, setLoading] = useState(false);

  const themeBg = isDarkMode ? '#090d16' : '#f8fafc';
  const paperBg = isDarkMode ? '#1e293b' : '#ffffff';
  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const subTextColor = isDarkMode ? '#94a3b8' : '#64748b';
  const borderColor = isDarkMode ? '#334155' : '#e2e8f0';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const convRes = await companionApi.getUserConversations();
      setConversations(convRes.data || []);
      if (convRes.data && convRes.data.length > 0) {
        setActiveConv(convRes.data[0]);
        setMessages(convRes.data[0].messages || []);
      } else {
        const newConv = await companionApi.createConversation('Career Recovery Guidance', 'career_chat');
        setActiveConv(newConv.conversation);
      }

      const planRes = await companionApi.getLatestCareerPlan();
      setCareerPlan(planRes);

      const ctxRes = await companionApi.getUserContext();
      setUserContext(ctxRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
      const res = await companionApi.generateRoadmap('Principal Backend Architect', 'Senior Software Engineer');
      setCareerPlan(res.plan);
      setActiveTab('roadmap');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: themeBg, minHeight: '100vh', color: textColor, py: 4, transition: 'all 0.3s ease' }}>
      <Container maxWidth="xl">
        {/* Header Bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#38bdf8', color: '#0f172a', width: 48, height: 48 }}>
              <AutoAwesomeIcon />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ background: 'linear-gradient(90deg, #38bdf8 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Kirmya AI Career Companion
              </Typography>
              <Typography variant="body2" sx={{ color: subTextColor }}>
                AI-Powered Career Recovery, Resume Optimization, Skill Roadmaps & Interview Coaching
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isDarkMode}
                  onChange={(e) => setIsDarkMode(e.target.checked)}
                  icon={<LightModeIcon sx={{ color: '#f59e0b', fontSize: 16 }} />}
                  checkedIcon={<DarkModeIcon sx={{ color: '#38bdf8', fontSize: 16 }} />}
                />
              }
              label={isDarkMode ? 'Dark Mode' : 'Light Mode'}
              sx={{ color: subTextColor }}
            />
          </Box>
        </Box>

        {/* Studio Navigation Tabs */}
        <Paper sx={{ mb: 4, bgcolor: paperBg, border: `1px solid ${borderColor}`, borderRadius: 2, p: 1, display: 'flex', gap: 1 }}>
          <Button
            variant={activeTab === 'chat' ? 'contained' : 'text'}
            startIcon={<PsycholologyIcon />}
            onClick={() => setActiveTab('chat')}
            sx={{ flex: 1, bgcolor: activeTab === 'chat' ? '#38bdf8' : 'transparent', color: activeTab === 'chat' ? '#0f172a' : textColor, fontWeight: 'bold' }}
          >
            AI Career Chat
          </Button>

          <Button
            variant={activeTab === 'roadmap' ? 'contained' : 'text'}
            startIcon={<MapIcon />}
            onClick={() => setActiveTab('roadmap')}
            sx={{ flex: 1, bgcolor: activeTab === 'roadmap' ? '#a855f7' : 'transparent', color: activeTab === 'roadmap' ? '#fff' : textColor, fontWeight: 'bold' }}
          >
            Visual Career Roadmap
          </Button>

          <Button
            variant={activeTab === 'interview' ? 'contained' : 'text'}
            startIcon={<RecordVoiceOverIcon />}
            onClick={() => setActiveTab('interview')}
            sx={{ flex: 1, bgcolor: activeTab === 'interview' ? '#10b981' : 'transparent', color: activeTab === 'interview' ? '#fff' : textColor, fontWeight: 'bold' }}
          >
            Interview Coaching
          </Button>
        </Paper>

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: paperBg, '& .MuiLinearProgress-bar': { bgcolor: '#38bdf8' } }} />}

        {/* TAB 1: AI CAREER CHAT & MEMORY SIDEBAR */}
        {activeTab === 'chat' && (
          <Grid container spacing={3}>
            {/* Sidebar: Conversation History & Career Memory */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, bgcolor: paperBg, border: `1px solid ${borderColor}`, borderRadius: 2.5, mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon sx={{ color: '#38bdf8' }} /> Session History
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
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 1 }}>
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
                      <Chip key={idx} label={goal} size="small" sx={{ bgcolor: '#0f172a', color: '#38bdf8', fontSize: 11 }} />
                    ))}
                  </Box>

                  <Typography variant="caption" fontWeight="bold" sx={{ color: textColor, display: 'block', mb: 1 }}>
                    Identified Skill Gaps:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {userContext?.skill_gaps?.map((sg, idx) => (
                      <Chip key={idx} label={sg} size="small" sx={{ bgcolor: '#0f172a', color: '#f43f5e', fontSize: 11 }} />
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

                  <Button variant="outlined" size="small" onClick={handleGenerateRoadmap} sx={{ color: '#a855f7', borderColor: '#a855f7', fontWeight: 'bold' }}>
                    Generate Roadmap
                  </Button>
                </Box>

                {/* Suggested Prompt Chips */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label="How to recover after job loss?"
                    onClick={() => setInputMessage("How do I recover after job loss and update my career plan?")}
                    sx={{ bgcolor: '#0f172a', color: '#38bdf8', cursor: 'pointer', border: '1px solid #334155' }}
                  />
                  <Chip
                    label="Optimize Go & System Design Resume"
                    onClick={() => setInputMessage("Review my Go backend and system design resume points.")}
                    sx={{ bgcolor: '#0f172a', color: '#38bdf8', cursor: 'pointer', border: '1px solid #334155' }}
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
                          bgcolor: m.sender === 'user' ? '#38bdf8' : '#0f172a',
                          color: m.sender === 'user' ? '#0f172a' : '#f8fafc',
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
                    sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', minWidth: 110 }}
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
                <Typography variant="h5" fontWeight="bold" sx={{ color: '#a855f7' }}>
                  Target Role: {careerPlan?.target_role || 'Principal Backend Architect'}
                </Typography>

                <Typography variant="body2" sx={{ color: subTextColor }}>
                  Current Level: {careerPlan?.current_level || 'Senior Software Engineer'} • Target Salary: {careerPlan?.target_salary || '$180,000 - $220,000'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ color: subTextColor }}>Roadmap Completion</Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#10b981' }}>{careerPlan?.progress_percentage || 45}%</Typography>
                </Box>
                <Button variant="contained" onClick={handleGenerateRoadmap} sx={{ bgcolor: '#a855f7', color: '#fff', fontWeight: 'bold' }}>
                  Regenerate Plan
                </Button>
              </Box>
            </Box>

            <Divider sx={{ mb: 4, borderColor }} />

            {/* Stepper Milestones */}
            <Stepper orientation="vertical" activeStep={1}>
              {careerPlan?.milestones.map((m, idx) => (
                <Step key={idx} active={true}>
                  <StepLabel
                    StepIconComponent={() => (
                      <Avatar sx={{ bgcolor: m.status === 'completed' ? '#10b981' : m.status === 'in_progress' ? '#38bdf8' : '#334155', width: 32, height: 32 }}>
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
                        <Chip key={sIdx} label={skill} size="small" sx={{ bgcolor: '#0f172a', color: '#38bdf8', border: '1px solid #334155' }} />
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
            <Typography variant="h5" fontWeight="bold" sx={{ color: '#10b981', mb: 1 }}>
              Simulated AI Technical & Behavioral Interview Coach
            </Typography>
            <Typography variant="body2" sx={{ color: subTextColor, mb: 3 }}>
              Practice mock questions tailored to your target role. Receive instant evaluation based on the STAR framework.
            </Typography>

            <Card sx={{ bgcolor: '#0f172a', border: '1px solid #334155', borderRadius: 2, mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Chip label="INTERVIEW QUESTION 1" size="small" sx={{ bgcolor: '#10b981', color: '#0f172a', fontWeight: 'bold', mb: 1.5 }} />
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc', mb: 1 }}>
                  "Tell me about a complex architectural decision where you had to balance low latency database performance against cost."
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Target Competency: System Architecture & PostgreSQL Optimization
                </Typography>
              </CardContent>
            </Card>

            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Type your STAR interview answer (Situation, Task, Action, Result)..."
              sx={{ input: { color: textColor }, mb: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor } }}
            />

            <Button variant="contained" sx={{ bgcolor: '#10b981', color: '#0f172a', fontWeight: 'bold', px: 4 }}>
              Submit Answer for AI Evaluation
            </Button>
          </Paper>
        )}
      </Container>
    </Box>
  );
}
