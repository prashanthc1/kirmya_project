'use client';

import React from 'react';
import { Box, Typography, Grid, Paper, Stack, useTheme } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import Diversity1Icon from '@mui/icons-material/Diversity1';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GlassCard from '../landing/GlassCard';

interface LifeAtCompanyProps {
  culture: string;
}

export const LifeAtCompany: React.FC<LifeAtCompanyProps> = ({ culture }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const pillars = [
    { title: 'Workplace Culture', desc: culture || 'We foster an innovative, collaborative, and inclusive environment.', icon: <WbSunnyIcon sx={{ color: '#f59e0b' }} /> },
    { title: 'Diversity & Inclusion', desc: 'Promoting global perspectives, equal growth opportunity, and multi-cultural teamwork.', icon: <Diversity1Icon sx={{ color: '#ec4899' }} /> },
    { title: 'Career Progression', desc: 'Structured mentorship, fast-track internal promotions, and global mobility paths.', icon: <TrendingUpIcon sx={{ color: '#10b981' }} /> },
  ];

  return (
    <GlassCard sx={{ p: { xs: 3, md: 4 }, mb: 4 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <WbSunnyIcon sx={{ color: '#f59e0b', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 900 }}>
          Life &amp; Culture at the Organization
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        {pillars.map((p, idx) => (
          <Grid item xs={12} md={4} key={idx}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                height: '100%',
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                {p.icon}
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  {p.title}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {p.desc}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </GlassCard>
  );
};

export default LifeAtCompany;
