'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Container } from '@mui/material';
import ContractView from '../../../../components/freelance/ContractView';

export default function FreelanceContractPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <Container maxWidth="lg">
      <ContractView contractID={id} />
    </Container>
  );
}
