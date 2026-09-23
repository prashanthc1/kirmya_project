'use client';

import React from 'react';
import { Box, Container, Typography, Paper, Button, Chip } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';

interface MaintenanceOverlayProps {
  reason?: string;
}

export default function MaintenanceOverlay({ reason }: MaintenanceOverlayProps) {
  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, color: 'text.primary' }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 3, textAlign: 'center' }}>
          <Box sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', color: 'warning.main', p: 2, borderRadius: '50%', display: 'inline-flex', mb: 2 }}>
            <BuildIcon fontSize="large" />
          </Box>
          <Typography variant="h4" fontWeight="bold" sx={{    mb: 1 }}>
            Kirmya System Maintenance
          </Typography>
          <Chip label="SCHEDULED UPGRADE IN PROGRESS" color="warning" size="small" sx={{ mb: 2, fontWeight: 'bold' }} />
          <Typography variant="body1" sx={{ color: 'text.primary', mb: 3 }}>
            {reason || 'We are performing scheduled database and infrastructure maintenance to improve system reliability and performance. Kirmya services will resume shortly.'}
          </Typography>
          <Button variant="outlined" href="/status" sx={{ color: 'primary.main', borderColor: 'primary.main', fontWeight: 'bold' }}>
            Check Platform Status Page
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
