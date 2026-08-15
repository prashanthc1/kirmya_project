'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Stack,
  Typography,
  Alert,
  Box,
  CircularProgress,
  Chip,
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { adminApi } from '../../features/admin/services/adminApi';
import { MaintenanceModeConfigDTO } from '../../features/admin/types';

export interface MaintenanceModeModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: (config: Partial<MaintenanceModeConfigDTO>) => void;
  currentConfig?: MaintenanceModeConfigDTO;
}

export const MaintenanceModeModal: React.FC<MaintenanceModeModalProps> = ({
  open,
  onClose,
  onSave,
  currentConfig,
}) => {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [allowedIps, setAllowedIps] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (currentConfig) {
        setEnabled(currentConfig.enabled);
        setMessage(currentConfig.message || '');
        setAllowedIps((currentConfig.allowedIpAddresses || []).join(', '));
        setScheduledStart(currentConfig.scheduledStartTime ? currentConfig.scheduledStartTime.slice(0, 16) : '');
        setScheduledEnd(currentConfig.scheduledEndTime ? currentConfig.scheduledEndTime.slice(0, 16) : '');
      } else {
        setLoading(true);
        adminApi
          .getMaintenanceModeConfig()
          .then((cfg) => {
            setEnabled(cfg.enabled);
            setMessage(cfg.message || '');
            setAllowedIps((cfg.allowedIpAddresses || []).join(', '));
            setScheduledStart(cfg.scheduledStartTime ? cfg.scheduledStartTime.slice(0, 16) : '');
            setScheduledEnd(cfg.scheduledEndTime ? cfg.scheduledEndTime.slice(0, 16) : '');
          })
          .catch(() => {
            setFeedback('Failed to fetch maintenance mode configuration.');
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [open, currentConfig]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setFeedback(null);
    const payload: Partial<MaintenanceModeConfigDTO> = {
      enabled,
      message,
      allowedIpAddresses: allowedIps
        .split(',')
        .map((ip) => ip.trim())
        .filter(Boolean),
      scheduledStartTime: scheduledStart ? new Date(scheduledStart).toISOString() : undefined,
      scheduledEndTime: scheduledEnd ? new Date(scheduledEnd).toISOString() : undefined,
    };

    try {
      const updated = await adminApi.updateMaintenanceModeConfig(payload);
      if (onSave) {
        onSave(updated);
      }
      onClose();
    } catch {
      setFeedback('Failed to update maintenance mode setting.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth paperProps-sx={{ borderRadius: '24px' }}>
      <DialogTitle sx={{ fontWeight: 900, pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <BuildIcon color="warning" sx={{ fontSize: 30 }} />
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Platform Maintenance Mode Schedule
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ textCenter: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3}>
            {feedback && (
              <Alert severity="error" onClose={() => setFeedback(null)} sx={{ borderRadius: '12px' }}>
                {feedback}
              </Alert>
            )}

            {enabled && (
              <Alert severity="warning" icon={<WarningAmberIcon fontSize="inherit" />} sx={{ borderRadius: '12px' }}>
                <strong>CRITICAL WARNING:</strong> Enabling maintenance mode will block non-admin users from accessing the platform!
              </Alert>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  color="warning"
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Enable Maintenance Mode
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Toggle to immediately activate maintenance shield.
                  </Typography>
                </Box>
              }
            />

            <TextField
              label="Maintenance Banner / Broadcast Message"
              multiline
              rows={3}
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="System is currently undergoing scheduled maintenance..."
            />

            <TextField
              label="Allowed Admin IP Addresses (comma separated)"
              fullWidth
              value={allowedIps}
              onChange={(e) => setAllowedIps(e.target.value)}
              placeholder="e.g. 192.168.1.1, 10.0.0.100"
              helperText="Requests from these IP addresses will bypass the maintenance screen."
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Scheduled Start Time"
                type="datetime-local"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
              />
              <TextField
                label="Scheduled End Time"
                type="datetime-local"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={scheduledEnd}
                onChange={(e) => setScheduledEnd(e.target.value)}
              />
            </Stack>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} sx={{ borderRadius: '10px' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color={enabled ? 'warning' : 'primary'}
          onClick={handleSubmit}
          disabled={submitting || loading}
          sx={{ borderRadius: '10px', fontWeight: 800, px: 3 }}
        >
          {submitting ? <CircularProgress size={20} /> : enabled ? 'Activate Maintenance' : 'Save Configuration'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MaintenanceModeModal;
