'use client';

import React, { useEffect, useState, useRef } from 'react';
import ProtectedRoute from '../../features/auth/components/protectedRoute';
import {
  Container,
  Grid,
  Card,
  Typography,
  Box,
  Button,
  IconButton,
  Chip,
  Divider,
  Stack,
  TextField,
  InputAdornment,
  CircularProgress,
  Badge,
  Avatar,
  Paper,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import ChatIcon from '@mui/icons-material/Chat';
import CircleIcon from '@mui/icons-material/Circle';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DownloadIcon from '@mui/icons-material/Download';
import ImageIcon from '@mui/icons-material/Image';

import { useColorMode } from '../providers';
import { messagingApi } from '../../features/messaging/services/messagingApi';

interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  createdAt: string;
}

interface Conversation {
  id: string;
  userId1: string;
  userId2: string;
  lastMessageText: string;
  lastMessageTime: string;
  unreadCount?: number;
  participantId?: string;
  participantName?: string;
  participantStatus?: string; // online, offline
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  attachments?: MessageAttachment[];
  createdAt: string;
}

export default function MessagingPage() {
  const { mode, toggleColorMode } = useColorMode();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSandboxMode, setIsSandboxMode] = useState(false);

  // Search and Input states
  const [searchTerm, setSearchTerm] = useState('');
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [inputContent, setInputContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Refs
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastTypingSentRef = useRef<number>(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set dynamic document title for client-side SEO
  useEffect(() => {
    document.title = "Kirmya - Secure Real-Time Messaging Console";
  }, []);

  const fetchConversationsData = async () => {
    try {
      setLoading(true);
      const list = await messagingApi.listConversations();

      // Resolve participant names and statuses
      const enrichedList = list.map((c: Conversation) => {
        const isUser1 = c.userId1 === messagingApi.getMockUserId();
        const partID = isUser1 ? c.userId2 : c.userId1;
        const name = getMockParticipantName(partID);
        return {
          ...c,
          participantId: partID,
          participantName: name,
          participantStatus: 'offline', // Default, updated via websocket
          unreadCount: c.unreadCount || 0,
        };
      });

      setConversations(enrichedList);
      if (enrichedList.length > 0 && !selectedConv) {
        handleSelectConversation(enrichedList[0]);
      }
    } catch (err) {
      console.warn('Backend not running or schema unapplied, utilizing local client-side sandbox mode.');
      setIsSandboxMode(true);
      
      const mockConvs: Conversation[] = [
        {
          id: 'conv-uuid-1',
          userId1: messagingApi.getMockUserId(),
          userId2: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
          lastMessageText: 'I highly suggest using the OpenTelemetry collector package.',
          lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
          participantId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
          participantName: 'Salim Al-Harthy',
          participantStatus: 'online',
          unreadCount: 2,
        },
        {
          id: 'conv-uuid-2',
          userId1: messagingApi.getMockUserId(),
          userId2: '11112222-3333-4444-5555-666677778888',
          lastMessageText: 'Let us align on the database prefix tables deployment.',
          lastMessageTime: new Date(Date.now() - 7200000).toISOString(),
          participantId: '11112222-3333-4444-5555-666677778888',
          participantName: 'Ayesha Siddiqui',
          participantStatus: 'offline',
          unreadCount: 0,
        },
      ];
      setConversations(mockConvs);
      if (!selectedConv) {
        handleSelectConversation(mockConvs[0], mockConvs);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversationsData();
  }, []);

  // Hook WebSockets
  useEffect(() => {
    if (isSandboxMode) return;

    try {
      const socket = messagingApi.connectWebSocket((evt) => {
        if (evt.type === 'chat') {
          // Handle incoming message
          const newMsg: Message = {
            id: evt.id || Math.random().toString(),
            conversationId: evt.conversationId,
            senderId: evt.senderId,
            content: evt.content,
            attachments: evt.attachments,
            createdAt: evt.timestamp,
          };

          // Append to active chat if open
          if (selectedConv?.id === evt.conversationId) {
            setMessages((prev) => [...prev, newMsg]);
          }

          // Update last message preview and unread count in sidebar
          setConversations((prevList) =>
            prevList.map((c) =>
              c.id === evt.conversationId
                ? {
                    ...c,
                    lastMessageText: evt.content || (evt.attachments && evt.attachments.length > 0 ? '[Attachment]' : ''),
                    lastMessageTime: evt.timestamp,
                    unreadCount: selectedConv?.id === evt.conversationId ? 0 : (c.unreadCount || 0) + 1,
                  }
                : c
            )
          );
        } else if (evt.type === 'presence') {
          // Update status in conversations list
          setConversations((prevList) =>
            prevList.map((c) => {
              if (c.participantId === evt.senderId) {
                return { ...c, participantStatus: evt.content };
              }
              return c;
            })
          );
          if (selectedConv && selectedConv.participantId === evt.senderId) {
            setSelectedConv((prev) => prev ? { ...prev, participantStatus: evt.content } : null);
          }
        } else if (evt.type === 'typing') {
          // Show typing indicator if it is the active conversation
          if (selectedConv && evt.conversationId === selectedConv.id && evt.senderId !== messagingApi.getMockUserId()) {
            setIsTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
              setIsTyping(false);
            }, 3000);
          }
        }
      });

      socketRef.current = socket;
    } catch (e) {
      console.warn('WebSocket connection handshake failed. Operating in mock rest mode.');
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [selectedConv, isSandboxMode]);

  // Scroll to bottom helper
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSelectConversation = async (conv: Conversation, currentList?: Conversation[]) => {
    setSelectedConv(conv);
    
    // Clear unread count locally and update list
    const activeList = currentList || conversations;
    setConversations(activeList.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));

    try {
      const list = await messagingApi.listMessages(conv.id);
      setMessages(list);
    } catch (err) {
      // Mock history list for sandbox
      const mockHistory: Message[] = [
        {
          id: 'msg-1',
          conversationId: conv.id,
          senderId: conv.participantId || '',
          content: 'Hello, are we ready to deploy the NATS worker instances?',
          createdAt: new Date(Date.now() - 10800000).toISOString(),
        },
        {
          id: 'msg-2',
          conversationId: conv.id,
          senderId: messagingApi.getMockUserId(),
          content: 'Yes, the outbox patterns migration script is already approved.',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: 'msg-3',
          conversationId: conv.id,
          senderId: conv.participantId || '',
          content: conv.lastMessageText || 'Great, let us sync later.',
          createdAt: conv.lastMessageTime,
          attachments: [
            {
              id: 'att-1',
              messageId: 'msg-3',
              fileName: 'architecture_diagram.pdf',
              fileUrl: '#',
              fileSize: 452000,
              createdAt: conv.lastMessageTime,
            }
          ]
        },
      ];
      setMessages(mockHistory);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputContent(e.target.value);
    
    // Send typing notification
    if (!isSandboxMode && socketRef.current && socketRef.current.readyState === WebSocket.OPEN && selectedConv) {
      if (Date.now() - lastTypingSentRef.current > 2000) {
        socketRef.current.send(JSON.stringify({
          type: 'typing',
          conversationId: selectedConv.id,
          receiverId: selectedConv.participantId,
        }));
        lastTypingSentRef.current = Date.now();
      }
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConv || (!inputContent.trim() && !selectedFile)) return;

    let attachmentPayload: any[] = [];
    if (selectedFile) {
      const mockUrl = URL.createObjectURL(selectedFile);
      attachmentPayload = [{
        id: Math.random().toString(),
        fileName: selectedFile.name,
        fileUrl: mockUrl,
        fileSize: selectedFile.size,
        createdAt: new Date().toISOString(),
      }];
    }

    try {
      const newMsg = await messagingApi.sendMessage(selectedConv.id, inputContent, attachmentPayload);
      setMessages((prev) => [...prev, newMsg]);
      
      // Update preview in sidebar
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConv.id
            ? {
                ...c,
                lastMessageText: inputContent || '[Attachment]',
                lastMessageTime: new Date().toISOString()
              }
            : c
        )
      );
      setInputContent('');
      setSelectedFile(null);
    } catch (err) {
      // Offline sandbox simulation fallback
      const mockMsg: Message = {
        id: Math.random().toString(),
        conversationId: selectedConv.id,
        senderId: messagingApi.getMockUserId(),
        content: inputContent,
        attachments: attachmentPayload.length > 0 ? attachmentPayload : undefined,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, mockMsg]);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConv.id
            ? {
                ...c,
                lastMessageText: inputContent || `Sent a file: ${selectedFile?.name}`,
                lastMessageTime: new Date().toISOString()
              }
            : c
        )
      );

      const savedInput = inputContent;
      const fileSent = selectedFile;
      
      setInputContent('');
      setSelectedFile(null);

      // Trigger realistic sandbox response simulation
      setTimeout(() => {
        setIsTyping(true);
      }, 800);

      setTimeout(() => {
        setIsTyping(false);
        const replyText = fileSent
          ? `I received the file "${fileSent.name}". Let me review it and get back to you.`
          : `Thanks for the update: "${savedInput}". Let's schedule a call tomorrow.`;
          
        const replyMsg: Message = {
          id: Math.random().toString(),
          conversationId: selectedConv.id,
          senderId: selectedConv.participantId || '',
          content: replyText,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, replyMsg]);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConv.id
              ? {
                  ...c,
                  lastMessageText: replyText,
                  lastMessageTime: new Date().toISOString(),
                  unreadCount: 0,
                }
              : c
          )
        );
      }, 3000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Helper Participant name resolver
  const getMockParticipantName = (id: string) => {
    if (id === 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee') return 'Salim Al-Harthy';
    if (id === '11112222-3333-4444-5555-666677778888') return 'Ayesha Siddiqui';
    return 'Kirmya Colleague';
  };

  // Message Search (Checks content and file names)
  const filteredMessages = messages.filter((m) => {
    const matchesContent = m.content.toLowerCase().includes(chatSearchTerm.toLowerCase());
    const matchesFiles = (m.attachments || []).some((a) =>
      a.fileName.toLowerCase().includes(chatSearchTerm.toLowerCase())
    );
    return matchesContent || matchesFiles;
  });

  // Conversation Search
  const filteredConversations = conversations.filter((c) =>
    (c.participantName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <Box
        component="div"
        sx={{
          minHeight: '100vh',
          bgcolor: mode === 'light' ? '#f3f2f0' : '#090d16',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Global Premium Bar */}
        <Box
          component="header"
          sx={{
            bgcolor: mode === 'light' ? 'white' : '#111827',
          borderBottom: '1px solid',
          borderColor: mode === 'light' ? '#e0e0e0' : '#1f2937',
          py: 1.5,
          px: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: '#0a66c2', width: 36, height: 36, fontWeight: 'bold', fontSize: '1rem' }}>K</Avatar>
          <Box>
            <Typography component="h1" variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'light' ? '#1f2937' : '#f9fafb', lineHeight: 1.1 }}>
              Kirmya Secure Messaging
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Professional Collaboration Space
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          {isSandboxMode && (
            <Chip
              label="SANDBOX MODE (OFFLINE)"
              size="small"
              sx={{
                bgcolor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                fontWeight: 700,
                fontSize: '0.7rem',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            />
          )}
          <IconButton onClick={toggleColorMode} sx={{ color: 'text.secondary' }}>
            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Stack>
      </Box>

      {/* Main Split Interface */}
      <Container maxWidth="lg" sx={{ flexGrow: 1, py: 3, display: 'flex', flexDirection: 'column' }}>
        <Grid container sx={{ flexGrow: 1, height: '80vh', borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          
          {/* Left Column: Thread Lists */}
          <Grid
            item
            xs={12}
            md={4}
            sx={{
              bgcolor: mode === 'light' ? 'white' : '#111827',
              borderRight: '1px solid',
              borderColor: mode === 'light' ? '#e0e0e0' : '#1f2937',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ p: 2 }}>
              <TextField
                id="search-conversations-input"
                placeholder="Search conversations..."
                size="small"
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: mode === 'light' ? '#f3f2f0' : '#1f2937',
                    border: 'none',
                    '& fieldset': { border: 'none' },
                  },
                }}
              />
            </Box>

            <Divider />

            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
              {filteredConversations.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <ChatIcon sx={{ color: 'text.secondary', fontSize: 36, mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No threads match your search.
                  </Typography>
                </Box>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = selectedConv?.id === conv.id;
                  const isOnline = conv.participantStatus === 'online';
                  
                  return (
                    <Box key={conv.id}>
                      <Box
                        onClick={() => handleSelectConversation(conv)}
                        sx={{
                          p: 2.5,
                          cursor: 'pointer',
                          bgcolor: isSelected ? (mode === 'light' ? '#f3f9fe' : 'rgba(10, 102, 194, 0.08)') : 'transparent',
                          borderLeft: isSelected ? '4px solid #0a66c2' : '4px solid transparent',
                          transition: 'background-color 0.2s',
                          '&:hover': {
                            bgcolor: isSelected ? (mode === 'light' ? '#f3f9fe' : 'rgba(10, 102, 194, 0.08)') : (mode === 'light' ? '#f8fafc' : 'rgba(255,255,255,0.02)'),
                          },
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', minWidth: 0, flexGrow: 1 }}>
                          <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            variant="dot"
                            sx={{
                              '& .MuiBadge-badge': {
                                backgroundColor: isOnline ? '#44b700' : '#9ca3af',
                                color: isOnline ? '#44b700' : '#9ca3af',
                                boxShadow: `0 0 0 2px ${mode === 'light' ? '#fff' : '#111827'}`,
                                '&::after': isOnline ? {
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  borderRadius: '50%',
                                  animation: 'ripple 1.2s infinite ease-in-out',
                                  border: '1px solid currentColor',
                                  content: '""',
                                } : undefined,
                              },
                              '@keyframes ripple': {
                                '0%': { transform: 'scale(.8)', opacity: 1 },
                                '100%': { transform: 'scale(2.4)', opacity: 0 },
                              },
                            }}
                          >
                            <Avatar sx={{ bgcolor: isOnline ? '#e0f2fe' : 'action.disabledBackground', color: 'primary.main', width: 46, height: 46, fontWeight: 700 }}>
                              {(conv.participantName || 'K')[0]}
                            </Avatar>
                          </Badge>

                          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800, color: mode === 'light' ? '#1f2937' : '#f3f4f6' }}>
                              {conv.participantName}
                            </Typography>
                            <Typography
                              variant="caption"
                              color={conv.unreadCount && conv.unreadCount > 0 ? 'text.primary' : 'text.secondary'}
                              sx={{
                                display: 'block',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                fontWeight: conv.unreadCount && conv.unreadCount > 0 ? 700 : 400,
                              }}
                            >
                              {conv.lastMessageText || 'No messages yet.'}
                            </Typography>
                          </Box>
                        </Stack>

                        <Stack spacing={1} sx={{ alignItems: 'flex-end', ml: 1, flexShrink: 0 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                          {conv.unreadCount && conv.unreadCount > 0 ? (
                            <Chip
                              label={conv.unreadCount}
                              size="small"
                              sx={{
                                height: 18,
                                minWidth: 18,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                bgcolor: '#ef4444',
                                color: 'white',
                                '& .MuiChip-label': { px: 0.5 }
                              }}
                            />
                          ) : null}
                        </Stack>
                      </Box>
                      <Divider />
                    </Box>
                  );
                })
              )}
            </Box>
          </Grid>

          {/* Right Column: Chat Feed */}
          <Grid
            item
            xs={12}
            md={8}
            sx={{
              bgcolor: mode === 'light' ? '#fcfcfc' : '#0d111a',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            {selectedConv ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                
                {/* Active chat header */}
                <Box
                  sx={{
                    p: 2,
                    bgcolor: mode === 'light' ? 'white' : '#111827',
                    borderBottom: '1px solid',
                    borderColor: mode === 'light' ? '#e0e0e0' : '#1f2937',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <CircleIcon sx={{ fontSize: 10, color: selectedConv.participantStatus === 'online' ? '#10b981' : '#9ca3af' }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        {selectedConv.participantName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedConv.participantStatus === 'online' ? 'Active now' : 'Offline'}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Inline thread search */}
                  <TextField
                    id="search-messages-input"
                    placeholder="Search in chat..."
                    size="small"
                    value={chatSearchTerm}
                    onChange={(e) => setChatSearchTerm(e.target.value)}
                    sx={{
                      width: '200px',
                      '& .MuiOutlinedInput-root': {
                        bgcolor: mode === 'light' ? '#f3f2f0' : '#1f2937',
                        border: 'none',
                        '& fieldset': { border: 'none' },
                        height: '32px',
                        fontSize: '0.8rem',
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      endAdornment: chatSearchTerm && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setChatSearchTerm('')} sx={{ p: 0.25 }}>
                            <CloseIcon sx={{ fontSize: '0.9rem' }} />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Message stream */}
                <Box
                  sx={{
                    flexGrow: 1,
                    p: 3,
                    overflowY: 'auto',
                    bgcolor: mode === 'light' ? '#f8fafc' : 'rgba(15, 23, 42, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Stack spacing={2.5} sx={{ flexGrow: 1 }}>
                    {filteredMessages.length === 0 ? (
                      <Box sx={{ m: 'auto', textAlign: 'center', opacity: 0.6 }}>
                        <ChatIcon sx={{ fontSize: 40, mb: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {chatSearchTerm ? 'No search results found.' : 'No messages in this chat yet.'}
                        </Typography>
                      </Box>
                    ) : (
                      filteredMessages.map((msg) => {
                        const isMe = msg.senderId === messagingApi.getMockUserId();
                        return (
                          <Box key={msg.id} sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                            <Stack direction="row" spacing={1} sx={{ maxWidth: '75%', alignItems: 'flex-end' }}>
                              {!isMe && (
                                <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', fontWeight: 700, bgcolor: 'action.disabledBackground' }}>
                                  {(selectedConv.participantName || 'K')[0]}
                                </Avatar>
                              )}
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                <Paper
                                  elevation={0}
                                  sx={{
                                    p: 1.75,
                                    borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                                    bgcolor: isMe ? '#0a66c2' : (mode === 'light' ? 'white' : '#1f2937'),
                                    color: isMe ? 'white' : 'text.primary',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    border: mode === 'light' && !isMe ? '1px solid #e2e8f0' : 'none',
                                  }}
                                >
                                  {msg.content && (
                                    <Typography variant="body2" sx={{ lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
                                      {msg.content}
                                    </Typography>
                                  )}

                                  {/* Rendering attachments */}
                                  {msg.attachments && msg.attachments.length > 0 && (
                                    <Stack spacing={1} sx={{ mt: msg.content ? 1.5 : 0, minWidth: '180px' }}>
                                      {msg.attachments.map((att) => {
                                        const isImg = att.fileName.match(/\.(jpeg|jpg|gif|png)$/i) || att.fileUrl.startsWith('blob:');
                                        if (isImg) {
                                          return (
                                            <Box key={att.id} sx={{ mt: 0.5, maxWidth: '100%', borderRadius: 1.5, overflow: 'hidden' }}>
                                              <img
                                                src={att.fileUrl}
                                                alt={att.fileName}
                                                style={{
                                                  maxWidth: '100%',
                                                  maxHeight: '200px',
                                                  display: 'block',
                                                  objectFit: 'cover',
                                                  borderRadius: '6px',
                                                }}
                                              />
                                              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: isMe ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}>
                                                {att.fileName} ({(att.fileSize / 1024).toFixed(1)} KB)
                                              </Typography>
                                            </Box>
                                          );
                                        }
                                        return (
                                          <Card
                                            key={att.id}
                                            variant="outlined"
                                            sx={{
                                              bgcolor: isMe ? 'rgba(255,255,255,0.1)' : 'background.paper',
                                              color: 'inherit',
                                              borderColor: isMe ? 'rgba(255,255,255,0.2)' : 'divider',
                                              boxShadow: 'none',
                                            }}
                                          >
                                            <Box sx={{ p: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                                              <Stack direction="row" spacing={1} alignItems="center" sx={{ overflow: 'hidden' }}>
                                                <InsertDriveFileIcon sx={{ color: isMe ? 'white' : 'primary.main', flexShrink: 0 }} />
                                                <Box sx={{ overflow: 'hidden' }}>
                                                  <Typography variant="body2" sx={{ fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                                    {att.fileName}
                                                  </Typography>
                                                  <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', fontSize: '0.7rem' }}>
                                                    {(att.fileSize / 1024).toFixed(1)} KB
                                                  </Typography>
                                                </Box>
                                              </Stack>
                                              <IconButton size="small" href={att.fileUrl} download={att.fileName} target="_blank" sx={{ color: 'inherit', p: 0.5 }}>
                                                <DownloadIcon sx={{ fontSize: '1.1rem' }} />
                                              </IconButton>
                                            </Box>
                                          </Card>
                                        );
                                      })}
                                    </Stack>
                                  )}
                                </Paper>

                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, mx: 1, fontSize: '0.65rem' }}>
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                              </Box>
                            </Stack>
                          </Box>
                        );
                      })
                    )}

                    {/* Bouncing dots typing indicator */}
                    {isTyping && (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-end' }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', fontWeight: 700, bgcolor: 'action.disabledBackground' }}>
                            {(selectedConv.participantName || 'K')[0]}
                          </Avatar>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 1.5,
                              borderRadius: '16px 16px 16px 2px',
                              bgcolor: mode === 'light' ? 'white' : '#1f2937',
                              border: mode === 'light' ? '1px solid #e2e8f0' : 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            <span style={{ fontSize: '0.75rem', color: 'gray', marginRight: '4px' }}>
                              {selectedConv.participantName} is typing
                            </span>
                            <Box sx={{ display: 'flex', gap: 0.4 }}>
                              <Box sx={{ width: 4, height: 4, bgcolor: '#0a66c2', borderRadius: '50%', animation: 'bounce 1s infinite alternate' }} />
                              <Box sx={{ width: 4, height: 4, bgcolor: '#0a66c2', borderRadius: '50%', animation: 'bounce 1s infinite alternate 0.2s' }} />
                              <Box sx={{ width: 4, height: 4, bgcolor: '#0a66c2', borderRadius: '50%', animation: 'bounce 1s infinite alternate 0.4s' }} />
                            </Box>
                          </Paper>
                        </Stack>
                      </Box>
                    )}
                    
                    <style>{`
                      @keyframes bounce {
                        from { transform: translateY(0); }
                        to { transform: translateY(-4px); }
                      }
                    `}</style>

                    <div ref={messagesEndRef} />
                  </Stack>
                </Box>

                <Divider />

                {/* Previews selected file */}
                {selectedFile && (
                  <Box
                    sx={{
                      p: 1.5,
                      px: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      bgcolor: mode === 'light' ? '#f8fafc' : '#1e293b',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ overflow: 'hidden' }}>
                      {selectedFile.type.startsWith('image/') ? (
                        <ImageIcon color="primary" sx={{ flexShrink: 0 }} />
                      ) : (
                        <InsertDriveFileIcon color="primary" sx={{ flexShrink: 0 }} />
                      )}
                      <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {selectedFile.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </Typography>
                      </Box>
                    </Stack>
                    <IconButton size="small" onClick={() => setSelectedFile(null)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}

                {/* Text input panel */}
                <Box
                  sx={{
                    p: 2,
                    bgcolor: mode === 'light' ? 'white' : '#111827',
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'center',
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />

                  <IconButton id="chat-attach-btn" onClick={() => fileInputRef.current?.click()} color="primary" sx={{ p: 1 }}>
                    <AttachFileIcon />
                  </IconButton>

                  <TextField
                    id="chat-message-input"
                    placeholder="Write a message..."
                    fullWidth
                    size="small"
                    value={inputContent}
                    onChange={handleInputChange}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: mode === 'light' ? '#f3f2f0' : '#1f2937',
                        border: 'none',
                        '& fieldset': { border: 'none' },
                        borderRadius: 6,
                      },
                    }}
                  />
                  
                  <Button
                    id="chat-send-btn"
                    variant="contained"
                    onClick={handleSendMessage}
                    disabled={!inputContent.trim() && !selectedFile}
                    sx={{
                      minWidth: '40px',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      p: 0,
                      bgcolor: '#0a66c2',
                      '&:hover': { bgcolor: '#004182' },
                    }}
                  >
                    <SendIcon fontSize="small" sx={{ ml: 0.3 }} />
                  </Button>
                </Box>

              </Box>
            ) : (
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 4, bgcolor: 'transparent', boxShadow: 'none' }}>
                <ChatIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Select a chat thread</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center', maxWidth: '360px' }}>
                  Choose a professional contact from the list on the left to start a real-time messaging session.
                </Typography>
              </Card>
            )}
          </Grid>

        </Grid>
      </Container>
    </Box>
    </ProtectedRoute>
  );
}
