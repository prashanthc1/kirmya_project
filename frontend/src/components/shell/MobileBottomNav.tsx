'use client';

import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper, Badge, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';

import { useAuth } from '../../hooks/useAuth';
import { MOBILE_NAV_ITEMS, type NavItem } from '../../shared/navigation';
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
 * Primary workspace destinations on compact screens, paired with the
 * desktop navigation at the `lg` breakpoint. Links and active-route matching
 * come from the shared navigation registry.
 */
export interface MobileBottomNavProps {
  /**
   * The destinations to offer. Defaults to the professional five.
   *
   * The bar carries the primary destinations of the *active* workspace, so a
   * recruiter working a pipeline is offered the recruiting destinations rather
   * than Feed, Network and Jobs - none of which is where they are. The shell
   * decides which set that is; this renders whichever it is handed.
   */
  items?: NavItem[];
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ items = MOBILE_NAV_ITEMS }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const pathname = usePathname();
  const { authenticated, notificationsCount } = useAuth();

  if (!authenticated) return null;

  const activeId = findActiveId(pathname || '/', items) ?? false;

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
        display: { xs: 'block', lg: 'none' },
        borderRadius: 0,
        bgcolor: alpha(theme.palette.background.paper, isDark ? 0.92 : 0.88),
        backdropFilter: 'blur(24px) saturate(150%)',
        boxShadow: `0 -1px 16px ${alpha(theme.palette.common.black, 0.05)}`,
        '@media (prefers-reduced-transparency: reduce), (prefers-contrast: more)': {
          bgcolor: 'background.paper',
          backdropFilter: 'none',
        },
        '@media (prefers-contrast: more)': { borderTop: `1px solid ${theme.palette.text.primary}` },
        // Keeps the bar clear of the home indicator on a modern handset.
        pb: 'env(safe-area-inset-bottom)',
      }}
    >
      <BottomNavigation
        value={activeId}
        showLabels
        sx={{
          bgcolor: 'transparent',
          minHeight: 64,
          height: 'auto',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            // 48px is the smallest comfortable touch target.
            minHeight: 48,
            padding: '8px 2px',
            color: 'text.secondary',
            '&.Mui-selected': { color: theme.palette.primary.main, bgcolor: 'action.selected' },
            '&:active': { bgcolor: 'action.selected', transition: 'none' },
            '& .MuiBottomNavigationAction-label, & .MuiBottomNavigationAction-label.Mui-selected': {
              fontSize: '0.6875rem',
              fontWeight: 600,
              lineHeight: 1.3,
              mt: 0.5,
            },
            '&:focus-visible': {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: -2,
            },
          },
        }}
      >
        {items.map(item => {
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
