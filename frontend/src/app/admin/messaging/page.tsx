'use client';

import React, { useEffect, useState } from 'react';
import AdminMessagingView from '@/components/admin/messaging/AdminMessagingView';
import { AdminMessagingAnalytics, messagingApi } from '@/features/messaging/services/messagingApi';

export default function AdminMessagingPage() {
  const [analytics, setAnalytics] = useState<AdminMessagingAnalytics | undefined>(undefined);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    messagingApi.getAdminAnalytics().then((data) => setAnalytics(data)).catch(() => {});
    messagingApi.getAdminReports().then((data) => setReports(data)).catch(() => {});
  }, []);

  return <AdminMessagingView analytics={analytics} reports={reports} />;
}
