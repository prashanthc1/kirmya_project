'use client';

import React from 'react';
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
} from '@mui/material';
import PushPinIcon from '@mui/icons-material/PushPin';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import ArchiveIcon from '@mui/icons-material/Archive';
import { ConversationItem, messagingApi } from '../../features/messaging/services/messagingApi';

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
  const handlePin = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await messagingApi.pinConversation(id);
    if (onRefresh) onRefresh();
  };

  const handleMute = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await messagingApi.muteConversation(id);
    if (onRefresh) onRefresh();
  };

  const handleArchive = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await messagingApi.archiveConversation(id);
    if (onRefresh) onRefresh();
  };

  return (
    <List disablePadding>
      {conversations.map((conv) => {
        const isSelected = conv.id === selectedId;

        return (
          <ListItemButton
            key={conv.id}
            selected={isSelected}
            onClick={() => onSelect(conv)}
            sx={{
              py: 2,
              px: 2.5,
              borderRadius: '16px',
              mb: 1,
              bgcolor: isSelected ? 'action.selected' : 'transparent',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <ListItemAvatar>
              <Badge
                color="success"
                variant="dot"
                invisible={conv.participantStatus !== 'online'}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              >
                <Avatar src={conv.participantAvatar} sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontWeight: 800 }}>
                  {conv.participantName ? conv.participantName[0].toUpperCase() : 'K'}
                </Avatar>
              </Badge>
            </ListItemAvatar>

            <ListItemText
              primary={
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {conv.participantName || 'Connection'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </Typography>
                </Stack>
              }
              secondary={
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    noWrap
                    sx={{ maxWidth: 180, fontWeight: conv.unreadCount ? 700 : 400 }}
                  >
                    {conv.lastMessageText || 'No messages yet'}
                  </Typography>

                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {conv.isPinned && <PushPinIcon fontSize="small" color="primary" sx={{ transform: 'rotate(45deg)', fontSize: 16 }} />}
                    {conv.isMuted && <VolumeOffIcon fontSize="small" color="action" sx={{ fontSize: 16 }} />}
                    {conv.unreadCount ? (
                      <Badge badgeContent={conv.unreadCount} color="error" size="small" />
                    ) : null}
                  </Stack>
                </Stack>
              }
            />

            <Box className="actions" sx={{ opacity: 0, transition: 'opacity 0.2s', ml: 1, '&:hover': { opacity: 1 } }}>
              <Tooltip title="Pin">
                <IconButton size="small" onClick={(e) => handlePin(e, conv.id)}>
                  <PushPinIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Archive">
                <IconButton size="small" onClick={(e) => handleArchive(e, conv.id)}>
                  <ArchiveIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </ListItemButton>
        );
      })}
    </List>
  );
};

export default ConversationList;
