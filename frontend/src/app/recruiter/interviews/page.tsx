'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import RecruiterLayout from '../../../components/recruiter/RecruiterLayout';
import InterviewScheduler from '../../../components/recruiter/InterviewScheduler';

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

      {/*
        * The scorecard used to be rendered here on its own, with no interview
        * selected: it defaulted to interview "int_101" and candidate "Sarah
        * Chen", arrived with every score pre-set to 5 and a written assessment
        * already in the box, and submitting it recorded nothing. A scorecard
        * belongs to one interview, so it is opened from that interview.
        */}
      <InterviewScheduler />
    </RecruiterLayout>
  );
}
