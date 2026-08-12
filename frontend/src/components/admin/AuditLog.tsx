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
  Chip,
  TextField,
  Stack,
  useTheme,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';

export const AuditLog: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const logs = [
    {
      id: 'log1',
      adminEmail: 'admin@kirmya.com',
      roleCode: 'super_admin',
      action: 'user.status_update',
      targetType: 'User',
      targetId: 'u2',
      reason: 'Suspicious spam messaging pattern',
      ipAddress: '192.168.1.10',
      createdAt: '2026-08-12 18:20:00',
    },
    {
      id: 'log2',
      adminEmail: 'moderator@kirmya.com',
      roleCode: 'job_admin',
      action: 'job.moderate',
      targetType: 'Job',
      targetId: 'j2',
      reason: 'Removed scam wire fee listing',
      ipAddress: '192.168.1.15',
      createdAt: '2026-08-12 16:45:00',
    },
    {
      id: 'log3',
      adminEmail: 'admin@kirmya.com',
      roleCode: 'super_admin',
      action: 'feature_flag.update',
      targetType: 'FeatureFlag',
      targetId: 'ai_moderation_v2',
      reason: 'Updated rollout to 100%',
      ipAddress: '192.168.1.10',
      createdAt: '2026-08-12 14:10:00',
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <HistoryIcon sx={{ color: '#6366f1', fontSize: 36 }} />
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Immutable Administrative Audit Trail
        </Typography>
      </Stack>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Complete log of every privileged administrative action, target entity, admin role, IP address, and justification.
      </Typography>

      <Card
        sx={{
          borderRadius: '24px',
          p: 3,
          bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <TextField
            placeholder="Search audit logs by admin email, action code, or target ID..."
            fullWidth
            InputProps={{ startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} /> }}
          />
        </Stack>

        <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Admin Identity</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Action Code</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Target Entity</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Reason / Justification</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>IP Address</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{l.adminEmail}</Typography>
                    <Chip label={l.roleCode} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
                  </TableCell>
                  <TableCell>
                    <Chip label={l.action} size="small" color="primary" sx={{ fontWeight: 800 }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{l.targetType} ({l.targetId})</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">{l.reason}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{l.ipAddress}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">{l.createdAt}</Typography>
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

export default AuditLog;
