'use client';

import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { useRouter } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import RecruiterLayout from '../../../components/recruiter/RecruiterLayout';
import JobManager from '../../../components/recruiter/JobManager';

export default function RecruiterJobsPage() {
  const router = useRouter();

  return (
    <RecruiterLayout>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
            Job Management
          </Typography>

          <Typography variant="subtitle1" color="text.secondary">
            Manage active vacancies, draft postings, custom screening questions, and status transitions.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/recruiter/jobs/create')}
          sx={{
            borderRadius: '12px',
            fontWeight: 800,
            px: 3,
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          }}
        >
          Post New Job
        </Button>
      </Stack>

      <JobManager />
    </RecruiterLayout>
  );
}
