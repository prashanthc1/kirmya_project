'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Typography, Button, Card, Stack, Chip, Grid, Divider } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import RecruiterLayout from '../../../../components/recruiter/RecruiterLayout';
import PipelineBoard from '../../../../components/recruiter/PipelineBoard';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = (params?.id as string) || '11111111-1111-1111-1111-111111111111';

  return (
    <RecruiterLayout>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/recruiter/jobs')} sx={{ fontWeight: 700 }}>
            Back to Jobs
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Senior Go Backend Architect
          </Typography>
          <Chip label="ACTIVE" color="success" size="small" sx={{ fontWeight: 800 }} />
        </Stack>

        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => router.push(`/recruiter/jobs/${jobId}/edit`)}
          sx={{ borderRadius: '12px', fontWeight: 800 }}
        >
          Edit Job Details
        </Button>
      </Stack>

      <Card sx={{ borderRadius: '20px', p: 3, mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Department</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Engineering &amp; Tech</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Location</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Dubai, UAE (Remote)</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Salary Range</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>$120,000 - $160,000</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Applicants Count</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>18 Candidates</Typography>
          </Grid>
        </Grid>
      </Card>

      <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>
        Job Candidate ATS Pipeline
      </Typography>
      <PipelineBoard jobId={jobId} />
    </RecruiterLayout>
  );
}
