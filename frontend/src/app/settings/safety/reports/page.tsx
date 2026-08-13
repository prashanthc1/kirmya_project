'use client';

import React from 'react';
import ReportList from '@/components/safety/ReportList';
import { Container, Typography } from '@mui/material';

export default function SettingsSafetyReportsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 3 }}>My Reports Tracker</Typography>
      <ReportList />
    </Container>
  );
}
