'use client';

import React from 'react';
import { Box, CircularProgress, Typography, Skeleton, Grid } from '@mui/material';

export interface LoadingStateProps {
  type?: 'spinner' | 'page' | 'cards' | 'list';
  message?: string;
  count?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'spinner',
  message = 'Loading...',
  count = 3,
}) => {
  if (type === 'page') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 2,
        }}
        role="status"
        aria-live="polite"
      >
        <CircularProgress size={44} thickness={4} color="primary" />
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </Box>
    );
  }

  if (type === 'cards') {
    return (
      <Grid container spacing={3} role="status" aria-label="Loading content">
        {Array.from({ length: count }).map((_, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                border: (theme) => `1px solid ${theme.palette.divider}`,
              }}
            >
              <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 1.5, mb: 2 }} />
              <Skeleton variant="text" width="80%" height={28} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="60%" height={20} sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Skeleton variant="rounded" width={60} height={24} />
                <Skeleton variant="rounded" width={80} height={24} />
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (type === 'list') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} role="status" aria-label="Loading list">
        {Array.from({ length: count }).map((_, index) => (
          <Box
            key={index}
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Skeleton variant="circular" width={48} height={48} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="50%" height={24} sx={{ mb: 0.5 }} />
              <Skeleton variant="text" width="30%" height={18} />
            </Box>
            <Skeleton variant="rounded" width={90} height={36} />
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        gap: 1.5,
      }}
      role="status"
      aria-live="polite"
    >
      <CircularProgress size={24} thickness={4} color="primary" />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingState;
