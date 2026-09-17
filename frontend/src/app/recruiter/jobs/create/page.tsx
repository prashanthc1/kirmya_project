'use client';

import React from 'react';
import AuthenticatedLayout from '../../../../components/shell/AuthenticatedLayout';
import JobEditor from '../../../../components/recruiter/JobEditor';

export default function CreateJobPage() {
  return (
    <AuthenticatedLayout>
      <JobEditor />
    </AuthenticatedLayout>
  );
}
