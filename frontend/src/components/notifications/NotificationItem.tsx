'use client';

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Avatar,
  Chip,
  IconButton,
  Button,
  useTheme,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import EventIcon from '@mui/icons-material/Event';
import WorkIcon from '@mui/icons-material/Work';
import SecurityIcon from '@mui/icons-material/Security';
import PeopleIcon from '@mui/icons-material/People';
import ForumIcon from '@mui/icons-material/Forum';
import SchoolIcon from '@mui/icons-material/School';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PersonIcon from '@mui/icons-material/Person';
import { useRouter } from 'next/navigation';
import { NotificationItemDTO } from '../../features/notifications/types';

interface NotificationItemProps {
  item: NotificationItemDTO;
  onMarkRead?: (id: string) => void;
  onMarkUnread?: (id: string) => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  item,
  onMarkRead,
  onMarkUnread,
  onDelete,
  onArchive,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const router = useRouter();

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Security':
        return '#ef4444';
      case 'Interviews':
        return '#ec4899';
      case 'Jobs':
        return '#6366f1';
      case 'Applications':
        return '#f59e0b';
      case 'Networking':
      case 'Communities':
        return '#10b981';
      case 'Career':
      case 'Resume':
      case 'Cover Letters':
        return '#8b5cf6';
      case 'System':
      case 'Support':
        return '#06b6d4';
      default:
        return '#3b82f6';
    }
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'Security':
        return <SecurityIcon sx={{ color: '#ef4444' }} />;
      case 'Interviews':
        return <EventIcon sx={{ color: '#ec4899' }} />;
      case 'Jobs':
        return <WorkIcon sx={{ color: '#6366f1' }} />;
      case 'Networking':
        return <PeopleIcon sx={{ color: '#10b981' }} />;
      case 'Career':
        return <SchoolIcon sx={{ color: '#8b5cf6' }} />;
      case 'Support':
      case 'System':
        return <ForumIcon sx={{ color: '#06b6d4' }} />;
      default:
        return <NotificationsIcon sx={{ color: '#3b82f6' }} />;
    }
  };

  const getPriorityChip = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return <Chip label="CRITICAL" size="small" color="error" sx={{ fontWeight: 900, height: 18, fontSize: '0.6rem' }} />;
      case 'High':
        return <Chip label="HIGH" size="small" color="warning" sx={{ fontWeight: 800, height: 18, fontSize: '0.6rem' }} />;
      case 'Normal':
        return <Chip label="NORMAL" size="small" color="primary" sx={{ fontWeight: 700, height: 18, fontSize: '0.6rem' }} />;
      default:
        return null;
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: '16px',
        bgcolor: item.isRead
          ? isDark
            ? 'rgba(30, 41, 59, 0.5)'
            : 'rgba(255, 255, 255, 0.8)'
          : isDark
          ? 'rgba(99, 102, 241, 0.12)'
          : 'rgba(99, 102, 241, 0.06)',
        backdropFilter: 'blur(20px)',
        border: '1px solid',
        borderColor: item.isRead ? 'rgba(255, 255, 255, 0.08)' : 'rgba(99, 102, 241, 0.3)',
        borderLeft: `4px solid ${getCategoryColor(item.category)}`,
        transition: 'all 0.2s ease',
      }}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Avatar
          sx={{
            bgcolor: `${getCategoryColor(item.category)}15`,
            width: 44,
            height: 44,
            borderRadius: '12px',
          }}
        >
          {getIcon(item.category)}
        </Avatar>

        <Box sx={{ flexGrow: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="subtitle1" sx={{ fontWeight: item.isRead ? 700 : 900 }}>
                {item.title}
              </Typography>
              <Chip
                label={item.category}
                size="small"
                sx={{
                  bgcolor: `${getCategoryColor(item.category)}15`,
                  color: getCategoryColor(item.category),
                  fontWeight: 800,
                  fontSize: '0.65rem',
                  height: 20,
                }}
              />
              {getPriorityChip(item.priority)}
            </Stack>

            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {new Date(item.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
            </Typography>
          </Stack>

          {item.actorName && (
            <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mb: 1 }}>
              <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem', bgcolor: 'primary.main' }}>
                {item.actorName.charAt(0)}
              </Avatar>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {item.actorName}
              </Typography>
            </Stack>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.5 }}>
            {item.content}
          </Typography>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            {item.actionUrl ? (
              <Button
                variant="outlined"
                size="small"
                endIcon={<OpenInNewIcon fontSize="small" />}
                onClick={() => router.push(item.actionUrl!)}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
              >
                View Target
              </Button>
            ) : (
              <Box />
            )}

            <Stack direction="row" spacing={0.5}>
              {item.isRead ? (
                <IconButton size="small" title="Mark as unread" onClick={() => onMarkUnread?.(item.id)}>
                  <MarkEmailReadOutlinedIcon fontSize="small" />
                </IconButton>
              ) : (
                <IconButton size="small" title="Mark as read" onClick={() => onMarkRead?.(item.id)}>
                  <MarkEmailReadOutlinedIcon fontSize="small" color="primary" />
                </IconButton>
              )}

              <IconButton size="small" title="Archive" onClick={() => onArchive?.(item.id)}>
                <ArchiveOutlinedIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" color="error" title="Delete" onClick={() => onDelete?.(item.id)}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};

export default NotificationItem;
