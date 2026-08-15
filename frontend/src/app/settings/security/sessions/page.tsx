'use client';

import React from 'react';
import SessionManagerView from '@/components/security/SessionManagerView';
import { Container, Typography } from '@mui/material';

export default function SecuritySessionsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 3 }}>Active Authentication Sessions</Typography>
      <SessionManagerView />
    </Container>
  );
}
