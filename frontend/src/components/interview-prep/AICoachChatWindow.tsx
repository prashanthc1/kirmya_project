'use client';

import React, { useState } from 'react';
import { Paper, Box, Typography, TextField, Button, Stack, Avatar, IconButton } from '@mui/material';
import { AutoAwesome, Send, Person } from '@mui/icons-material';
import { AICoachSession, AICoachMessage } from '@/features/interview-prep/types';

interface AICoachChatWindowProps {
  session?: AICoachSession;
  onSendMessage: (msg: string, topic?: string) => Promise<void>;
}

export const AICoachChatWindow: React.FC<AICoachChatWindowProps> = ({ session, onSendMessage }) => {
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || loading) return;
    const text = inputMsg;
    setInputMsg('');
    setLoading(true);
    try {
      await onSendMessage(text, session?.topic || 'General Coaching');
    } finally {
      setLoading(false);
    }
  };

  const messages = session?.messages || [
    {
      sender: 'ai',
      content: 'Hello! I am your 24/7 AI Interview Coach. Ask me anything about behavioral questions, STAR method formatting, salary negotiation tactics, or dealing with interview stress.',
      timestamp: new Date().toISOString(),
    },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        height: 520,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2, pb: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <Avatar sx={{ bgcolor: '#8B5CF6' }}>
          <AutoAwesome />
        </Avatar>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            AI Interview Coach
          </Typography>
          <Typography variant="caption" sx={{ color: '#34D399' }}>
            ● Active Assistant
          </Typography>
        </Box>
      </Stack>

      {/* Messages Stream */}
      <Box sx={{ flex: 1, overflowY: 'auto', pr: 1, display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
        {messages.map((m, idx) => {
          const isUser = m.sender === 'user';
          return (
            <Box
              key={idx}
              sx={{
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                p: 2,
                borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: isUser ? 'linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)' : 'rgba(15, 23, 42, 0.8)',
                border: isUser ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                color: '#fff',
              }}
            >
              <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                {m.content}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Input Form */}
      <form onSubmit={handleSend}>
        <Stack direction="row" spacing={1.5}>
          <TextField
            fullWidth
            placeholder="Ask your AI coach a question (e.g. How do I answer tell me about yourself?)"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                bgcolor: 'rgba(15, 23, 42, 0.6)',
                borderRadius: 3,
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !inputMsg.trim()}
            sx={{
              background: 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)',
              color: '#fff',
              borderRadius: 3,
              px: 3,
            }}
          >
            <Send />
          </Button>
        </Stack>
      </form>
    </Paper>
  );
};
