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
  CircularProgress,
  Tooltip,
} from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import EventIcon from '@mui/icons-material/Event';
import SecurityIcon from '@mui/icons-material/Security';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { notificationApi } from '../../features/notifications/services/notificationApi';
import { NotificationItemDTO } from '../../features/notifications/types';
import { useAuthContext } from '../../context/AuthContext';
import { tokens } from '../../theme/tokens';

export const NotificationBell: React.FC = () => {
  const router = useRouter();
  const { notificationsCount, setNotificationsCount } = useAuthContext();

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [notifications, setNotifications] = useState<NotificationItemDTO[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    notificationApi
      .getUnreadCount()
      .then((res) => {
        if (res.unreadCount !== undefined && setNotificationsCount) {
          setNotificationsCount(res.unreadCount);
        }
      })
      .catch(() => {});
  }, [setNotificationsCount]);

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setLoading(true);
    try {
      const data = await notificationApi.listNotifications({ limit: 5 });
      setNotifications(data || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (setNotificationsCount) {
      setNotificationsCount(0);
    }
    try {
      await notificationApi.markAllRead();
    } catch {}
  };

  const handleItemClick = (item: NotificationItemDTO) => {
    handleClose();
    if (!item.isRead) {
      notificationApi.markRead(item.id).catch(() => {});
      if (setNotificationsCount) {
        setNotificationsCount((prev) => Math.max(0, prev - 1));
      }
    }
    const target = item.actionUrl || '/notifications';
    router.push(target);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Security':
        return <SecurityIcon sx={{ color: '#ef4444', fontSize: 18 }} />;
      case 'Interviews':
        return <EventIcon sx={{ color: '#ec4899', fontSize: 18 }} />;
      case 'Jobs':
      case 'Applications':
        return <WorkOutlineIcon sx={{ color: '#6366f1', fontSize: 18 }} />;
      case 'Networking':
        return <PeopleOutlineIcon sx={{ color: '#10b981', fontSize: 18 }} />;
      case 'Messaging':
        return <ChatBubbleOutlineIcon sx={{ color: '#06b6d4', fontSize: 18 }} />;
      default:
        return <NotificationsNoneIcon sx={{ color: '#3b82f6', fontSize: 18 }} />;
    }
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        onClick={handleClick}
        aria-label="Open notifications menu"
        size="small"
        sx={{ color: 'text.primary' }}
      >
        <Badge badgeContent={notificationsCount > 99 ? '99+' : notificationsCount} color="error">
          <NotificationsNoneIcon fontSize="small" />
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
            width: { xs: 320, sm: 380 },
            maxHeight: 520,
            borderRadius: `${tokens.radius.lg}px`,
            boxShadow: (theme) =>
              theme.palette.mode === 'dark'
                ? '0 12px 36px rgba(0,0,0,0.6)'
                : '0 12px 36px rgba(0,0,0,0.12)',
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          },
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Notifications {notificationsCount > 0 && `(${notificationsCount})`}
            </Typography>
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Mark all read">
                <span>
                  <IconButton
                    size="small"
                    onClick={handleMarkAllRead}
                    disabled={notificationsCount === 0}
                    aria-label="Mark all notifications as read"
                  >
                    <DoneAllIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Settings">
                <IconButton
                  component={Link}
                  href="/settings/notifications"
                  onClick={handleClose}
                  size="small"
                  aria-label="Notification preferences"
                >
                  <SettingsOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>

        {/* List */}
        <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          ) : notifications.length > 0 ? (
            <List disablePadding>
              {notifications.map((n) => (
                <ListItem
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    cursor: 'pointer',
                    bgcolor: n.isRead ? 'transparent' : 'action.hover',
                    '&:hover': { bgcolor: 'action.selected' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      {getCategoryIcon(n.category)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: n.isRead ? 600 : 800,
                          lineHeight: 1.3,
                          fontSize: '0.85rem',
                        }}
                      >
                        {n.title}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: 'block',
                          mt: 0.25,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 240,
                        }}
                      >
                        {n.content}
                      </Typography>
                    }
                  />
                  {!n.isRead && (
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        ml: 1,
                      }}
                    />
                  )}
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No notifications to display
              </Typography>
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <Button
            component={Link}
            href="/notifications"
            onClick={handleClose}
            size="small"
            fullWidth
            sx={{ fontWeight: 700, borderRadius: `${tokens.radius.sm}px` }}
          >
            View all notifications
          </Button>
        </Box>
      </Popover>
    </>
  );
};

export default NotificationBell;
