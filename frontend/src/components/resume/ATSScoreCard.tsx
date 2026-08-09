'use client';

import React from 'react';
import { Box, Paper, Typography, LinearProgress, Stack, Grid, Tooltip } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SpeedIcon from '@mui/icons-material/Speed';

interface ATSScoreCardProps {
  score: number;
  keywordScore?: number;
  experienceScore?: number;
  formattingScore?: number;
  skillsScore?: number;
}

export const ATSScoreCard: React.FC<ATSScoreCardProps> = ({
  score,
  keywordScore = 92,
  experienceScore = 88,
  formattingScore = 95,
  skillsScore = 90,
}) => {
  const getScoreColor = (val: number) => {
    if (val >= 90) return '#00CC66';
    if (val >= 75) return '#0066FF';
    if (val >= 60) return '#FF9900';
    return '#FF3366';
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SpeedIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            ATS Optimization Score
          </Typography>
        </Box>
        <Box
          sx={{
            px: 2,
            py: 0.5,
            borderRadius: 2,
            background: `${getScoreColor(score)}15`,
            border: `1px solid ${getScoreColor(score)}40`,
            color: getScoreColor(score),
            fontWeight: 800,
            fontSize: '1.25rem',
          }}
        >
          {score} / 100
        </Box>
      </Box>

      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Calculated against enterprise Applicant Tracking Systems (Workday, Greenhouse, Lever, Taleo)
      </Typography>

      <Grid container spacing={2}>
        {[
          { label: 'Keyword Density', val: keywordScore },
          { label: 'Impact & Quantification', val: experienceScore },
          { label: 'ATS Format Parsing', val: formattingScore },
          { label: 'Skills Relevance', val: skillsScore },
        ].map((item) => (
          <Grid item xs={6} key={item.label}>
            <Stack spacing={0.75}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  {item.label}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: getScoreColor(item.val) }}>
                  {item.val}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={item.val}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: getScoreColor(item.val),
                    borderRadius: 3,
                  },
                }}
              />
            </Stack>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};
