'use client';

import React from 'react';
import { Box, Typography, Paper, Stack, Chip, LinearProgress, useTheme } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { AIMatchBreakdown } from '../../../features/recruiter/search/types';

interface MatchScoreCardProps {
  match: AIMatchBreakdown;
}

export const MatchScoreCard: React.FC<MatchScoreCardProps> = ({ match }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: '16px',
        bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <AutoAwesomeIcon sx={{ color: '#10b981' }} />
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            AI Match Score Breakdown
          </Typography>
        </Stack>
        <Chip label={`${match.overallScore}% MATCH`} color="success" sx={{ fontWeight: 900, fontSize: '0.85rem' }} />
      </Stack>

      <LinearProgress
        variant="determinate"
        value={match.overallScore}
        sx={{
          height: 10,
          borderRadius: 5,
          bgcolor: 'rgba(255, 255, 255, 0.1)',
          mb: 3,
          '& .MuiLinearProgress-bar': { bgcolor: '#10b981', borderRadius: 5 },
        }}
      />

      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
        Matching Skill Requirements:
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        {match.matchingSkills.map((sk) => (
          <Chip key={sk} label={sk} size="small" color="success" icon={<CheckCircleIcon fontSize="small" />} sx={{ fontWeight: 700 }} />
        ))}
      </Stack>

      {match.missingSkills.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
            Missing / Skill Gaps:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            {match.missingSkills.map((sk) => (
              <Chip key={sk} label={sk} size="small" color="error" icon={<CancelIcon fontSize="small" />} sx={{ fontWeight: 700 }} />
            ))}
          </Stack>
        </>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
        • Experience Alignment: {match.experienceAlignment}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>
        • Location Compatibility: {match.locationCompatibility}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>
        • Salary Expectation: {match.salaryAlignment}
      </Typography>
    </Paper>
  );
};

export default MatchScoreCard;
