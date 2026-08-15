'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Tab,
  Tabs,
  Stack,
  Button,
  useTheme,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import NotificationList from './NotificationList';
import NotificationPreferences from './NotificationPreferences';
import QuietHours from './QuietHours';
import DigestSettings from './DigestSettings';
import NotificationHistory from './NotificationHistory';
import { notificationApi } from '../../features/notifications/services/notificationApi';
import { NotificationItemDTO } from '../../features/notifications/types';

interface NotificationCenterProps {
  initialCategory?: string;
  initialUnreadOnly?: boolean;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  initialCategory = 'all',
  initialUnreadOnly = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [activeTab, setActiveTab] = useState(initialUnreadOnly ? 1 : 0);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [notifications, setNotifications] = useState<NotificationItemDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationApi
      .listNotifications()
      .then((data) => {
        setNotifications(data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await notificationApi.markRead(id);
    } catch {}
  };

  const handleMarkUnread = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)));
    try {
      await notificationApi.markUnread(id);
    } catch {}
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await notificationApi.markAllRead();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await notificationApi.deleteNotification(id);
    } catch {}
  };

  const handleArchive = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isArchived: true } : n)));
    try {
      await notificationApi.archiveNotification(id);
    } catch {}
  };

  const filteredNotifications = notifications.filter((n) => {
    if (n.isArchived) return false;
    if (activeTab === 1 && n.isRead) return false;
    if (selectedCategory !== 'all') {
      const catLower = selectedCategory.toLowerCase();
      const itemCatLower = n.category.toLowerCase();
      if (catLower === 'network' && itemCatLower === 'networking') return true;
      if (catLower !== itemCatLower) return false;
    }
    return true;
  });

  const categories = [
    { key: 'all', label: 'All Categories' },
    { key: 'jobs', label: 'Jobs' },
    { key: 'applications', label: 'Applications' },
    { key: 'interviews', label: 'Interviews' },
    { key: 'networking', label: 'Networking' },
    { key: 'messages', label: 'Messages' },
    { key: 'career', label: 'Career' },
    { key: 'security', label: 'Security' },
  ];

  const unreadCount = notifications.filter((n) => !n.isRead && !n.isArchived).length;

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <NotificationsIcon sx={{ color: 'primary.main', fontSize: 36 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              Centralized Notification Center
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Manage your real-time alerts, job notifications, interview updates, and communication preferences.
            </Typography>
          </Box>
        </Stack>

        {unreadCount > 0 && (activeTab === 0 || activeTab === 1) && (
          <Button
            startIcon={<DoneAllIcon />}
            variant="outlined"
            onClick={handleMarkAllRead}
            sx={{ fontWeight: 800, borderRadius: '12px', textTransform: 'none' }}
          >
            Mark All Read
          </Button>
        )}
      </Stack>

      <Card
        sx={{
          borderRadius: '24px',
          p: 1,
          mb: 4,
          bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
          <Tab label={`All Feed (${notifications.filter((n) => !n.isArchived).length})`} sx={{ fontWeight: 800 }} />
          <Tab label={`Unread (${unreadCount})`} sx={{ fontWeight: 800 }} />
          <Tab label="Channel Preferences" sx={{ fontWeight: 800 }} />
          <Tab label="Quiet Hours" sx={{ fontWeight: 800 }} />
          <Tab label="Digest & History" sx={{ fontWeight: 800 }} />
        </Tabs>
      </Card>

      {(activeTab === 0 || activeTab === 1) && (
        <Box>
          <Card sx={{ borderRadius: '20px', p: 1.5, mb: 3 }}>
            <Tabs
              value={selectedCategory}
              onChange={(_, val) => setSelectedCategory(val)}
              variant="scrollable"
              scrollButtons="auto"
            >
              {categories.map((c) => (
                <Tab key={c.key} value={c.key} label={c.label} sx={{ fontWeight: 800, textTransform: 'none' }} />
              ))}
            </Tabs>
          </Card>

          <NotificationList
            notifications={filteredNotifications}
            onMarkRead={handleMarkRead}
            onMarkUnread={handleMarkUnread}
            onMarkAllRead={handleMarkAllRead}
            onDelete={handleDelete}
            onArchive={handleArchive}
          />
        </Box>
      )}

      {activeTab === 2 && <NotificationPreferences />}
      {activeTab === 3 && <QuietHours />}
      {activeTab === 4 && (
        <Stack spacing={4}>
          <DigestSettings />
          <NotificationHistory />
        </Stack>
      )}
    </Box>
  );
};

export default NotificationCenter;
