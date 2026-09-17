'use client';

import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import RecruiterLayout from '../../../components/recruiter/RecruiterLayout';
import PageHeader from '../../../components/shell/PageHeader';
import DashboardCards from '../../../components/recruiter/DashboardCards';
import HiringCharts from '../../../components/recruiter/HiringCharts';
import QuickActions from '../../../components/recruiter/QuickActions';
import JobManager from '../../../components/recruiter/JobManager';
import AIRecruiterAssistant from '../../../components/recruiter/AIRecruiterAssistant';
import { recruiterApi } from '../../../features/recruiter/api';
import { RecruiterDashboardOverview, RecruiterJob } from '../../../features/recruiter/types';

export default function RecruiterDashboardPage() {
  const [overview, setOverview] = useState<RecruiterDashboardOverview | null>(null);
  const [jobs, setJobs] = useState<RecruiterJob[]>([]);

  useEffect(() => {
    recruiterApi.getDashboardOverview().then((res) => setOverview(res)).catch(() => {});
    recruiterApi.getJobs().then((res) => setJobs(res)).catch(() => {});
  }, []);

  return (
    <RecruiterLayout>
      <PageHeader 
        title="Welcome Back, Corporate Talent Team" 
        subtitle="Manage job vacancies, review ATS candidate applications, schedule interviews, and analyze hiring performance." 
      />

      {/* Quick Action Navigation Buttons */}
      <QuickActions />

      {/* Metric Cards */}
      <DashboardCards overview={overview} />

      {/* Hiring Analytics & Conversion Funnel Charts */}
      <HiringCharts />

      {/* Active Jobs Table */}
      <JobManager jobs={jobs} />

      {/* AI Recruiter Assistant */}
      <AIRecruiterAssistant />
    </RecruiterLayout>
  );
}
