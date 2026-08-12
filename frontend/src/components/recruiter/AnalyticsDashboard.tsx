'use client';

import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Stack,
  LinearProgress,
  Card,
  Divider,
  useTheme,
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupIcon from '@mui/icons-material/Group';
import WorkIcon from '@mui/icons-material/Work';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export const AnalyticsDashboard: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const metrics = [
    { label: 'Total Jobs Created', value: '14 Active / Draft', icon: <WorkIcon sx={{ color: '#6366f1' }} /> },
    { label: 'Applications Received', value: '142 Applicants', icon: <GroupIcon sx={{ color: '#10b981' }} /> },
    { label: 'Candidate Conversion Rate', value: '24.5%', icon: <TrendingUpIcon sx={{ color: '#f59e0b' }} /> },
    { label: 'Average Time To Hire', value: '18 Days', icon: <AccessTimeIcon sx={{ color: '#ec4899' }} /> },
  ];

  const conversionFunnel = [
    { stage: 'Applications Received', count: 142, rate: 100 },
    { stage: 'Qualified & Reviewed', count: 88, rate: 62 },
    { stage: 'Shortlisted', count: 35, rate: 24.6 },
    { stage: 'Interviews Conducted', count: 22, rate: 15.4 },
    { stage: 'Offers Extended', count: 12, rate: 8.4 },
    { stage: 'Successful Hires', count: 10, rate: 7.0 },
  ];

  const timeMetrics = [
    { label: 'Time To First Review', value: '1.2 Days' },
    { label: 'Time To Technical Interview', value: '4.5 Days' },
    { label: 'Time To Offer Decision', value: '12.0 Days' },
    { label: 'Time To Hire Completion', value: '18.0 Days' },
  ];

  const sources = [
    { name: 'Kirmya Direct Discovery', percent: 42, count: 60 },
    { name: 'AI Candidate Match', percent: 34, count: 48 },
    { name: 'Employee Referrals', percent: 14, count: 20 },
    { name: 'External Job Boards', percent: 10, count: 14 },
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 900, mb: 3 }}>
        Recruitment Performance &amp; Hiring Analytics
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((m, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '20px',
                bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Paper elevation={0} sx={{ p: 1.5, borderRadius: '14px', bgcolor: 'rgba(99, 102, 241, 0.1)' }}>
                {m.icon}
              </Paper>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  {m.value}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  {m.label}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Conversion Funnel */}
        <Grid item xs={12} md={7}>
          <Card
            sx={{
              borderRadius: '24px',
              p: 3,
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
              Candidate Conversion &amp; Stage Funnel
            </Typography>
            <Stack spacing={2.5}>
              {conversionFunnel.map((item) => (
                <Box key={item.stage}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {item.stage} ({item.count})
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>
                      {item.rate}%
                    </Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={item.rate} color="primary" sx={{ height: 8, borderRadius: 4 }} />
                </Box>
              ))}
            </Stack>
          </Card>
        </Grid>

        {/* Time Metrics & Sources */}
        <Grid item xs={12} md={5}>
          <Card
            sx={{
              borderRadius: '24px',
              p: 3,
              mb: 3,
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              Time-to-Hire Velocity Metrics
            </Typography>
            <Grid container spacing={2}>
              {timeMetrics.map((tm, i) => (
                <Grid item xs={6} key={i}>
                  <Box sx={{ p: 2, borderRadius: '14px', bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{tm.label}</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main', mt: 0.5 }}>{tm.value}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Card>

          <Card
            sx={{
              borderRadius: '24px',
              p: 3,
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              Candidate Sourcing Channels
            </Typography>
            <Stack spacing={1.5}>
              {sources.map((s) => (
                <Box key={s.name}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>{s.name}</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>{s.count} ({s.percent}%)</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={s.percent} color="secondary" sx={{ height: 6, borderRadius: 3 }} />
                </Box>
              ))}
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard;
