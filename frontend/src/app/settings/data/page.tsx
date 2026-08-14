'use client';

import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import UserDataExportCard from '../../../components/privacy/UserDataExportCard';

export default function UserDataSettingsPage() {
  return (
    <Box sx={{ bgcolor: '#090d16', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" fontWeight="bold" sx={{ color: '#f8fafc', mb: 1 }}>
          Data Rights & Privacy Downloads
        </Typography>
        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 4 }}>
          Manage your personal data exports, download history, and data portability packages.
        </Typography>

        <UserDataExportCard />
      </Container>
    </Box>
  );
}
