'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Alert,
  Stack,
  Box,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { securityApi } from '../../features/security/services/securityApi';

interface AccountDeletionModalProps {
  open: boolean;
  onClose: () => void;
}

export const AccountDeletionModal: React.FC<AccountDeletionModalProps> = ({ open, onClose }) => {
  const [password, setPassword] = useState('');
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [reason, setReason] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConfirmDeletion = async () => {
    if (confirmPhrase !== 'DELETE MY ACCOUNT') return;

    setLoading(true);
    const res = await securityApi.requestAccountDeletion(reason, password);
    setLoading(false);

    if (res.success) {
      setStatusMessage(
        `Account deletion scheduled. A ${res.grace_period_days}-day grace period has begun. You can cancel deletion anytime by logging back in.`
      );
      setTimeout(() => {
        onClose();
      }, 2500);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ style: { borderRadius: 24 } }}>
      <DialogTitle sx={{ fontWeight: 900, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningAmberIcon color="error" /> Confirm Account Deletion
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Alert severity="warning" sx={{ borderRadius: '16px' }}>
            Account deletion triggers a mandatory <strong>14-day grace period</strong>. Your profile, search visibility, and job alerts will be immediately deactivated.
          </Alert>

          <Typography variant="body2" color="text.secondary">
            After the 14-day grace period expires, eligible personal identifiers will be permanently deleted or anonymized according to platform retention policies.
          </Typography>

          <TextField
            label="Confirm Account Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Optional Feedback Reason"
            multiline
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tell us why you are leaving Kirmya..."
            fullWidth
          />

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
              Type &quot;DELETE MY ACCOUNT&quot; to confirm:
            </Typography>
            <TextField
              fullWidth
              value={confirmPhrase}
              onChange={(e) => setConfirmPhrase(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
            />
          </Box>

          {statusMessage && <Alert severity="info" sx={{ borderRadius: '12px' }}>{statusMessage}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} sx={{ fontWeight: 800 }}>Cancel</Button>
        <Button
          variant="contained"
          color="error"
          disabled={confirmPhrase !== 'DELETE MY ACCOUNT' || loading}
          onClick={handleConfirmDeletion}
          sx={{ borderRadius: '12px', fontWeight: 800 }}
        >
          {loading ? 'Scheduling Deletion...' : 'Confirm Account Deletion'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccountDeletionModal;
