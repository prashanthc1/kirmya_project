'use client';

import React from 'react';
import DataExportView from '@/components/privacy/DataExportView';
import { Container, Typography } from '@mui/material';

export default function DownloadDataPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 3 }}>
        Download Personal Data Archive
      </Typography>
      <DataExportView />
    </Container>
  );
}
