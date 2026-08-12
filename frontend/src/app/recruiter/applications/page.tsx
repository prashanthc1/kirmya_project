'use client';

import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import RecruiterLayout from '../../../components/recruiter/RecruiterLayout';
import PipelineBoard from '../../../components/recruiter/PipelineBoard';
import ApplicationDetails from '../../../components/recruiter/ApplicationDetails';

export default function ApplicationsMainPage() {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  if (selectedAppId) {
    return (
      <RecruiterLayout>
        <ApplicationDetails applicationId={selectedAppId} />
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
          ATS Application Pipeline
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Track candidates across customizable stages, move applicants, and initiate interview scheduling.
        </Typography>
      </Box>

      <PipelineBoard onSelectCandidate={(c) => setSelectedAppId(c.applicationId)} />
    </RecruiterLayout>
  );
}
