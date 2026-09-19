'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography } from '@mui/material';
import RecruiterLayout from '../../../components/recruiter/RecruiterLayout';
import PipelineBoard from '../../../components/recruiter/PipelineBoard';
import { recruiterApi } from '../../../features/recruiter/api';

function PipelineContent() {
  const searchParams = useSearchParams();
  const queryJobId = searchParams?.get('jobId') || undefined;

  const { data: jobs = [] } = useQuery({
    queryKey: ['recruiter', 'jobs'],
    queryFn: () => recruiterApi.getJobs(),
    enabled: !queryJobId,
  });

  const activeJobId = queryJobId || (jobs.length > 0 ? jobs[0].id : undefined);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
          Customizable Hiring Pipeline
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Configure stage workflows, monitor candidate counts, and perform bulk pipeline stage movements.
        </Typography>
      </Box>

      <PipelineBoard jobId={activeJobId} />
    </Box>
  );
}

export default function PipelinePage() {
  return (
    <RecruiterLayout>
      <Suspense fallback={null}>
        <PipelineContent />
      </Suspense>
    </RecruiterLayout>
  );
}
