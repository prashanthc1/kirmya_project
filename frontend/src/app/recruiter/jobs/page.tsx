'use client';

import React, { useState, useEffect } from 'react';
import RecruiterLayout from '../../../components/recruiter/RecruiterLayout';
import JobManager from '../../../components/recruiter/JobManager';
import { recruiterApi } from '../../../features/recruiter/api';
import { RecruiterJob } from '../../../features/recruiter/types';

export default function RecruiterJobsPage() {
  const [jobs, setJobs] = useState<RecruiterJob[]>([]);

  useEffect(() => {
    recruiterApi.getJobs().then((res) => setJobs(res)).catch(() => {});
  }, []);

  return (
    <RecruiterLayout>
      <JobManager jobs={jobs} />
    </RecruiterLayout>
  );
}
