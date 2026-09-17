'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import AuthenticatedLayout from '../../../../components/shell/AuthenticatedLayout';
import ApplicationDetails from '../../../../components/recruiter/ApplicationDetails';

export default function ApplicationDetailPage() {
  const params = useParams();
  const appId = (params?.id as string) || 'a1111111-1111-1111-1111-111111111111';

  return (
    <AuthenticatedLayout>
      <ApplicationDetails applicationId={appId} />
    </AuthenticatedLayout>
  );
}
