'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import RecruiterLayout from '../../../components/recruiter/RecruiterLayout';
import PipelineBoard from '../../../components/recruiter/PipelineBoard';

export default function PipelinePage() {
  return (
    <RecruiterLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
          Customizable Hiring Pipeline
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Configure stage workflows, monitor candidate counts, and perform bulk pipeline stage movements.
        </Typography>
      </Box>

      <PipelineBoard />
    </RecruiterLayout>
  );
}
