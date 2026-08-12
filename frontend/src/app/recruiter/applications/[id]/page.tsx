'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import RecruiterLayout from '../../../../components/recruiter/RecruiterLayout';
import ApplicationDetails from '../../../../components/recruiter/ApplicationDetails';

export default function ApplicationDetailPage() {
  const params = useParams();
  const appId = (params?.id as string) || 'a1111111-1111-1111-1111-111111111111';

  return (
    <RecruiterLayout>
      <ApplicationDetails applicationId={appId} />
    </RecruiterLayout>
  );
}
