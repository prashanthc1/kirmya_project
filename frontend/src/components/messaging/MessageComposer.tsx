'use client';

import React, { useState, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Stack,
  Paper,
  Chip,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';

import { MessageAttachment } from '../../features/messaging/types';
import { tokens } from '../../theme/tokens';

interface MessageComposerProps {
  onSend: (content: string, attachments?: MessageAttachment[]) => Promise<void> | void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSend,
  onTyping,
  disabled = false,
  placeholder = 'Write a message... (Press Enter to send, Shift+Enter for new line)',
}) => {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);

    // Typing indicator throttling
    if (onTyping) {
      onTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    }
  };

  const handleSend = async () => {
    const trimmed = content.trim();
    if ((!trimmed && attachments.length === 0) || disabled || sending) return;

    if (onTyping) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      onTyping(false);
    }

    setSending(true);
    try {
      await onSend(trimmed, attachments.length > 0 ? attachments : undefined);
      setContent('');
      setAttachments([]);
    } catch {
      // Handled in parent
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    // In production, file is uploaded to object storage / signed URL
    const newAttachment: MessageAttachment = {
      id: `att-${Date.now()}`,
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      fileSize: file.size,
      createdAt: new Date().toISOString(),
    };

    setAttachments((prev) => [...prev, newAttachment]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        borderRadius: 0,
      }}
    >
      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5} sx={{ mb: 1 }}>
          {attachments.map((att) => (
            <Chip
              key={att.id}
              icon={<InsertDriveFileOutlinedIcon sx={{ fontSize: 16 }} />}
              label={`${att.fileName} (${Math.round(att.fileSize / 1024)} KB)`}
              onDelete={() => handleRemoveAttachment(att.id)}
              deleteIcon={<CloseIcon sx={{ fontSize: 14 }} />}
              size="small"
              sx={{ borderRadius: `${tokens.radius.sm}px` }}
            />
          ))}
        </Stack>
      )}

      <Stack direction="row" spacing={1} alignItems="flex-end">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={handleFileSelect}
          aria-label="Upload file attachment"
        />

        <Tooltip title="Attach File">
          <span>
            <IconButton
              size="small"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || sending}
              aria-label="Attach file"
              sx={{ mb: 0.5 }}
            >
              <AttachFileIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        {/* Message Input Box */}
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder={placeholder}
          value={content}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || sending}
          variant="outlined"
          size="small"
          inputProps={{
            maxLength: 2000,
            'aria-label': 'Message input text',
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: `${tokens.radius.md}px`,
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            },
          }}
        />

        {/* Send Button */}
        <Tooltip title="Send Message (Enter)">
          <span>
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={(!content.trim() && attachments.length === 0) || disabled || sending}
              aria-label="Send message"
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                mb: 0.5,
                '&:hover': { bgcolor: 'primary.dark' },
                '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
              }}
            >
              {sending ? <CircularProgress size={18} color="inherit" /> : <SendIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Paper>
  );
};

export default MessageComposer;
