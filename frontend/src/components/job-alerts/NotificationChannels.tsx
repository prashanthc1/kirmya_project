'use client';

import React from 'react';
import { Box, Paper, Typography, FormControlLabel, Switch, Stack, Chip } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import SmsIcon from '@mui/icons-material/Sms';
import WebhookIcon from '@mui/icons-material/Webhook';

interface NotificationChannelsProps {
  email: boolean;
  push: boolean;
  inApp: boolean;
  sms: boolean;
  webhook: boolean;
  onChange: (channels: { email: boolean; push: boolean; inApp: boolean; sms: boolean; webhook: boolean }) => void;
}

export const NotificationChannels: React.FC<NotificationChannelsProps> = ({
  email,
  push,
  inApp,
  sms,
  webhook,
  onChange,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        Notification Channels
      </Typography>

      <Stack spacing={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <EmailIcon sx={{ color: 'primary.main' }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Email Alerts</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Receive digest summaries via email</Typography>
            </Box>
          </Box>
          <Switch checked={email} onChange={(e) => onChange({ email: e.target.checked, push, inApp, sms, webhook })} />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PhoneIphoneIcon sx={{ color: '#9933FF' }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Mobile Push Notifications</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Instant real-time notifications on mobile app</Typography>
            </Box>
          </Box>
          <Switch checked={push} onChange={(e) => onChange({ email, push: e.target.checked, inApp, sms, webhook })} />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <NotificationsActiveIcon sx={{ color: '#00CCFF' }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>In-App Notifications</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Alert badges in Kirmya dashboard</Typography>
            </Box>
          </Box>
          <Switch checked={inApp} onChange={(e) => onChange({ email, push, inApp: e.target.checked, sms, webhook })} />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SmsIcon sx={{ color: '#FF9900' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>SMS Urgent Digest</Typography>
              <Chip label="Future-ready" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
            </Box>
          </Box>
          <Switch checked={sms} onChange={(e) => onChange({ email, push, inApp, sms: e.target.checked, webhook })} />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <WebhookIcon sx={{ color: '#00CC66' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Custom Webhook Payload</Typography>
              <Chip label="Future-ready" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
            </Box>
          </Box>
          <Switch checked={webhook} onChange={(e) => onChange({ email, push, inApp, sms, webhook: e.target.checked })} />
        </Box>
      </Stack>
    </Paper>
  );
};
