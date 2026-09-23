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
        bgcolor: 'background.paper',
        border: 1, borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <AutoAwesomeIcon sx={{ color: 'primary.main', fontSize: 30 }} />
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
            sx={{ bgcolor: 'action.hover', fontWeight: 600, border: 1, borderColor: 'divider' }}
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
            bgcolor: 'primary.main',
          }}
        >
          {isLoading ? 'Enhancing...' : 'Optimize'}
        </Button>
      </Box>
    </Paper>
  );
};
