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
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { securityApi } from '../../features/security/services/securityApi';

interface APIKeyManagerDialogProps {
  open: boolean;
  onClose: () => void;
  onKeyCreated?: () => void;
}

export const APIKeyManagerDialog: React.FC<APIKeyManagerDialogProps> = ({ open, onClose, onKeyCreated }) => {
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState({
    'profile.read': true,
    'jobs.read': true,
    'applications.write': false,
    'analytics.read': false,
  });
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleScopeToggle = (scopeKey: string) => {
    setScopes((prev) => ({
      ...prev,
      [scopeKey as keyof typeof prev]: !prev[scopeKey as keyof typeof prev],
    }));
  };

  const handleGenerate = async () => {
    if (!name) return;
    const selectedScopes = Object.entries(scopes)
      .filter(([, active]) => active)
      .map(([s]) => s)
      .join(',');

    const res = await securityApi.createAPIKey({ name, scopes: selectedScopes });
    setGeneratedSecret(res.secret);
    if (onKeyCreated) onKeyCreated();
  };

  const handleClose = () => {
    setGeneratedSecret(null);
    setName('');
    onClose();
  };

  const handleCopy = () => {
    if (generatedSecret) {
      navigator.clipboard.writeText(generatedSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ style: { borderRadius: 24 } }}>
      <DialogTitle sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
        <KeyIcon color="primary" /> Create New Scoped API Key
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {generatedSecret ? (
            <Alert severity="warning" sx={{ borderRadius: '16px' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Save Your API Key Secret Now
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                This secret will never be displayed again. Copy it and store it securely in your environment variables.
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: 'background.paper',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    wordBreak: 'break-all',
                    flexGrow: 1,
                  }}
                >
                  {generatedSecret}
                </Box>
                <Button size="small" onClick={handleCopy} startIcon={<ContentCopyIcon fontSize="small" />}>
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </Stack>
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

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                  Select API Scopes:
                </Typography>
                <FormGroup>
                  <FormControlLabel
                    control={<Checkbox checked={scopes['profile.read']} onChange={() => handleScopeToggle('profile.read')} />}
                    label="profile.read (Read candidate profile data)"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={scopes['jobs.read']} onChange={() => handleScopeToggle('jobs.read')} />}
                    label="jobs.read (Access job listings & searches)"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox checked={scopes['applications.write']} onChange={() => handleScopeToggle('applications.write')} />
                    }
                    label="applications.write (Submit and manage applications)"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={scopes['analytics.read']} onChange={() => handleScopeToggle('analytics.read')} />}
                    label="analytics.read (Read platform analytics)"
                  />
                </FormGroup>
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={handleClose} sx={{ fontWeight: 800 }}>
          {generatedSecret ? 'Done' : 'Cancel'}
        </Button>
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
