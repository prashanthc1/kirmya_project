'use client';

import React from 'react';
import NotificationCenter from '@/components/notifications/NotificationCenter';

export default function ApplicationsNotificationsSubPage() {
  return <NotificationCenter initialCategory="applications" initialUnreadOnly={false} />;
}
