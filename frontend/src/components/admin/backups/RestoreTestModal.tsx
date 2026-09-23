'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Alert,
} from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { backupApi, RestoreTest } from '../../../features/backups/services/backupApi';

interface RestoreTestModalProps {
  open: boolean;
  onClose: () => void;
  backupId: string;
}

export default function RestoreTestModal({ open, onClose, backupId }: RestoreTestModalProps) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RestoreTest | null>(null);

  const handleRunTest = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await backupApi.runRestoreTest(backupId, 'isolated_sandbox');
      setResult(res);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { bgcolor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: 2.5 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'primary.main' }}>
        <ScienceIcon /> Isolated Sandbox Restore Test Runner
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: 'divider' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Execute an automated restore drill in an isolated, sandboxed environment. This operation tests backup file readability, schema migration compatibility, foreign key integrity, and auth/user/job table row verification without affecting production live traffic.
        </Typography>

        <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, border: 1, borderColor: 'divider', mb: 3 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>TARGET BACKUP ID</Typography>
          <Typography variant="body1" fontWeight="bold" sx={{ color: 'text.primary', fontFamily: 'monospace' }}>
            {backupId || 'Select a valid backup'}
          </Typography>
        </Box>

        {running && (
          <Box sx={{ my: 3 }}>
            <Typography variant="body2" sx={{ color: 'primary.main', mb: 1 }}>Restoring backup into sandbox instance & running smoke test suite...</Typography>
            <LinearProgress sx={{ bgcolor: 'background.paper', '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' } }} />
          </Box>
        )}

        {result && (
          <Alert icon={<CheckCircleIcon fontSize="inherit" />} severity="success" sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: 'success.main', border: 1, borderColor: 'divider', mb: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold">Sandbox Restore Drill Passed Cleanly!</Typography>
            <Typography variant="caption">Duration: {result.durationMs}ms • Status: {result.status.toUpperCase()}</Typography>
            <Box sx={{ mt: 1.5 }}>
              {Object.entries(result.verificationResults).map(([key, val]) => (
                <Chip key={key} label={`${key}: ${val}`} size="small" sx={{ mr: 0.5, mb: 0.5, bgcolor: 'background.default', color: 'success.main', fontSize: '0.7rem' }} />
              ))}
            </Box>
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Close</Button>
        <Button
          variant="contained"
          onClick={handleRunTest}
          disabled={running || !backupId}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold', '&:hover': { bgcolor: 'primary.main' } }}
        >
          {running ? 'Running Drill...' : 'Execute Sandbox Test'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
