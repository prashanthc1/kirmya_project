'use client';

import React from 'react';
import SupportTicketList from '@/components/support/SupportTicketList';
import { Container } from '@mui/material';

export default function UserSupportTicketsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <SupportTicketList />
    </Container>
  );
}
