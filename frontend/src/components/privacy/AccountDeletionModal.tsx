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

interface AccountDeletionModalProps {
  open: boolean;
  onClose: () => void;
}

export const AccountDeletionModal: React.FC<AccountDeletionModalProps> = ({ open, onClose }) => {
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [reason, setReason] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleConfirmDeletion = () => {
    if (confirmPhrase !== 'DELETE MY ACCOUNT') return;

    setStatusMessage('Account deletion scheduled. A 14-day grace period has begun. You can cancel deletion anytime by logging back in.');
    setTimeout(() => {
      onClose();
    }, 2500);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth paperProps={{ style: { borderRadius: 24 } }}>
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
          disabled={confirmPhrase !== 'DELETE MY ACCOUNT'}
          onClick={handleConfirmDeletion}
          sx={{ borderRadius: '12px', fontWeight: 800 }}
        >
          Confirm Account Deletion
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccountDeletionModal;
