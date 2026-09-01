'use client';

import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Typography,
  Divider,
  useTheme,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import MemoryOutlinedIcon from '@mui/icons-material/MemoryOutlined';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { tokens } from '../../theme/tokens';
import { RECRUITER_NAV_ITEMS, ADMIN_NAV_ITEMS, NavItem } from '../../shared/navigation';

export interface AppSidebarProps {
  variant?: 'recruiter' | 'admin';
}

/**
 * Collapsible Application Secondary Sidebar (Prompt 14/50)
 * 
 * Provides secondary navigation for console-heavy workflows (Recruiter ATS, Admin Center)
 * with tooltips and active state pills.
 */
export const AppSidebar: React.FC<AppSidebarProps> = ({ variant = 'recruiter' }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const items: NavItem[] = variant === 'admin' ? ADMIN_NAV_ITEMS : RECRUITER_NAV_ITEMS;
  const title = variant === 'admin' ? 'Admin Center' : 'Recruiter Console';

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'DashboardOutlined':
        return <DashboardOutlinedIcon />;
      case 'WorkOutline':
        return <WorkOutlineIcon />;
      case 'SearchOutlined':
        return <SearchOutlinedIcon />;
      case 'ViewKanbanOutlined':
        return <ViewKanbanOutlinedIcon />;
      case 'BarChartOutlined':
        return <BarChartOutlinedIcon />;
      case 'PeopleOutline':
        return <PeopleOutlineIcon />;
      case 'GavelOutlined':
        return <GavelOutlinedIcon />;
      case 'ShieldOutlined':
        return <ShieldOutlinedIcon />;
      case 'HistoryOutlined':
        return <HistoryOutlinedIcon />;
      case 'MemoryOutlined':
        return <MemoryOutlinedIcon />;
      default:
        return <DashboardOutlinedIcon />;
    }
  };

  const sidebarWidth = collapsed
    ? tokens.layout.collapsedSidebarWidth
    : tokens.layout.sidebarWidth;

  return (
    <Box
      component="nav"
      aria-label={`${title} navigation`}
      sx={{
        width: { xs: '100%', md: sidebarWidth },
        flexShrink: 0,
        bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.6)',
        borderRight: `1px solid ${theme.palette.divider}`,
        transition: 'width 200ms ease-in-out',
        minHeight: 'calc(100dvh - 64px)',
        p: 2,
        boxSizing: 'border-box',
        display: { xs: 'none', md: 'block' },
      }}
    >
      {/* Header with Title & Collapse Toggle */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          mb: 2,
        }}
      >
        {!collapsed && (
          <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: variant === 'admin' ? 'error.main' : 'primary.main' }}>
            {title}
          </Typography>
        )}
        <IconButton
          size="small"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
        </IconButton>
      </Box>

      <Divider sx={{ mb: 1.5 }} />

      {/* Navigation Links */}
      <List disablePadding>
        {items.map((item) => {
          const isActive = Boolean(pathname && (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))));
          const icon = getIcon(item.iconName);

          const buttonContent = (
            <ListItemButton
              component={Link}
              href={item.href}
              sx={{
                borderRadius: `${tokens.radius.md}px`,
                mb: 0.5,
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 1.5 : 2,
                py: 1,
                bgcolor: isActive
                  ? isDark
                    ? 'rgba(129, 140, 248, 0.12)'
                    : 'rgba(99, 102, 241, 0.08)'
                  : 'transparent',
                color: isActive ? theme.palette.primary.main : 'text.primary',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.04)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 0 : 36,
                  color: isActive ? theme.palette.primary.main : 'inherit',
                  justifyContent: 'center',
                }}
              >
                {icon}
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 700 : 500,
                  }}
                />
              )}
            </ListItemButton>
          );

          return (
            <ListItem key={item.id} disablePadding>
              {collapsed ? (
                <Tooltip title={item.label} placement="right">
                  {buttonContent}
                </Tooltip>
              ) : (
                buttonContent
              )}
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default AppSidebar;
