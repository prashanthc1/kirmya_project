'use client';

import React, { useState } from 'react';
import {
  Box,
  Stack,
  Avatar,
  Typography,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import VolumeOffOutlinedIcon from '@mui/icons-material/VolumeOffOutlined';
import VolumeUpOutlinedIcon from '@mui/icons-material/VolumeUpOutlined';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import UnarchiveOutlinedIcon from '@mui/icons-material/UnarchiveOutlined';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import Link from 'next/link';

import { ConversationItem } from '../../features/messaging/types';
import { tokens } from '../../theme/tokens';

interface ChatHeaderProps {
  conversation: ConversationItem;
  isTyping?: boolean;
  onBack?: () => void;
  onMute?: () => void;
  onArchive?: () => void;
  onPin?: () => void;
  onReport?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  isTyping = false,
  onBack,
  onMute,
  onArchive,
  onPin,
  onReport,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const isOnline = conversation.participantStatus === 'online';
  const profileUsername = conversation.participantUsername || conversation.participantId || conversation.userId2;
  const profileHref = `/profile/${encodeURIComponent(profileUsername)}`;

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box
      sx={{
        px: { xs: 1.5, sm: 2.5 },
        py: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 1,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
        {onBack && (
          <IconButton
            size="small"
            onClick={onBack}
            sx={{ display: { xs: 'flex', md: 'none' }, mr: 0.5 }}
            aria-label="Back to conversations list"
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        )}

        <Badge
          color="success"
          variant="dot"
          invisible={!isOnline}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          overlap="circular"
        >
          <Avatar
            component={Link}
            href={profileHref}
            src={conversation.participantAvatar}
            sx={{
              width: 44,
              height: 44,
              bgcolor: 'primary.main',
              fontWeight: 800,
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            {conversation.participantName ? conversation.participantName[0].toUpperCase() : 'K'}
          </Avatar>
        </Badge>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            component={Link}
            href={profileHref}
            variant="subtitle1"
            sx={{
              fontWeight: 800,
              color: 'text.primary',
              textDecoration: 'none',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'block',
              '&:hover': { color: 'primary.main' },
            }}
          >
            {conversation.participantName || 'Conversation'}
          </Typography>

          <Typography
            variant="caption"
            color={isTyping ? 'primary.main' : isOnline ? 'success.main' : 'text.secondary'}
            sx={{
              fontWeight: isTyping || isOnline ? 700 : 500,
              display: 'block',
              lineHeight: 1.2,
            }}
          >
            {isTyping ? 'Typing...' : isOnline ? 'Online' : conversation.participantHeadline || 'Offline'}
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" spacing={0.5} alignItems="center">
        <Tooltip title="View Profile">
          <IconButton
            component={Link}
            href={profileHref}
            size="small"
            aria-label="View public profile"
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            <PersonOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <IconButton size="small" onClick={handleMenuOpen} aria-label="Conversation options">
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Stack>

      {/* Options Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: `${tokens.radius.md}px`,
            minWidth: 190,
            boxShadow: (theme) =>
              theme.palette.mode === 'dark'
                ? '0 8px 24px rgba(0,0,0,0.5)'
                : '0 8px 24px rgba(0,0,0,0.1)',
          },
        }}
      >
        <MenuItem component={Link} href={profileHref} onClick={handleMenuClose}>
          <ListItemIcon>
            <PersonOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="View Public Profile" />
        </MenuItem>

        {onPin && (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              onPin();
            }}
          >
            <ListItemIcon>
              <PushPinOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={conversation.isPinned ? 'Unpin Conversation' : 'Pin to Top'} />
          </MenuItem>
        )}

        {onMute && (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              onMute();
            }}
          >
            <ListItemIcon>
              {conversation.isMuted ? <VolumeUpOutlinedIcon fontSize="small" /> : <VolumeOffOutlinedIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText primary={conversation.isMuted ? 'Unmute Notifications' : 'Mute Notifications'} />
          </MenuItem>
        )}

        {onArchive && (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              onArchive();
            }}
          >
            <ListItemIcon>
              {conversation.isArchived ? <UnarchiveOutlinedIcon fontSize="small" /> : <ArchiveOutlinedIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText primary={conversation.isArchived ? 'Unarchive' : 'Archive Conversation'} />
          </MenuItem>
        )}

        {onReport && (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              onReport();
            }}
          >
            <ListItemIcon>
              <FlagOutlinedIcon fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText primary="Report Conversation" />
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default ChatHeader;
