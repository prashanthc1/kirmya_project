'use client';

import React from 'react';
import NotificationCenter from '../../../components/notifications/NotificationCenter';

export default function NotificationsUnreadPage() {
  return <NotificationCenter initialUnreadOnly={true} />;
}
