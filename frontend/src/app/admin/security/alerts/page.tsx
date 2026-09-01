'use client';

import React from 'react';
import { Box, Typography, Container, Breadcrumbs, Link as MuiLink, Stack } from '@mui/material';
import Link from 'next/link';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import SecurityAlertsDesk from '@/components/security/SecurityAlertsDesk';
import FraudThreatMonitor from '@/components/security/FraudThreatMonitor';

export default function SecurityAlertsPage() {
  return (
    <Box sx={{ minHeight: '100dvh', py: 4, px: { xs: 2, md: 4 } }}>
      <Container maxWidth="xl">
        <Breadcrumbs sx={{ mb: 2 }}>
          <MuiLink component={Link} href="/admin/security" underline="hover" color="inherit" sx={{ fontWeight: 700 }}>
            Security Operations Center
          </MuiLink>
          <Typography color="text.primary" sx={{ fontWeight: 800 }}>
            Security Alerts & Threat Monitor
          </Typography>
        </Breadcrumbs>

        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4 }}>
          <WarningAmberIcon sx={{ color: 'error.main', fontSize: 36 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              Security Alerts & Threat Monitor
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Investigate security events, manage false positives, and contain fraud across candidate and employer entities.
            </Typography>
          </Box>
        </Stack>

        <Stack spacing={4}>
          <SecurityAlertsDesk />
          <FraudThreatMonitor />
        </Stack>
      </Container>
    </Box>
  );
}
