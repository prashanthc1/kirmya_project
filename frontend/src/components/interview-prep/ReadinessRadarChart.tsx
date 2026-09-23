'use client';

import React from 'react';
import { Paper, Box, Typography, Stack, LinearProgress } from '@mui/material';
import { InterviewReadinessScore } from '@/features/interview-prep/types';

interface ReadinessRadarChartProps {
  score?: InterviewReadinessScore;
}

export const ReadinessRadarChart: React.FC<ReadinessRadarChartProps> = ({ score }) => {
  const metrics = [
    { label: 'Technical Depth', val: score?.technical_readiness || 80, color: '#3B82F6' },
    { label: 'Behavioral STAR Structure', val: score?.behavioral_readiness || 72, color: '#8B5CF6' },
    { label: 'Communication Cadence', val: score?.communication_readiness || 85, color: '#10B981' },
    { label: 'Role & Skill Fit', val: score?.role_fit_readiness || 78, color: '#F59E0B' },
    { label: 'Company & Industry Knowledge', val: score?.company_knowledge_readiness || 70, color: '#EC4899' },
  ];

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
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5 }}>
        Category Skill Competency Breakdown
      </Typography>

      <Stack spacing={2.5}>
        {metrics.map((m, idx) => (
          <Box key={idx}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.8 }}>
              <Typography variant="body2" fontWeight={600} sx={{ color: "text.primary" }}>
                {m.label}
              </Typography>
              <Typography variant="body2" fontWeight={700} sx={{ color: m.color }}>
                {m.val}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={m.val}
              sx={{
                height: 10,
                borderRadius: 5,
                bgcolor: "action.hover",
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                  bgcolor: m.color,
                },
              }}
            />
          </Box>
        ))}
      </Stack>
    </Paper>
  );
};
