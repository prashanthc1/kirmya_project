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
  TextField,
  FormControlLabel,
  Checkbox,
  Alert,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { backupApi } from '../../../features/backups/services/backupApi';

interface RecoveryConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  backupId: string;
}

export default function RecoveryConfirmationModal({ open, onClose, backupId }: RecoveryConfirmationModalProps) {
  const [code, setCode] = useState('');
  const [reason, setReason] = useState('');
  const [ack, setAck] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any | null>(null);

  const handleRestore = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await backupApi.confirmProductionRestore({
        backupId,
        confirmationCode: code,
        targetEnvironment: 'production',
        reason,
        acknowledgeDataLoss: ack,
      });
      setSuccess(res);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to initiate production restore');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = code === 'RESTORE-PRODUCTION-DATA' && reason.length >= 10 && ack;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#0f172a', color: '#f8fafc', border: '1px solid #ef4444', borderRadius: 2.5 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#ef4444' }}>
        <WarningAmberIcon fontSize="large" /> CRITICAL: Production Database Restore Safeguard
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: '#334155' }}>
        <Alert severity="error" sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid #ef4444', mb: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold">DESTRUCTIVE OPERATION WARNING</Typography>
          Restoring a production snapshot will overwrite live database state. A pre-restore rollback snapshot will be automatically created before restoration starts.
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <Typography variant="subtitle2" fontWeight="bold">Restore Pipeline Initiated</Typography>
            <Typography variant="caption">{success.message}</Typography>
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>SELECTED BACKUP ARTIFACT</Typography>
          <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'monospace', color: '#38bdf8' }}>{backupId}</Typography>
        </Box>

        <TextField
          fullWidth
          label="Operational Reason (Required, min 10 chars)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Critical database corruption mitigation ticket INC-8492"
          margin="normal"
          sx={{ '& .MuiOutlinedInput-root': { color: '#f8fafc', borderColor: '#334155' }, '& .MuiInputLabel-root': { color: '#94a3b8' } }}
        />

        <TextField
          fullWidth
          label='Type "RESTORE-PRODUCTION-DATA" to confirm'
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="RESTORE-PRODUCTION-DATA"
          margin="normal"
          sx={{ '& .MuiOutlinedInput-root': { color: '#f8fafc', borderColor: '#334155' }, '& .MuiInputLabel-root': { color: '#94a3b8' } }}
        />

        <FormControlLabel
          control={<Checkbox checked={ack} onChange={(e) => setAck(e.target.checked)} sx={{ color: '#ef4444', '&.Mui-checked': { color: '#ef4444' } }} />}
          label={<Typography variant="caption" sx={{ color: '#cbd5e1' }}>I confirm I hold `backup.restore` authority and acknowledge live data replacement risks.</Typography>}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ color: '#94a3b8' }}>Cancel</Button>
        <Button
          variant="contained"
          color="error"
          disabled={!isFormValid || loading}
          onClick={handleRestore}
          sx={{ fontWeight: 'bold' }}
        >
          {loading ? 'Initiating Restore...' : 'CONFIRM PRODUCTION RESTORE'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
