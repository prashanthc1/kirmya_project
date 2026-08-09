'use client';

import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import { JobAlert } from '@/features/job-alerts/types';
import { AlertCard } from './AlertCard';

interface AlertListProps {
  alerts: JobAlert[];
  onEditAlert?: (alert: JobAlert) => void;
  onDeleteAlert?: (alert: JobAlert) => void;
  onTogglePauseAlert?: (alert: JobAlert) => void;
}

export const AlertList: React.FC<AlertListProps> = ({
  alerts,
  onEditAlert,
  onDeleteAlert,
  onTogglePauseAlert,
}) => {
  if (alerts.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, background: 'rgba(255, 255, 255, 0.02)' }}>
        <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          No job alerts configured yet
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
          Create an alert to automatically monitor new job postings matching your skills and preferences.
        </Typography>
      </Paper>
    );
  }

  return (
    <Grid container spacing={3}>
      {alerts.map((alert) => (
        <Grid item xs={12} md={6} key={alert.id}>
          <AlertCard
            alert={alert}
            onEdit={onEditAlert}
            onDelete={onDeleteAlert}
            onTogglePause={onTogglePauseAlert}
          />
        </Grid>
      ))}
    </Grid>
  );
};
