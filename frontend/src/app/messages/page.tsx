'use client';

import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import {
  Container,
  Grid,
  Card,
  Typography,
  Box,
  Button,
  IconButton,
  Stack,
  Skeleton,
  Chip,
  Badge,
  useMediaQuery,
  useTheme,
  Alert,
} from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import AuthenticatedLayout from '../../components/shell/AuthenticatedLayout';
import ConversationList from '../../components/messaging/ConversationList';
import ChatHeader from '../../components/messaging/ChatHeader';
import MessageBubble from '../../components/messaging/MessageBubble';
import MessageComposer from '../../components/messaging/MessageComposer';
import MessageReportDialog from '../../components/messaging/MessageReportDialog';
import {
  ConversationItem,
  MessageItem,
  MessageAttachment,
  WSEvent,
  messagingApi,
} from '../../features/messaging/services/messagingApi';
import { tokens } from '../../theme/tokens';

export const dynamic = 'force-dynamic';

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const paramConvId = searchParams.get('conv');
  const paramUserId = searchParams.get('userId');

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportingMessage, setReportingMessage] = useState<MessageItem | null>(null);
  const [requestsCount, setRequestsCount] = useState(0);
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('disconnected');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const socketManagerRef = useRef<{ socket: WebSocket | null; send: (data: any) => void; close: () => void } | null>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  }, []);

  // Fetch initial conversations list
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const [convs, reqs] = await Promise.all([
        messagingApi.listConversations(),
        messagingApi.listRequests().catch(() => []),
      ]);
      setConversations(convs);
      setRequestsCount(reqs.length);

      // Handle query param routing
      if (paramConvId) {
        const matched = convs.find((c) => c.id === paramConvId);
        if (matched) setSelectedConv(matched);
      } else if (paramUserId) {
        // Direct profile -> message shortcut
        const matched = convs.find(
          (c) => c.userId1 === paramUserId || c.userId2 === paramUserId || c.participantId === paramUserId
        );
        if (matched) {
          setSelectedConv(matched);
        } else {
          try {
            const newConv = await messagingApi.getOrCreateConversation(paramUserId);
            setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)]);
            setSelectedConv(newConv);
          } catch {
            // Handled
          }
        }
      } else if (convs.length > 0 && !isMobile && !selectedConv) {
        setSelectedConv(convs[0]);
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  }, [paramConvId, paramUserId, isMobile]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Real-time WebSocket connection
  useEffect(() => {
    const ws = messagingApi.connectWebSocket(
      (evt: WSEvent) => {
        if (evt.type === 'chat' && evt.conversationId) {
          // If message is in the currently active conversation, append it
          if (selectedConv && evt.conversationId === selectedConv.id) {
            const newMsg: MessageItem = {
              id: evt.id || `msg-${Date.now()}`,
              conversationId: evt.conversationId,
              senderId: evt.senderId || '',
              content: evt.content || '',
              isRead: true,
              createdAt: evt.timestamp || new Date().toISOString(),
              attachments: evt.attachments,
            };

            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });

            setTimeout(() => scrollToBottom(true), 50);
            messagingApi.markRead(evt.conversationId).catch(() => {});
          }

          // Update conversation list item preview
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === evt.conversationId) {
                return {
                  ...c,
                  lastMessageText: evt.content || 'New attachment',
                  lastMessageTime: evt.timestamp || new Date().toISOString(),
                  unreadCount: selectedConv?.id === evt.conversationId ? 0 : (c.unreadCount || 0) + 1,
                };
              }
              return c;
            })
          );
        } else if (evt.type === 'typing' && selectedConv && evt.conversationId === selectedConv.id) {
          setIsPeerTyping(Boolean(evt.isTyping));
        } else if (evt.type === 'presence' && evt.senderId) {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.userId1 === evt.senderId || c.userId2 === evt.senderId || c.participantId === evt.senderId) {
                return {
                  ...c,
                  participantStatus: evt.status || 'offline',
                };
              }
              return c;
            })
          );
        }
      },
      (status) => {
        setWsStatus(status);
      }
    );

    socketManagerRef.current = ws;

    return () => {
      if (socketManagerRef.current) {
        socketManagerRef.current.close();
      }
    };
  }, [selectedConv, scrollToBottom]);

  // Load messages whenever active conversation changes
  useEffect(() => {
    if (!selectedConv) return;

    let isCurrent = true;
    setMessagesLoading(true);
    setIsPeerTyping(false);

    messagingApi
      .listMessages(selectedConv.id)
      .then((data) => {
        if (isCurrent) {
          setMessages(data);
          setTimeout(() => scrollToBottom(false), 50);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isCurrent) setMessagesLoading(false);
      });

    // Mark messages as read
    messagingApi.markRead(selectedConv.id).catch(() => {});
    setConversations((prev) =>
      prev.map((c) => (c.id === selectedConv.id ? { ...c, unreadCount: 0 } : c))
    );

    return () => {
      isCurrent = false;
    };
  }, [selectedConv, scrollToBottom]);

  // Send message handler
  const handleSend = async (content: string, attachments?: MessageAttachment[]) => {
    if (!selectedConv) return;

    try {
      const sentMsg = await messagingApi.sendMessage(selectedConv.id, content, attachments);
      setMessages((prev) => [...prev, sentMsg]);

      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConv.id
            ? {
                ...c,
                lastMessageText: content || (attachments ? attachments[0]?.fileName : ''),
                lastMessageTime: new Date().toISOString(),
              }
            : c
        )
      );

      setTimeout(() => scrollToBottom(true), 50);

      // Also send through WebSocket for real-time dispatch
      if (socketManagerRef.current) {
        socketManagerRef.current.send({
          type: 'chat',
          conversationId: selectedConv.id,
          content,
          attachments,
        });
      }
    } catch {
      // Handled in composer
    }
  };

  // Typing event notification to peer
  const handleTyping = (typing: boolean) => {
    if (!selectedConv || !socketManagerRef.current) return;
    socketManagerRef.current.send({
      type: 'typing',
      conversationId: selectedConv.id,
      isTyping: typing,
    });
  };

  // Conversation options handlers
  const handleMute = async () => {
    if (!selectedConv) return;
    try {
      await messagingApi.muteConversation(selectedConv.id);
      setSelectedConv((prev) => (prev ? { ...prev, isMuted: !prev.isMuted } : null));
      loadConversations();
    } catch {}
  };

  const handleArchive = async () => {
    if (!selectedConv) return;
    try {
      await messagingApi.archiveConversation(selectedConv.id);
      setSelectedConv(null);
      loadConversations();
    } catch {}
  };

  const handlePin = async () => {
    if (!selectedConv) return;
    try {
      await messagingApi.pinConversation(selectedConv.id);
      setSelectedConv((prev) => (prev ? { ...prev, isPinned: !prev.isPinned } : null));
      loadConversations();
    } catch {}
  };

  const handleReportSubmit = async (reason: string, details: string) => {
    if (!selectedConv) return;
    try {
      await messagingApi.reportMessage({
        conversationId: selectedConv.id,
        messageId: reportingMessage?.id,
        reason,
        details,
      });
      setReportingMessage(null);
    } catch {}
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 1.5, md: 3 }, height: { xs: 'calc(100dvh - 72px)', md: 'calc(100dvh - 96px)' } }}>
      <Card
        elevation={0}
        sx={{
          height: '100%',
          borderRadius: `${tokens.radius.lg}px`,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Left Pane: Conversation List */}
        <Box
          sx={{
            width: { xs: '100%', md: 380 },
            display: isMobile && selectedConv ? 'none' : 'flex',
            flexDirection: 'column',
            borderRight: '1px solid',
            borderColor: 'divider',
            height: '100%',
            bgcolor: 'background.paper',
          }}
        >
          {/* Header */}
          <Box sx={{ p: 2, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                Messages
              </Typography>

              <Button
                component={Link}
                href="/messages/requests"
                size="small"
                variant="outlined"
                startIcon={<MailOutlineIcon fontSize="small" />}
                sx={{
                  borderRadius: `${tokens.radius.sm}px`,
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                }}
              >
                Requests {requestsCount > 0 && `(${requestsCount})`}
              </Button>
            </Stack>

            {wsStatus === 'reconnecting' && (
              <Alert severity="warning" sx={{ mt: 1, py: 0, fontSize: '0.75rem', borderRadius: `${tokens.radius.sm}px` }}>
                Reconnecting real-time chat...
              </Alert>
            )}
          </Box>

          {/* List Component */}
          {loading ? (
            <Stack spacing={1} sx={{ p: 1.5 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} variant="rounded" height={72} sx={{ borderRadius: `${tokens.radius.md}px` }} />
              ))}
            </Stack>
          ) : (
            <ConversationList
              conversations={conversations}
              selectedId={selectedConv?.id}
              onSelect={(c) => {
                setSelectedConv(c);
                router.replace(`/messages?conv=${c.id}`);
              }}
              onRefresh={loadConversations}
            />
          )}
        </Box>

        {/* Right Pane: Chat Thread */}
        <Box
          sx={{
            flexGrow: 1,
            display: isMobile && !selectedConv ? 'none' : 'flex',
            flexDirection: 'column',
            height: '100%',
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(248, 250, 252, 0.6)',
          }}
        >
          {selectedConv ? (
            <>
              {/* Active Conversation Header */}
              <ChatHeader
                conversation={selectedConv}
                isTyping={isPeerTyping}
                onBack={isMobile ? () => setSelectedConv(null) : undefined}
                onMute={handleMute}
                onArchive={handleArchive}
                onPin={handlePin}
                onReport={() => {
                  setReportingMessage(null);
                  setReportOpen(true);
                }}
              />

              {/* Message History */}
              <Box
                sx={{
                  flexGrow: 1,
                  overflowY: 'auto',
                  p: { xs: 1.5, sm: 2.5 },
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {messagesLoading ? (
                  <Stack spacing={2} sx={{ py: 2 }}>
                    <Skeleton variant="rounded" width="45%" height={48} sx={{ alignSelf: 'flex-start', borderRadius: `${tokens.radius.md}px` }} />
                    <Skeleton variant="rounded" width="55%" height={56} sx={{ alignSelf: 'flex-end', borderRadius: `${tokens.radius.md}px` }} />
                    <Skeleton variant="rounded" width="40%" height={48} sx={{ alignSelf: 'flex-start', borderRadius: `${tokens.radius.md}px` }} />
                  </Stack>
                ) : messages.length > 0 ? (
                  messages.map((msg) => {
                    // Check if outgoing
                    const isOutgoing =
                      msg.senderId === 'me' ||
                      (selectedConv && msg.senderId !== selectedConv.userId1 && msg.senderId !== selectedConv.userId2);

                    return (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isOutgoing={isOutgoing}
                        onReport={(m) => {
                          setReportingMessage(m);
                          setReportOpen(true);
                        }}
                      />
                    );
                  })
                ) : (
                  <Box sx={{ textAlign: 'center', my: 'auto', py: 6 }}>
                    <ChatBubbleOutlineIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1, opacity: 0.6 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      No messages yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Send a message to start the conversation with {selectedConv.participantName || 'your connection'}.
                    </Typography>
                  </Box>
                )}
                <div ref={messagesEndRef} />
              </Box>

              {/* Message Composer */}
              <MessageComposer onSend={handleSend} onTyping={handleTyping} />
            </>
          ) : (
            <Box sx={{ textAlign: 'center', my: 'auto', py: 8, px: 3 }}>
              <ChatBubbleOutlineIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1.5, opacity: 0.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                Select a Conversation
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto', mb: 3 }}>
                Choose a conversation from the left pane or discover professionals in your network to start messaging.
              </Typography>
              <Button
                component={Link}
                href="/people"
                variant="contained"
                startIcon={<PeopleOutlineIcon />}
                sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700 }}
              >
                Discover Professionals
              </Button>
            </Box>
          )}
        </Box>
      </Card>

      {/* Safety & Report Dialog */}
      <MessageReportDialog
        open={reportOpen}
        onClose={() => {
          setReportOpen(false);
          setReportingMessage(null);
        }}
        onSubmit={handleReportSubmit}
      />
    </Container>
  );
}

export default function MessagesMainPage() {
  return (
    <AuthenticatedLayout>
      <Suspense fallback={null}>
        <MessagesContent />
      </Suspense>
    </AuthenticatedLayout>
  );
}
