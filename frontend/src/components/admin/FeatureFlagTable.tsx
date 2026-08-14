'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  Chip,
  Button,
  Stack,
  Alert,
  useTheme,
} from '@mui/material';
import FlagIcon from '@mui/icons-material/Flag';
import { adminApi } from '../../features/admin/services/adminApi';

export const FeatureFlagTable: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [flags, setFlags] = useState([
    { id: 'f1', name: 'ai_job_matching_v2', description: 'Enable NextGen vector similarity job matching model', isEnabled: true, environment: 'production', rolloutPercentage: 100 },
    { id: 'f2', name: 'realtime_notifications_ws', description: 'Enable WebSocket live notification pushed center', isEnabled: true, environment: 'production', rolloutPercentage: 100 },
    { id: 'f3', name: 'experimental_video_interviews', description: 'Enable WebRTC video interview prep sandbox', isEnabled: false, environment: 'staging', rolloutPercentage: 25 },
    { id: 'f4', name: 'recruiter_bulk_messaging', description: 'Allow verified recruiter accounts to send bulk messages', isEnabled: true, environment: 'production', rolloutPercentage: 50 },
  ]);

  const [message, setMessage] = useState<string | null>(null);

  const handleToggle = async (id: string, current: boolean) => {
    setFlags((prev) => prev.map((f) => (f.id === id ? { ...f, isEnabled: !current } : f)));
    const target = flags.find((f) => f.id === id);
    if (target) {
      await adminApi.updateFeatureFlag({ name: target.name, isEnabled: !current, environment: target.environment }).catch(() => {});
      setMessage(`Feature flag "${target.name}" is now ${!current ? 'ENABLED' : 'DISABLED'}.`);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4 }}>
        <FlagIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Feature Rollout Controls &amp; Toggles
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage real-time feature flags, environment deployment state, and progressive rollout percentages.
          </Typography>
        </Box>
      </Stack>

      {message && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}

      <Card
        sx={{
          borderRadius: '24px',
          p: 3,
          bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Feature Name & Description</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Environment</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Rollout %</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Toggle State</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {flags.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>
                      {f.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {f.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={f.environment.toUpperCase()} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip label={`${f.rolloutPercentage}%`} color="primary" size="small" sx={{ fontWeight: 800 }} />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={f.isEnabled ? 'ACTIVE' : 'INACTIVE'}
                      color={f.isEnabled ? 'success' : 'default'}
                      size="small"
                      sx={{ fontWeight: 800 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Switch
                      checked={f.isEnabled}
                      onChange={() => handleToggle(f.id, f.isEnabled)}
                      color="primary"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default FeatureFlagTable;
