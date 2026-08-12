'use client';

import React, { useState } from 'react';
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
  useTheme,
} from '@mui/material';
import DesktopMacIcon from '@mui/icons-material/DesktopMac';
import EmailIcon from '@mui/icons-material/Email';
import PhonelinkRingIcon from '@mui/icons-material/PhonelinkRing';
import SmsIcon from '@mui/icons-material/Sms';
import SecurityIcon from '@mui/icons-material/Security';
import WorkIcon from '@mui/icons-material/Work';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import RestoreIcon from '@mui/icons-material/Restore';
import { NotificationCategory } from '../../features/notifications/types';

const categoryMeta: { category: NotificationCategory; label: string; icon: React.ReactNode; lockSecurity?: boolean }[] = [
  { category: 'Security', label: 'Security & Account Protection', icon: <SecurityIcon sx={{ color: '#ef4444' }} />, lockSecurity: true },
  { category: 'Jobs', label: 'Job Alerts & Matches', icon: <WorkIcon sx={{ color: '#6366f1' }} /> },
  { category: 'Applications', label: 'Applications & Status Updates', icon: <WorkIcon sx={{ color: '#f59e0b' }} /> },
  { category: 'Interviews', label: 'Interview Reminders & Schedule', icon: <EventIcon sx={{ color: '#ec4899' }} /> },
  { category: 'Recruiter', label: 'Recruiter Messages & Outreach', icon: <WorkIcon sx={{ color: '#8b5cf6' }} /> },
  { category: 'Networking', label: 'Connection Requests & Profile Views', icon: <PeopleIcon sx={{ color: '#10b981' }} /> },
];

export const NotificationPreferences: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [prefs, setPrefs] = useState<Record<string, { inApp: boolean; email: boolean; push: boolean; sms: boolean }>>({
    Security: { inApp: true, email: true, push: true, sms: true },
    Jobs: { inApp: true, email: true, push: true, sms: false },
    Applications: { inApp: true, email: true, push: true, sms: false },
    Interviews: { inApp: true, email: true, push: true, sms: true },
    Recruiter: { inApp: true, email: true, push: false, sms: false },
    Networking: { inApp: true, email: false, push: true, sms: false },
  });

  const handleToggle = (cat: string, channel: 'inApp' | 'email' | 'push' | 'sms') => {
    setPrefs((prev) => ({
      ...prev,
      [cat]: {
        ...prev[cat],
        [channel]: !prev[cat]?.[channel],
      },
    }));
  };

  const handleResetDefaults = () => {
    setPrefs({
      Security: { inApp: true, email: true, push: true, sms: true },
      Jobs: { inApp: true, email: true, push: true, sms: false },
      Applications: { inApp: true, email: true, push: true, sms: false },
      Interviews: { inApp: true, email: true, push: true, sms: true },
      Recruiter: { inApp: true, email: true, push: false, sms: false },
      Networking: { inApp: true, email: false, push: true, sms: false },
    });
  };

  return (
    <Card
      sx={{
        borderRadius: '24px',
        p: { xs: 3, md: 4 },
        bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5 }}>
            Communication Channel Preferences
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure delivery channels (In-App Console, Email, Mobile Push, SMS) per notification category.
          </Typography>
        </Box>
        <Button
          startIcon={<RestoreIcon />}
          onClick={handleResetDefaults}
          sx={{ fontWeight: 800, textTransform: 'none' }}
        >
          Reset Defaults
        </Button>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      <Stack spacing={3}>
        {categoryMeta.map((item) => {
          const current = prefs[item.category] || { inApp: true, email: true, push: true, sms: false };
          return (
            <Box key={item.category} sx={{ pb: 2.5, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'rgba(99, 102, 241, 0.1)' }}>
                    {item.icon}
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {item.label}
                    </Typography>
                    {item.lockSecurity && (
                      <Chip label="Required Security Policy" size="small" color="error" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, mt: 0.5 }} />
                    )}
                  </Box>
                </Stack>

                <Grid container spacing={2} sx={{ maxWidth: 440 }}>
                  <Grid item xs={3} textAlign="center">
                    <Stack direction="column" alignItems="center">
                      <DesktopMacIcon fontSize="small" sx={{ color: 'text.secondary', mb: 0.5 }} />
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>In-App</Typography>
                      <Switch
                        size="small"
                        checked={current.inApp}
                        disabled={item.lockSecurity}
                        onChange={() => handleToggle(item.category, 'inApp')}
                      />
                    </Stack>
                  </Grid>

                  <Grid item xs={3} textAlign="center">
                    <Stack direction="column" alignItems="center">
                      <EmailIcon fontSize="small" sx={{ color: 'text.secondary', mb: 0.5 }} />
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>Email</Typography>
                      <Switch
                        size="small"
                        checked={current.email}
                        disabled={item.lockSecurity}
                        onChange={() => handleToggle(item.category, 'email')}
                      />
                    </Stack>
                  </Grid>

                  <Grid item xs={3} textAlign="center">
                    <Stack direction="column" alignItems="center">
                      <PhonelinkRingIcon fontSize="small" sx={{ color: 'text.secondary', mb: 0.5 }} />
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>Push</Typography>
                      <Switch
                        size="small"
                        checked={current.push}
                        disabled={item.lockSecurity}
                        onChange={() => handleToggle(item.category, 'push')}
                      />
                    </Stack>
                  </Grid>

                  <Grid item xs={3} textAlign="center">
                    <Stack direction="column" alignItems="center">
                      <SmsIcon fontSize="small" sx={{ color: 'text.secondary', mb: 0.5 }} />
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>SMS</Typography>
                      <Switch
                        size="small"
                        checked={current.sms}
                        onChange={() => handleToggle(item.category, 'sms')}
                      />
                    </Stack>
                  </Grid>
                </Grid>
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Card>
  );
};

export default NotificationPreferences;
