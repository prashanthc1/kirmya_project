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
  CircularProgress,
  Switch,
  Alert,
} from '@mui/material';
import AutoDeleteIcon from '@mui/icons-material/AutoDelete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { RetentionPolicyItem, DryRunResult } from '@/features/privacy/types';
import { privacyApi } from '@/features/privacy/services/privacyApi';

export const RetentionManager: React.FC = () => {
  const [policies, setPolicies] = useState<RetentionPolicyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dryRunRes, setDryRunRes] = useState<DryRunResult | null>(null);
  const [activePolicy, setActivePolicy] = useState<RetentionPolicyItem | null>(null);
  const [dryRunning, setDryRunning] = useState(false);
  const [purging, setPurging] = useState(false);
  const [purgeSuccess, setPurgeSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    setLoading(true);
    const data = await privacyApi.getRetentionPolicies();
    setPolicies(data);
    setLoading(false);
  };

  const handleDryRun = async (policy: RetentionPolicyItem) => {
    setActivePolicy(policy);
    setDryRunning(true);
    const res = await privacyApi.runRetentionDryRun(policy.id);
    setDryRunRes(res);
    setDryRunning(false);
  };

  const handleExecutePurge = async () => {
    if (!activePolicy) return;
    setPurging(true);
    const res = await privacyApi.executeRetentionPurge(activePolicy.id);
    setPurging(false);
    setPurgeSuccess(`Purge executed for ${activePolicy.category}. ${res.purgedCount} records processed.`);
    setDryRunRes(null);
    setActivePolicy(null);
    loadPolicies();
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
            <AutoDeleteIcon sx={{ color: 'primary.main', fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Automated Data Retention & Lifecycle Rules
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Configure automatic purging, archiving, or anonymization of expired dataset categories.
          </Typography>
        </Box>
      </Stack>

      {purgeSuccess && (
        <Alert severity="success" onClose={() => setPurgeSuccess(null)} sx={{ mb: 3, borderRadius: '12px' }}>
          {purgeSuccess}
        </Alert>
      )}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Category & Description</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Retention (Days)</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Action</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Last Purged</TableCell>
              <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Controls</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {policies.map((pol) => (
              <TableRow key={pol.id} hover>
                <TableCell>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {pol.category}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {pol.description}
                  </Typography>
                </TableCell>
                <TableCell sx={{ fontWeight: 800 }}>{pol.retentionDays} Days</TableCell>
                <TableCell>
                  <Chip
                    label={pol.action.toUpperCase()}
                    color={pol.action === 'purge' ? 'error' : pol.action === 'anonymize' ? 'warning' : 'info'}
                    size="small"
                    sx={{ fontWeight: 800 }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={pol.isEnabled ? 'Enabled' : 'Disabled'}
                    color={pol.isEnabled ? 'success' : 'default'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{pol.lastPurgeDate || 'Never'}</TableCell>
                <TableCell sx={{ textAlign: 'right' }}>
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => handleDryRun(pol)}
                      sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
                    >
                      Run Dry Run
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dry Run Simulation Modal */}
      {dryRunRes && activePolicy && (
        <Dialog open onClose={() => setDryRunRes(null)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ fontWeight: 800 }}>
            Retention Dry Run Results — {activePolicy.category}
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Alert severity="info" sx={{ borderRadius: '12px' }}>
                Simulated execution complete. No live data was modified during this dry run.
              </Alert>

              <Box sx={{ p: 2, background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <Typography variant="subtitle2" color="text.secondary">Estimated Affected Records</Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main', my: 0.5 }}>
                  {dryRunRes.affectedRecordsCount.toLocaleString()} Records
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1.5 }}>Affected Datasets</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                  {dryRunRes.affectedDatasets.map((ds, idx) => (
                    <Chip key={idx} label={ds} size="small" color="secondary" variant="outlined" />
                  ))}
                </Stack>

                <Stack direction="row" justifyContent="space-between" sx={{ mt: 2, pt: 1.5, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <Typography variant="caption" color="text.secondary">Simulated At: {new Date(dryRunRes.simulatedAt).toLocaleTimeString()}</Typography>
                  <Typography variant="caption" color="text.secondary">Estimated Duration: {dryRunRes.estimatedDurationSec}s</Typography>
                </Stack>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDryRunRes(null)}>Close</Button>
            <Button
              variant="contained"
              color="error"
              startIcon={purging ? <CircularProgress size={18} color="inherit" /> : <DeleteSweepIcon />}
              onClick={handleExecutePurge}
              disabled={purging}
              sx={{ borderRadius: '12px', fontWeight: 700 }}
            >
              Execute Live Purge
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Card>
  );
};

export default RetentionManager;
