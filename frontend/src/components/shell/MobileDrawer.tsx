'use client';

import React, { forwardRef, useLayoutEffect, useRef, useState } from 'react';
import {
  Drawer,
  Box,
  Stack,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  InputBase,
  Avatar,
  Badge,
  useTheme,
  Button,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import useForkRef from '@mui/utils/useForkRef';
import type { TransitionProps } from '@mui/material/transitions';
import { animate, motion, useMotionValue, useReducedMotion } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import BrandLockup from '../brand/BrandLockup';
import { useAuth } from '../../hooks/useAuth';
import { canAccessPlatformAdmin } from '../../shared/permissions';
import { activeWorkspace } from '../../shared/workspace/active';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import { ROUTES } from '../../shared/routes';
import { PRIMARY_NAV_ITEMS, PUBLIC_NAV_ITEMS } from '../../shared/navigation';
import { isItemActive } from '../../shared/navigation/matchRoute';
import { tokens } from '../../theme/tokens';

export interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

// Keep MUI's modal semantics while retargeting the live presentation value.
// There is deliberately no swipe recognizer: this drawer is button-operated.
const DrawerTransition = forwardRef<HTMLDivElement, TransitionProps & { children: React.ReactElement }>(
  function DrawerTransition({ in: visible, children, onEnter, onExited, onFocus, tabIndex }, forwardedRef) {
    const node = useRef<HTMLDivElement>(null);
    const ref = useForkRef(node, forwardedRef);
    const x = useMotionValue(0);
    const opacity = useMotionValue(0);
    const reducedMotion = useReducedMotion();
    const initialized = useRef(false);
    const callbacks = useRef({ onEnter, onExited });

    useLayoutEffect(() => {
      callbacks.current = { onEnter, onExited };
      const element = node.current;
      if (!element) return;
      const width = element.getBoundingClientRect().width;
      if (!initialized.current) {
        x.set(-width);
        initialized.current = true;
      }
      if (visible) callbacks.current.onEnter?.(element, false);

      const finish = () => {
        if (!visible) callbacks.current.onExited?.(element);
      };
      if (reducedMotion) {
        x.set(0);
        const fade = animate(opacity, visible ? 1 : 0, { duration: 0.12, onComplete: finish });
        return () => fade.stop();
      }

      opacity.set(1);
      const spring = animate(x, visible ? 0 : -width, {
        type: 'spring',
        stiffness: 500,
        damping: 2 * Math.sqrt(500),
        mass: 1,
        velocity: x.getVelocity(),
        onComplete: finish,
      });
      return () => spring.stop();
    }, [visible, reducedMotion, x, opacity, onEnter, onExited]);

    return (
      <motion.div
        ref={ref}
        style={{ x, opacity, position: 'fixed', inset: '0 auto 0 0', width: 'min(85vw, 20rem)', outline: 'none' }}
        tabIndex={tabIndex ?? -1}
        onFocus={onFocus}
      >
        {children}
      </motion.div>
    );
  },
);

/**
 * Mobile Slide-Out Navigation Drawer (Prompt 14/50)
 * 
 * Provides accessible keyboard-friendly mobile navigation, search,
 * role sections, and profile actions.
 */
export const MobileDrawer: React.FC<MobileDrawerProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const pathname = usePathname();
  const router = useRouter();
  const { user, authenticated, notificationsCount, permissions, workspaces, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onClose();
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    router.push(ROUTES.HOME);
  };

  const navItems = authenticated ? PRIMARY_NAV_ITEMS : PUBLIC_NAV_ITEMS;

  const getNavIcon = (iconName: string) => {
    switch (iconName) {
      case 'WorkOutline':
        return <WorkOutlineIcon />;
      case 'PeopleOutline':
        return <PeopleOutlineIcon />;
      case 'ForumOutlined':
        return <ForumOutlinedIcon />;
      case 'ChatBubbleOutline':
        return <ChatBubbleOutlineIcon />;
      case 'NotificationsNone':
        return <NotificationsNoneIcon />;
      case 'BusinessCenterOutlined':
        return <BusinessCenterOutlinedIcon />;
      case 'BusinessOutlined':
        return <BusinessOutlinedIcon />;
      case 'HelpOutline':
        return <HelpOutlineIcon />;
      default:
        return null;
    }
  };

  /*
   * Both of these read roleId, and both were wrong in a different direction.
   *
   * Recruiting checked for values registration never writes, so the entry was
   * unreachable for every real account. Administration listed two roles by
   * hand and omitted super_admin - which AppHeader's shared helper includes -
   * so desktop and mobile disagreed about who is an administrator, and a
   * super_admin the server admits was offered no way in on a phone.
   *
   * Recruiting now comes from the served workspace list and administration
   * from the same helper the header uses, which is the same role set the API's
   * RequireAdmin() enforces. Neither is what protects the routes.
   */
  const hasRecruiting = (workspaces ?? []).some(workspace => workspace.type === 'recruiting');
  const isAdmin = canAccessPlatformAdmin({ permissions, role: user?.roleId });
  const activeLabel = activeWorkspace(workspaces, pathname)?.label;

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      slots={{ transition: DrawerTransition }}
      ModalProps={{ keepMounted: true, closeAfterTransition: true }}
      PaperProps={{
        role: 'dialog',
        'aria-modal': true,
        'aria-label': 'Navigation menu',
        sx: {
          position: 'absolute',
          width: '100%',
          boxSizing: 'border-box',
          bgcolor: alpha(theme.palette.background.paper, isDark ? 0.94 : 0.92),
          backdropFilter: 'blur(28px) saturate(150%)',
          borderRight: `1px solid ${theme.palette.divider}`,
          p: 2,
          pt: 'max(1rem, env(safe-area-inset-top))',
          pb: 'max(1rem, env(safe-area-inset-bottom))',
          '@media (prefers-reduced-transparency: reduce), (prefers-contrast: more)': {
            bgcolor: 'background.paper',
            backdropFilter: 'none',
          },
          '@media (prefers-contrast: more)': { borderColor: 'text.primary' },
          '& .MuiButtonBase-root': {
            minHeight: 44,
            '&:active': { bgcolor: 'action.selected', transition: 'none' },
            '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: -2 },
          },
        },
      }}
    >
      <Stack spacing={2} sx={{ minHeight: '100%', flexShrink: 0 }}>
        {/* Header: Brand & Close */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Link href={authenticated ? ROUTES.FEED : ROUTES.HOME} onClick={onClose} style={{ textDecoration: 'none', color: 'inherit' }}>
            <BrandLockup size={32} variant="h6" />
          </Link>
          <IconButton onClick={onClose} aria-label="Close navigation menu" sx={{ minWidth: 44 }}>
            <CloseIcon />
          </IconButton>
        </Stack>

        {/* Search */}
        <Box
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'background.default',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: `${tokens.radius.pill}px`,
            px: 1.5,
            py: 0.5,
            minHeight: 44,
            '&:focus-within': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
          }}
        >
          <SearchIcon sx={{ color: 'text.secondary', fontSize: 20, mr: 1 }} />
          <InputBase
            type="search"
            placeholder="Search Kirmya..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            inputProps={{ 'aria-label': 'Search' }}
            sx={{ width: '100%', fontSize: '0.875rem' }}
          />
        </Box>

        <Divider />

        {/* User Identity Card on Mobile */}
        {authenticated && user && (
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 1, py: 0.5 }}>
            <Avatar
              alt={user.firstName || 'User'}
              sx={{ width: 40, height: 40, bgcolor: theme.palette.primary.main }}
            >
              {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700 }}>
                {user.firstName ? `${user.firstName} ${user.lastName}` : user.email}
              </Typography>
              {/* roleId reads "user" for everyone; the workspace says something. */}
              <Typography variant="caption" color="text.secondary" noWrap>
                {user.jobTitle || activeLabel || 'Member'}
              </Typography>
            </Box>
          </Stack>
        )}

        {/*
          The switcher, at this breakpoint, opens from the account block rather
          than enumerating every workspace in the navigation list - the phone
          presentation the architecture asks for, and the same two interactions
          as on desktop.
        */}
        {authenticated && user && (
          <Box sx={{ px: 1, pb: 0.5 }}>
            <WorkspaceSwitcher variant="drawer" onNavigate={onClose} />
          </Box>
        )}

        {/* Navigation List */}
        <List component="nav" aria-label="Primary navigation" sx={{ flex: 1, py: 0 }}>
          {navItems.map((item) => {
            const isActive = Boolean(pathname && isItemActive(pathname, item));
            return (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={Link}
                  href={item.href}
                  onClick={onClose}
                  aria-current={isActive ? 'page' : undefined}
                  sx={{
                    borderRadius: `${tokens.radius.md}px`,
                    bgcolor: isActive ? 'action.selected' : 'transparent',
                    color: isActive ? theme.palette.primary.main : 'text.primary',
                  }}
                >
                  <ListItemIcon sx={{ color: isActive ? theme.palette.primary.main : 'inherit', minWidth: 36 }}>
                    {item.badgeKey === 'notifications' && notificationsCount > 0 ? (
                      <Badge badgeContent={notificationsCount > 99 ? '99+' : notificationsCount} color="error">
                        {getNavIcon(item.iconName)}
                      </Badge>
                    ) : (
                      getNavIcon(item.iconName)
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontWeight: isActive ? 700 : 500 }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}

          {/* Role Navigation Items */}
          {authenticated && user && hasRecruiting && (
            <>
              <Divider sx={{ my: 1 }} />
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  href={ROUTES.RECRUITER.DASHBOARD}
                  onClick={onClose}
                  sx={{ borderRadius: `${tokens.radius.md}px` }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <DashboardOutlinedIcon />
                  </ListItemIcon>
                  <ListItemText primary="Recruiter Console" />
                </ListItemButton>
              </ListItem>
            </>
          )}

          {authenticated && user && isAdmin && (
            <>
              <Divider sx={{ my: 1 }} />
              <ListItem disablePadding>
                {/*
                  This pointed at ROUTES.ADMIN.DASHBOARD - /admin/dashboard -
                  which has no page, so the administration entry on a phone led
                  to the not-found screen. It now goes where the header sends
                  administrators and where the resolver routes the platform
                  workspace, under the same name, so the two surfaces name and
                  reach one destination instead of two.
                */}
                <ListItemButton
                  component={Link}
                  href={ROUTES.ADMIN.ROOT}
                  onClick={onClose}
                  sx={{ borderRadius: `${tokens.radius.md}px`, color: 'error.main' }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: 'error.main' }}>
                    <ShieldOutlinedIcon />
                  </ListItemIcon>
                  <ListItemText primary="Kirmya administration" primaryTypographyProps={{ fontWeight: 700 }} />
                </ListItemButton>
              </ListItem>
            </>
          )}
        </List>

        <Divider />

        {/* Footer Actions */}
        {authenticated ? (
          <Stack spacing={1}>
            <ListItemButton
              component={Link}
              href={ROUTES.PROFILE}
              onClick={onClose}
              sx={{ borderRadius: `${tokens.radius.md}px` }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <PersonOutlineIcon />
              </ListItemIcon>
              <ListItemText primary="Your Profile" />
            </ListItemButton>

            <ListItemButton
              component={Link}
              href={ROUTES.SETTINGS.ROOT}
              onClick={onClose}
              sx={{ borderRadius: `${tokens.radius.md}px` }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <SettingsOutlinedIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItemButton>

            <ListItemButton
              onClick={handleLogout}
              sx={{ borderRadius: `${tokens.radius.md}px`, color: 'error.main' }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: 'error.main' }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Sign Out" />
            </ListItemButton>
          </Stack>
        ) : (
          <Stack spacing={1}>
            <Button
              component={Link}
              href={ROUTES.AUTH.LOGIN}
              onClick={onClose}
              variant="outlined"
              fullWidth
            >
              Sign In
            </Button>
            <Button
              component={Link}
              href={ROUTES.AUTH.SIGNUP}
              onClick={onClose}
              variant="contained"
              fullWidth
            >
              Join Free
            </Button>
          </Stack>
        )}
      </Stack>
    </Drawer>
  );
};

export default MobileDrawer;
