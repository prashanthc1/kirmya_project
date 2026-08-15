'use client';

import React from 'react';
import { Box, Typography, Stack, Button, CircularProgress } from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationItem from './NotificationItem';
import { NotificationItemDTO } from '../../features/notifications/types';

interface NotificationListProps {
  notifications: NotificationItemDTO[];
  loading?: boolean;
  onMarkRead?: (id: string) => void;
  onMarkUnread?: (id: string) => void;
  onMarkAllRead?: () => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  loading,
  onMarkRead,
  onMarkUnread,
  onMarkAllRead,
  onDelete,
  onArchive,
}) => {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <Box sx={{ p: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (notifications.length === 0) {
    return (
      <Box sx={{ p: 8, textAlign: 'center', opacity: 0.7 }}>
        <NotificationsIcon sx={{ fontSize: 56, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          You&apos;re all caught up!
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          No notifications found matching your current filter.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {unreadCount > 0 && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
            {unreadCount} UNREAD NOTIFICATIONS
          </Typography>
          <Button
            startIcon={<DoneAllIcon />}
            size="small"
            onClick={onMarkAllRead}
            sx={{ fontWeight: 800, textTransform: 'none' }}
          >
            Mark all as read
          </Button>
        </Stack>
      )}

      <Stack spacing={2}>
        {notifications.map((n) => (
          <NotificationItem
            key={n.id}
            item={n}
            onMarkRead={onMarkRead}
            onMarkUnread={onMarkUnread}
            onDelete={onDelete}
            onArchive={onArchive}
          />
        ))}
      </Stack>
    </Box>
  );
};

export default NotificationList;
