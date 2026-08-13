'use client';

import React from 'react';
import { Container, Card, Typography, Stack, Chip, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';

export default function AdminSecurityIncidentDetailsPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button component={Link} href="/admin/security" startIcon={<ArrowBackIcon />} sx={{ mb: 2, fontWeight: 800 }}>
        Back to Security Console
      </Button>
      <Card sx={{ borderRadius: '24px', p: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Security Incident Details
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2" color="text.secondary">Severity:</Typography>
            <Chip label="High" color="warning" sx={{ fontWeight: 800 }} />
          </Stack>
          <Typography variant="body1">
            Incident: Suspicious API Token Enumeration Probe
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Affected System: Authentication Services API Endpoint.
          </Typography>
        </Stack>
      </Card>
    </Container>
  );
}
