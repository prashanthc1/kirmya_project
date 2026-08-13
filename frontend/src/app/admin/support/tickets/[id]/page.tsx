'use client';

import React from 'react';
import { Container, Card, Typography, Stack, Chip, Button, TextField } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';

export default function AdminTicketDetailPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button component={Link} href="/admin/support" startIcon={<ArrowBackIcon />} sx={{ mb: 2, fontWeight: 800 }}>
        Back to Admin Desk
      </Button>
      <Card sx={{ borderRadius: '24px', p: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Ticket Detail Workspace: KIR-2026-000101
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2" color="text.secondary">Assigned Team:</Typography>
            <Chip label="Jobs Support" color="primary" sx={{ fontWeight: 800 }} />
          </Stack>
          <Typography variant="body1">
            Subject: Job Application Status Sync Inquiry
          </Typography>
          <Typography variant="body2" color="text.secondary">
            User: candidate@kirmya.com
          </Typography>

          <TextField
            multiline
            rows={3}
            label="Internal Note (Visible to Agents Only)"
            placeholder="Add internal investigation notes..."
            fullWidth
            sx={{ mt: 2 }}
          />
          <Button variant="contained" sx={{ borderRadius: '12px', fontWeight: 800, alignSelf: 'flex-start' }}>
            Save Internal Note
          </Button>
        </Stack>
      </Card>
    </Container>
  );
}
