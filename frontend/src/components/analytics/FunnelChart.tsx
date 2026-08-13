'use client';

import React from 'react';
import { Box, Card, CardContent, Typography, LinearProgress } from '@mui/material';
import { FunnelStageItem } from '@/features/analytics/types';

interface FunnelChartProps {
  title: string;
  stages: FunnelStageItem[];
}

export default function FunnelChart({ title, stages }: FunnelChartProps) {
  return (
    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ color: '#fff', mb: 2 }}>
          {title}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {stages.map((stg, idx) => (
            <Box key={idx}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: '#cbd5e1', fontWeight: 600 }}>
                  {stg.stage}
                </Typography>
                <Typography variant="body2" sx={{ color: '#38bdf8', fontWeight: 'bold' }}>
                  {stg.count} ({stg.percentage.toFixed(1)}%)
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={stg.percentage}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: '#0f172a',
                  '& .MuiLinearProgress-bar': { bgcolor: '#0284c7', borderRadius: 5 },
                }}
              />
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
