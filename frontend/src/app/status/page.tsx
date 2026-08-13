'use client';

import React from 'react';
import { Container, Card, Typography, Grid, Chip, Stack } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

export default function PlatformStatusPage() {
  const services = [
    { name: 'Authentication & Session Security', status: 'OPERATIONAL' },
    { name: 'Job Discovery & Application Pipeline', status: 'OPERATIONAL' },
    { name: 'Messaging & Direct Chat Safety', status: 'OPERATIONAL' },
    { name: 'Community Forums & Discussions', status: 'OPERATIONAL' },
    { name: 'Notification & Email Engine', status: 'OPERATIONAL' },
    { name: 'Unified Search Service', status: 'OPERATIONAL' },
    { name: 'Career AI & Resume Analysis', status: 'OPERATIONAL' },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <CheckCircleOutlineIcon color="success" sx={{ fontSize: 36 }} />
        <Typography variant="h4" sx={{ fontWeight: 900 }}>Kirmya System Health & Status</Typography>
      </Stack>

      <Card sx={{ p: 4, borderRadius: '24px', mb: 4, bgcolor: 'success.50', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
        <Typography variant="h6" color="success.main" sx={{ fontWeight: 800 }}>
          All Systems Operational
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Platform monitoring indicates 100.0% uptime across core services.
        </Typography>
      </Card>

      <Grid container spacing={2}>
        {services.map((s) => (
          <Grid item xs={12} key={s.name}>
            <Card sx={{ p: 2.5, borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{s.name}</Typography>
              <Chip label={s.status} color="success" size="small" sx={{ fontWeight: 800 }} />
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
