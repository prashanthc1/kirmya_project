'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import AuthenticatedLayout from '../../../../../components/shell/AuthenticatedLayout';
import JobEditor from '../../../../../components/recruiter/JobEditor';

export default function EditJobPage() {
  const params = useParams();
  const jobId = (params?.id as string) || '11111111-1111-1111-1111-111111111111';

  return (
    <AuthenticatedLayout sidebarVariant="recruiter">
      <JobEditor jobId={jobId} />
    </AuthenticatedLayout>
  );
}
