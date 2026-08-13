'use client';

import React from 'react';
import NotificationCenter from '@/components/notifications/NotificationCenter';

export default function InterviewsNotificationsSubPage() {
  return <NotificationCenter initialCategory="interviews" initialUnreadOnly={false} />;
}
