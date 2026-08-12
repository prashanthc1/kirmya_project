'use client';

import React from 'react';
import RecruiterLayout from '../../../../components/recruiter/RecruiterLayout';
import JobEditor from '../../../../components/recruiter/JobEditor';

export default function CreateJobPage() {
  return (
    <RecruiterLayout>
      <JobEditor />
    </RecruiterLayout>
  );
}
