'use client';

import React from 'react';
import NotificationCenter from '@/components/notifications/NotificationCenter';

export default function UnreadNotificationsPage() {
  return <NotificationCenter initialCategory="all" initialUnreadOnly={true} />;
}
