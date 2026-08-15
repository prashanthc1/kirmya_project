'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Stack,
  Tooltip,
  IconButton,
  Alert,
  CircularProgress,
  useTheme,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ReplayIcon from '@mui/icons-material/Replay';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';

import { adminApi } from '../../features/admin/services/adminApi';
import { BackgroundJobDTO } from '../../features/admin/types';

export const BackgroundJobManager: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [jobs, setJobs] = useState<BackgroundJobDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterQueue, setFilterQueue] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await adminApi.listBackgroundJobs();
      setJobs(data);
    } catch {
      setActionMessage('Failed to fetch background jobs queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleRetryJob = async (jobId: string) => {
    setRetryingId(jobId);
    setActionMessage(null);
    try {
      const res = await adminApi.retryBackgroundJob(jobId);
      setActionMessage(res.message || `Job ${jobId} queued for retry.`);
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: 'retrying', attempts: j.attempts + 1 } : j))
      );
    } catch {
      setActionMessage(`Error retrying job ${jobId}.`);
    } finally {
      setRetryingId(null);
    }
  };

  const queues = Array.from(new Set(jobs.map((j) => j.queue)));

  const filteredJobs = jobs.filter((j) => {
    const queueMatch = filterQueue === 'all' || j.queue === filterQueue;
    const statusMatch = filterStatus === 'all' || j.status === filterStatus;
    return queueMatch && statusMatch;
  });

  const countByStatus = (status: string) => jobs.filter((j) => j.status === status).length;

  const getStatusChip = (status: BackgroundJobDTO['status']) => {
    switch (status) {
      case 'completed':
        return <Chip icon={<CheckCircleIcon />} label="Completed" color="success" size="small" sx={{ fontWeight: 800 }} />;
      case 'running':
        return <Chip icon={<CircularProgress size={12} color="inherit" />} label="Running" color="info" size="small" sx={{ fontWeight: 800 }} />;
      case 'failed':
        return <Chip icon={<ErrorOutlineIcon />} label="Failed" color="error" size="small" sx={{ fontWeight: 800 }} />;
      case 'retrying':
        return <Chip icon={<ReplayIcon />} label="Retrying" color="warning" size="small" sx={{ fontWeight: 800 }} />;
      case 'pending':
      default:
        return <Chip icon={<HourglassEmptyIcon />} label="Pending" color="default" size="small" sx={{ fontWeight: 800 }} />;
    }
  };

  return (
    <Card
      sx={{
        borderRadius: '24px',
        p: { xs: 2, md: 3 },
        bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" sx={{ mb: 3 }} spacing={2}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <WorkHistoryIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              Background Job Manager &amp; Queue Depth
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Real-time telemetry for worker task queues, failed execution retries, and background job health.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchJobs}
          disabled={loading}
          sx={{ borderRadius: '12px', fontWeight: 800 }}
        >
          Refresh Queue
        </Button>
      </Stack>

      {actionMessage && (
        <Alert severity="info" onClose={() => setActionMessage(null)} sx={{ mb: 3, borderRadius: '12px' }}>
          {actionMessage}
        </Alert>
      )}

      {/* Telemetry Metric Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Jobs', count: jobs.length, color: '#3b82f6' },
          { label: 'Running', count: countByStatus('running'), color: '#06b6d4' },
          { label: 'Pending', count: countByStatus('pending'), color: '#8b5cf6' },
          { label: 'Retrying', count: countByStatus('retrying'), color: '#f59e0b' },
          { label: 'Failed Jobs', count: countByStatus('failed'), color: '#ef4444' },
        ].map((m) => (
          <Grid item xs={6} sm={2.4} key={m.label}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '16px',
                bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                textAlign: 'center',
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 900, color: m.color }}>
                {m.count}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                {m.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Controls & Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Queue</InputLabel>
          <Select value={filterQueue} label="Queue" onChange={(e) => setFilterQueue(e.target.value)}>
            <MenuItem value="all">All Queues</MenuItem>
            {queues.map((q) => (
              <MenuItem key={q} value={q}>
                {q}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
            <MenuItem value="running">Running</MenuItem>
            <MenuItem value="retrying">Retrying</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Jobs Table */}
      <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Job Name &amp; ID</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Queue</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Attempts</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Failure Detail</TableCell>
              <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Loading background queue telemetry...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : filteredJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No background jobs found matching the selected filter.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredJobs.map((job) => (
                <TableRow key={job.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {job.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      {job.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={job.queue} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                  </TableCell>
                  <TableCell>{getStatusChip(job.status)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      {job.attempts} / {job.maxAttempts}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {job.failedReason ? (
                      <Tooltip title={job.failedReason} arrow>
                        <Chip
                          icon={<ErrorOutlineIcon />}
                          label={job.failedReason}
                          color="error"
                          variant="outlined"
                          size="small"
                          sx={{ maxWidth: 220, fontWeight: 600 }}
                        />
                      </Tooltip>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        N/A
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {job.status === 'failed' ? (
                      <Button
                        variant="contained"
                        color="warning"
                        size="small"
                        startIcon={
                          retryingId === job.id ? <CircularProgress size={14} color="inherit" /> : <ReplayIcon />
                        }
                        onClick={() => handleRetryJob(job.id)}
                        disabled={retryingId === job.id}
                        sx={{ borderRadius: '10px', fontWeight: 800 }}
                      >
                        Retry Job
                      </Button>
                    ) : (
                      <Button variant="text" size="small" disabled sx={{ borderRadius: '10px' }}>
                        No Action
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default BackgroundJobManager;
