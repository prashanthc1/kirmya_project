'use client';

import React from 'react';
import ProfileCompletionCard from '@/components/onboarding/ProfileCompletionCard';
import { Container, Typography } from '@mui/material';

export default function ProfileCompletionPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 3 }}>
        Profile Completion & Candidate Strength
      </Typography>
      <ProfileCompletionCard />
    </Container>
  );
}
