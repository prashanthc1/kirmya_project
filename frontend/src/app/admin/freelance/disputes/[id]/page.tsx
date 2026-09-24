'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import DisputeDecision from '@/components/admin/freelance/DisputeDecision';

export default function AdminFreelanceDisputePage() {
  const { id } = useParams<{ id: string }>();
  return <DisputeDecision disputeID={id} />;
}
