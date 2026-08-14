'use client';

import React from 'react';
import AppealForm from '@/components/safety/AppealForm';
import { Box, Typography, Stack } from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';

export default function SafetyAppealsPage() {
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: 'auto' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <GavelIcon color="primary" sx={{ fontSize: 36 }} />
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Moderation Decision Appeals
        </Typography>
      </Stack>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        If an account feature was restricted or content removed, submit evidence below for human review.
      </Typography>
      <AppealForm />
    </Box>
  );
}
