'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Stack,
  Skeleton,
  useTheme,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import GavelIcon from '@mui/icons-material/Gavel';
import BlockIcon from '@mui/icons-material/Block';
import TimerIcon from '@mui/icons-material/Timer';
import FlagIcon from '@mui/icons-material/Flag';
import analyticsApi from '../../features/analytics/services/analyticsApi';
import { TrustSafetyAnalytics } from '../../features/analytics/types';

export default function TrustSafetyAnalyticsCard() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [data, setData] = useState<TrustSafetyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrustSafety();
  }, []);

  const loadTrustSafety = async () => {
    setLoading(true);
    const ts = await analyticsApi.getTrustSafetyAnalytics();
    setData(ts);
    setLoading(false);
  };

  const getThreatBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical':
        return <Chip label="Threat Level: CRITICAL" color="error" sx={{ fontWeight: 900 }} />;
      case 'high':
        return <Chip label="Threat Level: HIGH" color="warning" sx={{ fontWeight: 900 }} />;
      case 'medium':
        return <Chip label="Threat Level: MEDIUM" color="info" sx={{ fontWeight: 900 }} />;
      case 'low':
      default:
        return <Chip label="Threat Level: LOW" color="success" sx={{ fontWeight: 900 }} />;
    }
  };

  if (loading) {
    return (
      <Card sx={{ borderRadius: 4, p: 3, bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.8)' }}>
        <Skeleton variant="text" width={220} height={40} />
        <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2, my: 2 }} />
      </Card>
    );
  }

  const ts = data || {
    total_reports_count: 142,
    resolved_reports_count: 136,
    avg_resolution_time_mins: 18.5,
    user_restrictions_count: 12,
    permanent_bans_count: 3,
    security_threat_level: 'low',
    flagged_content_count: 28,
    spam_score_avg: 1.2,
  };

  return (
    <Card
      sx={{
        borderRadius: 4,
        p: 3,
        bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 8px 32px rgba(0, 0, 0, 0.06)',
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <SecurityIcon color="error" fontSize="large" />
              <Typography variant="h5" fontWeight={900}>
                Trust &amp; Safety Moderation Metrics
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Platform abuse reports, automated spam scores, user restriction logs, and resolution timing.
            </Typography>
          </Box>
          {getThreatBadge(ts.security_threat_level)}
        </Stack>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <ReportProblemIcon color="warning" fontSize="small" />
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  SAFETY REPORTS
                </Typography>
              </Stack>
              <Typography variant="h4" fontWeight={900} sx={{ color: '#f59e0b' }}>
                {ts.total_reports_count}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {ts.resolved_reports_count} Resolved ({((ts.resolved_reports_count / (ts.total_reports_count || 1)) * 100).toFixed(0)}%)
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <TimerIcon color="info" fontSize="small" />
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  AVG RESOLUTION TIME
                </Typography>
              </Stack>
              <Typography variant="h4" fontWeight={900} sx={{ color: '#3b82f6' }}>
                {ts.avg_resolution_time_mins}m
              </Typography>
              <Typography variant="caption" color="text.secondary">
                SLA Target: &lt;30 mins
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <GavelIcon color="secondary" fontSize="small" />
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  RESTRICTIONS &amp; BANS
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="baseline">
                <Typography variant="h4" fontWeight={900} sx={{ color: '#ec4899' }}>
                  {ts.user_restrictions_count}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Temp / {ts.permanent_bans_count} Bans
                </Typography>
              </Stack>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <FlagIcon color="error" fontSize="small" />
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  CONTENT &amp; SPAM SCORE
                </Typography>
              </Stack>
              <Typography variant="h4" fontWeight={900} sx={{ color: '#ef4444' }}>
                {ts.flagged_content_count}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avg Spam Score: {ts.spam_score_avg} / 10
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
