'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Stack,
  Tab,
  Tabs,
  CircularProgress,
  useTheme,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SecurityIcon from '@mui/icons-material/Security';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import GavelIcon from '@mui/icons-material/Gavel';
import LockIcon from '@mui/icons-material/Lock';
import ModerationQueue from './ModerationQueue';
import AppealsManager from './AppealsManager';
import SafetyRulesManager from './SafetyRulesManager';
import { safetyApi } from '../../../features/trust_safety/api';
import { SafetyMetricsSummary } from '../../../features/trust_safety/types';

export const AdminTrustSafetyDashboard: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [tabIndex, setTabIndex] = useState(0);
  const [metrics, setMetrics] = useState<SafetyMetricsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    safetyApi
      .getSafetyMetrics()
      .then((res) => {
        if (mounted) {
          setMetrics(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <AdminPanelSettingsIcon sx={{ color: 'primary.main', fontSize: 40 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Executive Trust & Safety Control Center
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage moderation queue, enforcement decisions, safety appeals, scam detection rules, and platform metrics.
          </Typography>
        </Box>
      </Stack>

      {/* Top Metrics Banner */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: '20px',
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              Open Reports Queue
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'warning.main' }}>
              {metrics ? metrics.open_cases : 12}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: '20px',
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              High Risk Score Alerts
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'error.main' }}>
              {metrics ? metrics.high_risk_count : 2}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: '20px',
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              Avg Resolution Time
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'success.main' }}>
              {metrics ? `${metrics.avg_resolution_time_hrs} hrs` : '4.2 hrs'}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: '20px',
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              Pending Appeals
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'info.main' }}>
              {metrics ? metrics.pending_appeals : 2}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Navigation */}
      <Card sx={{ borderRadius: '24px', p: 1, mb: 4 }}>
        <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} variant="scrollable">
          <Tab label="Moderation Queue" sx={{ fontWeight: 800 }} />
          <Tab label="Appeals Manager" sx={{ fontWeight: 800 }} />
          <Tab label="Safety Policy Rules" sx={{ fontWeight: 800 }} />
          <Tab label="Safety Analytics" sx={{ fontWeight: 800 }} />
        </Tabs>
      </Card>

      {/* Tab 0: Moderation Queue */}
      {tabIndex === 0 && <ModerationQueue />}

      {/* Tab 1: Appeals Manager */}
      {tabIndex === 1 && <AppealsManager />}

      {/* Tab 2: Safety Policy Rules */}
      {tabIndex === 2 && <SafetyRulesManager />}

      {/* Tab 3: Safety Analytics */}
      {tabIndex === 3 && (
        <Card sx={{ borderRadius: '24px', p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Trust & Safety Platform Metrics
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2.5, bgcolor: 'action.hover', borderRadius: '16px' }}>
                <Typography variant="caption" color="text.secondary">Total Reports Processed</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>{metrics?.total_reports || 142}</Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2.5, bgcolor: 'action.hover', borderRadius: '16px' }}>
                <Typography variant="caption" color="text.secondary">Resolved Today</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5, color: 'success.main' }}>{metrics?.resolved_today || 18}</Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2.5, bgcolor: 'action.hover', borderRadius: '16px' }}>
                <Typography variant="caption" color="text.secondary">Active Account Restrictions</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5, color: 'warning.main' }}>{metrics?.active_restrictions || 3}</Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2.5, bgcolor: 'action.hover', borderRadius: '16px' }}>
                <Typography variant="caption" color="text.secondary">High Risk Score Alerts</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5, color: 'error.main' }}>{metrics?.high_risk_count || 2}</Typography>
              </Card>
            </Grid>
          </Grid>
        </Card>
      )}
    </Box>
  );
};

export default AdminTrustSafetyDashboard;
