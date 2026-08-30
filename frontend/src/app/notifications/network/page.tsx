'use client';

import React from 'react';
import { Container } from '@mui/material';
import AuthenticatedLayout from '../../../components/shell/AuthenticatedLayout';
import NotificationCenter from '../../../components/notifications/NotificationCenter';

export const dynamic = 'force-dynamic';

export default function NetworkNotificationsSubPage() {
  return (
    <AuthenticatedLayout>
      <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
        <NotificationCenter initialCategory="networking" initialUnreadOnly={false} />
      </Container>
    </AuthenticatedLayout>
  );
}
