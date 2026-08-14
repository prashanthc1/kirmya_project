'use client';

import React from 'react';
import { Card, CardContent, Typography, Chip, Button, Box } from '@mui/material';
import { ApplicationSummary } from '@/features/applications/types';

interface Props {
  application: ApplicationSummary;
  onViewDetails?: (app: ApplicationSummary | any) => void;
  onMessageRecruiter?: (app: ApplicationSummary) => void;
  onWithdraw?: (app: ApplicationSummary) => void;
  onToggleSave?: (app: ApplicationSummary) => void;
}

export function ApplicationCard({ application, onViewDetails }: Props) {
  return (
    <Card sx={{ mb: 2, background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)' }}>
      <CardContent>
        <Typography variant="h6">{application.job_title}</Typography>
        <Typography color="text.secondary">{application.company_name} - {application.location}</Typography>
        <Box sx={{ mt: 1, mb: 2 }}>
          <Chip label={application.current_status} color="primary" variant="outlined" size="small" sx={{ mr: 1 }} />
          <Chip label={application.employment_type} size="small" sx={{ mr: 1 }} />
        </Box>
        <Button variant="contained" size="small" onClick={() => onViewDetails?.(application)}>View Details</Button>
      </CardContent>
    </Card>
  );
}
