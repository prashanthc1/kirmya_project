'use client';

import React from 'react';
import LoginHistoryView from '@/components/security/LoginHistoryView';
import { Container, Typography } from '@mui/material';

export default function SecurityLoginHistoryPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 3 }}>Login Security Audit Log</Typography>
      <LoginHistoryView />
    </Container>
  );
}
