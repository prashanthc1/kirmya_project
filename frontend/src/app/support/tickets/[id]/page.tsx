'use client';

import React from 'react';
import SupportTicketDetails from '@/components/support/SupportTicketDetails';
import { Container, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function UserTicketDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || 'tkt-101';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button component={Link} href="/support/tickets" startIcon={<ArrowBackIcon />} sx={{ mb: 2, fontWeight: 800 }}>
        Back to My Tickets
      </Button>
      <SupportTicketDetails ticketId={id} />
    </Container>
  );
}
