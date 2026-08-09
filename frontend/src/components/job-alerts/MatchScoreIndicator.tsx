'use client';

import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

interface MatchScoreIndicatorProps {
  score: number;
  size?: number;
  showLabel?: boolean;
}

export const MatchScoreIndicator: React.FC<MatchScoreIndicatorProps> = ({ score, size = 64, showLabel = true }) => {
  const getColor = (val: number) => {
    if (val >= 90) return '#00CC66';
    if (val >= 75) return '#0066FF';
    if (val >= 60) return '#FF9900';
    return '#FF3366';
  };

  const color = getColor(score);

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress
        variant="determinate"
        value={100}
        size={size}
        thickness={5}
        sx={{ color: 'rgba(255, 255, 255, 0.08)' }}
      />
      <CircularProgress
        variant="determinate"
        value={score}
        size={size}
        thickness={5}
        sx={{
          color: color,
          position: 'absolute',
          left: 0,
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          },
        }}
      />
      {showLabel && (
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 800, fontSize: size > 50 ? '0.9rem' : '0.75rem', color: 'text.primary' }}>
            {score}%
          </Typography>
        </Box>
      )}
    </Box>
  );
};
