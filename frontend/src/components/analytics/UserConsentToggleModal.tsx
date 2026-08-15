'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  Stack,
  Alert,
  Slider,
  Divider,
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import analyticsApi from '../../features/analytics/services/analyticsApi';
import { UserConsentPreferences } from '../../features/analytics/types';

interface UserConsentToggleModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: (updated: UserConsentPreferences) => void;
}

export default function UserConsentToggleModal({ open, onClose, onSaved }: UserConsentToggleModalProps) {
  const [essential, setEssential] = useState(true);
  const [optionalAnalytics, setOptionalAnalytics] = useState(true);
  const [personalization, setPersonalization] = useState(true);
  const [retentionDays, setRetentionDays] = useState(90);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadConsent();
    }
  }, [open]);

  const loadConsent = async () => {
    const consent = await analyticsApi.getUserConsent();
    setEssential(consent.essential_telemetry);
    setOptionalAnalytics(consent.optional_analytics);
    setPersonalization(consent.personalization_tracking);
    setRetentionDays(consent.data_retention_period_days);
  };

  const handleSave = async () => {
    setSaving(true);
    const updated = await analyticsApi.updateUserConsent({
      essential_telemetry: essential,
      optional_analytics: optionalAnalytics,
      personalization_tracking: personalization,
      data_retention_period_days: retentionDays,
    });
    setSaving(false);
    setSuccessMsg('Privacy consent preferences updated successfully!');
    if (onSaved) {
      onSaved(updated);
    }
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 1200);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <ShieldIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h6" fontWeight={900}>
              Privacy &amp; Analytics Data Preferences
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Control how platform telemetry and analytics tracking data are processed.
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent>
        {successMsg && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>
            {successMsg}
          </Alert>
        )}

        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'action.hover' }}>
            <FormControlLabel
              control={<Switch checked={essential} disabled color="primary" />}
              label={
                <Box>
                  <Typography variant="subtitle2" fontWeight={800}>
                    Essential System Telemetry (Required)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Necessary for security logging, error tracing, and core platform operation. Cannot be disabled.
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'action.hover' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={optionalAnalytics}
                  onChange={(e) => setOptionalAnalytics(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2" fontWeight={800}>
                    Optional Analytics &amp; Usage Tracking
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Allows Kirmya to collect anonymous usage behavior to optimize search, job matching, and UI speed.
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'action.hover' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={personalization}
                  onChange={(e) => setPersonalization(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2" fontWeight={800}>
                    Personalized AI Recommendations
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Enables AI agent matching for personalized career recommendations and job recommendations.
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" fontWeight={800} gutterBottom>
              Data Retention Period: {retentionDays} Days
            </Typography>
            <Typography variant="caption" color="text.secondary" paragraph>
              Automatically purge granular event telemetry logs older than the selected retention window.
            </Typography>
            <Slider
              value={retentionDays}
              onChange={(_, val) => setRetentionDays(val as number)}
              min={30}
              max={365}
              step={30}
              marks={[
                { value: 30, label: '30 Days' },
                { value: 90, label: '90 Days' },
                { value: 180, label: '180 Days' },
                { value: 365, label: '1 Year' },
              ]}
              valueLabelDisplay="auto"
            />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 3 }}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          sx={{ borderRadius: 3, fontWeight: 800 }}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
