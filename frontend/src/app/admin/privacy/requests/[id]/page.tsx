'use client';

import React from 'react';
import { Container, Card, Typography, Stack, Chip, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';

export default function AdminPrivacyRequestDetailsPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button component={Link} href="/admin/privacy" startIcon={<ArrowBackIcon />} sx={{ mb: 2, fontWeight: 800 }}>
        Back to Privacy Console
      </Button>
      <Card sx={{ borderRadius: '24px', p: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Subject Access Request (SAR) Details
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2" color="text.secondary">Status:</Typography>
            <Chip label="Processing Grace Period" color="warning" sx={{ fontWeight: 800 }} />
          </Stack>
          <Typography variant="body1">
            Request Type: Account Data Deletion
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Grace Period Expires: 2026-08-27T00:00:00Z (14-day window).
          </Typography>
        </Stack>
      </Card>
    </Container>
  );
}
