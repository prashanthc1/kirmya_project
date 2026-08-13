'use client';

import React, { useState } from 'react';
import { Card, Typography, Button, Stack, Alert, Box, CircularProgress, Chip } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import FolderZipIcon from '@mui/icons-material/FolderZip';

export const DataExportView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);

  const handleRequestExport = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setRequested(true);
    }, 1500);
  };

  return (
    <Card sx={{ borderRadius: '24px', p: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <DownloadIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Download My Personal Data (SAR Data Export)
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Request a complete, encrypted JSON archive containing your account profile, job applications, messages, connections, resume metadata, and consent records.
      </Typography>

      {requested ? (
        <Alert severity="success" icon={<FolderZipIcon />} sx={{ borderRadius: '16px' }}>
          <Stack spacing={1}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Data Export Archive Ready for Download</Typography>
            <Typography variant="body2">Your data export archive (1.04 MB) has been generated. The download URL expires in 7 days.</Typography>
            <Box>
              <Button variant="contained" size="small" sx={{ borderRadius: '8px', fontWeight: 800, mt: 1 }}>
                Download JSON Archive (.zip)
              </Button>
            </Box>
          </Stack>
        </Alert>
      ) : (
        <Button
          variant="contained"
          onClick={handleRequestExport}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
          sx={{ borderRadius: '12px', fontWeight: 800 }}
        >
          {loading ? 'Generating Encrypted Export...' : 'Request Data Export Archive'}
        </Button>
      )}
    </Card>
  );
};

export default DataExportView;
