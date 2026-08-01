'use client';

import React, { useState, useEffect } from 'react';
import RecruiterLayout from '../../../components/recruiter/RecruiterLayout';
import InterviewScheduler from '../../../components/recruiter/InterviewScheduler';
import { recruiterApi } from '../../../features/recruiter/api';
import { InterviewItem } from '../../../features/recruiter/types';

export default function RecruiterInterviewsPage() {
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);

  const loadInterviews = () => {
    recruiterApi.getInterviews().then((res) => setInterviews(res)).catch(() => {});
  };

  useEffect(() => {
    loadInterviews();
  }, []);

  return (
    <RecruiterLayout>
      <InterviewScheduler interviews={interviews} onScheduled={loadInterviews} />
    </RecruiterLayout>
  );
}
