'use client';

import React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import MessageIcon from '@mui/icons-material/Message';
import Link from 'next/link';
import GlassCard from '../landing/GlassCard';
import { routes } from '../../shared/routes';

/**
 * Recruiter messaging.
 *
 * This was a chat window with a conversation in it: two messages between
 * "Rashid" and "Sarah Chen" about a Senior Microservices role, shown to every
 * recruiter who opened the page, on a platform where neither exists. The send
 * box appended to that array, so a recruiter could write to a candidate who
 * was not there and watch the message appear.
 *
 * Messaging is a real module - `/messages`, backed by
 * `GET /api/v1/messages/conversations` and the endpoints beside it, with
 * threads, requests and search. Rather than rebuild a worse copy of it here
 * against no data, this points at the one that works. A recruiter's
 * conversations are conversations; they do not need a separate inbox.
 */
export const MessageCenter: React.FC = () => (
  <GlassCard sx={{ p: { xs: 3, md: 4 }, mb: 4 }}>
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
      <MessageIcon sx={{ color: '#06b6d4', fontSize: 28 }} aria-hidden />
      <Typography variant="h5" component="h2" sx={{ fontWeight: 900 }}>
        Candidate messages
      </Typography>
    </Stack>

    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 560 }}>
      Your conversations with candidates live in your inbox, alongside everything else. Open it to
      read a thread, reply, or start a new conversation.
    </Typography>

    <Box>
      <Button
        component={Link}
        href={routes.messages.home()}
        variant="contained"
        sx={{ textTransform: 'none', fontWeight: 700 }}
      >
        Open your inbox
      </Button>
    </Box>
  </GlassCard>
);

export default MessageCenter;
