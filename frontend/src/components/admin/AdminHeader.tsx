'use client';

import React from 'react';
import {
  Box,
  Typography,
  Stack,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import LockIcon from '@mui/icons-material/Lock';
import NotificationsIcon from '@mui/icons-material/Notifications';

export const AdminHeader: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        py: 2,
        px: 3,
        bgcolor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <ShieldIcon sx={{ color: '#ef4444', fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 900, background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Kirmya Admin Control Center
        </Typography>
        <Chip
          label="SUPER ADMIN - AUDIT ENABLED"
          size="small"
          color="error"
          sx={{ fontWeight: 800, height: 20, fontSize: '0.65rem' }}
        />
      </Stack>

      <Stack direction="row" spacing={2} alignItems="center">
        <Tooltip title="Least-Privilege RBAC Enforced">
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ px: 1.5, py: 0.5, borderRadius: '20px', bgcolor: 'rgba(99, 102, 241, 0.1)' }}>
            <LockIcon sx={{ fontSize: 16, color: '#6366f1' }} />
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#6366f1' }}>
              RBAC ACTIVE
            </Typography>
          </Stack>
        </Tooltip>

        <IconButton size="small">
          <NotificationsIcon />
        </IconButton>

        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar sx={{ width: 34, height: 34, bgcolor: '#ef4444', fontWeight: 800, fontSize: '0.85rem' }}>
            SA
          </Avatar>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              System Administrator
            </Typography>
            <Typography variant="caption" color="text.secondary">
              admin@kirmya.com
            </Typography>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
};

export default AdminHeader;
