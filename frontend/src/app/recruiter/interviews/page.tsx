'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import RecruiterLayout from '../../../components/recruiter/RecruiterLayout';
import InterviewScheduler from '../../../components/recruiter/InterviewScheduler';
import InterviewFeedback from '../../../components/recruiter/InterviewFeedback';

export default function InterviewsPage() {
  return (
    <RecruiterLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
          Interview Management &amp; Scorecards
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Schedule candidate interviews, assign interviewers, send meeting links, and submit structured feedback scorecards.
        </Typography>
      </Box>

      <InterviewScheduler />

      <Box sx={{ mt: 4 }}>
        <InterviewFeedback />
      </Box>
    </RecruiterLayout>
  );
}
