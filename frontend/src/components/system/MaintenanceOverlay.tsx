'use client';

import React from 'react';
import { Box, Container, Typography, Paper, Button, Chip } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';

interface MaintenanceOverlayProps {
  reason?: string;
}

export default function MaintenanceOverlay({ reason }: MaintenanceOverlayProps) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#090d16', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, color: '#f8fafc' }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 3, textAlign: 'center' }}>
          <Box sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', p: 2, borderRadius: '50%', display: 'inline-flex', mb: 2 }}>
            <BuildIcon fontSize="large" />
          </Box>
          <Typography variant="h4" fontWeight="bold" sx={{ background: 'linear-gradient(90deg, #f59e0b 0%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 1 }}>
            Kirmya System Maintenance
          </Typography>
          <Chip label="SCHEDULED UPGRADE IN PROGRESS" color="warning" size="small" sx={{ mb: 2, fontWeight: 'bold' }} />
          <Typography variant="body1" sx={{ color: '#cbd5e1', mb: 3 }}>
            {reason || 'We are performing scheduled database and infrastructure maintenance to improve system reliability and performance. Kirmya services will resume shortly.'}
          </Typography>
          <Button variant="outlined" href="/status" sx={{ color: '#38bdf8', borderColor: '#38bdf8', fontWeight: 'bold' }}>
            Check Platform Status Page
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
