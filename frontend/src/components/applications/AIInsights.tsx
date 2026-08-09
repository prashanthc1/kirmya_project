'use client';

import React from 'react';
import { Box, Paper, Typography, Grid, LinearProgress, Chip, Stack } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import { AIApplicationInsightsDTO } from '@/features/applications/types';

interface AIInsightsProps {
  insights?: AIApplicationInsightsDTO;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ insights }) => {
  if (!insights) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3.5,
        borderRadius: 3,
        background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.08) 0%, rgba(153, 51, 255, 0.08) 100%)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(153, 51, 255, 0.2)',
        mb: 4,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <AutoAwesomeIcon sx={{ color: '#9933FF', fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          AI Hiring Insights & Match Optimization
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Profile Match Score
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {insights.profile_match_score}%
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={insights.profile_match_score} sx={{ height: 8, borderRadius: 4 }} />
          </Box>

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Resume Match Score
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#9933FF' }}>
                {insights.resume_match_score}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={insights.resume_match_score}
              sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(153, 51, 255, 0.2)', '& .MuiLinearProgress-bar': { bgcolor: '#9933FF' } }}
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningAmberIcon sx={{ color: '#FF9900', fontSize: 20 }} /> Missing Target Skills
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {insights.missing_skills.map((skill) => (
              <Chip key={skill} label={skill} size="small" sx={{ bgcolor: 'rgba(255, 153, 0, 0.12)', color: '#FF9900', fontWeight: 600 }} />
            ))}
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LightbulbIcon sx={{ color: '#00CC66', fontSize: 20 }} /> Recommendations
          </Typography>
          <Stack spacing={1}>
            {insights.improvement_suggestions.map((sug, i) => (
              <Typography key={i} variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.4 }}>
                &bull; {sug}
              </Typography>
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );
};
