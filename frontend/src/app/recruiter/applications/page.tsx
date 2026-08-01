'use client';

import React, { useState, useEffect } from 'react';
import ATSLayout from '../../../components/ats/ATSLayout';
import FilterPanel from '../../../components/ats/FilterPanel';
import CandidateCard from '../../../components/ats/CandidateCard';
import BulkActions from '../../../components/ats/BulkActions';
import ApplicationDetails from '../../../components/ats/ApplicationDetails';
import OfferManager from '../../../components/ats/OfferManager';
import { atsApi } from '../../../features/ats/api';
import { JobApplicationDTO } from '../../../features/ats/types';
import { Box, Stack } from '@mui/material';

export default function ApplicationsMainPage() {
  const [applications, setApplications] = useState<JobApplicationDTO[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedApp, setSelectedApp] = useState<JobApplicationDTO | null>(null);

  const loadApplications = (filters?: any) => {
    atsApi.getApplications(filters).then((res) => setApplications(res)).catch(() => {});
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleSelectToggle = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    }
  };

  if (selectedApp) {
    return (
      <ATSLayout>
        <ApplicationDetails applicationId={selectedApp.id} />
      </ATSLayout>
    );
  }

  return (
    <ATSLayout>
      <FilterPanel onFilterChange={(f) => loadApplications(f)} />

      <Stack spacing={2}>
        {applications.map((app) => (
          <CandidateCard
            key={app.id}
            application={app}
            onView={(a) => setSelectedApp(a)}
            onSchedule={() => {}}
            onReject={() => loadApplications()}
            onSelectToggle={handleSelectToggle}
            isSelected={selectedIds.includes(app.id)}
          />
        ))}
      </Stack>

      <BulkActions
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        onRefresh={loadApplications}
      />
    </ATSLayout>
  );
}
