'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Container,
  Grid,
  Card,
  Typography,
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Avatar,
  Divider,
  Paper,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import Link from 'next/link';

import ConversationList from '@/components/messaging/ConversationList';
import MessageComposer from '@/components/messaging/MessageComposer';
import MessageReportDialog from '@/components/messaging/MessageReportDialog';
import { ConversationItem, MessageItem, messagingApi } from '@/features/messaging/services/messagingApi';

export default function MessagesMainPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const socketRef = useRef<WebSocket | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await messagingApi.listConversations();
      setConversations(list);
      if (list.length > 0 && !selectedConv) {
        setSelectedConv(list[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Setup real-time WebSocket connection
    const socket = messagingApi.connectWebSocket((evt) => {
      if (evt.type === 'chat' && selectedConv && evt.conversationId === selectedConv.id) {
        setMessages((prev) => [
          ...prev,
          {
            id: evt.id || String(Date.now()),
            conversationId: evt.conversationId,
            senderId: evt.senderId,
            content: evt.content,
            isRead: false,
            createdAt: evt.timestamp || new Date().toISOString(),
          },
        ]);
      }
    });

    socketRef.current = socket;
    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (selectedConv) {
      messagingApi.listMessages(selectedConv.id).then((msgs) => setMessages(msgs)).catch(() => {});
      messagingApi.markRead(selectedConv.id).catch(() => {});
    }
  }, [selectedConv]);

  const handleSend = async (content: string) => {
    if (!selectedConv) return;
    try {
      const msg = await messagingApi.sendMessage(selectedConv.id, content);
      setMessages((prev) => [...prev, msg]);
      setSelectedConv((prev) => (prev ? { ...prev, lastMessageText: content, lastMessageTime: new Date().toISOString() } : null));
    } catch (e) {
      alert('Failed to send message.');
    }
  };

  const handleReport = async (reason: string, details: string) => {
    if (!selectedConv) return;
    try {
      await messagingApi.reportMessage({ conversationId: selectedConv.id, reason, details });
      alert('Report submitted to Trust & Safety.');
    } catch (e) {
      alert('Report submission failed.');
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.participantName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3, height: 'calc(100vh - 80px)' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Messages & Real-Time Inbox
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Encrypted end-to-end professional conversations and direct messages.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button component={Link} href="/messages/requests" variant="outlined" sx={{ borderRadius: '12px', fontWeight: 800 }}>
            Message Requests
          </Button>
          <Button component={Link} href="/messages/search" variant="outlined" sx={{ borderRadius: '12px', fontWeight: 800 }}>
            Search Messages
          </Button>
        </Stack>
      </Stack>

      <Card sx={{ height: '85vh', borderRadius: '24px', display: 'flex', overflow: 'hidden' }}>
        {/* Left Side: Conversation List */}
        <Box sx={{ width: { xs: '100%', md: 360 }, borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </Box>

          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
            <ConversationList
              conversations={filteredConversations}
              selectedId={selectedConv?.id}
              onSelect={(conv) => setSelectedConv(conv)}
              onRefresh={loadData}
            />
          </Box>
        </Box>

        {/* Right Side: Active Conversation Thread */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
          {selectedConv ? (
            <>
              {/* Header */}
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar src={selectedConv.participantAvatar} sx={{ width: 44, height: 44, bgcolor: 'primary.main', fontWeight: 800 }}>
                      {selectedConv.participantName ? selectedConv.participantName[0].toUpperCase() : 'K'}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                        {selectedConv.participantName || 'Candidate'}
                      </Typography>
                      <Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>
                        ● Online
                      </Typography>
                    </Box>
                  </Stack>

                  <IconButton onClick={() => setReportOpen(true)}>
                    <ReportProblemIcon color="warning" />
                  </IconButton>
                </Stack>
              </Box>

              {/* Messages Thread */}
              <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {messages.map((msg) => {
                  const isMine = msg.senderId === messagingApi.getMockUserId();

                  return (
                    <Box key={msg.id} sx={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: isMine ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                          bgcolor: isMine ? 'primary.main' : 'background.paper',
                          color: isMine ? 'white' : 'text.primary',
                        }}
                      >
                        <Typography variant="body1">{msg.content}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5, opacity: 0.8 }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Paper>
                    </Box>
                  );
                })}
              </Box>

              {/* Composer */}
              <MessageComposer onSend={handleSend} />
            </>
          ) : (
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">Select a conversation to begin messaging</Typography>
            </Box>
          )}
        </Box>
      </Card>

      <MessageReportDialog open={reportOpen} onClose={() => setReportOpen(false)} onSubmit={handleReport} />
    </Container>
  );
}
