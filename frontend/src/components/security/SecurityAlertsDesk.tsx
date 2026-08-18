'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Stack,
  Drawer,
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
import WarningIcon from '@mui/icons-material/Warning';
import ShieldIcon from '@mui/icons-material/Shield';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import FilterListIcon from '@mui/icons-material/FilterList';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

import { SecurityAlert } from '../../features/security/types';
import { securityApi } from '../../features/security/services/securityApi';

export const SecurityAlertsDesk: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Status update modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetAlert, setTargetAlert] = useState<SecurityAlert | null>(null);
  const [newStatus, setNewStatus] = useState<SecurityAlert['status']>('open');

  // False positive dialog state
  const [fpDialogOpen, setFpDialogOpen] = useState(false);
  const [fpReason, setFpReason] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchAlerts = async () => {
    setLoading(true);
    const data = await securityApi.getSecurityAlerts();
    setAlerts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleOpenDrawer = (alert: SecurityAlert) => {
    setSelectedAlert(alert);
    setDrawerOpen(true);
  };

  const handleOpenStatusModal = (alert: SecurityAlert) => {
    setTargetAlert(alert);
    setNewStatus(alert.status);
    setStatusModalOpen(true);
  };

  const handleOpenFpDialog = (alert: SecurityAlert) => {
    setTargetAlert(alert);
    setFpReason('');
    setFpDialogOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!targetAlert) return;
    const updated = await securityApi.updateSecurityAlertStatus(targetAlert.id, newStatus);
    setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    if (selectedAlert && selectedAlert.id === updated.id) {
      setSelectedAlert(updated);
    }
    setStatusModalOpen(false);
  };

  const handleConfirmFalsePositive = async () => {
    if (!targetAlert) return;
    const updated = await securityApi.markAlertFalsePositive(targetAlert.id, fpReason);
    setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    if (selectedAlert && selectedAlert.id === updated.id) {
      setSelectedAlert(updated);
    }
    setFpDialogOpen(false);
  };

  const getSeverityChip = (severity: SecurityAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return <Chip label="CRITICAL" color="error" size="small" sx={{ fontWeight: 800 }} />;
      case 'high':
        return <Chip label="HIGH" sx={{ bgcolor: 'warning.main', color: '#000', fontWeight: 800 }} size="small" />;
      case 'medium':
        return <Chip label="MEDIUM" color="info" size="small" sx={{ fontWeight: 800 }} />;
      default:
        return <Chip label="LOW" color="default" size="small" sx={{ fontWeight: 800 }} />;
    }
  };

  const getStatusChip = (status: SecurityAlert['status']) => {
    switch (status) {
      case 'open':
        return <Chip label="OPEN" color="error" variant="outlined" size="small" sx={{ fontWeight: 800 }} />;
      case 'investigating':
        return <Chip label="INVESTIGATING" color="warning" variant="outlined" size="small" sx={{ fontWeight: 800 }} />;
      case 'resolved':
        return <Chip label="RESOLVED" color="success" size="small" sx={{ fontWeight: 800 }} />;
      case 'false_positive':
        return <Chip label="FALSE POSITIVE" color="default" size="small" sx={{ fontWeight: 800 }} />;
      default:
        return <Chip label={status.toUpperCase()} size="small" sx={{ fontWeight: 800 }} />;
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (statusFilter !== 'all' && alert.status !== statusFilter) return false;
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        alert.title.toLowerCase().includes(q) ||
        alert.description.toLowerCase().includes(q) ||
        (alert.target_user_email && alert.target_user_email.toLowerCase().includes(q)) ||
        (alert.ip_address && alert.ip_address.includes(q))
      );
    }
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
          <ShieldIcon sx={{ color: 'error.main', fontSize: 32 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Security Operations Center - Threat & Incident Desk
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Real-time security alerts, threat anomalies, and false-positive management.
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField
            placeholder="Search alerts or IP..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: 220 }}
          />
          <FormControl size="small" sx={{ width: 140 }}>
            <InputLabel>Severity</InputLabel>
            <Select label="Severity" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
              <MenuItem value="all">All Severity</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ width: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="investigating">Investigating</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="false_positive">False Positive</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      {loading && <LinearProgress sx={{ borderRadius: 2, mb: 2 }} />}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Severity</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Alert & Description</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Source</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Risk Score</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Target / IP</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAlerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No security alerts matching the active filters.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredAlerts.map((alert) => (
                <TableRow key={alert.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>{getSeverityChip(alert.severity)}</TableCell>
                  <TableCell sx={{ maxWidth: 300 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {alert.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block">
                      {alert.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontWeight: 700, bgcolor: 'action.hover', px: 1, py: 0.5, borderRadius: '6px' }}>
                      {alert.source}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {alert.risk_score !== undefined ? (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 900,
                            color: alert.risk_score >= 80 ? 'error.main' : alert.risk_score >= 50 ? 'warning.main' : 'success.main',
                          }}
                        >
                          {alert.risk_score}/100
                        </Typography>
                      </Stack>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" display="block" sx={{ fontWeight: 700 }}>
                      {alert.target_user_email || 'System Wide'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {alert.ip_address || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>{getStatusChip(alert.status)}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="View Alert Details">
                        <IconButton size="small" onClick={() => handleOpenDrawer(alert)} color="primary">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Update Status">
                        <IconButton size="small" onClick={() => handleOpenStatusModal(alert)} color="info">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Mark False Positive">
                        <IconButton size="small" onClick={() => handleOpenFpDialog(alert)} color="secondary">
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Alert Detail Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: { xs: 320, sm: 450 }, p: 3 }}>
          {selectedAlert && (
            <Stack spacing={2.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" sx={{ fontWeight: 900 }}>Alert Details</Typography>
                {getSeverityChip(selectedAlert.severity)}
              </Stack>

              <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: '12px' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{selectedAlert.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{selectedAlert.description}</Typography>
              </Box>

              <Stack spacing={1.5}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>METADATA</Typography>
                <Box>
                  <Typography variant="caption" color="text.secondary">Alert ID:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedAlert.id}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Source:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedAlert.source}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Risk Score:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedAlert.risk_score || 'N/A'}/100</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Target Email:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedAlert.target_user_email || 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Target IP Address:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedAlert.ip_address || 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Timestamp:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{new Date(selectedAlert.created_at).toLocaleString()}</Typography>
                </Box>
              </Stack>

              {selectedAlert.is_false_positive && (
                <Box sx={{ bgcolor: 'warning.light', opacity: 0.9, p: 2, borderRadius: '12px', color: '#000' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Marked as False Positive</Typography>
                  <Typography variant="caption">{selectedAlert.false_positive_reason || 'No reason provided'}</Typography>
                </Box>
              )}

              <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
                <Button variant="contained" fullWidth onClick={() => handleOpenStatusModal(selectedAlert)} sx={{ borderRadius: '12px', fontWeight: 800 }}>
                  Change Status
                </Button>
                <Button variant="outlined" color="secondary" fullWidth onClick={() => handleOpenFpDialog(selectedAlert)} sx={{ borderRadius: '12px', fontWeight: 800 }}>
                  Mark False Positive
                </Button>
              </Stack>
            </Stack>
          )}
        </Box>
      </Drawer>

      {/* Status Update Modal */}
      <Dialog open={statusModalOpen} onClose={() => setStatusModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Update Alert Status</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Modify current state for alert: <strong>{targetAlert?.title}</strong>
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={newStatus} onChange={(e) => setNewStatus(e.target.value as SecurityAlert['status'])}>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="investigating">Investigating</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="false_positive">False Positive</MenuItem>
              <MenuItem value="dismissed">Dismissed</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveStatus} sx={{ borderRadius: '8px', fontWeight: 800 }}>
            Save Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* False Positive Dialog */}
      <Dialog open={fpDialogOpen} onClose={() => setFpDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Mark Alert as False Positive</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Provide justification for marking <strong>{targetAlert?.title}</strong> as a benign or false positive trigger.
          </Typography>
          <TextField
            label="False Positive Justification"
            multiline
            rows={3}
            fullWidth
            value={fpReason}
            onChange={(e) => setFpReason(e.target.value)}
            placeholder="e.g. Authorized security scan or verified integration test"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFpDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="secondary" onClick={handleConfirmFalsePositive} sx={{ borderRadius: '8px', fontWeight: 800 }}>
            Confirm False Positive
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default SecurityAlertsDesk;
