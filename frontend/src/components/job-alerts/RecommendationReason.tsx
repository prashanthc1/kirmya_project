'use client';

import React from 'react';
import { Box, Paper, Typography, Grid, Chip, LinearProgress, Divider, Stack } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

import { JobRecommendation } from '@/features/job-alerts/types';
import { MatchScoreIndicator } from './MatchScoreIndicator';

interface RecommendationReasonProps {
  recommendation: JobRecommendation;
}

export const RecommendationReason: React.FC<RecommendationReasonProps> = ({ recommendation }) => {
  const { score } = recommendation;

  const scoreItems = [
    { label: 'Skills Match', val: score.skills_match, color: '#0066FF' },
    { label: 'Experience Match', val: score.experience_match, color: '#9933FF' },
    { label: 'Education Match', val: score.education_match, color: '#00CCFF' },
    { label: 'Salary Match', val: score.salary_match, color: '#00CC66' },
    { label: 'Location Match', val: score.location_match, color: '#FF9900' },
    { label: 'Industry Match', val: score.industry_match, color: '#FF3366' },
    { label: 'Career Growth Score', val: score.growth_score, color: '#33CC33' },
    { label: 'Company Fit Score', val: score.company_fit_score, color: '#CC99FF' },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3.5,
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(153, 51, 255, 0.3)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AutoAwesomeIcon sx={{ color: '#9933FF', fontSize: 32 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              AI Match Breakdown
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Confidence Score: {score.confidence_score}% &bull; Tag: {recommendation.section_tag}
            </Typography>
          </Box>
        </Box>
        <MatchScoreIndicator score={score.overall_score} size={64} />
      </Box>

      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#9933FF' }}>
        Recommendation Reasons
      </Typography>
      <Stack spacing={1} sx={{ mb: 3 }}>
        {score.match_reasons.map((reason, idx) => (
          <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <CheckCircleOutlineIcon sx={{ color: '#00CC66', fontSize: 18, mt: 0.2 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {reason}
            </Typography>
          </Box>
        ))}
      </Stack>

      <Divider sx={{ my: 2.5, borderColor: 'rgba(255, 255, 255, 0.08)' }} />

      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
        Multi-Dimensional Scoring Vector
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {scoreItems.map((item) => (
          <Grid item xs={12} sm={6} key={item.label}>
            <Box sx={{ mb: 0.5, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>{item.label}</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: item.color }}>{item.val}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={item.val}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                '& .MuiLinearProgress-bar': { bgcolor: item.color },
              }}
            />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1, color: '#00CC66' }}>
            Matching Candidate Skills
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
            {score.matching_skills.map((s) => (
              <Chip key={s} label={s} size="small" sx={{ bgcolor: 'rgba(0, 204, 102, 0.12)', color: '#00CC66', fontWeight: 600 }} />
            ))}
          </Box>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1, color: '#FF9900' }}>
            Missing Skills / Target Areas
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
            {score.missing_skills.map((s) => (
              <Chip key={s} label={s} size="small" sx={{ bgcolor: 'rgba(255, 153, 0, 0.12)', color: '#FF9900', fontWeight: 600 }} />
            ))}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};
