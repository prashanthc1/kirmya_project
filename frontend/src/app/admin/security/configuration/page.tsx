'use client';

import React from 'react';
import { Box, Typography, Container, Breadcrumbs, Link as MuiLink, Stack } from '@mui/material';
import Link from 'next/link';
import TuneIcon from '@mui/icons-material/Tune';

import SecurityRulesConfig from '@/components/security/SecurityRulesConfig';
import BotMitigationDashboard from '@/components/security/BotMitigationDashboard';

export default function SecurityConfigurationPage() {
  return (
    <Box sx={{ minHeight: '100dvh', py: 4, px: { xs: 2, md: 4 } }}>
      <Container maxWidth="xl">
        <Breadcrumbs sx={{ mb: 2 }}>
          <MuiLink component={Link} href="/admin/security" underline="hover" color="inherit" sx={{ fontWeight: 700 }}>
            Security Operations Center
          </MuiLink>
          <Typography color="text.primary" sx={{ fontWeight: 800 }}>
            Security Rules & System Safeguards Studio
          </Typography>
        </Breadcrumbs>

        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4 }}>
          <TuneIcon sx={{ color: 'primary.main', fontSize: 36 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              Security Rules & System Safeguards Studio
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Tune rate-limiting thresholds, configure automated mitigation rules, and adjust bot protection settings.
            </Typography>
          </Box>
        </Stack>

        <Stack spacing={4}>
          <SecurityRulesConfig />
          <BotMitigationDashboard />
        </Stack>
      </Container>
    </Box>
  );
}
