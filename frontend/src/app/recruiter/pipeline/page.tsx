'use client';

import React, { useState, useEffect } from 'react';
import ATSLayout from '../../../components/ats/ATSLayout';
import PipelineBoard from '../../../components/ats/PipelineBoard';
import ApplicationDetails from '../../../components/ats/ApplicationDetails';
import FilterPanel from '../../../components/ats/FilterPanel';
import { atsApi } from '../../../features/ats/api';
import { JobApplicationDTO } from '../../../features/ats/types';

export default function PipelineMainPage() {
  const [applications, setApplications] = useState<JobApplicationDTO[]>([]);
  const [selectedApp, setSelectedApp] = useState<JobApplicationDTO | null>(null);

  const loadApps = (filters?: any) => {
    atsApi.getApplications(filters).then((res) => setApplications(res)).catch(() => {});
  };

  useEffect(() => {
    loadApps();
  }, []);

  if (selectedApp) {
    return (
      <ATSLayout>
        <ApplicationDetails applicationId={selectedApp.id} />
      </ATSLayout>
    );
  }

  return (
    <ATSLayout>
      <FilterPanel onFilterChange={(f) => loadApps(f)} />
      <PipelineBoard
        applications={applications}
        onView={(app) => setSelectedApp(app)}
        onSchedule={() => {}}
        onRefresh={loadApps}
      />
    </ATSLayout>
  );
}
