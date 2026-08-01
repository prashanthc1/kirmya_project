'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  FormControlLabel,
  Switch,
  Paper,
  useTheme,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import GroupsIcon from '@mui/icons-material/Groups';
import GlassCard from '../landing/GlassCard';

interface FollowersSectionProps {
  followersCount: number;
}

export const FollowersSection: React.FC<FollowersSectionProps> = ({ followersCount }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [alerts, setAlerts] = useState({
    hiring: true,
    updates: true,
    news: false,
  });

  return (
    <GlassCard sx={{ p: { xs: 3, md: 4 }, mb: 4 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <GroupsIcon sx={{ color: '#ec4899', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 900 }}>
          Followers &amp; Notification Preferences ({followersCount.toLocaleString()})
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Customize which notifications you receive when following this employer.
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: '16px',
          bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Stack spacing={2}>
          <FormControlLabel
            control={
              <Switch
                checked={alerts.hiring}
                onChange={(e) => setAlerts({ ...alerts, hiring: e.target.checked })}
                color="success"
              />
            }
            label={
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  Instant Job Hiring Alerts
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Receive notifications as soon as a new job position is published.
                </Typography>
              </Box>
            }
          />

          <FormControlLabel
            control={
              <Switch
                checked={alerts.updates}
                onChange={(e) => setAlerts({ ...alerts, updates: e.target.checked })}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  Company Articles &amp; Updates
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Get corporate press announcements and leadership posts in your feed.
                </Typography>
              </Box>
            }
          />
        </Stack>
      </Paper>
    </GlassCard>
  );
};

export default FollowersSection;
