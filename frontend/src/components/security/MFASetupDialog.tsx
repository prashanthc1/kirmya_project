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
  Stack,
  Alert,
  Box,
  Chip,
} from '@mui/material';

interface MFASetupDialogProps {
  open: boolean;
  onClose: () => void;
}

export const MFASetupDialog: React.FC<MFASetupDialogProps> = ({ open, onClose }) => {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const recoveryCodes = ['REC-8F3A', 'REC-9B21', 'REC-1C4D', 'REC-7E82', 'REC-3F90', 'REC-4D12', 'REC-5B67', 'REC-2A89'];

  const handleVerify = () => {
    if (code.length !== 6) {
      setStatus('Code must be 6 digits.');
      return;
    }
    setStatus('Two-Factor Authentication activated successfully!');
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ style: { borderRadius: 24 } }}>
      <DialogTitle sx={{ fontWeight: 900 }}>Two-Factor Authentication Setup</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Typography variant="body2" color="text.secondary">
            Scan the secret key below with your authenticator application (Google Authenticator, Authy, or 1Password).
          </Typography>

          <Box sx={{ p: 2, borderRadius: '16px', bgcolor: 'action.hover', textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">Secret Key (Base32):</Typography>
            <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: 2, fontFamily: 'monospace' }}>
              JBSW Y3DP EHPK 3PXP
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
              One-Time Recovery Codes (Store securely):
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {recoveryCodes.map((c) => (
                <Chip key={c} label={c} variant="outlined" sx={{ fontFamily: 'monospace', fontWeight: 800 }} />
              ))}
            </Box>
          </Box>

          <TextField
            label="Enter 6-Digit Authenticator Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            fullWidth
          />

          {status && <Alert severity={status.includes('successfully') ? 'success' : 'error'} sx={{ borderRadius: '12px' }}>{status}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} sx={{ fontWeight: 800 }}>Cancel</Button>
        <Button variant="contained" onClick={handleVerify} sx={{ borderRadius: '12px', fontWeight: 800 }}>
          Verify & Activate MFA
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MFASetupDialog;
