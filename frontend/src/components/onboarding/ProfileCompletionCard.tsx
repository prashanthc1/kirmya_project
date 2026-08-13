'use client';

import React from 'react';
import {
  Card,
  Typography,
  LinearProgress,
  Box,
  Stack,
  Button,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Link from 'next/link';
import { ProfileCompletion } from '../../features/onboarding/types';

export const ProfileCompletionCard: React.FC<{ completion?: ProfileCompletion }> = ({ completion }) => {
  const score = completion?.completion_score || 85;
  const suggestions = completion?.actionable_suggestions || [
    'Add 2 more core technical skills',
    'Upload an updated resume for automated ATS parsing',
    'Set up job alert preferences',
  ];

  return (
    <Card sx={{ borderRadius: '24px', p: 3.5, bgcolor: 'background.paper' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Profile Completion Strength
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Higher completion rates boost candidate search visibility to employers.
          </Typography>
        </Box>
        <Chip
          label={`${score}% Complete`}
          color={score > 80 ? 'success' : score > 50 ? 'warning' : 'error'}
          sx={{ fontWeight: 800, fontSize: '0.9rem', px: 1 }}
        />
      </Stack>

      <Box sx={{ width: '100%', mb: 3 }}>
        <LinearProgress
          variant="determinate"
          value={score}
          sx={{
            height: 10,
            borderRadius: 5,
            bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': { borderRadius: 5 },
          }}
        />
      </Box>

      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
        Recommended Profile Improvements:
      </Typography>
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {suggestions.map((s, idx) => (
          <Stack direction="row" spacing={1} alignItems="center" key={idx}>
            <CheckCircleIcon color="primary" sx={{ fontSize: 18 }} />
            <Typography variant="body2">{s}</Typography>
          </Stack>
        ))}
      </Stack>

      <Button
        component={Link}
        href="/onboarding"
        variant="contained"
        endIcon={<ArrowForwardIcon />}
        sx={{ borderRadius: '12px', fontWeight: 800, py: 1.2, width: '100%' }}
      >
        Complete Remaining Steps
      </Button>
    </Card>
  );
};

export default ProfileCompletionCard;
