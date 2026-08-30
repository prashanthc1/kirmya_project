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
  Skeleton,
  IconButton,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import AuthenticatedLayout from '../../../components/shell/AuthenticatedLayout';
import { MessageRequestItem, messagingApi } from '../../../features/messaging/services/messagingApi';
import { tokens } from '../../../theme/tokens';

export const dynamic = 'force-dynamic';

export default function MessageRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<MessageRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    messagingApi
      .listRequests()
      .then((data) => {
        if (isMounted) {
          setRequests(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAccept = async (id: string) => {
    setActionLoading(id);
    try {
      const conv = await messagingApi.acceptRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      router.push(`/messages?conv=${conv.id}`);
    } catch {
      // Handled
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (id: string) => {
    setActionLoading(id);
    try {
      await messagingApi.declineRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // Handled
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AuthenticatedLayout>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <IconButton component={Link} href="/messages" size="small" aria-label="Back to messages">
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
            Message Requests
          </Typography>
        </Stack>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, ml: { xs: 0, sm: 5 } }}>
          Direct messages sent by professionals outside your 1st-degree connection network.
        </Typography>

        {loading ? (
          <Stack spacing={2}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={110} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
            ))}
          </Stack>
        ) : requests.length > 0 ? (
          <Stack spacing={2}>
            {requests.map((req) => (
              <Card
                key={req.id}
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: `${tokens.radius.lg}px`,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                  },
                }}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  gap={2}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Avatar
                      component={Link}
                      href={`/profile/${encodeURIComponent(req.senderUsername || req.senderId)}`}
                      src={req.senderAvatar}
                      sx={{
                        width: 52,
                        height: 52,
                        bgcolor: 'primary.main',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      {req.senderName ? req.senderName[0].toUpperCase() : 'K'}
                    </Avatar>

                    <Box>
                      <Typography
                        component={Link}
                        href={`/profile/${encodeURIComponent(req.senderUsername || req.senderId)}`}
                        variant="subtitle1"
                        sx={{
                          fontWeight: 800,
                          color: 'text.primary',
                          textDecoration: 'none',
                          '&:hover': { color: 'primary.main' },
                        }}
                      >
                        {req.senderName || 'Kirmya Member'}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                        {req.senderHeadline || 'Professional outreach'}
                      </Typography>

                      <Box
                        sx={{
                          mt: 1,
                          p: 1.25,
                          borderRadius: `${tokens.radius.sm}px`,
                          bgcolor: 'action.hover',
                        }}
                      >
                        <Typography variant="body2" sx={{ fontStyle: 'italic', fontSize: '0.875rem' }}>
                          &ldquo;{req.initialMessage}&rdquo;
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' }, flexShrink: 0 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<CheckIcon />}
                      onClick={() => handleAccept(req.id)}
                      disabled={actionLoading === req.id}
                      fullWidth
                      sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700 }}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<CloseIcon />}
                      onClick={() => handleDecline(req.id)}
                      disabled={actionLoading === req.id}
                      fullWidth
                      sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 600 }}
                    >
                      Decline
                    </Button>
                  </Stack>
                </Stack>
              </Card>
            ))}
          </Stack>
        ) : (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              borderRadius: `${tokens.radius.lg}px`,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <MailOutlineIcon sx={{ fontSize: 44, color: 'text.secondary', mb: 1, opacity: 0.6 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
              No pending message requests
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              When someone outside your connection network reaches out, their invitation will appear here.
            </Typography>
            <Button
              component={Link}
              href="/messages"
              variant="outlined"
              sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700 }}
            >
              Return to Messages
            </Button>
          </Box>
        )}
      </Container>
    </AuthenticatedLayout>
  );
}
