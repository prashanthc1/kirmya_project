'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ATSLayout from '../../../../components/ats/ATSLayout';
import PipelineBoard from '../../../../components/ats/PipelineBoard';
import ApplicationDetails from '../../../../components/ats/ApplicationDetails';
import { atsApi } from '../../../../features/ats/api';
import { JobApplicationDTO } from '../../../../features/ats/types';

export default function JobApplicationsPage() {
  const params = useParams();
  const [applications, setApplications] = useState<JobApplicationDTO[]>([]);
  const [selectedApp, setSelectedApp] = useState<JobApplicationDTO | null>(null);

  const loadApps = () => {
    if (params?.jobId) {
      atsApi.getApplications({ jobId: params.jobId as string }).then((res) => setApplications(res)).catch(() => {});
    }
  };

  useEffect(() => {
    loadApps();
  }, [params?.jobId]);

  if (selectedApp) {
    return (
      <ATSLayout>
        <ApplicationDetails applicationId={selectedApp.id} />
      </ATSLayout>
    );
  }

  return (
    <ATSLayout>
      <PipelineBoard
        applications={applications}
        onView={(app) => setSelectedApp(app)}
        onSchedule={() => {}}
        onRefresh={loadApps}
      />
    </ATSLayout>
  );
}
