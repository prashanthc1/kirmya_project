'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import AuthenticatedLayout from '../../../../../components/shell/AuthenticatedLayout';
import ApplicationDetails from '../../../../../components/ats/ApplicationDetails';

export default function ApplicationDetailPage() {
  const params = useParams();
  const applicationId = (params?.applicationId as string) || 'a1111111-1111-1111-1111-111111111111';

  return (
    <AuthenticatedLayout sidebarVariant="recruiter">
      <ApplicationDetails applicationId={applicationId} />
    </AuthenticatedLayout>
  );
}
