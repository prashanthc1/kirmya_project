'use client';

import React from 'react';
import { Box, Paper, Typography, Grid, LinearProgress, Stack, Chip } from '@mui/material';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import { CareerInsights as CareerInsightsType } from '@/features/job-alerts/types';

interface CareerInsightsProps {
  insights?: CareerInsightsType;
}

export const CareerInsightsComponent: React.FC<CareerInsightsProps> = ({ insights }) => {
  if (!insights) return null;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <EqualizerIcon sx={{ color: 'primary.main', fontSize: 32 }} />
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          AI Hiring & Career Intelligence
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon sx={{ color: 'primary.main' }} /> Top Demanded Skills
            </Typography>
            <Stack spacing={2}>
              {insights.most_demanded_skills.map((skill) => (
                <Box key={skill.name}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{skill.name}</Typography>
                    <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 700 }}>
                      {skill.count} open roles
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(skill.count / 1500) * 100}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <WorkIcon sx={{ color: '#9933FF' }} /> Salary Benchmarks & Growth
            </Typography>
            <Stack spacing={2}>
              {insights.salary_trends.map((st) => (
                <Box key={st.role} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{st.role}</Typography>
                    <Chip label={`+${st.growth_pct}% YOY`} size="small" color="success" sx={{ fontWeight: 700 }} />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#00CC66', fontWeight: 700, mt: 0.5 }}>
                    Average Salary: ${st.avg_salary.toLocaleString()} / yr
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.08) 0%, rgba(153, 51, 255, 0.08) 100%)',
              border: '1px solid rgba(153, 51, 255, 0.2)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <LightbulbIcon sx={{ color: '#FF9900' }} /> Career Acceleration Suggestions
            </Typography>
            <Stack spacing={1.5}>
              {insights.career_progress_suggestions.map((sug, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: '#FF9900', fontWeight: 700 }}>
                    {i + 1}.
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6 }}>
                    {sug}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
