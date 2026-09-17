'use client';

import React from 'react';
import { Box } from '@mui/material';
import AuthenticatedLayout from '../../../components/shell/AuthenticatedLayout';
import PageHeader from '../../../components/shell/PageHeader';
import InterviewScheduler from '../../../components/recruiter/InterviewScheduler';

export default function InterviewsPage() {
  return (
    <AuthenticatedLayout>
      <PageHeader 
        title="Interview Management & Scorecards" 
        subtitle="Schedule candidate interviews, assign interviewers, send meeting links, and submit structured feedback scorecards." 
      />

      {/*
        * The scorecard used to be rendered here on its own, with no interview
        * selected: it defaulted to interview "int_101" and candidate "Sarah
        * Chen", arrived with every score pre-set to 5 and a written assessment
        * already in the box, and submitting it recorded nothing. A scorecard
        * belongs to one interview, so it is opened from that interview.
        */}
      <InterviewScheduler />
    </AuthenticatedLayout>
  );
}
