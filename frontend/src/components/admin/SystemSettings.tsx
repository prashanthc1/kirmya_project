'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Switch,
  TextField,
  Button,
  Stack,
  Alert,
  Paper,
  useTheme,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';

export const SystemSettings: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [settings, setSettings] = useState({
    registrationEnabled: true,
    verificationRequired: true,
    rateLimitPerMinute: 120,
    aiModerationAutoScore: true,
    maintenanceMode: false,
  });

  const [flags, setFlags] = useState([
    { id: 'f1', name: 'ai_moderation_v2', description: 'Enable assistive AI risk scoring in moderation queue', isEnabled: true, rolloutPercentage: 100 },
    { id: 'f2', name: 'strict_phone_verification', description: 'Mandate phone OTP verification for recruiter registration', isEnabled: true, rolloutPercentage: 50 },
    { id: 'f3', name: 'dark_mode_glassmorphism_v3', description: 'Enable enhanced glassmorphism UI theme', isEnabled: true, rolloutPercentage: 100 },
  ]);

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleToggleFlag = (id: string) => {
    setFlags((prev) => prev.map((f) => (f.id === id ? { ...f, isEnabled: !f.isEnabled } : f)));
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <SettingsIcon sx={{ color: '#6366f1', fontSize: 36 }} />
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Protected System Settings &amp; Feature Flags
        </Typography>
      </Stack>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Configure platform registration parameters, security rules, and environment feature toggles.
      </Typography>

      {saved && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }}>
          System configuration and feature flag updates saved successfully!
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 3,
              borderRadius: '24px',
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
              Global System Controls
            </Typography>

            <Stack spacing={3}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Public User Registration</Typography>
                  <Typography variant="caption" color="text.secondary">Allow new candidate and recruiter signups</Typography>
                </Box>
                <Switch
                  checked={settings.registrationEnabled}
                  onChange={(e) => setSettings({ ...settings, registrationEnabled: e.target.checked })}
                />
              </Stack>

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Company Verification Requirement</Typography>
                  <Typography variant="caption" color="text.secondary">Mandate manual document approval before posting jobs</Typography>
                </Box>
                <Switch
                  checked={settings.verificationRequired}
                  onChange={(e) => setSettings({ ...settings, verificationRequired: e.target.checked })}
                />
              </Stack>

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Assistive AI Risk Scoring</Typography>
                  <Typography variant="caption" color="text.secondary">Automatically calculate risk score on new job posts</Typography>
                </Box>
                <Switch
                  checked={settings.aiModerationAutoScore}
                  onChange={(e) => setSettings({ ...settings, aiModerationAutoScore: e.target.checked })}
                />
              </Stack>

              <TextField
                label="API Global Rate Limit (Requests / Min / IP)"
                type="number"
                value={settings.rateLimitPerMinute}
                onChange={(e) => setSettings({ ...settings, rateLimitPerMinute: parseInt(e.target.value) || 120 })}
              />

              <Button
                variant="contained"
                onClick={handleSave}
                sx={{ borderRadius: '12px', fontWeight: 800, py: 1.2 }}
              >
                Save System Settings
              </Button>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 3,
              borderRadius: '24px',
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
              <ToggleOnIcon sx={{ color: '#10b981', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Feature Rollout Flags
              </Typography>
            </Stack>

            <Stack spacing={2}>
              {flags.map((flag) => (
                <Paper key={flag.id} sx={{ p: 2, borderRadius: '16px', bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>
                      {flag.name}
                    </Typography>
                    <Switch
                      size="small"
                      checked={flag.isEnabled}
                      onChange={() => handleToggleFlag(flag.id)}
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    {flag.description}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    Rollout: {flag.rolloutPercentage}% of users
                  </Typography>
                </Paper>
              ))}
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemSettings;
