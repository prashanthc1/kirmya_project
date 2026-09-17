'use client';

import React from 'react';
import { Box, Button, Stack } from '@mui/material';
import { useRouter } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import AuthenticatedLayout from '../../../components/shell/AuthenticatedLayout';
import PageHeader from '../../../components/shell/PageHeader';
import JobManager from '../../../components/recruiter/JobManager';

export default function RecruiterJobsPage() {
  const router = useRouter();

  return (
    <AuthenticatedLayout>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <PageHeader 
          title="Job Management" 
          subtitle="Manage active vacancies, draft postings, custom screening questions, and status transitions." 
        />

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
    </AuthenticatedLayout>
  );
}
