'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  Tab,
  Tabs,
  Stack,
  Button,
  IconButton,
  Tooltip,
  useTheme,
  Alert,
} from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import Link from 'next/link';

import NotificationList from './NotificationList';
import { notificationApi } from '../../features/notifications/services/notificationApi';
import { NotificationItemDTO } from '../../features/notifications/types';
import { useAuthContext } from '../../context/AuthContext';
import { tokens } from '../../theme/tokens';

interface NotificationCenterProps {
  initialCategory?: string;
  initialUnreadOnly?: boolean;
}

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'applications', label: 'Applications' },
  { key: 'networking', label: 'Network' },
  { key: 'messaging', label: 'Messages' },
  { key: 'interviews', label: 'Interviews' },
  { key: 'security', label: 'Security' },
];

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  initialCategory = 'all',
  initialUnreadOnly = false,
}) => {
  const theme = useTheme();
  const { setNotificationsCount } = useAuthContext();

  const [activeCategory, setActiveCategory] = useState<string>(
    initialUnreadOnly ? 'unread' : initialCategory
  );
  const [notifications, setNotifications] = useState<NotificationItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const isUnread = activeCategory === 'unread';
      const categoryParam =
        activeCategory === 'all' || activeCategory === 'unread'
          ? undefined
          : activeCategory;

      const data = await notificationApi.listNotifications({
        category: categoryParam,
        unreadOnly: isUnread ? true : undefined,
      });

      setNotifications(data || []);

      // Also update unread count
      const unreadRes = await notificationApi.getUnreadCount().catch(() => ({ unreadCount: 0 }));
      if (setNotificationsCount) {
        setNotificationsCount(unreadRes.unreadCount || 0);
      }
    } catch (err: any) {
      setErrorMsg('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeCategory, setNotificationsCount]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    if (setNotificationsCount) {
      setNotificationsCount((prev) => Math.max(0, prev - 1));
    }
    try {
      await notificationApi.markRead(id);
    } catch {
      // Revert if error
      loadNotifications();
    }
  };

  const handleMarkUnread = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
    );
    if (setNotificationsCount) {
      setNotificationsCount((prev) => prev + 1);
    }
    try {
      await notificationApi.markUnread(id);
    } catch {
      loadNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (setNotificationsCount) {
      setNotificationsCount(0);
    }
    try {
      await notificationApi.markAllRead();
    } catch {
      loadNotifications();
    }
  };

  const handleDelete = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await notificationApi.deleteNotification(id);
    } catch {
      loadNotifications();
    }
  };

  const handleArchive = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await notificationApi.archiveNotification(id);
    } catch {
      loadNotifications();
    }
  };

  const handleClearRead = async () => {
    setNotifications((prev) => prev.filter((n) => !n.isRead));
    try {
      await notificationApi.clearRead();
    } catch {
      loadNotifications();
    }
  };

  return (
    <Box>
      {/* Header Bar */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        gap={1.5}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}
          >
            Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Stay updated with your job alerts, network requests, applications, and security.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="outlined"
            size="small"
            startIcon={<DoneAllIcon />}
            onClick={handleMarkAllRead}
            sx={{
              borderRadius: `${tokens.radius.sm}px`,
              fontWeight: 700,
              fontSize: '0.8rem',
              textTransform: 'none',
            }}
          >
            Mark all read
          </Button>

          <Tooltip title="Notification Settings">
            <IconButton
              component={Link}
              href="/settings/notifications"
              size="small"
              sx={{ border: '1px solid', borderColor: 'divider' }}
              aria-label="Notification settings"
            >
              <SettingsOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Category Tabs */}
      <Box
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          mb: 3,
        }}
      >
        <Tabs
          value={activeCategory}
          onChange={(_, newVal) => setActiveCategory(newVal)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Notification category filter tabs"
          sx={{
            minHeight: 44,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.875rem',
              minHeight: 44,
              minWidth: 'auto',
              px: 2,
            },
          }}
        >
          {CATEGORIES.map((cat) => (
            <Tab key={cat.key} value={cat.key} label={cat.label} />
          ))}
        </Tabs>
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: `${tokens.radius.md}px` }}>
          {errorMsg}
        </Alert>
      )}

      {/* Notification List Content */}
      <NotificationList
        notifications={notifications}
        loading={loading}
        onMarkRead={handleMarkRead}
        onMarkUnread={handleMarkUnread}
        onMarkAllRead={handleMarkAllRead}
        onDelete={handleDelete}
        onArchive={handleArchive}
      />
    </Box>
  );
};

export default NotificationCenter;
