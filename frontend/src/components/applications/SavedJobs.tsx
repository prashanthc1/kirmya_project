'use client';

import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { SavedJobDTO } from '@/features/applications/types';

interface SavedJobsProps {
  jobs?: SavedJobDTO[];
  savedJobs?: SavedJobDTO[];
  onRemove?: (jobId: string) => void;
  onRemoveSavedJob?: (jobId: string) => void;
}

export function SavedJobs({ jobs, savedJobs, onRemove, onRemoveSavedJob }: SavedJobsProps) {
  const list = jobs || savedJobs || [];
  const handleRemove = onRemove || onRemoveSavedJob;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Saved Jobs</Typography>
      {list.length === 0 && <Typography>No saved jobs.</Typography>}
      {list.map(job => (
        <Card key={job.id} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6">{job.job_title}</Typography>
            <Typography color="text.secondary">{job.company_name}</Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
