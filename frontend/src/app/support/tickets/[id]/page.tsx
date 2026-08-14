'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Box, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import SupportTicketDetails from '@/components/support/SupportTicketDetails';

export default function TicketDetailsPage() {
  const params = useParams();
  const ticketId = (params.id as string) || '';

  return (
    <Box sx={{ maxWidth: 950, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Button
        component={Link}
        href="/support/tickets"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 3, fontWeight: 800, textTransform: 'none' }}
      >
        Back to My Tickets
      </Button>

      <SupportTicketDetails ticketId={ticketId} />
    </Box>
  );
}
