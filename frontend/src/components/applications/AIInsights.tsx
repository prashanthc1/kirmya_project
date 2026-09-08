'use client';

import React from 'react';
import { Box, Paper, Typography, Grid, LinearProgress, Stack, Alert } from '@mui/material';
import InsightsIcon from '@mui/icons-material/Insights';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { AIApplicationInsightsDTO } from '@/features/applications/types';

interface AIInsightsProps {
  insights?: AIApplicationInsightsDTO;
}

/**
 * What this candidate's own applications have actually done.
 *
 * This panel used to be headed "AI Hiring Insights & Match Optimization" and
 * showed a "Profile Match Score" and "Resume Match Score" as progress bars,
 * plus a list of "Missing Target Skills". Every one of those values was a
 * server-side constant — 85, 81, and the same three skills for every user on
 * the platform. There was no model, no comparison and nothing personal about
 * them.
 *
 * What replaces them is arithmetic the candidate could redo by counting their
 * own application list, and an explicit "not enough yet" state instead of a
 * confident percentage over one or two applications.
 */
export const AIInsights: React.FC<AIInsightsProps> = ({ insights }) => {
  if (!insights) return null;

  const rates = [
    {
      label: 'Employer response rate',
      value: insights.response_rate,
      description: 'Applications that drew any reply, including a rejection.',
      color: 'primary.main',
      barColor: undefined,
    },
    {
      label: 'Interview rate',
      value: insights.interview_rate,
      description: 'Applications that reached an interview or went further.',
      color: '#9933FF',
      barColor: '#9933FF',
    },
    {
      label: 'Offer rate',
      value: insights.offer_rate,
      description: 'Applications that reached an offer.',
      color: '#00CC66',
      barColor: '#00CC66',
    },
  ];

  return (
    <Paper
      elevation={0}
      component="section"
      aria-labelledby="application-insights-heading"
      sx={{
        p: 3.5,
        borderRadius: 3,
        background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.08) 0%, rgba(153, 51, 255, 0.08) 100%)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(153, 51, 255, 0.2)',
        mb: 4,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <InsightsIcon sx={{ color: '#9933FF', fontSize: 28 }} />
        <Typography id="application-insights-heading" variant="h6" sx={{ fontWeight: 700 }}>
          Your application outcomes
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
        Counted from your own applications. Withdrawn and draft applications are not included.
      </Typography>

      {!insights.sufficient ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          You have {insights.applications_considered}{' '}
          {insights.applications_considered === 1 ? 'application' : 'applications'} so far. Outcome rates
          appear once you have {insights.minimum_applications} — below that a single reply or rejection
          would swing the numbers too far to mean anything.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Stack spacing={2.5}>
              {rates.map((rate) => (
                <Box key={rate.label}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {rate.label}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: rate.color }}>
                      {rate.value}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={rate.value}
                    aria-label={`${rate.label}: ${rate.value} percent`}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      ...(rate.barColor
                        ? {
                            bgcolor: 'rgba(153, 51, 255, 0.2)',
                            '& .MuiLinearProgress-bar': { bgcolor: rate.barColor },
                          }
                        : {}),
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {rate.description}
                  </Typography>
                </Box>
              ))}
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              Across {insights.applications_considered} applications.
            </Typography>
          </Grid>

          <Grid item xs={12} md={5}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <LightbulbIcon sx={{ color: '#00CC66', fontSize: 20 }} /> General guidance
            </Typography>
            <Stack spacing={1}>
              {insights.general_guidance.map((tip) => (
                <Typography
                  key={tip}
                  variant="caption"
                  sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.4 }}
                >
                  &bull; {tip}
                </Typography>
              ))}
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, fontStyle: 'italic' }}>
              Standing advice, the same for everyone — not an analysis of your profile.
            </Typography>
          </Grid>
        </Grid>
      )}
    </Paper>
  );
};

export default AIInsights;
