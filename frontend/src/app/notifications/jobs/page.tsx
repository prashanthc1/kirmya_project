'use client';

import React from 'react';
import NotificationCenter from '@/components/notifications/NotificationCenter';

export default function JobsNotificationsSubPage() {
  return <NotificationCenter initialCategory="jobs" initialUnreadOnly={false} />;
}
