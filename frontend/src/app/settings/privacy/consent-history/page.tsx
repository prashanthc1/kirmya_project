'use client';

import React from 'react';
import ConsentHistoryView from '@/components/privacy/ConsentHistoryView';
import { Container, Typography } from '@mui/material';

export default function ConsentHistoryPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 3 }}>
        Consent History Audit Record
      </Typography>
      <ConsentHistoryView />
    </Container>
  );
}
