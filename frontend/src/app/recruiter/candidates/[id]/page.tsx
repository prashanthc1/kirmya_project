'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import RecruiterLayout from '../../../../components/recruiter/RecruiterLayout';
import CandidateProfile from '../../../../components/recruiter/CandidateProfile';

export default function CandidateDetailPage() {
  const params = useParams();
  const candidateId = (params?.id as string) || 'c1111111-1111-1111-1111-111111111111';

  return (
    <RecruiterLayout>
      <CandidateProfile candidateId={candidateId} />
    </RecruiterLayout>
  );
}
