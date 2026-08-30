'use client';

import React from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Badge,
  useTheme,
} from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';

import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../shared/routes';
import { tokens } from '../../theme/tokens';

/**
 * Mobile Bottom Navigation Bar (Prompt 14/50)
 * 
 * Provides thumb-friendly navigation across high-frequency destinations
 * on compact mobile viewports.
 */
export const MobileBottomNav: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const pathname = usePathname();
  const router = useRouter();
  const { authenticated } = useAuth();

  if (!authenticated) {
    return null;
  }

  const getActiveTab = () => {
    if (!pathname) return 'feed';
    if (pathname.startsWith(ROUTES.JOBS)) return 'jobs';
    if (pathname.startsWith(ROUTES.NETWORK)) return 'network';
    if (pathname.startsWith(ROUTES.MESSAGES)) return 'messages';
    if (pathname.startsWith(ROUTES.PROFILE)) return 'profile';
    return 'feed';
  };

  const handleNavChange = (_: React.SyntheticEvent, newValue: string) => {
    switch (newValue) {
      case 'feed':
        router.push(ROUTES.FEED);
        break;
      case 'jobs':
        router.push(ROUTES.JOBS);
        break;
      case 'network':
        router.push(ROUTES.NETWORK);
        break;
      case 'messages':
        router.push(ROUTES.MESSAGES);
        break;
      case 'profile':
        router.push(ROUTES.PROFILE);
        break;
    }
  };

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: tokens.zIndex.fixed,
        display: { xs: 'block', sm: 'none' },
        borderTop: `1px solid ${theme.palette.divider}`,
        bgcolor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <BottomNavigation
        value={getActiveTab()}
        onChange={handleNavChange}
        showLabels
        sx={{
          bgcolor: 'transparent',
          height: 60,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '6px 0',
            color: 'text.secondary',
            '&.Mui-selected': {
              color: theme.palette.primary.main,
            },
          },
        }}
      >
        <BottomNavigationAction
          label="Home"
          value="feed"
          icon={<HomeOutlinedIcon />}
        />
        <BottomNavigationAction
          label="Jobs"
          value="jobs"
          icon={<WorkOutlineIcon />}
        />
        <BottomNavigationAction
          label="Network"
          value="network"
          icon={<PeopleOutlineIcon />}
        />
        <BottomNavigationAction
          label="Messages"
          value="messages"
          icon={<ChatBubbleOutlineIcon />}
        />
        <BottomNavigationAction
          label="Profile"
          value="profile"
          icon={<PersonOutlineIcon />}
        />
      </BottomNavigation>
    </Paper>
  );
};

export default MobileBottomNav;
