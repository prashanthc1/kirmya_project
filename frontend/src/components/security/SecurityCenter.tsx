'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Tab,
  Tabs,
  Stack,
  Button,
  Divider,
  Alert,
  Chip,
  Grid,
  TextField,
  useTheme,
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import PhonelinkLockIcon from '@mui/icons-material/PhonelinkLock';
import DevicesIcon from '@mui/icons-material/Devices';
import KeyIcon from '@mui/icons-material/Key';
import HistoryIcon from '@mui/icons-material/History';
import SecurityIcon from '@mui/icons-material/Security';
import MFASetupDialog from './MFASetupDialog';
import APIKeyManagerDialog from './APIKeyManagerDialog';
import SessionManagerView from './SessionManagerView';
import DeviceManagerView from './DeviceManagerView';
import { SecurityOverview } from '../../features/security/types';

export const SecurityCenter: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [tabIndex, setTabIndex] = useState(0);

  const [overview] = useState<SecurityOverview>({
    user_id: 'u1',
    email_verified: true,
    mfa_enabled: false,
    active_sessions_count: 1,
    trusted_devices_count: 1,
    recent_security_events: 2,
    password_last_changed_at: new Date(Date.now() - 2592000000).toISOString(),
    security_score: 75,
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);

  const [openMFADialog, setOpenMFADialog] = useState(false);
  const [openAPIKeyDialog, setOpenAPIKeyDialog] = useState(false);

  const handlePasswordChange = () => {
    if (newPassword.length < 12) {
      setPasswordStatus('Password must be at least 12 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus('New passwords do not match.');
      return;
    }
    setPasswordStatus('Password changed successfully. A security alert email has been sent.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <SecurityIcon sx={{ color: 'primary.main', fontSize: 36 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Security & Identity Protection Center
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage your authentication credentials, multi-factor authentication, active sessions, trusted devices, and API tokens.
          </Typography>
        </Box>
      </Stack>

      <Card
        sx={{
          borderRadius: '24px',
          p: 1,
          mb: 4,
          bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} variant="scrollable">
          <Tab label="Security Overview" sx={{ fontWeight: 800 }} />
          <Tab label="Password" sx={{ fontWeight: 800 }} />
          <Tab label="Two-Factor Authentication" sx={{ fontWeight: 800 }} />
          <Tab label="Active Sessions" sx={{ fontWeight: 800 }} />
          <Tab label="Trusted Devices" sx={{ fontWeight: 800 }} />
          <Tab label="API Access Keys" sx={{ fontWeight: 800 }} />
          <Tab label="Login Security Audit" sx={{ fontWeight: 800 }} />
        </Tabs>
      </Card>

      {/* Tab 0: Overview */}
      {tabIndex === 0 && (
        <Stack spacing={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2.5, borderRadius: '20px' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Security Score</Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'success.main' }}>
                  {overview.security_score} / 100
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2.5, borderRadius: '20px' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Email Verification</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5, color: 'success.main' }}>
                  Verified
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2.5, borderRadius: '20px' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>MFA Protection</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5, color: overview.mfa_enabled ? 'success.main' : 'warning.main' }}>
                  {overview.mfa_enabled ? 'Enabled' : 'Disabled'}
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2.5, borderRadius: '20px' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Active Sessions</Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'primary.main' }}>
                  {overview.active_sessions_count}
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {!overview.mfa_enabled && (
            <Alert severity="warning" sx={{ borderRadius: '16px' }} action={<Button color="warning" size="small" onClick={() => setOpenMFADialog(true)}>Enable MFA</Button>}>
              Protect your candidate profile and company credentials by enabling Two-Factor Authentication (TOTP).
            </Alert>
          )}
        </Stack>
      )}

      {/* Tab 1: Password */}
      {tabIndex === 1 && (
        <Card sx={{ borderRadius: '24px', p: 3, maxWidth: 600 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
            <LockResetIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Change Password</Typography>
          </Stack>
          <Stack spacing={2.5}>
            {passwordStatus && <Alert severity={passwordStatus.includes('successfully') ? 'success' : 'error'} sx={{ borderRadius: '12px' }}>{passwordStatus}</Alert>}
            <TextField
              label="Current Password"
              type="password"
              fullWidth
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <TextField
              label="New Password (min 12 chars)"
              type="password"
              fullWidth
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <TextField
              label="Confirm New Password"
              type="password"
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button variant="contained" onClick={handlePasswordChange} sx={{ borderRadius: '12px', fontWeight: 800, py: 1.2 }}>
              Update Password
            </Button>
          </Stack>
        </Card>
      )}

      {/* Tab 2: MFA */}
      {tabIndex === 2 && (
        <Card sx={{ borderRadius: '24px', p: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <PhonelinkLockIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Two-Factor Authentication (MFA)</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Use an authenticator app (Google Authenticator, Authy, 1Password) to generate 6-digit verification codes.
          </Typography>
          <Button variant="contained" onClick={() => setOpenMFADialog(true)} sx={{ borderRadius: '12px', fontWeight: 800 }}>
            Setup Two-Factor Authentication
          </Button>
          <MFASetupDialog open={openMFADialog} onClose={() => setOpenMFADialog(false)} />
        </Card>
      )}

      {/* Tab 3: Sessions */}
      {tabIndex === 3 && <SessionManagerView />}

      {/* Tab 4: Devices */}
      {tabIndex === 4 && <DeviceManagerView />}

      {/* Tab 5: API Keys */}
      {tabIndex === 5 && (
        <Card sx={{ borderRadius: '24px', p: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <KeyIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Developer API Keys</Typography>
            </Stack>
            <Button variant="contained" onClick={() => setOpenAPIKeyDialog(true)} sx={{ borderRadius: '12px', fontWeight: 800 }}>
              Generate API Key
            </Button>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Manage granular scoped API keys for external integrations and background services.
          </Typography>
          <APIKeyManagerDialog open={openAPIKeyDialog} onClose={() => setOpenAPIKeyDialog(false)} />
        </Card>
      )}

      {/* Tab 6: Audit */}
      {tabIndex === 6 && (
        <Card sx={{ borderRadius: '24px', p: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <HistoryIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Recent Login Security Telemetry</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Recent authentication events, successful logins, password changes, and MFA verifications.
          </Typography>
        </Card>
      )}
    </Box>
  );
};

export default SecurityCenter;
