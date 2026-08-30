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
  Skeleton,
  Chip,
  Badge,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import UndoIcon from '@mui/icons-material/Undo';
import NoteAltOutlinedIcon from '@mui/icons-material/NoteAltOutlined';
import Link from 'next/link';

import AuthenticatedLayout from '../../../components/shell/AuthenticatedLayout';
import { ConnectionRequestItem, networkingApi } from '../../../features/networking/services/networkingApi';
import { tokens } from '../../../theme/tokens';

export const dynamic = 'force-dynamic';

export default function PendingRequestsPage() {
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [incoming, setIncoming] = useState<ConnectionRequestItem[]>([]);
  const [sent, setSent] = useState<ConnectionRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      networkingApi.listIncomingRequests(),
      networkingApi.listSentRequests(),
    ])
      .then(([i, s]) => {
        if (isMounted) {
          setIncoming(i);
          setSent(s);
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
      await networkingApi.acceptRequest(id);
      setIncoming((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // Handled
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (id: string) => {
    setActionLoading(id);
    try {
      await networkingApi.declineRequest(id);
      setIncoming((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // Handled
    } finally {
      setActionLoading(null);
    }
  };

  const handleWithdraw = async (id: string) => {
    setActionLoading(id);
    try {
      await networkingApi.withdrawRequest(id);
      setSent((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // Handled
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AuthenticatedLayout>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 0.5 }}>
            Connection Invitations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review incoming connection requests and manage pending outgoing invitations.
          </Typography>
        </Box>

        {/* Tab Selection */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={tab}
            onChange={(_, val) => setTab(val)}
            sx={{
              '& .MuiTab-root': {
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.95rem',
              },
            }}
          >
            <Tab
              value="received"
              label={
                <Badge
                  badgeContent={incoming.length}
                  color="primary"
                  sx={{ '& .MuiBadge-badge': { right: -12, top: 2 } }}
                >
                  Received Invitations
                </Badge>
              }
            />
            <Tab
              value="sent"
              label={
                <Badge
                  badgeContent={sent.length}
                  color="default"
                  sx={{ '& .MuiBadge-badge': { right: -12, top: 2 } }}
                >
                  Sent Invitations
                </Badge>
              }
            />
          </Tabs>
        </Box>

        {/* Tab: Received */}
        {tab === 'received' && (
          <Box>
            {loading ? (
              <Stack spacing={2}>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} variant="rounded" height={120} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
                ))}
              </Stack>
            ) : incoming.length > 0 ? (
              <Stack spacing={2}>
                {incoming.map((req) => (
                  <Card
                    key={req.id}
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: `${tokens.radius.lg}px`,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      gap={2}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          component={Link}
                          href={`/profile/${encodeURIComponent(req.senderId)}`}
                          src={req.senderAvatarUrl}
                          sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontWeight: 800 }}
                        >
                          {req.senderName ? req.senderName[0].toUpperCase() : 'K'}
                        </Avatar>
                        <Box>
                          <Typography
                            component={Link}
                            href={`/profile/${encodeURIComponent(req.senderId)}`}
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
                          <Typography variant="body2" color="text.secondary">
                            {req.senderHeadline || 'Professional Member'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Invited {new Date(req.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' } }}>
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

                    {req.note && (
                      <Box
                        sx={{
                          mt: 2,
                          p: 1.5,
                          borderRadius: `${tokens.radius.sm}px`,
                          bgcolor: 'action.hover',
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="flex-start">
                          <NoteAltOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 0.2 }} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            &ldquo;{req.note}&rdquo;
                          </Typography>
                        </Stack>
                      </Box>
                    )}
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
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  No pending invitations
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  When someone requests to connect with you, you will see their invitation here.
                </Typography>
                <Button
                  component={Link}
                  href="/people"
                  variant="outlined"
                  sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700 }}
                >
                  Discover People to Connect With
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* Tab: Sent */}
        {tab === 'sent' && (
          <Box>
            {loading ? (
              <Stack spacing={2}>
                {[1, 2].map((i) => (
                  <Skeleton key={i} variant="rounded" height={100} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
                ))}
              </Stack>
            ) : sent.length > 0 ? (
              <Stack spacing={2}>
                {sent.map((req) => (
                  <Card
                    key={req.id}
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: `${tokens.radius.lg}px`,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      gap={2}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          component={Link}
                          href={`/profile/${encodeURIComponent(req.receiverId)}`}
                          src={req.receiverAvatarUrl}
                          sx={{ width: 52, height: 52, bgcolor: 'primary.main', fontWeight: 800 }}
                        >
                          {req.receiverName ? req.receiverName[0].toUpperCase() : 'K'}
                        </Avatar>
                        <Box>
                          <Typography
                            component={Link}
                            href={`/profile/${encodeURIComponent(req.receiverId)}`}
                            variant="subtitle1"
                            sx={{
                              fontWeight: 800,
                              color: 'text.primary',
                              textDecoration: 'none',
                              '&:hover': { color: 'primary.main' },
                            }}
                          >
                            {req.receiverName || 'Kirmya Member'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {req.receiverHeadline || 'Pending Response'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Sent {new Date(req.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Stack>

                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<UndoIcon />}
                        onClick={() => handleWithdraw(req.id)}
                        disabled={actionLoading === req.id}
                        sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 600 }}
                      >
                        Withdraw
                      </Button>
                    </Stack>

                    {req.note && (
                      <Box
                        sx={{
                          mt: 2,
                          p: 1.5,
                          borderRadius: `${tokens.radius.sm}px`,
                          bgcolor: 'action.hover',
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          Your note: &ldquo;{req.note}&rdquo;
                        </Typography>
                      </Box>
                    )}
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
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  No outgoing invitations
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  You do not have any pending sent invitations right now.
                </Typography>
                <Button
                  component={Link}
                  href="/people"
                  variant="outlined"
                  sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700 }}
                >
                  Find Professionals to Connect With
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Container>
    </AuthenticatedLayout>
  );
}
