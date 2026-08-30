'use client';

import React from 'react';
import { Container } from '@mui/material';
import AuthenticatedLayout from '../../../components/shell/AuthenticatedLayout';
import NotificationPreferences from '../../../components/notifications/NotificationPreferences';

export const dynamic = 'force-dynamic';

export default function NotificationSettingsPage() {
  return (
    <AuthenticatedLayout>
      <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
        <NotificationPreferences />
      </Container>
    </AuthenticatedLayout>
  );
}
