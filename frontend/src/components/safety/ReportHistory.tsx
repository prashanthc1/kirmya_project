'use client';

import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import ReportList from './ReportList';

export const ReportHistory: React.FC = () => {
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: 'auto' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <ReportProblemIcon sx={{ color: 'error.main', fontSize: 36 }} />
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          My Submitted Reports History
        </Typography>
      </Stack>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Track status updates and reviewer actions for your submitted reports. Reporter identities remain confidential.
      </Typography>

      <ReportList />
    </Box>
  );
};

export default ReportHistory;
