'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import ATSLayout from '../../../../../components/ats/ATSLayout';
import ApplicationDetails from '../../../../../components/ats/ApplicationDetails';

export default function ApplicationDetailPage() {
  const params = useParams();
  const applicationId = (params?.applicationId as string) || 'a1111111-1111-1111-1111-111111111111';

  return (
    <ATSLayout>
      <ApplicationDetails applicationId={applicationId} />
    </ATSLayout>
  );
}
