'use client';

import React from 'react';
import { Container } from '@mui/material';
import AuthenticatedLayout from '../../components/shell/AuthenticatedLayout';
import NotificationCenter from '../../components/notifications/NotificationCenter';

export const dynamic = 'force-dynamic';

export default function NotificationsMainPage() {
  return (
    <AuthenticatedLayout>
      <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
        <NotificationCenter initialCategory="all" initialUnreadOnly={false} />
      </Container>
    </AuthenticatedLayout>
  );
}
