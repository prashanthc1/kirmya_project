'use client';

import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  useTheme,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import BadgeIcon from '@mui/icons-material/Badge';
import WorkIcon from '@mui/icons-material/Work';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ForumIcon from '@mui/icons-material/Forum';
import FlagIcon from '@mui/icons-material/Flag';
import GavelIcon from '@mui/icons-material/Gavel';
import ShieldIcon from '@mui/icons-material/Shield';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import NotificationsIcon from '@mui/icons-material/Notifications';
import BarChartIcon from '@mui/icons-material/BarChart';
import HistoryIcon from '@mui/icons-material/History';
import MemoryIcon from '@mui/icons-material/Memory';
import SettingsIcon from '@mui/icons-material/Settings';
import { usePathname, useRouter } from 'next/navigation';

const menuItems = [
  { label: 'Overview Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
  { label: 'User Management', path: '/admin/users', icon: <PeopleIcon /> },
  { label: 'Company Management', path: '/admin/companies', icon: <BusinessIcon /> },
  { label: 'Recruiter Roster', path: '/admin/recruiters', icon: <BadgeIcon /> },
  { label: 'Job Moderation', path: '/admin/jobs', icon: <WorkIcon /> },
  { label: 'Application Safety', path: '/admin/applications', icon: <AssignmentIcon /> },
  { label: 'Community Moderation', path: '/admin/communities', icon: <ForumIcon /> },
  { label: 'User Reports', path: '/admin/reports', icon: <FlagIcon /> },
  { label: 'Moderation Queue', path: '/admin/moderation', icon: <GavelIcon /> },
  { label: 'Trust & Safety', path: '/admin/trust-safety', icon: <ShieldIcon /> },
  { label: 'Verification Queue', path: '/admin/verifications', icon: <VerifiedUserIcon /> },
  { label: 'Admin Notifications', path: '/admin/notifications', icon: <NotificationsIcon /> },
  { label: 'Platform Analytics', path: '/admin/analytics', icon: <BarChartIcon /> },
  { label: 'Immutable Audit Logs', path: '/admin/audit-logs', icon: <HistoryIcon /> },
  { label: 'System Health', path: '/admin/system', icon: <MemoryIcon /> },
  { label: 'System Settings', path: '/admin/settings', icon: <SettingsIcon /> },
];

export const AdminSidebar: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Box
      sx={{
        width: 260,
        flexShrink: 0,
        height: '100dvh',
        position: 'sticky',
        top: 0,
        bgcolor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      <Box sx={{ p: 2.5 }}>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: 1.2 }}>
          ADMINISTRATION MODULES
        </Typography>
      </Box>

      <Divider />

      <List sx={{ p: 1 }}>
        {menuItems.map((item) => {
          const active = pathname === item.path || (item.path !== '/admin' && pathname?.startsWith(item.path));
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => router.push(item.path)}
                sx={{
                  borderRadius: '12px',
                  bgcolor: active
                    ? isDark
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(239, 68, 68, 0.08)'
                    : 'transparent',
                  color: active ? '#ef4444' : 'text.primary',
                  fontWeight: active ? 800 : 600,
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: active ? '#ef4444' : 'text.secondary', minWidth: 38 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: active ? 800 : 600 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default AdminSidebar;
