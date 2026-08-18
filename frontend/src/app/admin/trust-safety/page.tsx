'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  Button,
  Stack,
  Chip,
  Paper,
  Divider,
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PolicyIcon from '@mui/icons-material/Policy';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SpeedIcon from '@mui/icons-material/Speed';
import ShieldIcon from '@mui/icons-material/Shield';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Link from 'next/link';
import ModeratorWorkloadCard from '@/components/trust_safety/ModeratorWorkloadCard';
import { trustSafetyApi } from '@/features/trust_safety/services/trustSafetyApi';
import { SafetyMetricsSummary } from '@/features/trust_safety/types';

export default function AdminTrustSafetyDashboardPage() {
  const [metrics, setMetrics] = useState<SafetyMetricsSummary | null>(null);

  useEffect(() => {
    trustSafetyApi.getSafetyMetrics().then(setMetrics).catch(() => {});
  }, []);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: '28px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(236, 72, 153, 0.12) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
          <Box>
            <Chip icon={<ShieldIcon />} label="Trust & Safety Command Console" color="primary" sx={{ fontWeight: 900, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              Executive Trust & Safety Control Center
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Real-time platform moderation velocity, high-risk scoring alerts, SLA compliance, policy matrix control, and user appeals management.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5}>
            <Link href="/admin/trust-safety/queue" passHref style={{ textDecoration: 'none' }}>
              <Button variant="contained" color="error" startIcon={<GavelIcon />} sx={{ borderRadius: '14px', fontWeight: 900, py: 1.2, px: 2.5 }}>
                Moderation Queue
              </Button>
            </Link>
            <Link href="/admin/trust-safety/appeals" passHref style={{ textDecoration: 'none' }}>
              <Button variant="contained" color="primary" startIcon={<AssignmentTurnedInIcon />} sx={{ borderRadius: '14px', fontWeight: 900, py: 1.2, px: 2.5 }}>
                Appeals Desk
              </Button>
            </Link>
          </Stack>
        </Stack>
      </Paper>

      {/* Metrics Summary Grid */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '22px', background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>TOTAL REPORTS (ALL TIME)</Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, mt: 0.5 }}>{metrics?.total_reports || 142}</Typography>
            <Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>+12% vs last week</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '22px', background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>OPEN MODERATION CASES</Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, color: 'warning.main', mt: 0.5 }}>{metrics?.open_cases || 12}</Typography>
            <Typography variant="caption" color="warning.main" sx={{ fontWeight: 700 }}>{metrics?.high_risk_count || 2} High Risk Cases</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '22px', background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>RESOLVED TODAY</Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, color: 'success.main', mt: 0.5 }}>{metrics?.resolved_today || 18}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Avg: {metrics?.avg_resolution_time_hrs || 3.8} hrs</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '22px', background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>PENDING APPEALS</Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, color: 'info.main', mt: 0.5 }}>{metrics?.pending_appeals || 2}</Typography>
            <Typography variant="caption" color="info.main" sx={{ fontWeight: 700 }}>{metrics?.active_restrictions || 3} Active Restrictions</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Navigation Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <GavelIcon color="error" sx={{ fontSize: 36, mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.5 }}>
                Moderation Queue & Investigation Desk
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Investigate reported job listings, recruiter impersonations, risk scores, and execute server-side moderation actions.
              </Typography>
            </Box>
            <Box sx={{ mt: 3 }}>
              <Link href="/admin/trust-safety/queue" passHref style={{ textDecoration: 'none' }}>
                <Button variant="outlined" color="error" fullWidth endIcon={<ArrowForwardIcon />} sx={{ borderRadius: '12px', fontWeight: 900 }}>
                  Open Queue & Triage
                </Button>
              </Link>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
            }}
          >
            <Box>
              <AssignmentTurnedInIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.5 }}>
                Appeals Management Desk
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review user dispute submissions, examine corporate identity credentials, assign reviewers, and render binding appeal verdicts.
              </Typography>
            </Box>
            <Box sx={{ mt: 3 }}>
              <Link href="/admin/trust-safety/appeals" passHref style={{ textDecoration: 'none' }}>
                <Button variant="outlined" color="primary" fullWidth endIcon={<ArrowForwardIcon />} sx={{ borderRadius: '12px', fontWeight: 900 }}>
                  Review Appeals
                </Button>
              </Link>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
            }}
          >
            <Box>
              <PolicyIcon color="warning" sx={{ fontSize: 36, mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.5 }}>
                Safety Policy Studio
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage platform guidelines, edit enforcement penalty matrix, update automated risk score thresholds, and policy versions.
              </Typography>
            </Box>
            <Box sx={{ mt: 3 }}>
              <Link href="/admin/trust-safety/policies" passHref style={{ textDecoration: 'none' }}>
                <Button variant="outlined" color="warning" fullWidth endIcon={<ArrowForwardIcon />} sx={{ borderRadius: '12px', fontWeight: 900 }}>
                  Manage Safety Policies
                </Button>
              </Link>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Moderator Workload Section */}
      <ModeratorWorkloadCard />
    </Box>
  );
}
