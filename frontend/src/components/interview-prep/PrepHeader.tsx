'use client';

import React from 'react';
import { Box, Typography, Button, Stack, Chip, Paper } from '@mui/material';
import { AutoAwesome, PlayArrow, Quiz, Assessment, EventAvailable } from '@mui/icons-material';
import Link from 'next/link';

interface PrepHeaderProps {
  readinessScore?: number;
  onOpenCreate?: () => void;
  onOpenWarmup?: () => void;
}

export const PrepHeader: React.FC<PrepHeaderProps> = ({
  readinessScore = 75,
  onOpenCreate,
  onOpenWarmup,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 4,
        borderRadius: 4,
        background: 'linear-gradient(135deg, rgba(24, 32, 54, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#fff',
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} justifyContent="space-between" alignItems={{ md: 'center' }}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h4" fontWeight={700} sx={{ background: 'linear-gradient(90deg, #60A5FA 0%, #A78BFA 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AI Interview Preparation & Coach
            </Typography>
            <Chip
              icon={<AutoAwesome sx={{ color: '#F59E0B !important', fontSize: '1rem' }} />}
              label="AI Powered"
              size="small"
              sx={{
                bgcolor: 'rgba(245, 158, 11, 0.15)',
                color: '#FBBF24',
                borderColor: 'rgba(245, 158, 11, 0.3)',
                fontWeight: 600,
              }}
            />
          </Stack>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Master job-specific interviews with AI mock sessions, STAR method structuring, and personalized coaching.
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} flexWrap="wrap">
          {onOpenWarmup && (
            <Button
              variant="outlined"
              startIcon={<EventAvailable />}
              onClick={onOpenWarmup}
              sx={{
                borderColor: 'rgba(96, 165, 250, 0.4)',
                color: '#93C5FD',
                '&:hover': { borderColor: '#60A5FA', bgcolor: 'rgba(96, 165, 250, 0.1)' },
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Interview Day Mode
            </Button>
          )}

          <Button
            component={Link}
            href="/dashboard/interview-prep/mock"
            variant="contained"
            startIcon={<PlayArrow />}
            sx={{
              background: 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)',
              color: '#fff',
              fontWeight: 600,
              borderRadius: 2.5,
              textTransform: 'none',
              px: 2.5,
              '&:hover': { background: 'linear-gradient(90deg, #2563EB 0%, #7C3AED 100%)' },
            }}
          >
            Start AI Mock Interview
          </Button>

          {onOpenCreate && (
            <Button
              variant="outlined"
              onClick={onOpenCreate}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: '#fff',
                '&:hover': { borderColor: 'rgba(255, 255, 255, 0.4)', bgcolor: 'rgba(255, 255, 255, 0.05)' },
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              + New Target Prep
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
};
