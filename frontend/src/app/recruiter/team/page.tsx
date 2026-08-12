'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import RecruiterLayout from '../../../components/recruiter/RecruiterLayout';
import TeamManagement from '../../../components/recruiter/TeamManagement';

export default function TeamPage() {
  return (
    <RecruiterLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
          Recruiting Team Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Collaborate with hiring managers, recruiters, and interviewers with RBAC permission controls.
        </Typography>
      </Box>

      <TeamManagement />
    </RecruiterLayout>
  );
}
