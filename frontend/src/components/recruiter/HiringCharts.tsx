'use client';

import React from 'react';
import { Grid, Typography, Paper, Stack, LinearProgress, useTheme } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import GlassCard from '../landing/GlassCard';

export const HiringCharts: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const funnelStages = [
    { stage: 'Applied', count: 142, color: '#6366f1' },
    { stage: 'Screening', count: 68, color: '#06b6d4' },
    { stage: 'Shortlisted', count: 34, color: '#f59e0b' },
    { stage: 'Interview / Tech Round', count: 18, color: '#ec4899' },
    { stage: 'Offer / Hired', count: 8, color: '#10b981' },
  ];

  const sources = [
    { name: 'Kirmya AI Referral Network', percentage: 54, color: '#6366f1' },
    { name: 'Direct Inbound Applications', percentage: 28, color: '#10b981' },
    { name: 'Recruiter Headhunting', percentage: 18, color: '#ec4899' },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {/* Hiring Funnel Breakdown */}
      <Grid item xs={12} md={7}>
        <GlassCard sx={{ p: 3, height: '100%' }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
            <FilterAltIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Recruitment Conversion Funnel
            </Typography>
          </Stack>

          <Stack spacing={2}>
            {funnelStages.map((st) => (
              <div key={st.stage}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {st.stage}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: st.color }}>
                    {st.count} Candidates
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={(st.count / 142) * 100}
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

      {/* Candidate Source Efficiency */}
      <Grid item xs={12} md={5}>
        <GlassCard sx={{ p: 3, height: '100%' }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
            <BarChartIcon sx={{ color: '#10b981' }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Candidate Source Channels
            </Typography>
          </Stack>

          <Stack spacing={2.5}>
            {sources.map((src) => (
              <Paper
                key={src.name}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: '14px',
                  bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {src.name}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: src.color }}>
                    {src.percentage}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={src.percentage}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    '& .MuiLinearProgress-bar': { bgcolor: src.color, borderRadius: 3 },
                  }}
                />
              </Paper>
            ))}
          </Stack>
        </GlassCard>
      </Grid>
    </Grid>
  );
};

export default HiringCharts;
