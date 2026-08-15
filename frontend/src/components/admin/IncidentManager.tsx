'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Chip,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Paper,
  Alert,
  CircularProgress,
  useTheme,
  Divider,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import AddIcon from '@mui/icons-material/Add';
import TimelineIcon from '@mui/icons-material/Timeline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import BuildIcon from '@mui/icons-material/Build';

import { adminApi } from '../../features/admin/services/adminApi';
import { IncidentDTO, IncidentUpdateDTO } from '../../features/admin/types';

const STATUS_STEPS = ['Open', 'Investigating', 'Mitigated', 'Resolved'];

export const IncidentManager: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [incidents, setIncidents] = useState<IncidentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<IncidentDTO | null>(null);

  // New Incident Dialog State
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSeverity, setNewSeverity] = useState<'Critical' | 'Major' | 'Minor'>('Major');
  const [newAffected, setNewAffected] = useState('');

  // Update Status Dialog State
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'Open' | 'Investigating' | 'Mitigated' | 'Resolved'>('Investigating');
  const [updateMessage, setUpdateMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const data = await adminApi.listIncidents();
      setIncidents(data);
      if (data.length > 0 && !selectedIncident) {
        setSelectedIncident(data[0]);
      }
    } catch {
      setFeedback('Failed to load platform incidents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleCreateIncident = async () => {
    if (!newTitle.trim() || !newDescription.trim()) return;
    setSubmitting(true);
    try {
      const created = await adminApi.createIncident({
        title: newTitle,
        description: newDescription,
        severity: newSeverity,
        status: 'Open',
        affectedServices: newAffected.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setIncidents((prev) => [created, ...prev]);
      setSelectedIncident(created);
      setCreateDialogOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewAffected('');
      setFeedback('Platform incident logged successfully.');
    } catch {
      setFeedback('Error creating incident.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedIncident || !updateMessage.trim()) return;
    setSubmitting(true);
    try {
      const updated = await adminApi.updateIncidentStatus(selectedIncident.id, {
        status: updateStatus,
        message: updateMessage,
      });
      setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setSelectedIncident(updated);
      setUpdateDialogOpen(false);
      setUpdateMessage('');
      setFeedback(`Incident updated to ${updateStatus}.`);
    } catch {
      setFeedback('Error updating incident status.');
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityBadge = (severity: IncidentDTO['severity']) => {
    switch (severity) {
      case 'Critical':
        return <Chip label="Critical" color="error" size="small" sx={{ fontWeight: 900 }} />;
      case 'Major':
        return <Chip label="Major" color="warning" size="small" sx={{ fontWeight: 900 }} />;
      case 'Minor':
      default:
        return <Chip label="Minor" color="info" size="small" sx={{ fontWeight: 900 }} />;
    }
  };

  const getStatusChip = (status: IncidentDTO['status']) => {
    switch (status) {
      case 'Resolved':
        return <Chip label="Resolved" color="success" size="small" sx={{ fontWeight: 800 }} />;
      case 'Mitigated':
        return <Chip label="Mitigated" color="info" size="small" sx={{ fontWeight: 800 }} />;
      case 'Investigating':
        return <Chip label="Investigating" color="warning" size="small" sx={{ fontWeight: 800 }} />;
      case 'Open':
      default:
        return <Chip label="Open" color="error" size="small" sx={{ fontWeight: 800 }} />;
    }
  };

  const activeStepIndex = selectedIncident ? STATUS_STEPS.indexOf(selectedIncident.status) : 0;

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
            <ReportProblemIcon color="error" sx={{ fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              Platform Incident Tracking &amp; SLA Management
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Real-time incident response management, service outage timelines, and resolution SLAs.
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="error"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{ borderRadius: '12px', fontWeight: 800, px: 3 }}
        >
          Report Incident
        </Button>
      </Stack>

      {feedback && (
        <Alert severity="info" onClose={() => setFeedback(null)} sx={{ mb: 3, borderRadius: '12px' }}>
          {feedback}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Incident List */}
        <Grid item xs={12} md={5}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, textTransform: 'uppercase', letterSpacing: 1 }}>
            Active &amp; Recent Incidents ({incidents.length})
          </Typography>
          <Stack spacing={2} sx={{ maxHeight: 480, overflowY: 'auto', pr: 1 }}>
            {loading ? (
              <Box sx={{ textCenter: 'center', py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : incidents.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center', borderRadius: '16px' }}>
                <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  All Platform Systems Operational
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  No open incidents reported.
                </Typography>
              </Paper>
            ) : (
              incidents.map((inc) => {
                const isSelected = selectedIncident?.id === inc.id;
                return (
                  <Paper
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    elevation={isSelected ? 4 : 0}
                    sx={{
                      p: 2,
                      borderRadius: '16px',
                      cursor: 'pointer',
                      bgcolor: isSelected
                        ? isDark
                          ? 'rgba(51, 65, 85, 0.9)'
                          : 'rgba(238, 242, 256, 0.9)'
                        : isDark
                        ? 'rgba(15, 23, 42, 0.5)'
                        : 'rgba(241, 245, 249, 0.7)',
                      border: isSelected ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                      transition: 'all 0.2s ease',
                      '&:hover': { transform: 'translateY(-2px)' },
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                      {getSeverityBadge(inc.severity)}
                      {getStatusChip(inc.status)}
                    </Stack>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>
                      {inc.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Reported: {new Date(inc.createdAt).toLocaleString()}
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                      {inc.affectedServices.map((srv) => (
                        <Chip key={srv} label={srv} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                      ))}
                    </Stack>
                  </Paper>
                );
              })
            )}
          </Stack>
        </Grid>

        {/* Selected Incident Detail & Status Timeline */}
        <Grid item xs={12} md={7}>
          {selectedIncident ? (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '20px',
                bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    {selectedIncident.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Incident ID: {selectedIncident.id}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<BuildIcon />}
                  onClick={() => {
                    setUpdateStatus(selectedIncident.status);
                    setUpdateDialogOpen(true);
                  }}
                  sx={{ borderRadius: '10px', fontWeight: 800 }}
                >
                  Update Status
                </Button>
              </Stack>

              <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                {selectedIncident.description}
              </Typography>

              {/* Status Timeline Stepper */}
              <Box sx={{ mb: 4, py: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>
                  Lifecycle Status Progression
                </Typography>
                <Stepper activeStep={activeStepIndex >= 0 ? activeStepIndex : 0} alternativeLabel>
                  {STATUS_STEPS.map((step) => (
                    <Step key={step}>
                      <StepLabel>{step}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Audit Timeline updates */}
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>
                Audit Timeline Updates ({selectedIncident.updates.length})
              </Typography>

              <Stack spacing={2}>
                {selectedIncident.updates.map((update) => (
                  <Box
                    key={update.id}
                    sx={{
                      p: 2,
                      borderRadius: '12px',
                      bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                      borderLeft: '4px solid #3b82f6',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      {getStatusChip(update.status)}
                      <Typography variant="caption" color="text.secondary">
                        {new Date(update.createdAt).toLocaleString()} by {update.author}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                      {update.message}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '20px' }}>
              <Typography variant="body1" color="text.secondary">
                Select an incident from the list to view timeline details.
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Create Incident Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Log Platform Incident</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Incident Title"
              fullWidth
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Database CPU Spike on DB-01"
            />

            <TextField
              label="Severity Level"
              select
              fullWidth
              value={newSeverity}
              onChange={(e) => setNewSeverity(e.target.value as any)}
            >
              <MenuItem value="Critical">Critical (P0 Outage)</MenuItem>
              <MenuItem value="Major">Major (P1 Degradation)</MenuItem>
              <MenuItem value="Minor">Minor (P2 Low Impact)</MenuItem>
            </TextField>

            <TextField
              label="Affected Services (comma separated)"
              fullWidth
              value={newAffected}
              onChange={(e) => setNewAffected(e.target.value)}
              placeholder="e.g. API Gateway, Auth Engine, Billing"
            />

            <TextField
              label="Incident Description & Initial Diagnostics"
              multiline
              rows={4}
              fullWidth
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCreateIncident}
            disabled={submitting || !newTitle.trim() || !newDescription.trim()}
            sx={{ fontWeight: 800 }}
          >
            {submitting ? <CircularProgress size={20} /> : 'Create Incident'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Update Incident Status</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="New Status"
              select
              fullWidth
              value={updateStatus}
              onChange={(e) => setUpdateStatus(e.target.value as any)}
            >
              <MenuItem value="Open">Open</MenuItem>
              <MenuItem value="Investigating">Investigating</MenuItem>
              <MenuItem value="Mitigated">Mitigated</MenuItem>
              <MenuItem value="Resolved">Resolved</MenuItem>
            </TextField>

            <TextField
              label="Status Update Message / Note"
              multiline
              rows={3}
              fullWidth
              value={updateMessage}
              onChange={(e) => setUpdateMessage(e.target.value)}
              placeholder="Describe progress made, mitigation applied, or root cause identified..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpdateStatus}
            disabled={submitting || !updateMessage.trim()}
            sx={{ fontWeight: 800 }}
          >
            {submitting ? <CircularProgress size={20} /> : 'Submit Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default IncidentManager;
