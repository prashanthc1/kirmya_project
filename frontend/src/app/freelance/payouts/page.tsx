'use client';

import React, { Suspense } from 'react';
import { Container } from '@mui/material';
import PayoutsView from '../../../components/freelance/PayoutsView';

export default function FreelancePayoutsPage() {
  return (
    <Container maxWidth="lg">
      {/* PayoutsView reads ?onboarding= from the processor's return. */}
      <Suspense fallback={null}>
        <PayoutsView />
      </Suspense>
    </Container>
  );
}
