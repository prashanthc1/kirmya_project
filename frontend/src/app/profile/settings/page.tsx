'use client';

import React from 'react';
import { Container } from '@mui/material';
import ProfilePrivacySettings from '@/components/profile/ProfilePrivacySettings';

export default function ProfileSettingsPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <ProfilePrivacySettings />
    </Container>
  );
}
