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
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#fff',
      }}
    >
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5 }}>
        Category Skill Competency Breakdown
      </Typography>

      <Stack spacing={2.5}>
        {metrics.map((m, idx) => (
          <Box key={idx}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.8 }}>
              <Typography variant="body2" fontWeight={600} sx={{ color: '#F8FAFC' }}>
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
                bgcolor: 'rgba(255, 255, 255, 0.08)',
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
