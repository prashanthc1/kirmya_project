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
        bgcolor: isDark ? "background.paper" : "action.hover",
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <ShieldIcon sx={{ color: 'error.main', fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 900,    }}>
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
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ px: 1.5, py: 0.5, borderRadius: '20px', bgcolor: 'background.paper' }}>
            <LockIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>
              RBAC ACTIVE
            </Typography>
          </Stack>
        </Tooltip>

        <IconButton size="small">
          <NotificationsIcon />
        </IconButton>

        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar sx={{ width: 34, height: 34, bgcolor: 'error.main', fontWeight: 800, fontSize: '0.85rem' }}>
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
