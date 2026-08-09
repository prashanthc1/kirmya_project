'use client';

import React from 'react';
import { Box, Paper, Typography, Grid, LinearProgress, Stack } from '@mui/material';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import { CareerAnalyticsDTO } from '@/features/applications/types';

interface ApplicationAnalyticsProps {
  analytics?: CareerAnalyticsDTO;
}

export const ApplicationAnalytics: React.FC<ApplicationAnalyticsProps> = ({ analytics }) => {
  if (!analytics) return null;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <EqualizerIcon sx={{ color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Career Search Analytics
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
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Top Applied Roles
            </Typography>
            <Stack spacing={2}>
              {analytics.most_applied_roles.map((role) => (
                <Box key={role.name}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{role.name}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {role.count} apps
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={(role.count / 10) * 100} sx={{ height: 6, borderRadius: 3 }} />
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
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Application Funnel Efficiency
            </Typography>
            <Stack spacing={2}>
              {analytics.status_funnel.map((funnel) => (
                <Box key={funnel.stage}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{funnel.stage}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {funnel.count}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(funnel.count / 18) * 100}
                    sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(0, 102, 255, 0.1)' }}
                  />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
