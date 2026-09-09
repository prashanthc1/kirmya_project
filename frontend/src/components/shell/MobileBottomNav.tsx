'use client';

import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper, Badge, useTheme } from '@mui/material';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';

import { useAuth } from '../../hooks/useAuth';
import { MOBILE_NAV_ITEMS } from '../../shared/navigation';
import { findActiveId } from '../../shared/navigation/matchRoute';
import { tokens } from '../../theme/tokens';

const ICONS: Record<string, React.ReactElement> = {
  HomeOutlined: <HomeOutlinedIcon />,
  PeopleOutline: <PeopleOutlineIcon />,
  WorkOutline: <WorkOutlineIcon />,
  ChatBubbleOutline: <ChatBubbleOutlineIcon />,
  PersonOutline: <PersonOutlineIcon />,
};

/**
 * Primary navigation on compact screens.
 *
 * Three things this had wrong.
 *
 * It was hidden from `sm` upwards while the desktop navigation row only appears
 * from `md`, so on a tablet — 600px to 900px — neither existed and every
 * primary destination was behind the hamburger. Both breakpoints are now `md`.
 *
 * Its destinations were a switch statement calling `router.push`, so each was a
 * button: no middle-click, no open-in-new-tab, and announced as a button rather
 * than a link. They are links now, from the same config the rest of the
 * navigation reads.
 *
 * Its active tab was decided by `startsWith`, which lit Jobs on `/jobs` and
 * also on any path merely beginning with those characters. Matching is shared
 * and segment-aware.
 */
export const MobileBottomNav: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const pathname = usePathname();
  const { authenticated, notificationsCount } = useAuth();

  if (!authenticated) return null;

  const activeId = findActiveId(pathname || '/', MOBILE_NAV_ITEMS) ?? false;

  return (
    <Paper
      elevation={4}
      component="nav"
      aria-label="Primary"
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: tokens.zIndex.fixed,
        display: { xs: 'block', md: 'none' },
        borderTop: `1px solid ${theme.palette.divider}`,
        bgcolor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        // Keeps the bar clear of the home indicator on a modern handset.
        pb: 'env(safe-area-inset-bottom)',
      }}
    >
      <BottomNavigation
        value={activeId}
        showLabels
        sx={{
          bgcolor: 'transparent',
          height: 60,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            // 48px is the smallest comfortable touch target.
            minHeight: 48,
            padding: '6px 0',
            color: 'text.secondary',
            '&.Mui-selected': { color: theme.palette.primary.main },
            '&:focus-visible': {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: -2,
            },
          },
        }}
      >
        {MOBILE_NAV_ITEMS.map(item => {
          const icon = ICONS[item.iconName] ?? <HomeOutlinedIcon />;
          const badged =
            item.badgeKey === 'messages' && notificationsCount > 0 ? (
              <Badge color="error" variant="dot">
                {icon}
              </Badge>
            ) : (
              icon
            );
          return (
            <BottomNavigationAction
              key={item.id}
              value={item.id}
              label={item.label}
              icon={badged}
              component={Link}
              href={item.href}
              aria-current={activeId === item.id ? 'page' : undefined}
            />
          );
        })}
      </BottomNavigation>
    </Paper>
  );
};

export default MobileBottomNav;
