'use client';

import React from 'react';
import { Paper, Box, Typography, Stack, CircularProgress } from '@mui/material';
import { InterviewReadinessScore } from '@/features/interview-prep/types';

interface ReadinessScoreMeterProps {
  score?: InterviewReadinessScore;
}

export const ReadinessScoreMeter: React.FC<ReadinessScoreMeterProps> = ({ score }) => {
  const overall = score?.overall_readiness || 75;
  const technical = score?.technical_readiness || 80;
  const behavioral = score?.behavioral_readiness || 72;
  const communication = score?.communication_readiness || 85;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        bgcolor: "background.paper",
        backdropFilter: 'blur(12px)',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        color: "text.primary",
      }}
    >
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        Interview Readiness Index
      </Typography>

      <Stack direction="row" spacing={3} alignItems="center" justifyContent="space-between">
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress
            variant="determinate"
            value={100}
            size={90}
            thickness={6}
            sx={{ color: 'rgba(255, 255, 255, 0.08)' }}
          />
          <CircularProgress
            variant="determinate"
            value={overall}
            size={90}
            thickness={6}
            sx={{
              color: "primary.main",
              position: 'absolute',
              left: 0,
              '& .MuiCircularProgress-circle': { strokeLinecap: 'round' },
            }}
          />
          <Box
            sx={{
              top: 0, left: 0, bottom: 0, right: 0,
              position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column',
            }}
          >
            <Typography variant="h5" fontWeight={800} sx={{ color: "text.primary" }}>
              {overall}%
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: '0.65rem' }}>
              READINESS
            </Typography>
          </Box>
        </Box>

        <Stack spacing={1.2} flex={1}>
          <Box>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.3 }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>Technical Depth</Typography>
              <Typography variant="caption" fontWeight={700} sx={{ color: "primary.main" }}>{technical}%</Typography>
            </Stack>
            <Box sx={{ height: 6, borderRadius: 3, bgcolor: "action.hover", overflow: 'hidden' }}>
              <Box sx={{ width: `${technical}%`, height: '100%', bgcolor: "primary.main", borderRadius: 3 }} />
            </Box>
          </Box>

          <Box>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.3 }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>Behavioral STAR</Typography>
              <Typography variant="caption" fontWeight={700} sx={{ color: "primary.main" }}>{behavioral}%</Typography>
            </Stack>
            <Box sx={{ height: 6, borderRadius: 3, bgcolor: "action.hover", overflow: 'hidden' }}>
              <Box sx={{ width: `${behavioral}%`, height: '100%', bgcolor: "primary.main", borderRadius: 3 }} />
            </Box>
          </Box>

          <Box>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.3 }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>Communication</Typography>
              <Typography variant="caption" fontWeight={700} sx={{ color: '#34D399' }}>{communication}%</Typography>
            </Stack>
            <Box sx={{ height: 6, borderRadius: 3, bgcolor: "action.hover", overflow: 'hidden' }}>
              <Box sx={{ width: `${communication}%`, height: '100%', bgcolor: '#10B981', borderRadius: 3 }} />
            </Box>
          </Box>
        </Stack>
      </Stack>
    </Paper>
  );
};
