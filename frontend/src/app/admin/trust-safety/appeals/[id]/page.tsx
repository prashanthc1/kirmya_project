'use client';

import React from 'react';
import { Container, Card, Typography, Stack, Chip, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';

export default function AdminAppealDetailsPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button component={Link} href="/admin/trust-safety" startIcon={<ArrowBackIcon />} sx={{ mb: 2, fontWeight: 800 }}>
        Back to Safety Dashboard
      </Button>
      <Card sx={{ borderRadius: '24px', p: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Appeal Review Workspace
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2" color="text.secondary">Status:</Typography>
            <Chip label="Under Review" color="info" sx={{ fontWeight: 800 }} />
          </Stack>
          <Typography variant="body1">
            Reason: Legitimate Recruiter Credentials
          </Typography>
          <Typography variant="body2" color="text.secondary">
            User provided official business registration documentation.
          </Typography>
        </Stack>
      </Card>
    </Container>
  );
}
