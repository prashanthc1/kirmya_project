'use client';

import React from 'react';
import NotificationCenter from '@/components/notifications/NotificationCenter';

export default function NetworkNotificationsSubPage() {
  return <NotificationCenter initialCategory="networking" initialUnreadOnly={false} />;
}
