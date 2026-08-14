'use client';

import React from 'react';
import { Box, Typography, Tabs, Tab, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { ApplicationSummary } from '@/features/applications/types';
import { ApplicationCard } from './ApplicationCard';

interface ApplicationDashboardProps {
  applications?: ApplicationSummary[];
  stats?: any;
  insights?: any;
  isLoading?: boolean;
  onSelectApplication?: (id: string) => Promise<any> | void;
  onWithdrawApplication?: (id: string) => void;
}

export function ApplicationDashboard({
  applications = [],
  stats,
  insights,
  isLoading = false,
  onSelectApplication,
  onWithdrawApplication,
}: ApplicationDashboardProps) {
  const [filter, setFilter] = React.useState('All');
  const [withdrawId, setWithdrawId] = React.useState<string | null>(null);

  const filtered = applications.filter(a => filter === 'All' || a.current_status === filter);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>My Applications & Status Tracker</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Tabs value={filter} onChange={(e, v) => setFilter(v)}>
          <Tab label="All" value="All" />
          <Tab label="Active" value="Active" />
          <Tab label="Interview" value="Interview" />
          <Tab label="Offer" value="Offer" />
          <Tab label="Rejected" value="Rejected" />
          <Tab label="Withdrawn" value="Withdrawn" />
        </Tabs>
        <TextField size="small" placeholder="Search..." />
      </Box>

      {filtered.length === 0 ? (
        <Typography>No applications match filter.</Typography>
      ) : (
        filtered.map(app => (
          <ApplicationCard key={app.id} application={app} />
        ))
      )}
      
      <Typography variant="caption" sx={{ mt: 3, display: 'block' }}>Page 1 of 1</Typography>

      <Dialog open={!!withdrawId} onClose={() => setWithdrawId(null)}>
        <DialogTitle>Confirm Withdrawal</DialogTitle>
        <DialogContent>Are you sure you want to withdraw this application?</DialogContent>
        <DialogActions>
          <Button onClick={() => setWithdrawId(null)}>Cancel</Button>
          <Button color="error" onClick={() => setWithdrawId(null)}>Withdraw</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
