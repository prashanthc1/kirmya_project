'use client';

import React from 'react';
import { Box, Typography, Stack, Button } from '@mui/material';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';
import SupportTicketList from '@/components/support/SupportTicketList';

export default function UserTicketsPage() {
  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <ConfirmationNumberIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              My Support Tickets
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Track active inquiries, communicate with support staff, and review past resolutions.
            </Typography>
          </Box>
        </Stack>

        <Button
          component={Link}
          href="/support"
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ borderRadius: '12px', fontWeight: 800, px: 3 }}
        >
          Create Ticket
        </Button>
      </Stack>

      <SupportTicketList />
    </Box>
  );
}
