'use client';

import React from 'react';
import {
  Box,
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
import Link from 'next/link';
import { useColorMode } from '../../app/providers';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../shared/routes';
import WorkspaceSwitcher from '../shell/WorkspaceSwitcher';

export const RecruiterHeader: React.FC = () => {
  const theme = useTheme();
  const { mode, toggleColorMode } = useColorMode();
  const { user, notificationsCount } = useAuth();
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
        // Hidden on a phone so the switcher fits. A convenience gives way to
        // the only control that leaves the workspace.
        sx={{ display: { xs: 'none', sm: 'block' }, width: { sm: 240, md: 380 } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="primary" />
            </InputAdornment>
          ),
        }}
      />

      <Stack direction="row" spacing={2} alignItems="center">
        {/*
          The switcher, so recruiting is a workspace you can leave.
          /recruiter/* is the one workspace with its own layout rather than the
          global shell, so without this an account could switch in and have no
          way back out - which is worse than never offering the control.

          Shown at every breakpoint, and the quick search below yields the room
          for it on a phone. Hiding it on small screens recreated the same trap
          there: this workspace has no drawer, so there would have been nothing
          else to leave by.

          It replaces a badge that read "Emaar Group HQ / Corporate
          Administrator" with a verified tick, for every recruiter, whoever they
          were. It named a real company none of these accounts belong to and
          asserted a verification nothing had performed. The workspace label
          says the same kind of thing and is true.
        */}
        <WorkspaceSwitcher />

        <IconButton onClick={toggleColorMode} color="inherit" aria-label="Toggle colour mode">
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>

        {/*
          The badge was the literal 4 for every recruiter on every page. A count
          is either counted or it is absent; it is never decorative. This is the
          same number the rest of the application shows, from /auth/me.
        */}
        <IconButton
          component={Link}
          href={ROUTES.NOTIFICATIONS}
          color="inherit"
          aria-label={
            notificationsCount > 0 ? `Notifications, ${notificationsCount} unread` : 'Notifications'
          }
        >
          <Badge badgeContent={notificationsCount} color="error" max={99}>
            <NotificationsIcon />
          </Badge>
        </IconButton>

        <Avatar sx={{ bgcolor: '#6366f1', fontWeight: 800, width: 38, height: 38 }}>
          {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'R'}
        </Avatar>
      </Stack>
    </Box>
  );
};

export default RecruiterHeader;
