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
        bgcolor: "background.paper",
        backdropFilter: 'blur(16px)',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        color: "text.primary",
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} justifyContent="space-between" alignItems={{ md: 'center' }}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h4" fontWeight={700} sx={{ bgcolor: "transparent", WebkitBackgroundClip: 'text', WebkitTextFillColor: "currentColor" }}>
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
                color: "primary.main",
                '&:hover': { borderColor: "primary.main", bgcolor: 'rgba(96, 165, 250, 0.1)' },
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
              bgcolor: "primary.main",
              color: "primary.contrastText",
              fontWeight: 600,
              borderRadius: 2.5,
              textTransform: 'none',
              px: 2.5,
              '&:hover': { bgcolor: "primary.main" },
            }}
          >
            Start AI Mock Interview
          </Button>

          {onOpenCreate && (
            <Button
              variant="outlined"
              onClick={onOpenCreate}
              sx={{
                borderColor: "divider",
                color: '#fff',
                '&:hover': { borderColor: "divider", bgcolor: "action.hover" },
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
