'use client';

import React from 'react';
import AppealForm from '@/components/safety/AppealForm';
import { Container, Typography } from '@mui/material';

export default function SettingsSafetyAppealsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 3 }}>Moderation Enforcement Appeals</Typography>
      <AppealForm />
    </Container>
  );
}
