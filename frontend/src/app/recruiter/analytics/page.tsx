'use client';

import React from 'react';
import { Box } from '@mui/material';
import AuthenticatedLayout from '../../../components/shell/AuthenticatedLayout';
import PageHeader from '../../../components/shell/PageHeader';
import AnalyticsDashboard from '../../../components/recruiter/AnalyticsDashboard';

export default function AnalyticsPage() {
  return (
    <AuthenticatedLayout sidebarVariant="recruiter">
      <PageHeader 
        title="Recruitment Analytics & Reports" 
        subtitle="Track conversion rates, time to hire, candidate sourcing metrics, and job posting performance." 
      />

      <AnalyticsDashboard />
    </AuthenticatedLayout>
  );
}
