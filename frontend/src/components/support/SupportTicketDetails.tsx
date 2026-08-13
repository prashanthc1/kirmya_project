'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Stack,
  Chip,
  Box,
  TextField,
  Button,
  Rating,
  Alert,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import StarIcon from '@mui/icons-material/Star';
import { supportApi } from '../../features/support/services/supportApi';
import { TicketMessage } from '../../features/support/types';

export const SupportTicketDetails: React.FC<{ ticketId: string }> = ({ ticketId }) => {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [csatRating, setCsatRating] = useState<number | null>(null);
  const [csatSubmitted, setCsatSubmitted] = useState(false);

  useEffect(() => {
    supportApi.getTicketMessages(ticketId).then(setMessages);
  }, [ticketId]);

  const handleSendReply = async () => {
    if (!replyText) return;
    const newMsg = await supportApi.addMessage(ticketId, replyText);
    setMessages([...messages, newMsg]);
    setReplyText('');
  };

  const handleCsat = async (val: number | null) => {
    if (!val) return;
    setCsatRating(val);
    await supportApi.recordCSAT(ticketId, val);
    setCsatSubmitted(true);
  };

  return (
    <Card sx={{ borderRadius: '24px', p: { xs: 3, md: 4 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Support Conversation Thread
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Reference ID: KIR-2026-000101
          </Typography>
        </Box>
        <Chip label="OPEN" color="info" sx={{ fontWeight: 800 }} />
      </Stack>

      <Stack spacing={2} sx={{ mb: 4 }}>
        {messages.map((m) => (
          <Box
            key={m.id}
            sx={{
              p: 2.5,
              borderRadius: '16px',
              bgcolor: m.sender_type === 'user' ? 'primary.50' : 'action.hover',
              alignSelf: m.sender_type === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 0.5, display: 'block' }}>
              {m.sender_type.toUpperCase()} • {new Date(m.created_at).toLocaleTimeString()}
            </Typography>
            <Typography variant="body1">{m.message_text}</Typography>
          </Box>
        ))}
      </Stack>

      {/* Reply Input */}
      <Stack spacing={2} sx={{ mb: 4 }}>
        <TextField
          multiline
          rows={3}
          placeholder="Write your response to the support team..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          fullWidth
        />
        <Button
          variant="contained"
          onClick={handleSendReply}
          endIcon={<SendIcon />}
          sx={{ borderRadius: '12px', fontWeight: 800, alignSelf: 'flex-end', px: 3 }}
        >
          Send Reply
        </Button>
      </Stack>

      {/* CSAT Feedback Section */}
      <Card sx={{ p: 3, borderRadius: '16px', bgcolor: 'action.hover', textAlign: 'center' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
          How would you rate your support experience?
        </Typography>
        {csatSubmitted ? (
          <Alert severity="success" sx={{ borderRadius: '12px' }}>
            Thank you for rating our support team!
          </Alert>
        ) : (
          <Rating
            value={csatRating}
            onChange={(_, val) => handleCsat(val)}
            emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
          />
        )}
      </Card>
    </Card>
  );
};

export default SupportTicketDetails;
