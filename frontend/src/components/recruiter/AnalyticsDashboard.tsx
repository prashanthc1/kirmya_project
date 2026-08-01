'use client';

import React from 'react';
import { Box, Grid, Typography, Paper, Stack, LinearProgress, useTheme } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GlassCard from '../landing/GlassCard';

export const AnalyticsDashboard: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const metrics = [
    { label: 'Average Time To Hire', value: '16 Days', icon: <AccessTimeIcon sx={{ color: '#6366f1' }} /> },
    { label: 'Cost Per Hire', value: '$1,240', icon: <AttachMoneyIcon sx={{ color: '#10b981' }} /> },
    { label: 'Applicant-to-Interview', value: '24.8%', icon: <TrendingUpIcon sx={{ color: '#f59e0b' }} /> },
    { label: 'Offer Acceptance Rate', value: '88.5%', icon: <BarChartIcon sx={{ color: '#ec4899' }} /> },
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 900, mb: 3 }}>
        Recruitment Performance &amp; Analytics
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((m, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: '12px',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                }}
              >
                {m.icon}
              </Paper>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  {m.value}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  {m.label}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard;
