'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Switch,
  TextField,
  MenuItem,
  Stack,
  Alert,
  Button,
  useTheme,
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ShieldIcon from '@mui/icons-material/Shield';

export const QuietHours: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [enabled, setEnabled] = useState(true);
  const [startTime, setStartTime] = useState('22:00');
  const [endTime, setEndTime] = useState('07:00');
  const [timezone, setTimezone] = useState('Asia/Dubai (GST)');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Card
      sx={{
        borderRadius: '24px',
        p: { xs: 3, md: 4 },
        mb: 4,
        bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <DarkModeIcon sx={{ color: '#6366f1', fontSize: 32 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Quiet Hours &amp; Do-Not-Disturb Schedule
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Automatically defer non-critical push and email notifications during quiet hours.
            </Typography>
          </Box>
        </Stack>

        <Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
      </Stack>

      <Alert severity="info" icon={<ShieldIcon />} sx={{ mb: 3, borderRadius: '12px' }}>
        <strong>Security Exception:</strong> Critical security alerts (e.g. suspicious login or password reset) bypass Quiet Hours to protect your account.
      </Alert>

      {enabled && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Start Quiet Hours"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="End Quiet Hours"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              select
              label="Timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              <MenuItem value="Asia/Dubai (GST)">Asia/Dubai (GST +04:00)</MenuItem>
              <MenuItem value="Europe/London (GMT)">Europe/London (GMT +00:00)</MenuItem>
              <MenuItem value="America/New_York (EST)">America/New_York (EST -05:00)</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      )}

      {saved && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: '10px' }}>
          Quiet Hours schedule saved successfully!
        </Alert>
      )}

      <Button
        variant="contained"
        onClick={handleSave}
        sx={{
          borderRadius: '12px',
          fontWeight: 800,
          px: 4,
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        }}
      >
        Save Quiet Hours
      </Button>
    </Card>
  );
};

export default QuietHours;
