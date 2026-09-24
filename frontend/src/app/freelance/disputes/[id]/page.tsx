'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Container } from '@mui/material';
import DisputeView from '../../../../components/freelance/DisputeView';

export default function FreelanceDisputePage() {
  const { id } = useParams<{ id: string }>();
  return (
    <Container maxWidth="lg">
      <DisputeView disputeID={id} />
    </Container>
  );
}
