'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import AuthenticatedLayout from '../../../../components/shell/AuthenticatedLayout';
import CandidateProfile from '../../../../components/recruiter/CandidateProfile';

export default function CandidateDetailPage() {
  const params = useParams();
  const candidateId = (params?.id as string) || 'c1111111-1111-1111-1111-111111111111';

  return (
    <AuthenticatedLayout sidebarVariant="recruiter">
      <CandidateProfile candidateId={candidateId} />
    </AuthenticatedLayout>
  );
}
