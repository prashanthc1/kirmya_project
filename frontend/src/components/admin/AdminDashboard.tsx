'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  Stack,
  Chip,
  Paper,
  Button,
  useTheme,
  Tab,
  Tabs,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import GavelIcon from '@mui/icons-material/Gavel';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BuildIcon from '@mui/icons-material/Build';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
import { useRouter } from 'next/navigation';

import BackgroundJobManager from './BackgroundJobManager';
import IncidentManager from './IncidentManager';
import MaintenanceModeModal from './MaintenanceModeModal';
import ImpersonationDialog from './ImpersonationDialog';

export const AdminDashboard: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(0);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [impersonationOpen, setImpersonationOpen] = useState(false);

  const metrics = [
    { label: 'Total Users', value: '12,450', change: '+12% this month', icon: <PeopleIcon sx={{ color: '#3b82f6' }} />, path: '/admin/users' },
    { label: 'Active Users', value: '11,200', change: '90% retention', icon: <PeopleIcon sx={{ color: '#10b981' }} />, path: '/admin/users' },
    { label: 'Suspended Users', value: '42', change: '0.3% of total', icon: <PeopleIcon sx={{ color: '#ef4444' }} />, path: '/admin/users' },
    { label: 'Verified Companies', value: '940 / 1,280', change: '73.4% verified', icon: <BusinessIcon sx={{ color: '#6366f1' }} />, path: '/admin/companies' },
    { label: 'Active Jobs', value: '4,850', change: '+18% growth', icon: <WorkIcon sx={{ color: '#f59e0b' }} />, path: '/admin/jobs' },
    { label: 'Pending Moderation', value: '14 Cases', change: 'Critical priority: 2', icon: <GavelIcon sx={{ color: '#ec4899' }} />, path: '/admin/moderation' },
    { label: 'Pending Verifications', value: '28 Reviews', change: 'Avg SLA: 2.4 hrs', icon: <VerifiedUserIcon sx={{ color: '#8b5cf6' }} />, path: '/admin/verifications' },
    { label: 'Security Alerts', value: '5 Alerts', change: '0 account breaches', icon: <SecurityIcon sx={{ color: '#dc2626' }} />, path: '/admin/trust-safety' },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} sx={{ mb: 4 }} spacing={2}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
            Platform Administrative Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Centralized monitoring for platform activity, background queues, incident SLAs, and system operations.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1}>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<BuildIcon />}
            onClick={() => setMaintenanceOpen(true)}
            sx={{ borderRadius: '12px', fontWeight: 800 }}
          >
            Maintenance Mode
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            startIcon={<SupervisorAccountIcon />}
            onClick={() => setImpersonationOpen(true)}
            sx={{ borderRadius: '12px', fontWeight: 800 }}
          >
            Impersonate
          </Button>

          <Button
            variant="contained"
            color="error"
            startIcon={<GavelIcon />}
            onClick={() => router.push('/admin/moderation')}
            sx={{ borderRadius: '12px', fontWeight: 800, px: 2.5 }}
          >
            Open Queue (14)
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((m) => (
          <Grid item xs={12} sm={6} md={3} key={m.label}>
            <Card
              onClick={() => router.push(m.path)}
              sx={{
                p: 3,
                borderRadius: '20px',
                cursor: 'pointer',
                bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(0,0,0,0.15)' },
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                <Box sx={{ p: 1, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.05)' }}>
                  {m.icon}
                </Box>
                <Chip label={m.change} size="small" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
              </Stack>

              <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
                {m.value}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                {m.label}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs for Operations Center */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
          <Tab label="System Telemetry & Operations" icon={<CheckCircleIcon />} iconPosition="start" sx={{ fontWeight: 800 }} />
          <Tab label="Background Jobs & Queues" icon={<WorkHistoryIcon />} iconPosition="start" sx={{ fontWeight: 800 }} />
          <Tab label="Platform Incident Center" icon={<ReportProblemIcon />} iconPosition="start" sx={{ fontWeight: 800 }} />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                p: 3,
                borderRadius: '24px',
                bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Infrastructure System Health
              </Typography>

              <Grid container spacing={2}>
                {['API Gateway', 'PostgreSQL DB', 'Redis Cache', 'Worker Queues', 'Notification Push', 'AI Moderation'].map((service) => (
                  <Grid item xs={6} key={service}>
                    <Paper sx={{ p: 2, borderRadius: '14px', bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)' }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CheckCircleIcon sx={{ color: '#10b981', fontSize: 20 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                          {service}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>
                        Operational - 99.99% Uptime
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              sx={{
                p: 3,
                borderRadius: '24px',
                bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Platform Growth Trends
              </Typography>

              <Stack spacing={2}>
                <Box>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Monthly User Signups</Typography>
                    <Typography variant="body2" color="primary.main" sx={{ fontWeight: 800 }}>+12.4%</Typography>
                  </Stack>
                  <Box sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(99, 102, 241, 0.2)' }}>
                    <Box sx={{ width: '78%', height: '100%', borderRadius: 4, bgcolor: '#6366f1' }} />
                  </Box>
                </Box>

                <Box>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Active Job Listings</Typography>
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 800 }}>+18.2%</Typography>
                  </Stack>
                  <Box sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(16, 185, 129, 0.2)' }}>
                    <Box sx={{ width: '85%', height: '100%', borderRadius: 4, bgcolor: '#10b981' }} />
                  </Box>
                </Box>

                <Box>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Moderation SLA Compliance</Typography>
                    <Typography variant="body2" color="error.main" sx={{ fontWeight: 800 }}>98.6% Target Passed</Typography>
                  </Stack>
                  <Box sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(239, 68, 68, 0.2)' }}>
                    <Box sx={{ width: '98%', height: '100%', borderRadius: 4, bgcolor: '#ef4444' }} />
                  </Box>
                </Box>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && <BackgroundJobManager />}
      {activeTab === 2 && <IncidentManager />}

      {/* Modals */}
      <MaintenanceModeModal open={maintenanceOpen} onClose={() => setMaintenanceOpen(false)} />

      <ImpersonationDialog
        open={impersonationOpen}
        onClose={() => setImpersonationOpen(false)}
        targetUser={{ id: 'u1', name: 'Tariq Al-Mansoor', email: 'tariq@kirmya.com' }}
      />
    </Box>
  );
};

export default AdminDashboard;
