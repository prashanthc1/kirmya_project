'use client';

import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Tabs,
  Tab,
  Box,
  Card,
  Stack,
  Button,
  Avatar,
  Divider,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import UndoIcon from '@mui/icons-material/Undo';
import { ConnectionRequestItem, networkingApi } from '@/features/networking/services/networkingApi';

export default function PendingRequestsPage() {
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [incoming, setIncoming] = useState<ConnectionRequestItem[]>([]);
  const [sent, setSent] = useState<ConnectionRequestItem[]>([]);

  useEffect(() => {
    networkingApi.listIncomingRequests().then((data) => setIncoming(data));
    networkingApi.listSentRequests().then((data) => setSent(data));
  }, []);

  const handleAccept = async (id: string) => {
    await networkingApi.acceptRequest(id);
    setIncoming(incoming.filter((r) => r.id !== id));
  };

  const handleDecline = async (id: string) => {
    await networkingApi.declineRequest(id);
    setIncoming(incoming.filter((r) => r.id !== id));
  };

  const handleWithdraw = async (id: string) => {
    await networkingApi.withdrawRequest(id);
    setSent(sent.filter((r) => r.id !== id));
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
        Pending Network Invitations
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, val) => setTab(val)}>
          <Tab label={`Received (${incoming.length})`} value="received" sx={{ fontWeight: 800 }} />
          <Tab label={`Sent (${sent.length})`} value="sent" sx={{ fontWeight: 800 }} />
        </Tabs>
      </Box>

      {tab === 'received' ? (
        <Stack spacing={2}>
          {incoming.map((req) => (
            <Card key={req.id} sx={{ p: 2.5, borderRadius: '20px', bgcolor: 'background.paper' }}>
              <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar src={req.senderAvatarUrl} sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontWeight: 800 }}>
                    {req.senderName ? req.senderName[0].toUpperCase() : 'K'}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {req.senderName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {req.senderHeadline}
                    </Typography>
                    {req.note && (
                      <Typography variant="body2" color="primary" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                        &quot;{req.note}&quot;
                      </Typography>
                    )}
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1}>
                  <Button variant="contained" color="success" startIcon={<CheckIcon />} onClick={() => handleAccept(req.id)} sx={{ borderRadius: '12px', fontWeight: 800 }}>
                    Accept
                  </Button>
                  <Button variant="outlined" color="error" startIcon={<CloseIcon />} onClick={() => handleDecline(req.id)} sx={{ borderRadius: '12px', fontWeight: 800 }}>
                    Ignore
                  </Button>
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      ) : (
        <Stack spacing={2}>
          {sent.map((req) => (
            <Card key={req.id} sx={{ p: 2.5, borderRadius: '20px', bgcolor: 'background.paper' }}>
              <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar src={req.senderAvatarUrl} sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontWeight: 800 }}>
                    {req.receiverName ? req.receiverName[0].toUpperCase() : 'K'}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {req.receiverName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {req.receiverHeadline}
                    </Typography>
                  </Box>
                </Stack>

                <Button variant="outlined" startIcon={<UndoIcon />} onClick={() => handleWithdraw(req.id)} sx={{ borderRadius: '12px', fontWeight: 800 }}>
                  Withdraw Request
                </Button>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  );
}
