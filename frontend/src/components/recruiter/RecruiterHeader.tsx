'use client';

import React from 'react';
import {
  Box,
  Typography,
  Stack,
  IconButton,
  Avatar,
  Badge,
  TextField,
  InputAdornment,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useColorMode } from '../../app/providers';

export const RecruiterHeader: React.FC = () => {
  const theme = useTheme();
  const { mode, toggleColorMode } = useColorMode();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        py: 2,
        px: 4,
        bgcolor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <TextField
        placeholder="Quick search candidates, active jobs, applications..."
        size="small"
        sx={{ width: { xs: 240, md: 380 } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="primary" />
            </InputAdornment>
          ),
        }}
      />

      <Stack direction="row" spacing={2} alignItems="center">
        {/* Company Badge */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ display: { xs: 'none', sm: 'flex' } }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.85rem', fontWeight: 800 }}>
            E
          </Avatar>
          <Box>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                Emaar Group HQ
              </Typography>
              <VerifiedIcon sx={{ color: '#0284c7', fontSize: 16 }} />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Corporate Administrator
            </Typography>
          </Box>
        </Stack>

        <IconButton onClick={toggleColorMode} color="inherit">
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>

        <IconButton color="inherit">
          <Badge badgeContent={4} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>

        <Avatar sx={{ bgcolor: '#6366f1', fontWeight: 800, width: 38, height: 38 }}>R</Avatar>
      </Stack>
    </Box>
  );
};

export default RecruiterHeader;
