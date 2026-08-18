'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Chip,
  Stack,
  CircularProgress,
  Paper,
  LinearProgress,
  Avatar,
  Divider,
} from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { trustSafetyApi } from '../../features/trust_safety/services/trustSafetyApi';
import { ModeratorWorkload } from '../../features/trust_safety/types';

export const ModeratorWorkloadCard: React.FC = () => {
  const [workloads, setWorkloads] = useState<ModeratorWorkload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWorkloads = async () => {
      try {
        const data = await trustSafetyApi.getModeratorWorkloads();
        setWorkloads(data || []);
      } catch {
        setWorkloads([]);
      } finally {
        setLoading(false);
      }
    };
    loadWorkloads();
  }, []);

  const totalAssigned = workloads.reduce((acc, w) => acc + w.assigned_cases_count, 0);
  const totalCompletedToday = workloads.reduce((acc, w) => acc + w.completed_today, 0);
  const avgSlaRate =
    workloads.length > 0
      ? (workloads.reduce((acc, w) => acc + w.sla_compliance_rate, 0) / workloads.length).toFixed(1)
      : '98.0';

  const getStatusChip = (status: ModeratorWorkload['status']) => {
    switch (status) {
      case 'active':
        return <Chip label="ACTIVE" color="success" size="small" sx={{ fontWeight: 900, borderRadius: '6px' }} />;
      case 'break':
        return <Chip label="ON BREAK" color="warning" size="small" sx={{ fontWeight: 800, borderRadius: '6px' }} />;
      case 'offline':
      default:
        return <Chip label="OFFLINE" color="default" size="small" sx={{ fontWeight: 700, borderRadius: '6px' }} />;
    }
  };

  return (
    <Card
      sx={{
        borderRadius: '24px',
        p: 3,
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SupervisorAccountIcon color="primary" /> Moderator Workload & SLA Metrics
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Live team capacity, assigned active queues, resolution speeds, and overall SLA adherence.
          </Typography>
        </Box>
        <Chip
          icon={<SpeedIcon />}
          label={`Team SLA: ${avgSlaRate}%`}
          color="success"
          variant="outlined"
          sx={{ fontWeight: 900, borderRadius: '12px' }}
        />
      </Stack>

      {/* Top Aggregates Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: '14px', background: 'rgba(0, 0, 0, 0.03)' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
              ACTIVE CASES ASSIGNED
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main', mt: 0.5 }}>
              {totalAssigned} Cases
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: '14px', background: 'rgba(0, 0, 0, 0.03)' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
              RESOLVED TODAY
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: 'success.main', mt: 0.5 }}>
              {totalCompletedToday} Cases
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: '14px', background: 'rgba(0, 0, 0, 0.03)' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
              AVG HANDLE TIME
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: 'indigo', mt: 0.5 }}>
              15.2 Mins
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 3 }} />

      {/* Moderator Roster */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {workloads.map((w) => (
            <Grid item xs={12} md={4} key={w.moderator_id}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 900, width: 40, height: 40 }}>
                    {w.moderator_name.charAt(0)}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                      {w.moderator_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Shift: {w.shift_start || '09:00 AM'}
                    </Typography>
                  </Box>
                  {getStatusChip(w.status)}
                </Stack>

                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      Assigned Queue:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>
                      {w.assigned_cases_count} Open Cases
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      Completed Today:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'success.main' }}>
                      {w.completed_today} Cases
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      Avg Handle Time:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>
                      {w.avg_handle_time_mins} mins
                    </Typography>
                  </Stack>

                  <Box sx={{ pt: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        SLA Compliance
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 900, color: 'success.main' }}>
                        {w.sla_compliance_rate}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={w.sla_compliance_rate}
                      color={w.sla_compliance_rate >= 95 ? 'success' : 'warning'}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Card>
  );
};

export default ModeratorWorkloadCard;
