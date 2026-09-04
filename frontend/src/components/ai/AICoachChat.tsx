'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  Stack,
  useTheme,
  CircularProgress,
  Divider,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface AICoachChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  suggestedPrompts?: string[];
  isLoading?: boolean;
}

export const AICoachChat: React.FC<AICoachChatProps> = ({
  messages,
  onSendMessage,
  suggestedPrompts = [
    'How do I practice STAR responses for system design?',
    'Review my Go microservices bullet points.',
    'What are the highest demand skills for Staff Engineer roles?',
  ],
  isLoading = false,
}) => {
  const [input, setInput] = useState('');
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput('');
    await onSendMessage(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: '1px solid',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        background: isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 520,
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2, mb: 2, borderBottom: '1px solid', borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
            <AutoAwesomeIcon fontSize="small" sx={{ color: 'primary.contrastText' }} />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'text.primary' }}>
              Kirmya AI Career Coach
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Grounded on your verified Kirmya profile & market requirements
            </Typography>
          </Box>
        </Box>

        <Chip
          icon={<SecurityIcon sx={{ fontSize: '0.9rem !important' }} />}
          label="Grounding Active"
          size="small"
          sx={{
            bgcolor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)',
            color: isDark ? '#4ade80' : '#166534',
            fontWeight: 600,
            fontSize: '0.75rem',
          }}
        />
      </Box>

      {/* Suggested Prompts */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {suggestedPrompts.map((p, idx) => (
            <Chip
              key={idx}
              label={p}
              size="small"
              onClick={() => setInput(p)}
              sx={{
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
                color: 'text.secondary',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(14, 165, 233, 0.15)',
                  color: isDark ? '#38bdf8' : '#0284c7',
                },
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Message Stream */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          maxHeight: 360,
          pr: 1,
          mb: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
            <AutoAwesomeIcon sx={{ fontSize: 40, mb: 1, opacity: 0.4 }} />
            <Typography variant="body2">Ask your Career Coach any question or choose a prompt above.</Typography>
          </Box>
        ) : (
          messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <Box
                key={m.id}
                sx={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  gap: 1,
                }}
              >
                {!isUser && (
                  <Avatar sx={{ bgcolor: 'primary.main', width: 28, height: 28, mt: 0.5 }}>
                    <AutoAwesomeIcon sx={{ fontSize: 16, color: 'primary.contrastText' }} />
                  </Avatar>
                )}

                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    maxWidth: '75%',
                    borderRadius: 2.5,
                    bgcolor: isUser
                      ? 'primary.main'
                      : isDark
                      ? 'rgba(30, 41, 59, 0.8)'
                      : 'rgba(241, 245, 249, 0.9)',
                    color: isUser
                      ? 'primary.contrastText'
                      : 'text.primary',
                    border: '1px solid',
                    borderColor: isUser
                      ? 'primary.main'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {m.content}
                  </Typography>
                </Paper>

                {isUser && (
                  <Avatar sx={{ bgcolor: 'text.secondary', width: 28, height: 28, mt: 0.5 }}>
                    <PersonIcon sx={{ fontSize: 16 }} />
                  </Avatar>
                )}
              </Box>
            );
          })
        )}
      </Box>

      {/* Message Input Box */}
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Type your message or STAR interview answer..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isLoading}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)',
            },
          }}
        />
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          endIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
          sx={{
            borderRadius: 2,
            px: 3,
            fontWeight: 600,
            textTransform: 'none',
          }}
        >
          Send
        </Button>
      </Box>
    </Paper>
  );
};

export default AICoachChat;
