'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  Spellcheck as GrammarIcon,
  ShortText as ShortenIcon,
  FormatQuote as ToneIcon,
} from '@mui/icons-material';

export interface AIWritingAssistantProps {
  onAction: (actionType: string) => Promise<void>;
}

export const AIWritingAssistant: React.FC<AIWritingAssistantProps> = ({ onAction }) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleTrigger = async (action: string) => {
    setLoadingAction(action);
    try {
      await onAction(action);
    } finally {
      setLoadingAction(null);
    }
  };

  const ACTIONS = [
    { id: 'rewrite', label: 'Rewrite Section', icon: <AIIcon fontSize="small" /> },
    { id: 'shorten', label: 'Make More Concise', icon: <ShortenIcon fontSize="small" /> },
    { id: 'opening', label: 'Improve Opening', icon: <ToneIcon fontSize="small" /> },
    { id: 'grammar', label: 'Grammar & ATS Check', icon: <GrammarIcon fontSize="small" /> },
  ];

  return (
    <Card
      sx={{
        background: 'rgba(99, 102, 241, 0.08)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: 3,
        p: 2,
      }}
    >
      <Box display="flex" alignItems="center" mb={1.5} gap={1}>
        <AIIcon sx={{ color: '#818cf8' }} />
        <Typography variant="h6" fontWeight={700} color="text.primary">
          AI Copilot Assistant
        </Typography>
        <Chip label="Zero Hallucinations" size="small" color="primary" variant="outlined" />
      </Box>

      <Typography variant="body2" color="text.secondary" mb={2}>
        Enhance your letter using verified facts directly from your Kirmya profile and resume.
      </Typography>

      <Stack direction="row" flexWrap="wrap" gap={1.5}>
        {ACTIONS.map((a) => (
          <Button
            key={a.id}
            variant="outlined"
            size="small"
            startIcon={loadingAction === a.id ? <CircularProgress size={14} /> : a.icon}
            disabled={!!loadingAction}
            onClick={() => handleTrigger(a.id)}
            sx={{
              borderRadius: 2,
              borderColor: 'rgba(99, 102, 241, 0.4)',
              color: '#c7d2fe',
              '&:hover': {
                borderColor: '#6366f1',
                background: 'rgba(99, 102, 241, 0.15)',
              },
            }}
          >
            {a.label}
          </Button>
        ))}
      </Stack>
    </Card>
  );
};
