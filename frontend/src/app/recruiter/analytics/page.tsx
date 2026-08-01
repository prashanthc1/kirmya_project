'use client';

import React from 'react';
import RecruiterLayout from '../../../components/recruiter/RecruiterLayout';
import AnalyticsDashboard from '../../../components/recruiter/AnalyticsDashboard';
import HiringCharts from '../../../components/recruiter/HiringCharts';

export default function RecruiterAnalyticsPage() {
  return (
    <RecruiterLayout>
      <AnalyticsDashboard />
      <HiringCharts />
    </RecruiterLayout>
  );
}
