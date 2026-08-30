'use client';

import React from 'react';
import { Box, Typography, Stack, Button, Skeleton } from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import NotificationItem from './NotificationItem';
import { NotificationItemDTO } from '../../features/notifications/types';
import { tokens } from '../../theme/tokens';

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
      <Stack spacing={1.5}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton
            key={i}
            variant="rounded"
            height={88}
            sx={{ borderRadius: `${tokens.radius.md}px` }}
          />
        ))}
      </Stack>
    );
  }

  if (notifications.length === 0) {
    return (
      <Box
        sx={{
          py: 8,
          px: 3,
          textAlign: 'center',
          borderRadius: `${tokens.radius.lg}px`,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <NotificationsNoneIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1.5, opacity: 0.5 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
          You&apos;re all caught up!
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          No notifications found in this view. New activity will appear here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {unreadCount > 0 && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, px: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
            {unreadCount} UNREAD NOTIFICATION{unreadCount > 1 ? 'S' : ''}
          </Typography>
          {onMarkAllRead && (
            <Button
              startIcon={<DoneAllIcon fontSize="small" />}
              size="small"
              onClick={onMarkAllRead}
              sx={{
                fontWeight: 700,
                fontSize: '0.8rem',
                textTransform: 'none',
                borderRadius: `${tokens.radius.sm}px`,
              }}
            >
              Mark all as read
            </Button>
          )}
        </Stack>
      )}

      <Stack spacing={1.5}>
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
