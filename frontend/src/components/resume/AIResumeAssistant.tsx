'use client';

import React, { useState } from 'react';
import { Paper, Box, Typography, Button, Stack, TextField, Chip } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SpellcheckIcon from '@mui/icons-material/Spellcheck';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface AIResumeAssistantProps {
  onOptimize: () => void;
  isLoading?: boolean;
}

export const AIResumeAssistant: React.FC<AIResumeAssistantProps> = ({ onOptimize, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        background: 'linear-gradient(135deg, rgba(153, 51, 255, 0.08) 0%, rgba(0, 102, 255, 0.08) 100%)',
        border: '1px solid rgba(153, 51, 255, 0.3)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <AutoAwesomeIcon sx={{ color: '#9933FF', fontSize: 30 }} />
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          AI Resume Copilot
        </Typography>
      </Box>

      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Intelligent enhancement engine. Improve bullet points, quantify metrics, optimize keywords, and fix formatting without fabricating factual credentials.
      </Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
        {['Fix Grammar', 'Quantify Impact', 'ATS Keyword Check', 'Shorten Bullets'].map((chip) => (
          <Chip
            key={chip}
            label={chip}
            size="small"
            clickable
            onClick={() => setPrompt(chip)}
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.06)', fontWeight: 600, border: '1px solid rgba(255, 255, 255, 0.1)' }}
          />
        ))}
      </Stack>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Ask AI to enhance specific section..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <Button
          variant="contained"
          onClick={onOptimize}
          disabled={isLoading}
          startIcon={<AutoAwesomeIcon />}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 800,
            px: 3,
            background: 'linear-gradient(90deg, #9933FF 0%, #0066FF 100%)',
          }}
        >
          {isLoading ? 'Enhancing...' : 'Optimize'}
        </Button>
      </Box>
    </Paper>
  );
};
