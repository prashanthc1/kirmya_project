'use client';

import React from 'react';
import { Box, Paper, Typography, Grid, Chip, Button, Stack } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import PeopleIcon from '@mui/icons-material/People';
import GroupsIcon from '@mui/icons-material/Groups';
import { CareerInsights } from '@/features/job-alerts/types';

interface LearningSuggestionsProps {
  insights?: CareerInsights;
}

export const LearningSuggestions: React.FC<LearningSuggestionsProps> = ({ insights }) => {
  if (!insights) return null;

  return (
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
            <SchoolIcon sx={{ color: 'primary.main' }} /> Recommended Learning Paths
          </Typography>
          <Stack spacing={1.5}>
            {insights.recommended_learning_paths.map((path) => (
              <Paper
                key={path}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'rgba(0, 102, 255, 0.08)',
                  border: '1px solid rgba(0, 102, 255, 0.2)',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{path}</Typography>
                <Button size="small" variant="text">Enroll</Button>
              </Paper>
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
            <WorkspacePremiumIcon sx={{ color: '#9933FF' }} /> Recommended Certifications
          </Typography>
          <Stack spacing={1.5}>
            {insights.recommended_certifications.map((cert) => (
              <Box key={cert} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{cert}</Typography>
                <Chip label="High Hiring Impact" size="small" color="secondary" sx={{ mt: 0.8, fontWeight: 700, fontSize: '0.68rem' }} />
              </Box>
            ))}
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
};
