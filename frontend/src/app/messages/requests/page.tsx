'use client';

import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  Stack,
  Button,
  Avatar,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { MessageRequestItem, messagingApi } from '@/features/messaging/services/messagingApi';

export default function MessageRequestsPage() {
  const [requests, setRequests] = useState<MessageRequestItem[]>([]);

  useEffect(() => {
    messagingApi.listRequests().then((data) => setRequests(data)).catch(() => {});
  }, []);

  const handleAccept = async (id: string) => {
    try {
      await messagingApi.acceptRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      alert('Request accepted. Conversation opened.');
    } catch (e) {
      alert('Failed to accept request.');
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await messagingApi.declineRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      alert('Failed to decline request.');
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
        Message Invitations & Requests
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Direct messages sent by professionals outside your 1st-degree connection graph.
      </Typography>

      <Stack spacing={2}>
        {requests.map((req) => (
          <Card key={req.id} sx={{ p: 2.5, borderRadius: '20px', bgcolor: 'background.paper' }}>
            <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar src={req.senderAvatar} sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontWeight: 800 }}>
                  {req.senderName ? req.senderName[0].toUpperCase() : 'K'}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {req.senderName || 'Sender'}
                  </Typography>
                  <Typography variant="body2" color="primary" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                    &quot;{req.initialMessage}&quot;
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1}>
                <Button variant="contained" color="success" startIcon={<CheckIcon />} onClick={() => handleAccept(req.id)} sx={{ borderRadius: '12px', fontWeight: 800 }}>
                  Accept
                </Button>
                <Button variant="outlined" color="error" startIcon={<CloseIcon />} onClick={() => handleDecline(req.id)} sx={{ borderRadius: '12px', fontWeight: 800 }}>
                  Decline
                </Button>
              </Stack>
            </Stack>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}
