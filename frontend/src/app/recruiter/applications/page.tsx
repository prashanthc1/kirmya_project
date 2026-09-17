'use client';

import React, { useState } from 'react';
import { Box } from '@mui/material';
import AuthenticatedLayout from '../../../components/shell/AuthenticatedLayout';
import PageHeader from '../../../components/shell/PageHeader';
import PipelineBoard from '../../../components/recruiter/PipelineBoard';
import ApplicationDetails from '../../../components/recruiter/ApplicationDetails';

export default function ApplicationsMainPage() {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  if (selectedAppId) {
    return (
        <AuthenticatedLayout>
          <ApplicationDetails applicationId={selectedAppId} />
        </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <PageHeader 
        title="ATS Application Pipeline" 
        subtitle="Track candidates across customizable stages, move applicants, and initiate interview scheduling." 
      />

      <PipelineBoard onSelectCandidate={(c) => setSelectedAppId(c.applicationId)} />
    </AuthenticatedLayout>
  );
}
