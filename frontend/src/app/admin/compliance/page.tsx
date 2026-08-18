'use client';

import React from 'react';
import { Box, Typography, Stack, Grid } from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import PrivacyRiskDashboard from '@/components/privacy/PrivacyRiskDashboard';
import PolicyVersionTable from '@/components/privacy/PolicyVersionTable';
import LegalHoldDialog from '@/components/privacy/LegalHoldDialog';
import ThirdPartyProcessorsCard from '@/components/privacy/ThirdPartyProcessorsCard';

export default function AdminCompliancePage() {
  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4 }}>
        <GavelIcon sx={{ color: 'warning.main', fontSize: 38 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Compliance & Regulatory Control Center
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Continuous compliance tracking for GDPR, CCPA, HIPAA, and SOC 2 Type II regulations.
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={4}>
        <PrivacyRiskDashboard />
        <PolicyVersionTable />
        <LegalHoldDialog />
        <ThirdPartyProcessorsCard />
      </Stack>
    </Box>
  );
}
