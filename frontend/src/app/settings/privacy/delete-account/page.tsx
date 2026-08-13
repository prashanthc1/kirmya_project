'use client';

import React, { useState } from 'react';
import AccountDeletionModal from '@/components/privacy/AccountDeletionModal';
import { Container, Card, Typography, Button, Stack } from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

export default function DeleteAccountPage() {
  const [openModal, setOpenModal] = useState(true);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 3, color: 'error.main' }}>
        Account Data Deletion Request
      </Typography>
      <Card sx={{ borderRadius: '24px', p: 4, border: '1px solid rgba(239, 68, 68, 0.4)' }}>
        <Stack spacing={2}>
          <Typography variant="body1">
            Initiating account deletion schedules your personal profile, messages, applications, and saved preferences for deletion following a 14-day grace period.
          </Typography>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteForeverIcon />}
            onClick={() => setOpenModal(true)}
            sx={{ borderRadius: '12px', fontWeight: 800, alignSelf: 'flex-start' }}
          >
            Confirm Account Deletion
          </Button>
        </Stack>
      </Card>
      <AccountDeletionModal open={openModal} onClose={() => setOpenModal(false)} />
    </Container>
  );
}
