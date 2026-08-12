'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Switch,
  Stack,
  Button,
  Box,
  Divider,
} from '@mui/material';

interface CookiePreferencesModalProps {
  open: boolean;
  onClose: () => void;
}

export const CookiePreferencesModal: React.FC<CookiePreferencesModalProps> = ({ open, onClose }) => {
  const [preferences, setPreferences] = useState({
    necessary: true,
    preferences: true,
    analytics: false,
    functional: true,
    marketing: false,
  });

  const handleSave = () => {
    localStorage.setItem('kirmya_cookie_consent', JSON.stringify(preferences));
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
      <DialogTitle sx={{ fontWeight: 900 }}>Cookie Preference Settings</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Necessary Cookies (Required)</Typography>
              <Typography variant="caption" color="text.secondary">Essential for authentication, CSRF security, and core platform operations.</Typography>
            </Box>
            <Switch checked={true} disabled />
          </Stack>
          <Divider />

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Preferences &amp; UI Settings</Typography>
              <Typography variant="caption" color="text.secondary">Remembers your dark mode and layout preferences.</Typography>
            </Box>
            <Switch
              checked={preferences.preferences}
              onChange={(e) => setPreferences({ ...preferences, preferences: e.target.checked })}
            />
          </Stack>
          <Divider />

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Anonymous Analytics</Typography>
              <Typography variant="caption" color="text.secondary">Helps us improve performance with aggregated usage metrics.</Typography>
            </Box>
            <Switch
              checked={preferences.analytics}
              onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} sx={{ borderRadius: '12px', fontWeight: 800 }}>
          Save Preferences
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CookiePreferencesModal;
