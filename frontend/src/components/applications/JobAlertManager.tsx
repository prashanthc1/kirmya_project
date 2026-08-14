'use client';

import React from 'react';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { JobAlertDTO } from '@/features/applications/types';

interface Props {
  alerts?: JobAlertDTO[];
  onCreateAlert?: () => void;
  onDeleteAlert?: (id: string) => void;
}

export function JobAlertManager({ alerts = [], onCreateAlert, onDeleteAlert }: Props) {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Job Alerts</Typography>
        <Button variant="contained" onClick={onCreateAlert}>Create Alert</Button>
      </Box>
      {alerts.length === 0 && <Typography>No alerts configured.</Typography>}
      {alerts.map(alert => (
        <Card key={alert.id} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1">{alert.title}</Typography>
            <Button color="error" onClick={() => onDeleteAlert?.(alert.id)}>Delete</Button>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
