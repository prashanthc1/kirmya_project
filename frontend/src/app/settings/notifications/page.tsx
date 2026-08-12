'use client';

import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import NotificationPreferences from '../../../components/notifications/NotificationPreferences';
import QuietHours from '../../../components/notifications/QuietHours';
import DigestSettings from '../../../components/notifications/DigestSettings';

export default function SettingsNotificationsPage() {
  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
        Notification &amp; Communication Preferences
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Customize channel delivery policies, quiet hours schedules, and digest summaries.
      </Typography>

      <Stack spacing={4}>
        <NotificationPreferences />
        <QuietHours />
        <DigestSettings />
      </Stack>
    </Box>
  );
}
