'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Switch,
  FormControlLabel,
  Divider,
  Box,
} from '@mui/material';

interface CookiePreferencesModalProps {
  open: boolean;
  onClose: () => void;
}

export const CookiePreferencesModal: React.FC<CookiePreferencesModalProps> = ({ open, onClose }) => {
  const [prefs, setPrefs] = useState({
    necessary: true,
    preferences: true,
    analytics: true,
    marketing: false,
  });

  const handleSave = () => {
    localStorage.setItem('kirmya_cookie_consent', JSON.stringify(prefs));
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth paperProps={{ style: { borderRadius: 24 } }}>
      <DialogTitle sx={{ fontWeight: 900 }}>Cookie Preferences Manager</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Box>
            <FormControlLabel
              control={<Switch checked disabled />}
              label={<Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Necessary & Security Cookies (Required)</Typography>}
            />
            <Typography variant="caption" color="text.secondary" display="block">
              Required for user authentication, session security, and CSRF protection. Cannot be disabled.
            </Typography>
          </Box>
          <Divider />
          <Box>
            <FormControlLabel
              control={<Switch checked={prefs.preferences} onChange={(e) => setPrefs({ ...prefs, preferences: e.target.checked })} />}
              label={<Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Preferences & Theme Cookies</Typography>}
            />
            <Typography variant="caption" color="text.secondary" display="block">
              Remembers UI dark mode preferences and language selection.
            </Typography>
          </Box>
          <Divider />
          <Box>
            <FormControlLabel
              control={<Switch checked={prefs.analytics} onChange={(e) => setPrefs({ ...prefs, analytics: e.target.checked })} />}
              label={<Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Analytics & Product Intelligence Cookies</Typography>}
            />
            <Typography variant="caption" color="text.secondary" display="block">
              Provides anonymous traffic telemetry to optimize page performance and job recommendations.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} sx={{ fontWeight: 800 }}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} sx={{ borderRadius: '12px', fontWeight: 800 }}>Save Preferences</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CookiePreferencesModal;
