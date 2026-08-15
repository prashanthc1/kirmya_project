'use client';

import React from 'react';
import NotificationCenter from '@/components/notifications/NotificationCenter';

export default function MessagesNotificationsSubPage() {
  return <NotificationCenter initialCategory="messages" initialUnreadOnly={false} />;
}
