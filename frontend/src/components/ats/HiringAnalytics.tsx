'use client';

import React from 'react';
import { Box, Grid, Typography, Paper, Stack, LinearProgress, useTheme } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GlassCard from '../landing/GlassCard';

export const HiringAnalytics: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const stages = [
    { name: 'Applied to Screening', days: 1.2, color: '#6366f1' },
    { name: 'Screening to Interview', days: 3.5, color: '#06b6d4' },
    { name: 'Interview to Tech Round', days: 4.8, color: '#f59e0b' },
    { name: 'Tech Round to Offer', days: 5.2, color: '#ec4899' },
    { name: 'Offer to Accepted', days: 2.1, color: '#10b981' },
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 900, mb: 3 }}>
        ATS Recruitment Pipeline Velocity &amp; Analytics
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <GlassCard sx={{ p: 3, height: '100%' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
              <AccessTimeIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Average Time Spent Per Stage
              </Typography>
            </Stack>

            <Stack spacing={2.5}>
              {stages.map((st) => (
                <div key={st.name}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {st.name}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: st.color }}>
                      {st.days} Days
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={(st.days / 6) * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'rgba(255, 255, 255, 0.08)',
                      '& .MuiLinearProgress-bar': { bgcolor: st.color, borderRadius: 4 },
                    }}
                  />
                </div>
              ))}
            </Stack>
          </GlassCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <GlassCard sx={{ p: 3, height: '100%' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
              <BarChartIcon sx={{ color: '#10b981' }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Application Source Conversion Performance
              </Typography>
            </Stack>

            <Stack spacing={2}>
              {[
                { source: 'Kirmya AI Referral Network', hiredCount: 8, conversion: '32.5%', color: '#6366f1' },
                { source: 'Inbound Job Board Applications', hiredCount: 4, conversion: '14.2%', color: '#10b981' },
                { source: 'Direct Recruiter Outreach', hiredCount: 3, conversion: '28.0%', color: '#ec4899' },
              ].map((src) => (
                <Paper
                  key={src.source}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: '14px',
                    bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {src.source}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: src.color }}>
                      {src.conversion} Conversion ({src.hiredCount} Hires)
                    </Typography>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HiringAnalytics;
