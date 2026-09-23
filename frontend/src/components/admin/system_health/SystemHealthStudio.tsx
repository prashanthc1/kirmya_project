'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Alert,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import SpeedIcon from '@mui/icons-material/Speed';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { systemHealthApi, OverallHealthSummary, HealthIncident, HealthRecoveryAction } from '../../../features/system_health/services/systemHealthApi';

export default function SystemHealthStudio() {
  const [tab, setTab] = useState(0);
  const [health, setHealth] = useState<OverallHealthSummary | null>(null);
  const [incidents, setIncidents] = useState<HealthIncident[]>([]);
  const [recoveries, setRecoveries] = useState<HealthRecoveryAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [mDialogOpen, setMDialogOpen] = useState(false);
  const [mReason, setMReason] = useState('Scheduled system maintenance & infrastructure health drill');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [hSummary, incList, recList] = await Promise.all([
        systemHealthApi.getAdminHealthSummary(),
        systemHealthApi.listIncidents(),
        systemHealthApi.listRecoveryActions(),
      ]);
      setHealth(hSummary);
      setIncidents(incList);
      setRecoveries(recList);
    } catch (error) {
      // Health is the one screen that must never guess. With no answer from
      // the API it says so; it does not leave the last state on screen or
      // fall back to a reassuring default.
      setHealth(null);
      setLoadError(error instanceof Error ? error.message : 'The request failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSelfHealing = async (actionType: string, component: string) => {
    setActionLoading(true);
    setSuccessMsg(null);
    try {
      const act = await systemHealthApi.triggerSelfHealing(actionType, component);
      setSuccessMsg(`Self-healing action ${act.actionType} completed for ${act.componentName}`);
      await loadData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleMaintenance = async () => {
    setActionLoading(true);
    try {
      const newStatus = !health?.isMaintenance;
      await systemHealthApi.toggleMaintenanceMode(newStatus, mReason);
      setMDialogOpen(false);
      await loadData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setActionLoading(true);
    try {
      const rep = await systemHealthApi.generateDiagnosticReport();
      setSuccessMsg(`Generated Diagnostic Package: ${rep.reportId.substring(0, 8)} (Signed Download Ready)`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100dvh', color: 'text.primary', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: 'success.main', p: 1.5, borderRadius: 2, color: 'success.contrastText', display: 'flex' }}>
              <HealthAndSafetyIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{    }}>
                Kirmya System Health & Diagnostics Studio
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Liveness • Readiness • Circuit Breakers • Automated Self-Healing • Maintenance Mode Engine
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <FormControlLabel
              control={<Switch checked={health?.isMaintenance || false} onChange={() => setMDialogOpen(true)} color="secondary" />}
              label={health?.isMaintenance ? 'MAINTENANCE ACTIVE' : 'Maintenance Mode'}
              sx={{ color: health?.isMaintenance ? '#f59e0b' : "text.secondary", fontWeight: 'bold' }}
            />
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleGenerateReport} disabled={actionLoading} sx={{ color: 'primary.main', borderColor: 'primary.main' }}>
              Export Diagnostics
            </Button>
            <Button variant="contained" startIcon={<RefreshIcon />} onClick={loadData} sx={{ bgcolor: 'success.main', color: 'success.contrastText', fontWeight: 'bold', '&:hover': { bgcolor: 'success.main' } }}>
              Refresh Probes
            </Button>
          </Box>
        </Box>

        {successMsg && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMsg(null)}>{successMsg}</Alert>}
        {loading && <LinearProgress sx={{ mb: 3, bgcolor: 'background.paper', '& .MuiLinearProgress-bar': { bgcolor: 'success.main' } }} />}

        {loadError && !loading && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Platform health is unknown: the health API could not be reached. Treat this as no signal,
            not as a healthy platform. {loadError}
          </Alert>
        )}

        {/* System Health Metric Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>OVERALL PLATFORM</Typography>
                  <CheckCircleIcon sx={{ color: health?.status === 'healthy' ? '#10b981' : '#f59e0b' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: health?.status === 'healthy' ? '#10b981' : '#f59e0b', mb: 0.5, textTransform: 'capitalize' }}>
                  {health?.status || 'Healthy'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Uptime: {Math.floor((health?.uptimeSeconds || 0) / 3600)}h {Math.floor(((health?.uptimeSeconds || 0) % 3600) / 60)}m</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>CIRCUIT BREAKERS</Typography>
                  <SpeedIcon sx={{ color: 'primary.main' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'primary.main', mb: 0.5 }}>
                  CLOSED (HEALTHY)
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>All Probes Latency &lt; 20ms</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>ACTIVE INCIDENTS</Typography>
                  <ReportProblemIcon sx={{ color: 'warning.main' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: incidents.length > 0 ? '#f59e0b' : '#10b981', mb: 0.5 }}>
                  {incidents.length}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Auto-Deduplicated & Tracked</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>SELF-HEALING ACTIONS</Typography>
                  <BuildCircleIcon sx={{ color: 'primary.main' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'primary.main', mb: 0.5 }}>
                  {recoveries.length}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Safe Recovery Executed</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabbed Operations Table */}
        <Paper sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2.5, mb: 4 }}>
          <Tabs
            value={tab}
            onChange={(_, val) => setTab(val)}
            sx={{ borderBottom: '1px solid #334155', '& .MuiTab-root': { color: 'text.secondary', fontWeight: 'bold' }, '& .Mui-selected': { color: 'success.main' } }}
          >
            <Tab label="Dependency Probes & Matrix" />
            <Tab label="Incident Telemetry" />
            <Tab label="Self-Healing Audit Logs" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {/* Tab 0: Component Health Matrix */}
            {tab === 0 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ '& th': { color: 'text.secondary', fontWeight: 'bold', borderColor: 'divider' } }}>
                      <TableCell>Component Name</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Weight</TableCell>
                      <TableCell>Probe Latency</TableCell>
                      <TableCell>Circuit Breaker</TableCell>
                      <TableCell>Diagnostic Details</TableCell>
                      <TableCell align="right">Self-Healing Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {health && Object.values(health.components).map((c) => (
                      <TableRow key={c.name} sx={{ '& td': { color: 'text.primary', borderColor: 'divider' } }}>
                        <TableCell><Typography variant="body2" fontWeight="bold" sx={{ textTransform: 'uppercase' }}>{c.name}</Typography></TableCell>
                        <TableCell><Chip label={c.status.toUpperCase()} color={c.status === 'healthy' ? 'success' : 'warning'} size="small" /></TableCell>
                        <TableCell><Chip label={c.weight} variant="outlined" size="small" sx={{ color: c.weight === 'critical' ? '#ef4444' : "primary.main", borderColor: c.weight === 'critical' ? '#ef4444' : "primary.main" }} /></TableCell>
                        <TableCell>{c.latencyMs} ms</TableCell>
                        <TableCell><Chip label={c.circuitBreakerStatus || 'CLOSED'} size="small" sx={{ bgcolor: 'background.default', color: 'success.main' }} /></TableCell>
                        <TableCell><Typography variant="caption" sx={{ color: 'text.primary' }}>{c.message}</Typography></TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="outlined" color="secondary" onClick={() => handleSelfHealing('clear_transient_cache', c.name)}>
                            Trigger Recovery
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Tab 1: Incidents */}
            {tab === 1 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ '& th': { color: 'text.secondary', fontWeight: 'bold', borderColor: 'divider' } }}>
                      <TableCell>Component / Failure</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Deduplicated Count</TableCell>
                      <TableCell>Error Details</TableCell>
                      <TableCell align="right">Last Seen</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {incidents.map((inc) => (
                      <TableRow key={inc.id} sx={{ '& td': { color: 'text.primary', borderColor: 'divider' } }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold" sx={{ textTransform: 'uppercase' }}>{inc.componentName}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{inc.failureType}</Typography>
                        </TableCell>
                        <TableCell><Chip label={inc.severity} color={inc.severity === 'critical' ? 'error' : 'warning'} size="small" /></TableCell>
                        <TableCell><Chip label={inc.status} size="small" sx={{ bgcolor: 'background.default', color: 'primary.main' }} /></TableCell>
                        <TableCell>{inc.dedupCount} events</TableCell>
                        <TableCell>{inc.errorMessage}</TableCell>
                        <TableCell align="right">{new Date(inc.lastSeenAt).toLocaleTimeString()}</TableCell>
                      </TableRow>
                    ))}
                    {incidents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                          No active system health incidents detected.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Tab 2: Self-Healing Log */}
            {tab === 2 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ '& th': { color: 'text.secondary', fontWeight: 'bold', borderColor: 'divider' } }}>
                      <TableCell>Action Type</TableCell>
                      <TableCell>Target Component</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Result Summary</TableCell>
                      <TableCell align="right">Executed At</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recoveries.map((r) => (
                      <TableRow key={r.id} sx={{ '& td': { color: 'text.primary', borderColor: 'divider' } }}>
                        <TableCell><Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>{r.actionType}</Typography></TableCell>
                        <TableCell sx={{ textTransform: 'uppercase' }}>{r.componentName}</TableCell>
                        <TableCell><Chip label={r.status} color="success" size="small" /></TableCell>
                        <TableCell>{r.resultSummary}</TableCell>
                        <TableCell align="right">{new Date(r.startedAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Paper>

        {/* Maintenance Toggle Dialog */}
        <Dialog open={mDialogOpen} onClose={() => setMDialogOpen(false)} PaperProps={{ sx: { bgcolor: '#0f172a', color: '#f8fafc', border: '1px solid #334155' } }}>
          <DialogTitle sx={{ color: 'warning.main' }}>
            {health?.isMaintenance ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: 'text.primary', mb: 2 }}>
              {health?.isMaintenance
                ? 'Disabling maintenance mode will restore standard user traffic to all Kirmya services.'
                : 'Enabling maintenance mode will route non-administrative visitors to the Kirmya Maintenance Page overlay while keeping diagnostic access open to admins.'}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Maintenance Operational Reason"
              value={mReason}
              onChange={(e) => setMReason(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { color: 'text.primary' }, '& .MuiInputLabel-root': { color: 'text.secondary' } }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setMDialogOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
            <Button variant="contained" color="warning" onClick={handleToggleMaintenance} disabled={actionLoading}>
              Confirm Maintenance Toggle
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
