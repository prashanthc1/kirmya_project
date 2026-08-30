'use client';

import React, { useState, useMemo } from 'react';
import {
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  Badge,
  Box,
  IconButton,
  Tooltip,
  Stack,
  TextField,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PushPinIcon from '@mui/icons-material/PushPin';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import ClearIcon from '@mui/icons-material/Clear';

import { ConversationItem, messagingApi } from '../../features/messaging/services/messagingApi';
import { tokens } from '../../theme/tokens';

interface ConversationListProps {
  conversations: ConversationItem[];
  selectedId?: string;
  onSelect: (conv: ConversationItem) => void;
  onRefresh?: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  onSelect,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return conversations;
    const lower = searchTerm.toLowerCase();
    return conversations.filter(
      (c) =>
        c.participantName?.toLowerCase().includes(lower) ||
        c.lastMessageText?.toLowerCase().includes(lower)
    );
  }, [conversations, searchTerm]);

  const handlePin = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await messagingApi.pinConversation(id);
      if (onRefresh) onRefresh();
    } catch {
      // Handled
    }
  };

  const handleMute = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await messagingApi.muteConversation(id);
      if (onRefresh) onRefresh();
    } catch {
      // Handled
    }
  };

  const handleArchive = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await messagingApi.archiveConversation(id);
      if (onRefresh) onRefresh();
    } catch {
      // Handled
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search Bar */}
      <Box sx={{ p: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
            endAdornment: searchTerm ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')} aria-label="Clear search">
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
            sx: {
              borderRadius: `${tokens.radius.md}px`,
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            },
          }}
          inputProps={{
            'aria-label': 'Search conversations',
          }}
        />
      </Box>

      {/* Conversation List */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
        <List disablePadding>
          {filteredConversations.map((conv) => {
            const isSelected = conv.id === selectedId;
            const hasUnread = (conv.unreadCount || 0) > 0;
            const isOnline = conv.participantStatus === 'online';

            return (
              <ListItemButton
                key={conv.id}
                selected={isSelected}
                onClick={() => onSelect(conv)}
                sx={{
                  py: 1.5,
                  px: 2,
                  borderRadius: `${tokens.radius.md}px`,
                  mb: 0.5,
                  bgcolor: isSelected ? 'action.selected' : 'transparent',
                  transition: 'all 0.15s ease',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <ListItemAvatar sx={{ minWidth: 56 }}>
                  <Badge
                    color="success"
                    variant="dot"
                    invisible={!isOnline}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    overlap="circular"
                  >
                    <Avatar
                      src={conv.participantAvatar}
                      sx={{
                        width: 44,
                        height: 44,
                        bgcolor: 'primary.main',
                        fontWeight: 800,
                      }}
                    >
                      {conv.participantName ? conv.participantName[0].toUpperCase() : 'K'}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>

                <ListItemText
                  primary={
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: hasUnread ? 800 : 600,
                          color: 'text.primary',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 160,
                        }}
                      >
                        {conv.participantName || 'Connection'}
                      </Typography>

                      <Typography
                        variant="caption"
                        color={hasUnread ? 'primary.main' : 'text.secondary'}
                        sx={{ fontWeight: hasUnread ? 700 : 500, fontSize: '0.7rem' }}
                      >
                        {conv.lastMessageTime
                          ? new Date(conv.lastMessageTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </Typography>
                    </Stack>
                  }
                  secondary={
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5 }}>
                      <Typography
                        variant="body2"
                        color={hasUnread ? 'text.primary' : 'text.secondary'}
                        sx={{
                          fontWeight: hasUnread ? 700 : 400,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 160,
                          fontSize: '0.8rem',
                        }}
                      >
                        {conv.lastMessageText || 'No messages yet'}
                      </Typography>

                      <Stack direction="row" spacing={0.5} alignItems="center">
                        {conv.isPinned && <PushPinIcon sx={{ fontSize: 13, color: 'text.secondary' }} />}
                        {conv.isMuted && <VolumeOffIcon sx={{ fontSize: 13, color: 'text.secondary' }} />}
                        {hasUnread && (
                          <Badge
                            badgeContent={conv.unreadCount}
                            color="primary"
                            sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', height: 16, minWidth: 16 } }}
                          />
                        )}
                      </Stack>
                    </Stack>
                  }
                />
              </ListItemButton>
            );
          })}

          {filteredConversations.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                {searchTerm ? 'No matching conversations' : 'No conversations yet'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {searchTerm ? 'Try a different name or message snippet' : 'Connect with professionals to start messaging'}
              </Typography>
            </Box>
          )}
        </List>
      </Box>
    </Box>
  );
};

export default ConversationList;
