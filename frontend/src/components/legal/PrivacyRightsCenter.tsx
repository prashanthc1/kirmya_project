'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  Stack,
  Alert,
  Paper,
  Divider,
  useTheme,
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

export const PrivacyRightsCenter: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [exportRequested, setExportRequested] = useState(false);
  const [deletionRequested, setDeletionRequested] = useState(false);

  const handleExport = () => {
    setExportRequested(true);
  };

  const handleDelete = () => {
    setDeletionRequested(true);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: 'auto' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <ShieldIcon sx={{ color: '#10b981', fontSize: 36 }} />
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Privacy &amp; Data Rights Center
        </Typography>
      </Stack>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your personal data exports, account deletion requests, cookie preferences, and consent history.
      </Typography>

      {exportRequested && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }}>
          Data export job initiated asynchronously. You will receive a secure download link once compiled.
        </Alert>
      )}

      {deletionRequested && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: '12px' }}>
          Account deletion request registered under 14-day grace period. You may cancel deletion anytime before expiration.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 3,
              borderRadius: '24px',
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                Export My Personal Data
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Download a machine-readable JSON archive of your account profile, applications, messages, and activity.
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              sx={{ borderRadius: '12px', fontWeight: 800 }}
            >
              Request Data Export
            </Button>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 3,
              borderRadius: '24px',
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: 'error.main' }}>
                Account Deletion Request
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Initiate account closure and data anonymization subject to legal holds and statutory retention rules.
              </Typography>
            </Box>

            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteForeverIcon />}
              onClick={handleDelete}
              sx={{ borderRadius: '12px', fontWeight: 800 }}
            >
              Request Account Deletion
            </Button>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PrivacyRightsCenter;
