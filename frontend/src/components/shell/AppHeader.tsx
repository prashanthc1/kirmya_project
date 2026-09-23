'use client';

import React, { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Button,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  InputBase,
  useTheme,
  Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

import BrandLockup from '../brand/BrandLockup';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../shared/routes';
import { PRIMARY_NAV_ITEMS, PUBLIC_NAV_ITEMS } from '../../shared/navigation';
import { isItemActive, isWithin } from '../../shared/navigation/matchRoute';
import { canAccessPlatformAdmin } from '../../shared/permissions';
import { activeWorkspace } from '../../shared/workspace/active';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import { tokens } from '../../theme/tokens';

import { resolveAssetUrl } from '../../shared/utils/assets';
export interface AppHeaderProps {
  onMobileNavOpen?: () => void;
}

/**
 * Top Global Application Navigation Bar (Prompt 14/50)
 * 
 * Provides desktop/tablet navigation, search entry, realtime notification counters,
 * theme controls, and authenticated account management.
 */
export const AppHeader: React.FC<AppHeaderProps> = ({ onMobileNavOpen }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const pathname = usePathname();
  const router = useRouter();
  const { user, authenticated, notificationsCount, permissions, workspaces, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = async () => {
    handleUserMenuClose();
    await logout();
    router.push(ROUTES.HOME);
  };

  const navItems = authenticated ? PRIMARY_NAV_ITEMS : PUBLIC_NAV_ITEMS;

  const getNavIcon = (iconName: string) => {
    switch (iconName) {
      case 'WorkOutline':
        return <WorkOutlineIcon fontSize="small" />;
      case 'PeopleOutline':
        return <PeopleOutlineIcon fontSize="small" />;
      case 'ForumOutlined':
        return <ForumOutlinedIcon fontSize="small" />;
      case 'ChatBubbleOutline':
        return <ChatBubbleOutlineIcon fontSize="small" />;
      case 'NotificationsNone':
        return <NotificationsNoneIcon fontSize="small" />;
      case 'BusinessCenterOutlined':
        return <BusinessCenterOutlinedIcon fontSize="small" />;
      case 'BusinessOutlined':
        return <BusinessOutlinedIcon fontSize="small" />;
      case 'HelpOutline':
        return <HelpOutlineIcon fontSize="small" />;
      default:
        return null;
    }
  };

  /*
   * Recruiting used to be `roleId === 'recruiter' || roleId === 'company_admin'`.
   * Registration hardcodes roleId "user" and nothing ever writes either value,
   * so that entry was unreachable for every normally registered account - while
   * the API behind it was open to all of them. Visibility and authorization
   * pointed in opposite directions.
   *
   * It now reads the workspace list the server resolves from the recruiter
   * capability itself, so the entry appears exactly when the routes behind it
   * would admit the caller. Hiding it is still not what protects them.
   */
  const hasRecruiting = (workspaces ?? []).some(workspace => workspace.type === 'recruiting');
  // Centralised, and matching the role set the API's own RequireAdmin() uses.
  // Written out here it missed super_admin entirely, so an account the server
  // would have admitted was shown no way in.
  const isAdmin = canAccessPlatformAdmin({ permissions, role: user?.roleId });
  const activeLabel = activeWorkspace(workspaces, pathname)?.label;

  return (
    <Box
      component="header"
      data-material="toolbar"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: tokens.zIndex.fixed,
        width: '100%',
        minHeight: tokens.layout.headerHeight,
        bgcolor: alpha(theme.palette.background.paper, isDark ? 0.9 : 0.84),
        backdropFilter: 'blur(24px) saturate(150%)',
        boxShadow: `0 1px 12px ${alpha(theme.palette.common.black, 0.04)}`,
        '@media (prefers-reduced-transparency: reduce), (prefers-contrast: more)': {
          bgcolor: 'background.paper',
          backdropFilter: 'none',
        },
        '@media (prefers-contrast: more)': {
          borderBottom: `1px solid ${theme.palette.text.primary}`,
        },
        '& .MuiButtonBase-root': {
          minHeight: 44,
          '&:active': { bgcolor: 'action.selected', transition: 'none' },
          '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
        },
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        px: { xs: 1.5, sm: 3, md: 4 },
        py: 1,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ width: '100%', maxWidth: tokens.layout.maxWidth, mx: 'auto', gap: { xs: 1, md: 2 }, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}
      >
        {/* Brand and Mobile Menu Trigger */}
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {onMobileNavOpen && (
            <IconButton
              onClick={onMobileNavOpen}
              aria-label="Open mobile navigation"
              sx={{ display: { xs: 'inline-flex', xl: 'none' }, minWidth: 44 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Link href={authenticated ? ROUTES.FEED : ROUTES.HOME} style={{ textDecoration: 'none', color: 'inherit' }}>
            <BrandLockup size={32} variant="h6" />
          </Link>
        </Stack>

        {/* Global Search Field (Desktop & Tablet) */}
        <Box
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{
            display: { xs: 'none', sm: 'flex', lg: 'none', xl: 'flex' },
            alignItems: 'center',
            bgcolor: 'background.default',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: `${tokens.radius.pill}px`,
            px: 1.5,
            py: 0.5,
            minHeight: 44,
            minWidth: 0,
            flex: '1 1 12rem',
            maxWidth: 280,
            '&:focus-within': {
              borderColor: theme.palette.primary.main,
              boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
            },
          }}
        >
          <SearchIcon sx={{ color: 'text.secondary', fontSize: 20, mr: 1 }} />
          <InputBase
            type="search"
            placeholder="Search jobs, people, skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            inputProps={{ 'aria-label': 'Search Kirmya platform' }}
            sx={{ width: '100%', fontSize: '0.875rem' }}
          />
        </Box>

        {/* Primary Desktop Navigation Links */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          component="nav"
          // The landmark a screen reader jumps to. The bottom bar carries the
          // same name, and never at the same time: it is display:none above
          // this breakpoint, which removes it from the accessibility tree.
          aria-label="Primary"
          sx={{ display: { xs: 'none', lg: 'flex' }, flexShrink: 0 }}
        >
          {navItems.map((item) => {
            // Segment-aware, so /network does not claim /networking and Feed
            // lights only on /feed itself.
            const isActive = Boolean(pathname && isItemActive(pathname, item));
            return (
              <Button
                key={item.id}
                component={Link}
                href={item.href}
                // Weight and colour say "you are here" to someone looking at
                // the screen. aria-current says it to everyone else.
                aria-current={isActive ? 'page' : undefined}
                startIcon={
                  item.badgeKey === 'notifications' && notificationsCount > 0 ? (
                    <Badge badgeContent={notificationsCount > 99 ? '99+' : notificationsCount} color="error">
                      {getNavIcon(item.iconName)}
                    </Badge>
                  ) : (
                    getNavIcon(item.iconName)
                  )
                }
                sx={{
                  px: 1.25,
                  py: 0.75,
                  borderRadius: `${tokens.radius.md}px`,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  color: isActive ? theme.palette.primary.main : 'text.primary',
                  bgcolor: isActive ? 'action.selected' : 'transparent',
                  '&:hover': {
                    bgcolor: isActive ? 'action.selected' : 'action.hover',
                  },
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Stack>

        {/* Right Actions: User Menu & Notifications */}
        <Stack direction="row" alignItems="center" spacing={1}>
          {authenticated && user ? (
            <>
              {/*
                The switcher sits beside the account controls rather than in the
                primary navigation: changing workspace changes the contextual
                navigation, and the five primary destinations stay five. On
                small screens it moves into the drawer's account block, which is
                the account control at that breakpoint.
              */}
              <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
                <WorkspaceSwitcher />
              </Box>

              {/*
                Notifications is a global action, not a destination, so it sits
                here beside search and the account menu rather than taking one
                of the five slots in the primary navigation. It was in that row
                before, which is how the row came to hold everything.
              */}
              <Tooltip title="Notifications">
                <IconButton
                  component={Link}
                  href={ROUTES.NOTIFICATIONS}
                  aria-label={
                    notificationsCount > 0
                      ? `Notifications, ${notificationsCount} unread`
                      : 'Notifications'
                  }
                  aria-current={pathname && isWithin(pathname, ROUTES.NOTIFICATIONS) ? 'page' : undefined}
                  sx={{ p: 1, minWidth: 44, color: pathname && isWithin(pathname, ROUTES.NOTIFICATIONS) ? 'primary.main' : 'text.primary' }}
                >
                  <Badge badgeContent={notificationsCount} color="error" max={99}>
                    <NotificationsNoneIcon fontSize="small" />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Tooltip title="Account menu">
                <IconButton
                  onClick={handleUserMenuOpen}
                  aria-label="User account menu"
                  aria-controls={userMenuAnchor ? 'user-account-menu' : undefined}
                  aria-haspopup="menu"
                  aria-expanded={Boolean(userMenuAnchor)}
                  sx={{ p: 0.5, minWidth: 44 }}
                >
                  <Avatar
                    alt={user.firstName ? `${user.firstName} ${user.lastName}` : 'User Avatar'}
                    src={resolveAssetUrl(user.avatarUrl)}
                    sx={{ width: 34, height: 34, bgcolor: theme.palette.primary.main, fontSize: '0.875rem' }}
                  >
                    {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                  </Avatar>
                </IconButton>
              </Tooltip>

              <Menu
                id="user-account-menu"
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  sx: {
                    minWidth: 220,
                    mt: 1,
                    p: 0.5,
                    bgcolor: alpha(theme.palette.background.paper, 0.96),
                    backdropFilter: 'blur(24px) saturate(150%)',
                    '& .MuiMenuItem-root': { minHeight: 44, borderRadius: 1.5, '&:active': { bgcolor: 'action.selected', transition: 'none' } },
                    '@media (prefers-reduced-transparency: reduce), (prefers-contrast: more)': {
                      bgcolor: 'background.paper',
                      backdropFilter: 'none',
                    },
                    '@media (prefers-contrast: more)': { border: `1px solid ${theme.palette.text.primary}` },
                  },
                }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {user.firstName ? `${user.firstName} ${user.lastName}` : user.email}
                  </Typography>
                  {/*
                    This displayed user.roleId, which is "user" for every
                    normally registered account - a label that told the reader
                    nothing and leaked an internal vocabulary to do it. The job
                    title if there is one, otherwise the workspace they are in.
                  */}
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {user.jobTitle || activeLabel || 'Member'}
                  </Typography>
                </Box>
                <Divider sx={{ my: 0.5 }} />

                <MenuItem
                  component={Link}
                  href={ROUTES.PROFILE}
                  onClick={handleUserMenuClose}
                >
                  <ListItemIcon>
                    <PersonOutlineIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Your Profile" />
                </MenuItem>

                {hasRecruiting && (
                  <MenuItem
                    component={Link}
                    href={ROUTES.RECRUITER.DASHBOARD}
                    onClick={handleUserMenuClose}
                  >
                    <ListItemIcon>
                      <DashboardOutlinedIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Recruiter Console" />
                  </MenuItem>
                )}

                {isAdmin && (
                  <MenuItem
                    component={Link}
                    href={ROUTES.ADMIN.ROOT}
                    onClick={handleUserMenuClose}
                  >
                    <ListItemIcon>
                      <ShieldOutlinedIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText primary="Kirmya administration" sx={{ color: 'error.main', fontWeight: 600 }} />
                  </MenuItem>
                )}

                <MenuItem
                  component={Link}
                  href={ROUTES.SETTINGS.ROOT}
                  onClick={handleUserMenuClose}
                >
                  <ListItemIcon>
                    <SettingsOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Settings" />
                </MenuItem>

                <Divider sx={{ my: 0.5 }} />

                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText primary="Sign Out" />
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                component={Link}
                href={ROUTES.AUTH.LOGIN}
                variant="outlined"
                size="small"
                sx={{ borderRadius: `${tokens.radius.sm}px` }}
              >
                Sign In
              </Button>
              <Button
                component={Link}
                href={ROUTES.AUTH.SIGNUP}
                variant="contained"
                size="small"
                sx={{ borderRadius: `${tokens.radius.sm}px` }}
              >
                Join Free
              </Button>
            </Stack>
          )}
        </Stack>
      </Stack>
    </Box>
  );
};

export default AppHeader;
