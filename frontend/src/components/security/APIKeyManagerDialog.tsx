'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Alert,
  Box,
  Typography,
} from '@mui/material';

interface APIKeyManagerDialogProps {
  open: boolean;
  onClose: () => void;
}

export const APIKeyManagerDialog: React.FC<APIKeyManagerDialogProps> = ({ open, onClose }) => {
  const [name, setName] = useState('');
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);

  const handleGenerate = () => {
    if (!name) return;
    setGeneratedSecret('krm_live_7a9f8e2d1c0b3a4f5e6d7c8b9a0f1e2d');
  };

  const handleClose = () => {
    setGeneratedSecret(null);
    setName('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ style: { borderRadius: 24 } }}>
      <DialogTitle sx={{ fontWeight: 900 }}>Create New Scoped API Key</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {generatedSecret ? (
            <Alert severity="warning" sx={{ borderRadius: '16px' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Save Your API Key Secret Now</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                This secret will never be displayed again. Copy it and store it in your environment variables.
              </Typography>
              <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: '8px', fontFamily: 'monospace', fontWeight: 800 }}>
                {generatedSecret}
              </Box>
            </Alert>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary">
                Generate a scoped API key to authenticate external integration services with Kirmya REST endpoints.
              </Typography>
              <TextField
                label="API Key Label / Purpose"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Talent Sync Worker"
                fullWidth
              />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={handleClose} sx={{ fontWeight: 800 }}>{generatedSecret ? 'Done' : 'Cancel'}</Button>
        {!generatedSecret && (
          <Button variant="contained" disabled={!name} onClick={handleGenerate} sx={{ borderRadius: '12px', fontWeight: 800 }}>
            Generate Secret Key
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default APIKeyManagerDialog;
