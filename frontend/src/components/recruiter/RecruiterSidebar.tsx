'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  useTheme,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import WorkIcon from '@mui/icons-material/Work';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import PeopleIcon from '@mui/icons-material/People';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import EventIcon from '@mui/icons-material/Event';
import MessageIcon from '@mui/icons-material/Message';
import BarChartIcon from '@mui/icons-material/BarChart';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SettingsIcon from '@mui/icons-material/Settings';

export const RecruiterSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const menuItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, route: '/recruiter/dashboard' },
    { label: 'Job Management', icon: <WorkIcon />, route: '/recruiter/jobs' },
    { label: 'Post New Job', icon: <AddCircleIcon />, route: '/recruiter/jobs/create' },
    { label: 'Candidate Discovery', icon: <PeopleIcon />, route: '/recruiter/candidates' },
    { label: 'ATS Pipeline', icon: <ViewKanbanIcon />, route: '/recruiter/applications' },
    { label: 'Interviews', icon: <EventIcon />, route: '/recruiter/interviews' },
    { label: 'Messages', icon: <MessageIcon />, route: '/recruiter/messages' },
    { label: 'Analytics', icon: <BarChartIcon />, route: '/recruiter/analytics' },
    { label: 'Team & Settings', icon: <SettingsIcon />, route: '/recruiter/settings' },
  ];

  return (
    <Box
      sx={{
        width: { xs: '100%', md: 280 },
        // Only a full-height rail once it sits beside the content; stacked on a
        // phone it should take the height of its own list, not the screen.
        minHeight: { xs: 'auto', md: '100dvh' },
        flexShrink: 0,
        bgcolor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderRight: { xs: 'none', md: '1px solid rgba(255, 255, 255, 0.08)' },
        borderBottom: { xs: '1px solid rgba(255, 255, 255, 0.08)', md: 'none' },
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Brand Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
          }}
        >
          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 900 }}>
            K
          </Typography>
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
            KIRMYA
          </Typography>
          <Chip label="RECRUITER SUITE" size="small" color="primary" sx={{ fontSize: '0.6rem', fontWeight: 800, height: 18 }} />
        </Box>
      </Box>

      <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.08)' }} />

      {/* Menu Navigation */}
      <List disablePadding>
        {menuItems.map((item) => {
          const isActive = pathname === item.route;
          return (
            <ListItemButton
              key={item.route}
              onClick={() => router.push(item.route)}
              sx={{
                borderRadius: '12px',
                mb: 0.8,
                bgcolor: isActive ? (isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)') : 'transparent',
                color: isActive ? 'primary.main' : 'text.primary',
                '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)' },
              }}
            >
              <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'text.secondary', minWidth: 38 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isActive ? 800 : 600 }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* AI Hiring Assistant Promo Footer */}
      <Box
        sx={{
          mt: 'auto',
          p: 2,
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          textAlign: 'center',
        }}
      >
        <AutoAwesomeIcon sx={{ color: '#a855f7', mb: 0.5 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#a855f7' }}>
          AI Hiring Companion Active
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.3 }}>
          Automated candidate match ranking &amp; ATS resume scoring.
        </Typography>
      </Box>
    </Box>
  );
};

export default RecruiterSidebar;
