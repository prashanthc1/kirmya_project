'use client';

import React from 'react';
import NotificationCenter from '@/components/notifications/NotificationCenter';

export default function CareerNotificationsSubPage() {
  return <NotificationCenter initialCategory="career" initialUnreadOnly={false} />;
}
