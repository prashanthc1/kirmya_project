'use client';

import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Grid, Chip, LinearProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { systemHealthApi } from '../../features/system_health/services/systemHealthApi';

export default function PublicStatusPage() {
  const [statusData, setStatusData] = useState<{ overallStatus: string; isMaintenance: boolean; publicComponents: Record<string, string>; checkedAt: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    systemHealthApi.getPublicStatus().then((data) => {
      setStatusData(data);
      setLoading(false);
    });
  }, []);

  return (
    <Box sx={{ bgcolor: '#090d16', minHeight: '100vh', color: '#f8fafc', py: 6 }}>
      <Container maxWidth="md">
        <Box sx={{ textCenter: 'center', textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" fontWeight="bold" sx={{ background: 'linear-gradient(90deg, #10b981 0%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 1 }}>
            Kirmya Platform Service Status
          </Typography>
          <Typography variant="body1" sx={{ color: '#94a3b8' }}>
            Real-time status updates across Kirmya global infrastructure and services.
          </Typography>
        </Box>

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: '#1e293b', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }} />}

        <Paper sx={{ p: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 3, mb: 4, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 1 }}>
            <CheckCircleIcon sx={{ color: statusData?.overallStatus === 'healthy' ? '#10b981' : '#f59e0b', fontSize: 32 }} />
            <Typography variant="h5" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
              {statusData?.isMaintenance ? 'System Maintenance Active' : statusData?.overallStatus === 'healthy' ? 'All Systems Operational' : 'Partial Service Degradation'}
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            Last checked: {statusData?.checkedAt ? new Date(statusData.checkedAt).toLocaleString() : 'Just now'}
          </Typography>
        </Paper>

        <Paper sx={{ p: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#f8fafc' }}>
            Service Component Status
          </Typography>

          <Grid container spacing={2}>
            {statusData && Object.entries(statusData.publicComponents).map(([comp, st]) => (
              <Grid item xs={12} sm={6} key={comp}>
                <Paper sx={{ p: 2, bgcolor: '#0f172a', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>{comp}</Typography>
                  <Chip label={st.toUpperCase()} color={st === 'healthy' ? 'success' : 'warning'} size="small" />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
}
