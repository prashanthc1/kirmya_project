'use client';

import React, { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Tooltip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

import { MessageItem, MessageAttachment } from '../../features/messaging/types';
import { tokens } from '../../theme/tokens';

interface MessageBubbleProps {
  message: MessageItem;
  isOutgoing: boolean;
  showAvatar?: boolean;
  onReport?: (message: MessageItem) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOutgoing,
  onReport,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setAnchorEl(null);
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReport = () => {
    setAnchorEl(null);
    if (onReport) onReport(message);
  };

  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isOutgoing ? 'flex-end' : 'flex-start',
        mb: 1.5,
        px: 1,
        position: 'relative',
        '&:hover .message-action-trigger': {
          opacity: 1,
        },
      }}
    >
      <Stack
        direction={isOutgoing ? 'row-reverse' : 'row'}
        spacing={0.5}
        alignItems="flex-end"
        sx={{ maxWidth: { xs: '88%', sm: '75%', md: '65%' } }}
      >
        {/* Message Content Card */}
        <Box
          sx={{
            p: 1.75,
            borderRadius: `${tokens.radius.md}px`,
            borderBottomRightRadius: isOutgoing ? 4 : `${tokens.radius.md}px`,
            borderBottomLeftRadius: isOutgoing ? `${tokens.radius.md}px` : 4,
            bgcolor: isOutgoing ? 'primary.main' : 'background.paper',
            color: isOutgoing ? 'primary.contrastText' : 'text.primary',
            border: '1px solid',
            borderColor: isOutgoing ? 'primary.dark' : 'divider',
            boxShadow: (theme) =>
              theme.palette.mode === 'dark'
                ? '0 2px 8px rgba(0,0,0,0.3)'
                : '0 2px 8px rgba(0,0,0,0.04)',
            wordBreak: 'break-word',
          }}
        >
          {/* Text Content */}
          {message.content && (
            <Typography
              variant="body2"
              sx={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5,
                fontSize: '0.925rem',
              }}
            >
              {message.content}
            </Typography>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <Stack spacing={1} sx={{ mt: message.content ? 1.25 : 0 }}>
              {message.attachments.map((att: MessageAttachment) => (
                <Chip
                  key={att.id}
                  icon={<InsertDriveFileOutlinedIcon sx={{ fontSize: 16 }} />}
                  label={`${att.fileName} (${Math.round((att.fileSize || 0) / 1024)} KB)`}
                  component="a"
                  href={att.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  clickable
                  size="small"
                  sx={{
                    borderRadius: `${tokens.radius.sm}px`,
                    maxWidth: '100%',
                    bgcolor: isOutgoing ? 'rgba(255,255,255,0.2)' : 'action.hover',
                    color: 'inherit',
                  }}
                />
              ))}
            </Stack>
          )}

          {/* Metadata Footer: Timestamp & Read Status */}
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            justifyContent="flex-end"
            sx={{
              mt: 0.5,
              opacity: isOutgoing ? 0.85 : 0.6,
              fontSize: '0.7rem',
            }}
          >
            <span>{formattedTime}</span>
            {isOutgoing && (
              <Tooltip title={message.isRead ? 'Read' : 'Sent'}>
                {message.isRead ? (
                  <DoneAllIcon sx={{ fontSize: 13, color: 'inherit' }} />
                ) : (
                  <DoneIcon sx={{ fontSize: 13, color: 'inherit' }} />
                )}
              </Tooltip>
            )}
          </Stack>
        </Box>

        {/* Hover Action Trigger */}
        <IconButton
          className="message-action-trigger"
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            opacity: 0,
            transition: 'opacity 0.15s ease',
            p: 0.5,
          }}
          aria-label="Message options"
        >
          <MoreHorizIcon fontSize="small" />
        </IconButton>
      </Stack>

      {/* Message Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            borderRadius: `${tokens.radius.md}px`,
            minWidth: 140,
          },
        }}
      >
        <MenuItem onClick={handleCopy}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={copied ? 'Copied!' : 'Copy Text'} />
        </MenuItem>

        {onReport && !isOutgoing && (
          <MenuItem onClick={handleReport}>
            <ListItemIcon>
              <FlagOutlinedIcon fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText primary="Report Message" />
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default MessageBubble;
