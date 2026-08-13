'use client';

import React from 'react';
import BlockedUsers from '@/components/safety/BlockedUsers';
import { Container, Typography } from '@mui/material';

export default function SettingsSafetyBlockedPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 3 }}>Blocked Accounts Manager</Typography>
      <BlockedUsers />
    </Container>
  );
}
