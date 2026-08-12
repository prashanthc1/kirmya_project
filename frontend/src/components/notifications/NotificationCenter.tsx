'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Tab,
  Tabs,
  Stack,
  useTheme,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationList from './NotificationList';
import NotificationPreferences from './NotificationPreferences';
import QuietHours from './QuietHours';
import DigestSettings from './DigestSettings';
import NotificationHistory from './NotificationHistory';
import { NotificationItemDTO, NotificationCategory } from '../../features/notifications/types';

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

  const [notifications, setNotifications] = useState<NotificationItemDTO[]>([
    {
      id: 'n1',
      userId: 'u1',
      category: 'Interviews',
      type: 'interview_scheduled',
      priority: 'High',
      title: 'Technical Interview Scheduled',
      content: 'Your Senior Go Architect interview with Emaar is scheduled for tomorrow at 10:00 AM.',
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
      content: 'Kirmya AI matched a new Lead Backend Role in Dubai (96% Skill Score).',
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
      content: 'Successful account login from Chrome on Windows (Dubai, UAE).',
      actionUrl: '/notifications',
      isRead: false,
      isArchived: false,
      createdAt: new Date(Date.now() - 14400000).toISOString(),
    },
    {
      id: 'n4',
      userId: 'u1',
      category: 'Applications',
      type: 'application_status_changed',
      priority: 'High',
      title: 'Application Shortlisted',
      content: 'Your application for Lead Architect at TechCorp has been moved to Shortlisted.',
      actionUrl: '/dashboard/applications',
      isRead: true,
      isArchived: false,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'n5',
      userId: 'u1',
      category: 'Networking',
      type: 'connection_accepted',
      priority: 'Normal',
      title: 'Connection Accepted',
      content: 'Salim Al-Harthy accepted your connection request.',
      actionUrl: '/networking',
      isRead: true,
      isArchived: false,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ]);

  const handleMarkRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleMarkUnread = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)));
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleArchive = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isArchived: true } : n)));
  };

  const filteredNotifications = notifications.filter((n) => {
    if (n.isArchived) return false;
    if (activeTab === 1 && n.isRead) return false;
    if (selectedCategory !== 'all' && n.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
    return true;
  });

  const categories = [
    { key: 'all', label: 'All Categories' },
    { key: 'jobs', label: 'Jobs' },
    { key: 'applications', label: 'Applications' },
    { key: 'interviews', label: 'Interviews' },
    { key: 'networking', label: 'Networking' },
    { key: 'security', label: 'Security' },
  ];

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
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
          <Tab label={`Unread (${notifications.filter((n) => !n.isRead && !n.isArchived).length})`} sx={{ fontWeight: 800 }} />
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
