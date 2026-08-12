'use client';

import React from 'react';
import { Box, Typography, Card, Grid, Alert, Paper, Stack, Chip, useTheme } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';

export const AdminBillingCenter: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <MonetizationOnIcon sx={{ color: '#6366f1', fontSize: 36 }} />
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Administrative Billing Control &amp; Entitlements
        </Typography>
      </Stack>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Platform financial administration, plan definitions, entitlement management, and webhook logs.
      </Typography>

      <Alert
        severity="info"
        icon={<LockIcon sx={{ color: '#6366f1' }} />}
        sx={{ mb: 4, borderRadius: '16px' }}
      >
        <strong>Billing Status:</strong> Billing is currently disabled. All platform users operate under the default conceptual FREE plan.
      </Alert>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2.5, borderRadius: '20px', textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.secondary' }}>$0</Typography>
            <Typography variant="caption" color="text.secondary">Monthly Recurring Revenue (MRR)</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2.5, borderRadius: '20px', textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.secondary' }}>$0</Typography>
            <Typography variant="caption" color="text.secondary">Annual Recurring Revenue (ARR)</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2.5, borderRadius: '20px', textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#10b981' }}>100%</Typography>
            <Typography variant="caption" color="text.secondary">Free Access Rate</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2.5, borderRadius: '20px', textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#6366f1' }}>7</Typography>
            <Typography variant="caption" color="text.secondary">Active Core Entitlements</Typography>
          </Paper>
        </Grid>
      </Grid>

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
          Configured Entitlements Catalog
        </Typography>
        <Stack spacing={1.5}>
          {[
            { code: 'jobs.create', name: 'Create Job Listings', category: 'jobs' },
            { code: 'recruiter.search', name: 'Recruiter Candidate Search', category: 'recruiter' },
            { code: 'recruiter.advanced_search', name: 'AI Advanced Candidate Search', category: 'recruiter' },
            { code: 'company.analytics', name: 'Company Hiring Analytics', category: 'company' },
            { code: 'applications.submit', name: 'Submit Job Applications', category: 'candidate' },
            { code: 'ai.standard', name: 'Standard AI Resume & Interview Prep', category: 'ai' },
          ].map((item) => (
            <Paper key={item.code} sx={{ p: 2, borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{item.code}</Typography>
                <Typography variant="caption" color="text.secondary">{item.name}</Typography>
              </Box>
              <Chip label={item.category} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
            </Paper>
          ))}
        </Stack>
      </Card>
    </Box>
  );
};

export default AdminBillingCenter;
