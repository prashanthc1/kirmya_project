'use client';

import React from 'react';
import { Box, Container, Grid, Typography, Stack, useTheme } from '@mui/material';
import GlassCard from './GlassCard';
import AnimatedCounter from './AnimatedCounter';

export const MetricsSection: React.FC = () => {
  const theme = useTheme();

  const metrics = [
    { label: 'Jobs Posted', value: '25,480+' },
    { label: 'Applications Submitted', value: '350,000+' },
    { label: 'Successful Hires', value: '18,450+' },
    { label: 'Communities Active', value: '120+' },
    { label: 'Messages Sent', value: '1,250,000+' },
    { label: 'Referrals Granted', value: '45,200+' },
    { label: 'Companies Hiring', value: '4,850+' },
    { label: 'Countries Served', value: '120+' },
  ];

  return (
    <Box sx={{ py: 10, position: 'relative' }}>
      <Container maxWidth="xl">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              letterSpacing: 2,
              color: 'primary.main',
              textTransform: 'uppercase',
              display: 'block',
              mb: 1,
            }}
          >
            GLOBAL IMPACT & GROWTH
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, color: 'text.primary' }}>
            Kirmya By The Numbers
          </Typography>
        </Box>

        <Grid container spacing={2.5}>
          {metrics.map((m, idx) => (
            <Grid item xs={6} sm={3} md={1.5} key={idx} sx={{ flexGrow: 1 }}>
              <GlassCard sx={{ p: 2.5, textAlign: 'center' }}>
                <Stack spacing={0.8} alignItems="center">
                  <AnimatedCounter
                    value={m.value}
                    variant="h5"
                    sx={{ fontWeight: 900, color: 'primary.main' }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>
                    {m.label}
                  </Typography>
                </Stack>
              </GlassCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default MetricsSection;
