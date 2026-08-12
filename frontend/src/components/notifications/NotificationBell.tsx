'use client';

import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Popover,
  Box,
  Typography,
  Stack,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Chip,
  useTheme,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import SettingsIcon from '@mui/icons-material/Settings';
import WorkIcon from '@mui/icons-material/Work';
import EventIcon from '@mui/icons-material/Event';
import SecurityIcon from '@mui/icons-material/Security';
import ForumIcon from '@mui/icons-material/Forum';
import PeopleIcon from '@mui/icons-material/People';
import { useRouter } from 'next/navigation';
import { notificationApi } from '../../features/notifications/services/notificationApi';
import { NotificationItemDTO } from '../../features/notifications/types';

export const NotificationBell: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const router = useRouter();

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [unreadCount, setUnreadCount] = useState(3);
  const [notifications, setNotifications] = useState<NotificationItemDTO[]>([
    {
      id: 'n1',
      userId: 'u1',
      category: 'Interviews',
      type: 'interview_scheduled',
      priority: 'High',
      title: 'Technical Interview Scheduled',
      content: 'Your Senior Go Architect interview with Emaar is set for tomorrow at 10:00 AM.',
      actionUrl: '/dashboard/interviews',
      isRead: false,
      isArchived: false,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'n2',
      userId: 'u1',
      category: 'Jobs',
      type: 'job_alert',
      priority: 'Normal',
      title: 'New Matching Job Opportunity',
      content: 'Kirmya AI matched a new Lead Backend Role in Dubai (96% Match).',
      actionUrl: '/jobs',
      isRead: false,
      isArchived: false,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'n3',
      userId: 'u1',
      category: 'Security',
      type: 'security_alert',
      priority: 'Critical',
      title: 'New Login Detected',
      content: 'Successful login from Chrome on Windows (Dubai, UAE).',
      actionUrl: '/notifications',
      isRead: false,
      isArchived: false,
      createdAt: new Date(Date.now() - 14400000).toISOString(),
    },
  ]);

  useEffect(() => {
    notificationApi
      .getUnreadCount()
      .then((res) => {
        if (res.unreadCount !== undefined) setUnreadCount(res.unreadCount);
      })
      .catch(() => {});
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationApi.markAllRead();
    } catch {}
  };

  const handleItemClick = (item: NotificationItemDTO) => {
    if (!item.isRead) {
      setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
      notificationApi.markRead(item.id).catch(() => {});
    }
    handleClose();
    if (item.actionUrl) {
      router.push(item.actionUrl);
    }
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'Interviews':
        return <EventIcon sx={{ color: '#ec4899' }} />;
      case 'Jobs':
        return <WorkIcon sx={{ color: '#6366f1' }} />;
      case 'Security':
        return <SecurityIcon sx={{ color: '#ef4444' }} />;
      case 'Networking':
        return <PeopleIcon sx={{ color: '#10b981' }} />;
      default:
        return <NotificationsIcon sx={{ color: '#3b82f6' }} />;
    }
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton onClick={handleClick} sx={{ color: 'text.secondary' }}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 380,
            borderRadius: '20px',
            bgcolor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
              Notifications
            </Typography>
            {unreadCount > 0 && <Chip label={`${unreadCount} New`} size="small" color="primary" sx={{ fontWeight: 800 }} />}
          </Stack>
          <Stack direction="row" spacing={0.5}>
            {unreadCount > 0 && (
              <IconButton size="small" onClick={handleMarkAllRead} title="Mark all read">
                <DoneAllIcon fontSize="small" />
              </IconButton>
            )}
            <IconButton size="small" onClick={() => { handleClose(); router.push('/settings/notifications'); }} title="Settings">
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        <Divider />

        <List sx={{ p: 0, maxH: 340, overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', opacity: 0.7 }}>
              <Typography variant="body2">No recent notifications</Typography>
            </Box>
          ) : (
            notifications.map((n) => (
              <ListItem
                key={n.id}
                onClick={() => handleItemClick(n)}
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  bgcolor: n.isRead ? 'transparent' : isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.05)',
                  borderLeft: n.isRead ? '3px solid transparent' : '3px solid #6366f1',
                  '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 42 }}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {getIcon(n.category)}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="subtitle2" sx={{ fontWeight: n.isRead ? 600 : 800, fontSize: '0.85rem' }}>
                      {n.title}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {n.content}
                    </Typography>
                  }
                />
              </ListItem>
            ))
          )}
        </List>

        <Divider />

        <Box sx={{ p: 1.5, textAlign: 'center' }}>
          <Button
            fullWidth
            size="small"
            onClick={() => {
              handleClose();
              router.push('/notifications');
            }}
            sx={{ fontWeight: 800, borderRadius: '10px' }}
          >
            View All Notifications
          </Button>
        </Box>
      </Popover>
    </>
  );
};

export default NotificationBell;
