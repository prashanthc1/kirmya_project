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
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import EditIcon from '@mui/icons-material/Edit';
import { PrivacyIncidentItem } from '@/features/privacy/types';
import { privacyApi } from '@/features/privacy/services/privacyApi';

const severityColors: Record<PrivacyIncidentItem['severity'], 'info' | 'warning' | 'error' | 'error'> = {
  low: 'info',
  medium: 'warning',
  high: 'error',
  critical: 'error',
};

const statusColors: Record<PrivacyIncidentItem['status'], 'warning' | 'info' | 'secondary' | 'success'> = {
  investigating: 'warning',
  contained: 'info',
  notified: 'secondary',
  resolved: 'success',
};

export const PrivacyIncidentManager: React.FC = () => {
  const [incidents, setIncidents] = useState<PrivacyIncidentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInc, setSelectedInc] = useState<PrivacyIncidentItem | null>(null);
  const [newStatus, setNewStatus] = useState<PrivacyIncidentItem['status']>('investigating');

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    setLoading(true);
    const data = await privacyApi.getPrivacyIncidents();
    setIncidents(data);
    setLoading(false);
  };

  const handleOpenUpdate = (inc: PrivacyIncidentItem) => {
    setSelectedInc(inc);
    setNewStatus(inc.status);
  };

  const handleSaveStatus = async () => {
    if (!selectedInc) return;
    const updated = await privacyApi.updateIncidentStatus(selectedInc.id, newStatus);
    setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setSelectedInc(null);
  };

  return (
    <Card
      sx={{
        borderRadius: '24px',
        p: 3,
        backdropFilter: 'blur(12px)',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ReportProblemIcon sx={{ color: 'error.main', fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Privacy Incident & Data Breach Response Desk
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Regulatory breach notification tracking (72h GDPR notification clock) and containment lifecycle.
          </Typography>
        </Box>
      </Stack>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Incident #</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Title & Summary</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Severity</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Affected Users</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Reported At</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {incidents.map((inc) => (
              <TableRow key={inc.id} hover>
                <TableCell sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{inc.incidentNumber}</TableCell>
                <TableCell>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {inc.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {inc.summary}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={inc.severity.toUpperCase()}
                    color={severityColors[inc.severity]}
                    size="small"
                    sx={{ fontWeight: 800 }}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 800 }}>{inc.affectedCount.toLocaleString()}</TableCell>
                <TableCell>{new Date(inc.reportedAt).toLocaleString()}</TableCell>
                <TableCell>
                  <Chip
                    label={inc.status.toUpperCase()}
                    color={statusColors[inc.status]}
                    size="small"
                    sx={{ fontWeight: 800 }}
                  />
                </TableCell>
                <TableCell sx={{ textAlign: 'right' }}>
                  <Tooltip title="Update Incident Status">
                    <IconButton size="small" onClick={() => handleOpenUpdate(inc)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {incidents.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No active privacy incidents logged.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Update Dialog */}
      {selectedInc && (
        <Dialog open onClose={() => setSelectedInc(null)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ fontWeight: 800 }}>Update Incident Status ({selectedInc.incidentNumber})</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <Typography variant="subtitle2">{selectedInc.title}</Typography>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={newStatus}
                  label="Status"
                  onChange={(e) => setNewStatus(e.target.value as PrivacyIncidentItem['status'])}
                >
                  <MenuItem value="investigating">Investigating</MenuItem>
                  <MenuItem value="contained">Contained</MenuItem>
                  <MenuItem value="notified">Authorities & Data Subjects Notified</MenuItem>
                  <MenuItem value="resolved">Resolved & Closed</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedInc(null)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveStatus}>
              Save Status
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Card>
  );
};

export default PrivacyIncidentManager;
