'use client';

import React from 'react';
import { Box, Typography, Button, Stack, Grid, Card, Container } from '@mui/material';
import Link from 'next/link';
import ShieldIcon from '@mui/icons-material/Shield';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TuneIcon from '@mui/icons-material/Tune';
import SpeedIcon from '@mui/icons-material/Speed';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import GavelIcon from '@mui/icons-material/Gavel';

import AdminSecurityDashboard from '@/components/security/AdminSecurityDashboard';
import AccountRiskScorecard from '@/components/security/AccountRiskScorecard';

export default function AdminSecurityPage() {
  return (
    <Box sx={{ minHeight: '100dvh', py: 4, px: { xs: 2, md: 4 } }}>
      <Container maxWidth="xl">
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, background: 'linear-gradient(45deg, #10B981 30%, #3B82F6 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Executive Security Operations Center (SOC)
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Centralized platform security telemetry, automated threat prevention, bot defense, and fraud containment studio.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5}>
            <Button
              component={Link}
              href="/admin/security/alerts"
              variant="contained"
              color="error"
              startIcon={<WarningAmberIcon />}
              sx={{ borderRadius: '12px', fontWeight: 800 }}
            >
              Alerts & Threat Monitor
            </Button>
            <Button
              component={Link}
              href="/admin/security/configuration"
              variant="outlined"
              color="primary"
              startIcon={<TuneIcon />}
              sx={{ borderRadius: '12px', fontWeight: 800 }}
            >
              Rules & Safeguards Studio
            </Button>
          </Stack>
        </Stack>

        <Stack spacing={4}>
          <AdminSecurityDashboard />

          <Typography variant="h5" sx={{ fontWeight: 800, mt: 2 }}>
            Account Risk Scorecard Preview
          </Typography>
          <AccountRiskScorecard />
        </Stack>
      </Container>
    </Box>
  );
}
