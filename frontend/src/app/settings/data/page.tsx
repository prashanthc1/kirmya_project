'use client';

import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import UserDataExportCard from '../../../components/privacy/UserDataExportCard';

export default function UserDataSettingsPage() {
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100dvh', py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" fontWeight="bold" sx={{ color: 'text.primary', mb: 1 }}>
          Data Rights & Privacy Downloads
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
          Manage your personal data exports, download history, and data portability packages.
        </Typography>

        <UserDataExportCard />
      </Container>
    </Box>
  );
}
