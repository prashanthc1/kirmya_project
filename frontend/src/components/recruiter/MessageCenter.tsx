'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Avatar,
  Stack,
  TextField,
  Button,
  IconButton,
  Chip,
  useTheme,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MessageIcon from '@mui/icons-material/Message';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import GlassCard from '../landing/GlassCard';

export const MessageCenter: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [activeCandidate, setActiveCandidate] = useState({ name: 'Sarah Chen', title: 'Senior Software Engineer' });
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([
    { id: 'm1', sender: 'candidate', text: 'Hi Rashid, thank you for reaching out regarding the Senior Microservices role!', time: '10:30 AM' },
    { id: 'm2', sender: 'recruiter', text: 'Hi Sarah! Your background in Go microservices and React is impressive. Are you available for a 30-min interview?', time: '10:32 AM' },
  ]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    setMessages([
      ...messages,
      { id: String(Date.now()), sender: 'recruiter', text: inputText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
    setInputText('');
  };

  const templates = [
    'Schedule Interview Invitation',
    'Application Receipt Confirmation',
    'Follow-up on Salary Expectations',
  ];

  return (
    <GlassCard sx={{ p: { xs: 2, md: 3 }, mb: 4 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <MessageIcon sx={{ color: '#06b6d4', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 900 }}>
          Recruiter Candidate Communication Hub
        </Typography>
      </Stack>

      <Grid container spacing={2.5}>
        {/* Conversation List */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '16px',
              bgcolor: isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(241, 245, 249, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
              Active Conversations
            </Typography>
            <Stack spacing={1}>
              {[
                { name: 'Sarah Chen', title: 'Staff Engineer (Go)', time: '10:32 AM' },
                { name: 'Tariq Al-Mansoor', title: 'Facilities Director', time: 'Yesterday' },
                { name: 'Elena Rostova', title: 'Lead AI Engineer', time: '3 days ago' },
              ].map((c) => (
                <Paper
                  key={c.name}
                  elevation={0}
                  onClick={() => setActiveCandidate({ name: c.name, title: c.title })}
                  sx={{
                    p: 1.5,
                    borderRadius: '12px',
                    bgcolor: activeCandidate.name === c.name ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' },
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 800 }}>{c.name[0]}</Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        {c.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {c.title}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {c.time}
                    </Typography>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* Chat Thread */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '16px',
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              height: 420,
            }}
          >
            {/* Header */}
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ pb: 1.5, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 800 }}>{activeCandidate.name[0]}</Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  {activeCandidate.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {activeCandidate.title}
                </Typography>
              </Box>
            </Stack>

            {/* Message History */}
            <Stack spacing={1.5} sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, mb: 2 }}>
              {messages.map((m) => (
                <Box
                  key={m.id}
                  sx={{
                    alignSelf: m.sender === 'recruiter' ? 'flex-end' : 'flex-start',
                    maxWidth: '75%',
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.8,
                      borderRadius: '14px',
                      bgcolor: m.sender === 'recruiter' ? 'primary.main' : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      color: m.sender === 'recruiter' ? '#ffffff' : 'text.primary',
                    }}
                  >
                    <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                      {m.text}
                    </Typography>
                  </Paper>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.4, textAlign: m.sender === 'recruiter' ? 'right' : 'left' }}>
                    {m.time}
                  </Typography>
                </Box>
              ))}
            </Stack>

            {/* Template Buttons */}
            <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
              {templates.map((tmpl) => (
                <Chip
                  key={tmpl}
                  label={`+ ${tmpl}`}
                  size="small"
                  onClick={() => setInputText(`Hi ${activeCandidate.name}, ${tmpl.toLowerCase()}...`)}
                  sx={{ fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}
                />
              ))}
            </Stack>

            {/* Input Bar */}
            <Stack direction="row" spacing={1.5}>
              <TextField
                placeholder="Write message or select pre-built response template..."
                fullWidth
                size="small"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <Button variant="contained" onClick={handleSend} endIcon={<SendIcon />} sx={{ borderRadius: '10px', fontWeight: 800 }}>
                Send
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </GlassCard>
  );
};

export default MessageCenter;
