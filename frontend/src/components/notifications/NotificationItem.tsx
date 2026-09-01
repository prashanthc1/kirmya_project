'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  Avatar,
  IconButton,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Tooltip,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import EventIcon from '@mui/icons-material/Event';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import SecurityIcon from '@mui/icons-material/Security';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import MarkEmailUnreadOutlinedIcon from '@mui/icons-material/MarkEmailUnreadOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { NotificationItemDTO } from '../../features/notifications/types';
import { tokens } from '../../theme/tokens';

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
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Security':
        return <SecurityIcon sx={{ color: '#ef4444', fontSize: 20 }} />;
      case 'Interviews':
        return <EventIcon sx={{ color: '#ec4899', fontSize: 20 }} />;
      case 'Jobs':
        return <WorkOutlineIcon sx={{ color: '#6366f1', fontSize: 20 }} />;
      case 'Applications':
        return <WorkOutlineIcon sx={{ color: '#f59e0b', fontSize: 20 }} />;
      case 'Networking':
        return <PeopleOutlineIcon sx={{ color: '#10b981', fontSize: 20 }} />;
      case 'Messaging':
        return <ChatBubbleOutlineIcon sx={{ color: '#06b6d4', fontSize: 20 }} />;
      case 'Career':
      case 'Resume':
      case 'Cover Letters':
        return <SchoolOutlinedIcon sx={{ color: '#8b5cf6', fontSize: 20 }} />;
      default:
        return <NotificationsIcon sx={{ color: '#3b82f6', fontSize: 20 }} />;
    }
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHour < 24) return `${diffHour}h ago`;
      if (diffDay === 1) return 'Yesterday';
      if (diffDay < 7) return `${diffDay}d ago`;
      return new Date(isoString).toLocaleDateString();
    } catch {
      return '';
    }
  };

  // Determine canonical target URL
  const resolveTargetUrl = (): string => {
    if (item.actionUrl) return item.actionUrl;
    switch (item.category) {
      case 'Networking':
        return '/network/requests';
      case 'Messaging':
        return '/messages';
      case 'Jobs':
        return '/jobs';
      case 'Applications':
        return '/dashboard/applications';
      case 'Interviews':
        return '/dashboard/interviews';
      case 'Security':
        return '/settings/security';
      default:
        return '/notifications';
    }
  };

  const targetUrl = resolveTargetUrl();

  const handleRowClick = () => {
    if (!item.isRead && onMarkRead) {
      onMarkRead(item.id);
    }
    if (targetUrl) {
      router.push(targetUrl);
    }
  };

  return (
    <Box
      onClick={handleRowClick}
      sx={{
        p: 2,
        borderRadius: `${tokens.radius.md}px`,
        bgcolor: item.isRead ? 'background.paper' : (theme) => (theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.04)'),
        border: '1px solid',
        borderColor: item.isRead ? 'divider' : 'primary.main',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        cursor: 'pointer',
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
        position: 'relative',
        '&:hover': {
          bgcolor: 'action.hover',
          borderColor: 'primary.main',
        },
      }}
    >
      {/* Category Icon / Actor Avatar */}
      <Avatar
        sx={{
          width: 44,
          height: 44,
          bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
          border: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        {getCategoryIcon(item.category)}
      </Avatar>

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: item.isRead ? 600 : 800,
                  color: 'text.primary',
                  lineHeight: 1.3,
                }}
              >
                {item.title}
              </Typography>

              {item.priority === 'Critical' && (
                <Chip label="Critical" size="small" color="error" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800 }} />
              )}
            </Stack>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.5,
                lineHeight: 1.4,
                wordBreak: 'break-word',
                fontSize: '0.875rem',
              }}
            >
              {item.content}
            </Typography>

            {item.actorName && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 500 }}>
                From: <strong>{item.actorName}</strong>
              </Typography>
            )}
          </Box>

          {/* Time & Options Menu */}
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: item.isRead ? 500 : 700, fontSize: '0.75rem' }}>
              {getRelativeTime(item.createdAt)}
            </Typography>

            {!item.isRead && (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  ml: 0.5,
                }}
              />
            )}

            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setAnchorEl(e.currentTarget);
              }}
              aria-label="Notification options"
              sx={{ p: 0.5 }}
            >
              <MoreHorizIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={(e: any) => {
          if (e?.stopPropagation) e.stopPropagation();
          setAnchorEl(null);
        }}
        PaperProps={{
          sx: {
            borderRadius: `${tokens.radius.md}px`,
            minWidth: 160,
          },
        }}
      >
        {item.isRead ? (
          onMarkUnread && (
            <MenuItem
              onClick={(e) => {
                e.stopPropagation();
                setAnchorEl(null);
                onMarkUnread(item.id);
              }}
            >
              <ListItemIcon>
                <MarkEmailUnreadOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Mark as unread" />
            </MenuItem>
          )
        ) : (
          onMarkRead && (
            <MenuItem
              onClick={(e) => {
                e.stopPropagation();
                setAnchorEl(null);
                onMarkRead(item.id);
              }}
            >
              <ListItemIcon>
                <MarkEmailReadOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Mark as read" />
            </MenuItem>
          )
        )}

        {onArchive && (
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              setAnchorEl(null);
              onArchive(item.id);
            }}
          >
            <ListItemIcon>
              <ArchiveOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Archive" />
          </MenuItem>
        )}

        {onDelete && (
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              setAnchorEl(null);
              onDelete(item.id);
            }}
          >
            <ListItemIcon>
              <DeleteOutlineIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText primary="Delete" sx={{ color: 'error.main' }} />
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default NotificationItem;
