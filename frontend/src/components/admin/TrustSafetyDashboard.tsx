'use client';

import React from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Chip,
  Paper,
  Stack,
  Alert,
  useTheme,
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export const TrustSafetyDashboard: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const riskSignals = [
    { entity: 'John Doe (User u2)', score: 0.88, level: 'High', factor: 'Rapid messaging across 15 communities in 3 mins' },
    { entity: 'Apex Logistics (Company c9)', score: 0.94, level: 'Critical', factor: 'Wire transfer payment request in job description' },
    { entity: 'Remote Data Entry (Job j2)', score: 0.92, level: 'Critical', factor: 'Multiple duplicate postings with high weekly rate' },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <ShieldIcon sx={{ color: '#ef4444', fontSize: 36 }} />
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Trust &amp; Safety Control Dashboard
        </Typography>
      </Stack>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Real-time risk scoring, explainable fraud detection signals, and internal account flags.
      </Typography>

      <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 4, borderRadius: '14px' }}>
        <strong>Explainable Risk Policy:</strong> Risk scores are generated strictly from behavior metrics (duplicate content, rapid rate limits, wire fee language). Protected personal characteristics are never used as risk factors.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 3,
              borderRadius: '24px',
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              High Risk Entities &amp; Behavioral Signals
            </Typography>

            <Stack spacing={2}>
              {riskSignals.map((item) => (
                <Paper key={item.entity} sx={{ p: 2, borderRadius: '14px', bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{item.entity}</Typography>
                    <Chip label={`${item.level} (${(item.score * 100).toFixed(0)}%)`} size="small" color="error" sx={{ fontWeight: 900 }} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">{item.factor}</Typography>
                </Paper>
              ))}
            </Stack>
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
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              Active Fraud Prevention Signals
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, borderRadius: '14px', textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: 'error.main' }}>0</Typography>
                  <Typography variant="caption" color="text.secondary">Credential Theft</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, borderRadius: '14px', textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: 'warning.main' }}>3</Typography>
                  <Typography variant="caption" color="text.secondary">Recruitment Fee Scams</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, borderRadius: '14px', textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: 'info.main' }}>1</Typography>
                  <Typography variant="caption" color="text.secondary">Phishing Link Alerts</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, borderRadius: '14px', textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: 'success.main' }}>12</Typography>
                  <Typography variant="caption" color="text.secondary">Fake Companies Blocked</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TrustSafetyDashboard;
