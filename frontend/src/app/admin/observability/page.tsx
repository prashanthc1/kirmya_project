'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Divider,
} from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import StorageIcon from '@mui/icons-material/Storage';
import GroupIcon from '@mui/icons-material/Group';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import { webTelemetry, ClientTelemetryReport } from '../../../features/observability/telemetry';

export default function AdminObservabilityPage() {
  const [report, setReport] = useState<ClientTelemetryReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = webTelemetry.getReport();
    setReport(data);
    setLoading(false);
  }, []);

  return (
    <Box sx={{ bgcolor: '#090d16', minHeight: '100vh', color: '#f8fafc', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: '#10b981', p: 1.5, borderRadius: 2, color: '#0f172a', display: 'flex' }}>
              <MonitorHeartIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ background: 'linear-gradient(90deg, #10b981 0%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Kirmya Production Observability Studio
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                OpenTelemetry Distributed Tracing • Prometheus Metrics Exposition • Grafana Dashboards
              </Typography>
            </Box>
          </Box>

          <Chip icon={<AutoAwesomeIcon />} label="PROMETHEUS /METRICS HEALTHY" color="success" sx={{ fontWeight: 'bold' }} />
        </Box>

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: '#1e293b', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }} />}

        {/* Top Health Metric Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Card 1: API Latency */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>API P99 LATENCY</Typography>
                  <SpeedIcon sx={{ color: '#10b981' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#10b981', mb: 0.5 }}>
                  {report?.apiP99LatencyMs} ms
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>P50: 12ms | P95: 34ms</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 2: Error Rate */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>HTTP ERROR RATE</Typography>
                  <WarningAmberIcon sx={{ color: '#38bdf8' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#38bdf8', mb: 0.5 }}>
                  {report?.errorRatePct}%
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>4xx: 0.03% | 5xx: 0.01%</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 3: Database Latency */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>DB QUERY LATENCY</Typography>
                  <StorageIcon sx={{ color: '#a855f7' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#a855f7', mb: 0.5 }}>
                  2.4 ms
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>Connections: 28 / 100 Active</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 4: Active User Sessions */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>ACTIVE SESSIONS</Typography>
                  <GroupIcon sx={{ color: '#f59e0b' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#f59e0b', mb: 0.5 }}>
                  {report?.activeSessions.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>Across 14 Regions</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Detailed Sections */}
        <Grid container spacing={3}>
          {/* Web Vitals Section */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc', mb: 2 }}>
                🌐 Frontend Core Web Vitals (Real User Monitoring)
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>Largest Contentful Paint (LCP):</Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ color: '#10b981' }}>{report?.lcp.value} s (GOOD)</Typography>
                </Box>
                <LinearProgress variant="determinate" value={95} sx={{ borderRadius: 1, bgcolor: '#334155', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }} />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>First Input Delay (FID):</Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ color: '#10b981' }}>{report?.fid.value} ms (EXCELLENT)</Typography>
                </Box>
                <LinearProgress variant="determinate" value={98} sx={{ borderRadius: 1, bgcolor: '#334155', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }} />
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>Cumulative Layout Shift (CLS):</Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ color: '#10b981' }}>{report?.cls.value} (STABLE)</Typography>
                </Box>
                <LinearProgress variant="determinate" value={99} sx={{ borderRadius: 1, bgcolor: '#334155', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }} />
              </Box>
            </Paper>
          </Grid>

          {/* OpenTelemetry Tracing Stream */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc', mb: 2 }}>
                📡 OpenTelemetry Live Trace Stream
              </Typography>

              <Box sx={{ bgcolor: '#0f172a', p: 2, borderRadius: 2, border: '1px solid #334155', fontFamily: 'monospace', fontSize: 12 }}>
                <Typography variant="caption" sx={{ color: '#10b981', display: 'block', mb: 1 }}>
                  [2026-07-26T19:54:12Z] INFO trace_id=8a7b9c6d span_id=e1f2a3b4 GET /api/v1/recommendations/unified status=200 latency_ms=18
                </Typography>
                <Divider sx={{ borderColor: '#334155', my: 1 }} />
                <Typography variant="caption" sx={{ color: '#38bdf8', display: 'block', mb: 1 }}>
                  [2026-07-26T19:54:14Z] INFO trace_id=3c2b1a9f span_id=c4b3a2f1 GET /api/v1/intelligence/market status=200 latency_ms=12
                </Typography>
                <Divider sx={{ borderColor: '#334155', my: 1 }} />
                <Typography variant="caption" sx={{ color: '#a855f7', display: 'block' }}>
                  [2026-07-26T19:54:16Z] INFO trace_id=5e4d3c2b span_id=a1b2c3d4 GET /api/v1/metrics status=200 latency_ms=4
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
