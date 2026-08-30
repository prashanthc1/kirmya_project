'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Switch,
  Divider,
  Stack,
  Chip,
  Button,
  TextField,
  FormControlLabel,
  useTheme,
  Alert,
  Snackbar,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import EventIcon from '@mui/icons-material/Event';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import BedtimeOutlinedIcon from '@mui/icons-material/BedtimeOutlined';
import RestoreIcon from '@mui/icons-material/Restore';
import SaveIcon from '@mui/icons-material/Save';

import { notificationApi } from '../../features/notifications/services/notificationApi';
import { NotificationPreferenceDTO, QuietHoursDTO, NotificationCategory } from '../../features/notifications/types';
import { tokens } from '../../theme/tokens';

const CATEGORY_DEFINITIONS: {
  category: NotificationCategory;
  label: string;
  description: string;
  icon: React.ReactNode;
  lockSecurity?: boolean;
}[] = [
  {
    category: 'Security',
    label: 'Security & Account Protection',
    description: 'Login alerts, password changes, MFA challenges (Mandatory for protection)',
    icon: <SecurityIcon sx={{ color: '#ef4444' }} />,
    lockSecurity: true,
  },
  {
    category: 'Jobs',
    label: 'Job Alerts & Matches',
    description: 'AI recommendation matches, saved search alerts, job deadline notices',
    icon: <WorkOutlineIcon sx={{ color: '#6366f1' }} />,
  },
  {
    category: 'Applications',
    label: 'Applications & Status Updates',
    description: 'Status updates (Shortlisted, Reviewed, Offer), recruiter notes',
    icon: <WorkOutlineIcon sx={{ color: '#f59e0b' }} />,
  },
  {
    category: 'Interviews',
    label: 'Interview Reminders & Schedule',
    description: 'Interview invitations, calendar reminders, interview cancellations',
    icon: <EventIcon sx={{ color: '#ec4899' }} />,
  },
  {
    category: 'Recruiter',
    label: 'Recruiter Outreach & Messages',
    description: 'Direct recruiter inquiries, talent pool invitations',
    icon: <WorkOutlineIcon sx={{ color: '#8b5cf6' }} />,
  },
  {
    category: 'Networking',
    label: 'Connection Requests & Graph Updates',
    description: 'New connection invitations, connection acceptances',
    icon: <PeopleOutlineIcon sx={{ color: '#10b981' }} />,
  },
  {
    category: 'Messaging',
    label: 'Direct Messaging & Real-Time Chats',
    description: 'Incoming messages, group chat mentions, message requests',
    icon: <ChatBubbleOutlineIcon sx={{ color: '#06b6d4' }} />,
  },
];

