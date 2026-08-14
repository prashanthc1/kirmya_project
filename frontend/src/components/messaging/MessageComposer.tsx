'use client';

import React, { useState } from 'react';
import { Box, TextField, IconButton, Stack, Paper } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';

interface MessageComposerProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({ onSend, disabled }) => {
  const [content, setContent] = useState('');

  const handleSend = () => {
    if (!content.trim() || disabled) return;
    onSend(content.trim());
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <IconButton size="small" disabled={disabled}>
          <AttachFileIcon />
        </IconButton>
        <IconButton size="small" disabled={disabled}>
          <SentimentSatisfiedAltIcon />
        </IconButton>

        <TextField
          fullWidth
          multiline
          maxRows={3}
          placeholder="Type your message securely..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          variant="outlined"
          size="small"
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '20px' } }}
        />

        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={!content.trim() || disabled}
          sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, '&.Mui-disabled': { bgcolor: 'action.disabledBackground' } }}
        >
          <SendIcon />
        </IconButton>
      </Stack>
    </Paper>
  );
};

export default MessageComposer;
