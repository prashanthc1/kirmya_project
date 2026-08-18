'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Grid,
  Chip,
  Button,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  LinearProgress,
  useTheme,
} from '@mui/material';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import GavelIcon from '@mui/icons-material/Gavel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import WorkOffIcon from '@mui/icons-material/WorkOff';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';

import { FraudAlert } from '../../features/security/types';
import { securityApi } from '../../features/security/services/securityApi';

export const FraudThreatMonitor: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Action Dialog State
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [targetAlert, setTargetAlert] = useState<FraudAlert | null>(null);
  const [newStatus, setNewStatus] = useState<FraudAlert['status']>('under_review');
  const [mitigationAction, setMitigationAction] = useState<string>('');

  const fetchAlerts = async () => {
    setLoading(true);
    const data = await securityApi.getFraudAlerts();
    setAlerts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleOpenAction = (alert: FraudAlert) => {
    setTargetAlert(alert);
    setNewStatus(alert.status);
    setMitigationAction(alert.mitigation_action || '');
    setActionDialogOpen(true);
  };

  const handleSaveAction = async () => {
    if (!targetAlert) return;
    const updated = await securityApi.updateFraudAlertStatus(targetAlert.id, newStatus, mitigationAction);
    setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setActionDialogOpen(false);
  };

  const getFraudIcon = (type: FraudAlert['fraud_type']) => {
    switch (type) {
      case 'fake_account':
        return <PersonOffIcon sx={{ color: 'error.main' }} />;
      case 'suspicious_job':
        return <WorkOffIcon sx={{ color: 'warning.main' }} />;
      case 'messaging_abuse':
        return <ReportProblemIcon sx={{ color: 'secondary.main' }} />;
      default:
        return <GavelIcon sx={{ color: 'info.main' }} />;
    }
  };

  const getStatusChip = (status: FraudAlert['status']) => {
    switch (status) {
      case 'flagged':
        return <Chip label="FLAGGED" color="error" size="small" sx={{ fontWeight: 800 }} />;
      case 'under_review':
        return <Chip label="UNDER REVIEW" color="warning" size="small" sx={{ fontWeight: 800 }} />;
      case 'confirmed_fraud':
        return <Chip label="CONFIRMED FRAUD" color="error" variant="outlined" size="small" sx={{ fontWeight: 800 }} />;
      case 'dismissed':
        return <Chip label="DISMISSED" color="default" size="small" sx={{ fontWeight: 800 }} />;
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (typeFilter !== 'all' && a.fraud_type !== typeFilter) return false;
    return true;
  });

  return (
    <Card
      sx={{
        borderRadius: '24px',
        p: 3,
        bgcolor: isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <GavelIcon sx={{ color: 'warning.main', fontSize: 36 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Fraud & Abuse Prevention Monitor
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Detect and mitigate fake accounts, suspicious job postings, mass application spam, and messaging abuse.
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5}>
          <FormControl size="small" sx={{ width: 170 }}>
            <InputLabel>Fraud Vector</InputLabel>
            <Select label="Fraud Vector" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <MenuItem value="all">All Vectors</MenuItem>
              <MenuItem value="fake_account">Fake Accounts</MenuItem>
              <MenuItem value="suspicious_job">Suspicious Jobs</MenuItem>
              <MenuItem value="mass_applications">Mass Applications</MenuItem>
              <MenuItem value="messaging_abuse">Messaging Abuse</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ width: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="flagged">Flagged</MenuItem>
              <MenuItem value="under_review">Under Review</MenuItem>
              <MenuItem value="confirmed_fraud">Confirmed Fraud</MenuItem>
              <MenuItem value="dismissed">Dismissed</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      {loading && <LinearProgress sx={{ borderRadius: 2, mb: 2 }} />}

      <Grid container spacing={2}>
        {filteredAlerts.length === 0 ? (
          <Grid item xs={12}>
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No fraud incidents matching current selection.
              </Typography>
            </Box>
          </Grid>
        ) : (
          filteredAlerts.map((alert) => (
            <Grid item xs={12} key={alert.id}>
              <Card
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(241, 245, 249, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: '12px', display: 'flex', alignItems: 'center' }}>
                      {getFraudIcon(alert.fraud_type)}
                    </Box>
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                          {alert.title}
                        </Typography>
                        {getStatusChip(alert.status)}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {alert.description}
                      </Typography>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700 }}>
                          Entity: {alert.entity_type.toUpperCase()} ({alert.entity_id})
                        </Typography>
                        <Typography variant="caption" color="error.main" sx={{ fontWeight: 800 }}>
                          Risk Score: {alert.risk_score}/100
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          Detected: {new Date(alert.detected_at).toLocaleString()}
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: { xs: '100%', md: 'auto' }, justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleOpenAction(alert)}
                      sx={{ borderRadius: '10px', fontWeight: 800 }}
                    >
                      Mitigate / Resolve
                    </Button>
                  </Stack>
                </Stack>

                {alert.mitigation_action && (
                  <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: '10px' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', display: 'block' }}>
                      Active Mitigation Action:
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {alert.mitigation_action}
                    </Typography>
                  </Box>
                )}
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Mitigation Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Manage Fraud Incident: {targetAlert?.title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Update review status and assign containment / mitigation action.
          </Typography>

          <Stack spacing={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={newStatus} onChange={(e) => setNewStatus(e.target.value as FraudAlert['status'])}>
                <MenuItem value="flagged">Flagged</MenuItem>
                <MenuItem value="under_review">Under Review</MenuItem>
                <MenuItem value="confirmed_fraud">Confirmed Fraud</MenuItem>
                <MenuItem value="dismissed">Dismissed</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Mitigation / Containment Action"
              multiline
              rows={3}
              fullWidth
              value={mitigationAction}
              onChange={(e) => setMitigationAction(e.target.value)}
              placeholder="e.g. Account suspended, posting removed, candidate notified"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveAction} sx={{ borderRadius: '8px', fontWeight: 800 }}>
            Apply Action
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default FraudThreatMonitor;
