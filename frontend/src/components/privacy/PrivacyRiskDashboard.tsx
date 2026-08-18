'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
  Stack,
  LinearProgress,
  Chip,
  Divider,
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import SecurityIcon from '@mui/icons-material/Security';
import PolicyIcon from '@mui/icons-material/Policy';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { PrivacyRiskSummary, ComplianceOverview } from '@/features/privacy/types';
import { privacyApi } from '@/features/privacy/services/privacyApi';

export const PrivacyRiskDashboard: React.FC = () => {
  const [risk, setRisk] = useState<PrivacyRiskSummary>({
    riskScore: 24,
    highRiskCount: 1,
    mediumRiskCount: 3,
    lowRiskCount: 14,
    unmitigatedCount: 2,
    complianceScore: 92,
  });

  const [compliance, setCompliance] = useState<ComplianceOverview>({
    gdprCompliance: 96,
    ccpaCompliance: 94,
    hipaaCompliance: 89,
    soc2Compliance: 98,
    openDsrCount: 2,
    activeLegalHoldCount: 1,
    activeIncidentsCount: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [riskData, compData] = await Promise.all([
      privacyApi.getPrivacyRiskSummary(),
      privacyApi.getComplianceOverview(),
    ]);
    setRisk(riskData);
    setCompliance(compData);
    setLoading(false);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 3,
              borderRadius: '24px',
              backdropFilter: 'blur(12px)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              height: '100%',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <ShieldIcon sx={{ color: 'success.main', fontSize: 32 }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Enterprise Privacy & Exposure Risk Score
              </Typography>
            </Stack>

            <Stack direction="row" spacing={4} alignItems="center" sx={{ my: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  Risk Score Index
                </Typography>
                <Typography variant="h2" sx={{ fontWeight: 900, color: risk.riskScore < 30 ? 'success.main' : 'warning.main' }}>
                  {risk.riskScore}/100
                </Typography>
                <Chip
                  label={risk.riskScore < 30 ? 'Low Exposure Risk' : 'Moderate Exposure'}
                  color={risk.riskScore < 30 ? 'success' : 'warning'}
                  size="small"
                  sx={{ fontWeight: 700, mt: 0.5 }}
                />
              </Box>

              <Divider orientation="vertical" flexItem />

              <Box sx={{ flexGrow: 1 }}>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">High Severity Risks</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'error.main' }}>{risk.highRiskCount}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Medium Risks</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'warning.main' }}>{risk.mediumRiskCount}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Low Risks</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'info.main' }}>{risk.lowRiskCount}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Unmitigated Flaws</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'error.light' }}>{risk.unmitigatedCount}</Typography>
                  </Stack>
                </Stack>
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 3,
              borderRadius: '24px',
              backdropFilter: 'blur(12px)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              height: '100%',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <PolicyIcon sx={{ color: 'primary.main', fontSize: 32 }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Multi-Regulatory Framework Compliance
              </Typography>
            </Stack>

            <Stack spacing={2.5} sx={{ mt: 2 }}>
              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>GDPR (EU General Data Protection Regulation)</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'success.main' }}>{compliance.gdprCompliance}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={compliance.gdprCompliance} color="success" sx={{ height: 8, borderRadius: 4 }} />
              </Box>

              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>CCPA / CPRA (California Consumer Privacy Act)</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'info.main' }}>{compliance.ccpaCompliance}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={compliance.ccpaCompliance} color="info" sx={{ height: 8, borderRadius: 4 }} />
              </Box>

              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>HIPAA Security & Privacy Safeguards</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'warning.main' }}>{compliance.hipaaCompliance}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={compliance.hipaaCompliance} color="warning" sx={{ height: 8, borderRadius: 4 }} />
              </Box>

              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>SOC 2 Type II Privacy Trust Principle</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'success.main' }}>{compliance.soc2Compliance}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={compliance.soc2Compliance} color="success" sx={{ height: 8, borderRadius: 4 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PrivacyRiskDashboard;
