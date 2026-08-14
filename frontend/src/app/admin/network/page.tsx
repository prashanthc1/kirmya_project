'use client';

import React, { useEffect, useState } from 'react';
import AdminNetworkView from '@/components/admin/network/AdminNetworkView';
import { AdminNetworkAnalytics, networkingApi } from '@/features/networking/services/networkingApi';

export default function AdminNetworkPage() {
  const [analytics, setAnalytics] = useState<AdminNetworkAnalytics | undefined>(undefined);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    networkingApi.getAdminAnalytics().then((data) => setAnalytics(data)).catch(() => {});
    networkingApi.getAdminReports().then((data) => setReports(data)).catch(() => {});
  }, []);

  return <AdminNetworkView analytics={analytics} reports={reports} />;
}