export const NotificationPreferences: React.FC = () => {
  const [prefs, setPrefs] = useState<Record<string, { inApp: boolean; email: boolean; push: boolean; sms: boolean }>>({
    Security: { inApp: true, email: true, push: true, sms: true },
    Jobs: { inApp: true, email: true, push: true, sms: false },
    Applications: { inApp: true, email: true, push: true, sms: false },
    Interviews: { inApp: true, email: true, push: true, sms: true },
    Recruiter: { inApp: true, email: true, push: false, sms: false },
    Networking: { inApp: true, email: false, push: true, sms: false },
    Messaging: { inApp: true, email: true, push: true, sms: false },
  });

  const [quietHours, setQuietHours] = useState<QuietHoursDTO>({
    enabled: true,
    startTime: '22:00',
    endTime: '07:00',
    timezone: 'Asia/Dubai (GST)',
  });

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    notificationApi
      .getPreferences()
      .then((data) => {
        if (data && data.length > 0) {
          const map: Record<string, any> = {};
          data.forEach((p) => {
            map[p.category] = {
              inApp: p.inAppEnabled,
              email: p.emailEnabled,
              push: p.pushEnabled,
              sms: p.smsEnabled,
            };
          });
          setPrefs((prev) => ({ ...prev, ...map }));
        }
      })
      .catch(() => {});

    notificationApi
      .getQuietHours()
      .then((qh) => {
        if (qh) setQuietHours(qh);
      })
      .catch(() => {});
  }, []);

  const handleToggle = async (cat: string, channel: 'inApp' | 'email' | 'push' | 'sms') => {
    const updated = {
      ...prefs,
      [cat]: {
        ...prefs[cat],
        [channel]: !prefs[cat]?.[channel],
      },
    };
    setPrefs(updated);

    try {
      await notificationApi.updatePreference({
        category: cat as NotificationCategory,
        inAppEnabled: updated[cat].inApp,
        emailEnabled: updated[cat].email,
        pushEnabled: updated[cat].push,
        smsEnabled: updated[cat].sms,
      });
      setSnackbarMessage(`Updated preferences for ${cat}`);
      setSnackbarOpen(true);
    } catch {
      // Handled
    }
  };

  const handleSaveQuietHours = async () => {
    try {
      await notificationApi.updateQuietHours(quietHours);
      setSnackbarMessage('Quiet hours schedule saved');
      setSnackbarOpen(true);
    } catch {}
  };

  const handleResetDefaults = () => {
    const defaults = {
      Security: { inApp: true, email: true, push: true, sms: true },
      Jobs: { inApp: true, email: true, push: true, sms: false },
      Applications: { inApp: true, email: true, push: true, sms: false },
      Interviews: { inApp: true, email: true, push: true, sms: true },
      Recruiter: { inApp: true, email: true, push: false, sms: false },
      Networking: { inApp: true, email: false, push: true, sms: false },
      Messaging: { inApp: true, email: true, push: true, sms: false },
    };
    setPrefs(defaults);
    setSnackbarMessage('Reset to platform defaults');
    setSnackbarOpen(true);
  };

  return (
    <Box>
      <Card
        elevation={0}
        sx={{
          borderRadius: `${tokens.radius.lg}px`,
          p: { xs: 2.5, md: 4 },
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          mb: 3,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
              Notification Preferences
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Choose which communication channels (In-App, Email, Push, SMS) you want to receive alerts for.
            </Typography>
          </Box>
          <Button
            startIcon={<RestoreIcon />}
            size="small"
            onClick={handleResetDefaults}
            sx={{ fontWeight: 700, borderRadius: `${tokens.radius.sm}px`, textTransform: 'none' }}
          >
            Reset Defaults
          </Button>
        </Stack>

        <Divider sx={{ my: 2.5 }} />

        {/* Channels Table Header */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, mb: 2, px: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                CATEGORY & PURPOSE
              </Typography>
            </Grid>
            <Grid item xs={1.5} sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                IN-APP
              </Typography>
            </Grid>
            <Grid item xs={1.5} sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                EMAIL
              </Typography>
            </Grid>
            <Grid item xs={1.5} sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                PUSH
              </Typography>
            </Grid>
            <Grid item xs={1.5} sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                SMS
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Preference Rows */}
        <Stack spacing={2}>
          {CATEGORY_DEFINITIONS.map((def) => {
            const current = prefs[def.category] || { inApp: true, email: true, push: false, sms: false };
            return (
              <Box
                key={def.category}
                sx={{
                  p: 2,
                  borderRadius: `${tokens.radius.md}px`,
                  bgcolor: 'action.hover',
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ p: 1, borderRadius: `${tokens.radius.sm}px`, bgcolor: 'background.paper' }}>
                        {def.icon}
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                          {def.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {def.description}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>

                  <Grid item xs={6} sm={3} md={1.5} sx={{ textAlign: 'center' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={current.inApp}
                          disabled={def.lockSecurity}
                          onChange={() => handleToggle(def.category, 'inApp')}
                        />
                      }
                      label={<Typography variant="caption" sx={{ display: { md: 'none' } }}>In-App</Typography>}
                    />
                  </Grid>

                  <Grid item xs={6} sm={3} md={1.5} sx={{ textAlign: 'center' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={current.email}
                          disabled={def.lockSecurity}
                          onChange={() => handleToggle(def.category, 'email')}
                        />
                      }
                      label={<Typography variant="caption" sx={{ display: { md: 'none' } }}>Email</Typography>}
                    />
                  </Grid>

                  <Grid item xs={6} sm={3} md={1.5} sx={{ textAlign: 'center' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={current.push}
                          disabled={def.lockSecurity}
                          onChange={() => handleToggle(def.category, 'push')}
                        />
                      }
                      label={<Typography variant="caption" sx={{ display: { md: 'none' } }}>Push</Typography>}
                    />
                  </Grid>

                  <Grid item xs={6} sm={3} md={1.5} sx={{ textAlign: 'center' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={current.sms}
                          disabled={def.lockSecurity}
                          onChange={() => handleToggle(def.category, 'sms')}
                        />
                      }
                      label={<Typography variant="caption" sx={{ display: { md: 'none' } }}>SMS</Typography>}
                    />
                  </Grid>
                </Grid>
              </Box>
            );
          })}
        </Stack>
      </Card>

      {/* Quiet Hours Card */}
      <Card
        elevation={0}
        sx={{
          borderRadius: `${tokens.radius.lg}px`,
          p: { xs: 2.5, md: 4 },
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
          <BedtimeOutlinedIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Do Not Disturb & Quiet Hours
          </Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Mute non-critical notifications during your rest hours. Critical security alerts will always be delivered.
        </Typography>

        <Grid container spacing={2.5} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={quietHours.enabled}
                  onChange={(e) => setQuietHours((prev) => ({ ...prev, enabled: e.target.checked }))}
                />
              }
              label="Enable Quiet Hours Schedule"
            />
          </Grid>

          <Grid item xs={6} sm={3}>
            <TextField
              label="Start Time"
              type="time"
              size="small"
              fullWidth
              value={quietHours.startTime}
              disabled={!quietHours.enabled}
              onChange={(e) => setQuietHours((prev) => ({ ...prev, startTime: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={6} sm={3}>
            <TextField
              label="End Time"
              type="time"
              size="small"
              fullWidth
              value={quietHours.endTime}
              disabled={!quietHours.enabled}
              onChange={(e) => setQuietHours((prev) => ({ ...prev, endTime: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={2}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveQuietHours}
              fullWidth
              sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700 }}
            >
              Save
            </Button>
          </Grid>
        </Grid>
      </Card>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default NotificationPreferences;
