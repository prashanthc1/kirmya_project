'use client';

import React from 'react';
import DeviceManagerView from '@/components/security/DeviceManagerView';
import { Container, Typography } from '@mui/material';

export default function SecurityDevicesPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 3 }}>Trusted Devices Manager</Typography>
      <DeviceManagerView />
    </Container>
  );
}
