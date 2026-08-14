import { authApiClient } from '../../../services/authService';

const client = authApiClient;
const MOCK_USER_ID = '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d';

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  createdAt: string;
}

export interface ConversationItem {
  id: string;
  userId1: string;
  userId2: string;
  lastMessageText: string;
  lastMessageTime: string;
  createdAt: string;
  isArchived?: boolean;
  isMuted?: boolean;
  isPinned?: boolean;
  unreadCount?: number;
  participantName?: string;
  participantAvatar?: string;
  participantStatus?: string;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  attachments?: MessageAttachment[];
  reactions?: any[];
}

export interface MessageRequestItem {
  id: string;
  senderId: string;
  senderName?: string;
  senderHeadline?: string;
  senderAvatar?: string;
  receiverId: string;
  initialMessage: string;
  status: string;
  createdAt: string;
}

export interface AdminMessagingAnalytics {
  totalConversationsCount: number;
  totalMessagesSent: number;
  pendingRequestsCount: number;
  reportedMessagesCount: number;
}

export const messagingApi = {
  getMockUserId: () => MOCK_USER_ID,

  // Conversations
  listConversations: async (): Promise<ConversationItem[]> => {
    const res = await client.get<ConversationItem[]>('/messages/conversations');
    return res.data;
  },

  getOrCreateConversation: async (participantId: string): Promise<ConversationItem> => {
    const res = await client.post<ConversationItem>('/messages/conversations', { participantId });
    return res.data;
  },

  archiveConversation: async (conversationId: string): Promise<{ message: string }> => {
    const res = await client.post(`/messages/conversations/${conversationId}/archive`);
    return res.data;
  },

  muteConversation: async (conversationId: string): Promise<{ message: string }> => {
    const res = await client.post(`/messages/conversations/${conversationId}/mute`);
    return res.data;
  },

  pinConversation: async (conversationId: string): Promise<{ message: string }> => {
    const res = await client.post(`/messages/conversations/${conversationId}/pin`);
    return res.data;
  },

  // Messages
  listMessages: async (conversationId: string): Promise<MessageItem[]> => {
    const res = await client.get<MessageItem[]>(`/messages/conversations/${conversationId}/messages`);
    return res.data;
  },

  sendMessage: async (conversationId: string, content: string, attachments?: MessageAttachment[]): Promise<MessageItem> => {
    const res = await client.post<MessageItem>(`/messages/conversations/${conversationId}/messages`, { content, attachments });
    return res.data;
  },

  markRead: async (conversationId: string): Promise<{ message: string }> => {
    const res = await client.post(`/messages/conversations/${conversationId}/read`);
    return res.data;
  },

  addReaction: async (messageId: string, emoji: string): Promise<{ message: string }> => {
    const res = await client.post(`/messages/messages/${messageId}/reaction`, { emoji });
    return res.data;
  },

  searchMessages: async (query: string): Promise<MessageItem[]> => {
    const res = await client.get<MessageItem[]>('/messages/search', { params: { query } });
    return res.data;
  },

  // Requests
  listRequests: async (): Promise<MessageRequestItem[]> => {
    const res = await client.get<MessageRequestItem[]>('/messages/requests');
    return res.data;
  },

  sendRequest: async (receiverId: string, initialMessage: string): Promise<MessageRequestItem> => {
    const res = await client.post<MessageRequestItem>('/messages/requests', { receiverId, initialMessage });
    return res.data;
  },

  acceptRequest: async (requestId: string): Promise<ConversationItem> => {
    const res = await client.post<ConversationItem>(`/messages/requests/${requestId}/accept`);
    return res.data;
  },

  declineRequest: async (requestId: string): Promise<{ message: string }> => {
    const res = await client.post(`/messages/requests/${requestId}/decline`);
    return res.data;
  },

  reportMessage: async (payload: { conversationId: string; messageId?: string; reason: string; details?: string }): Promise<{ message: string }> => {
    const res = await client.post('/messages/report', payload);
    return res.data;
  },

  // Admin APIs
  getAdminAnalytics: async (): Promise<AdminMessagingAnalytics> => {
    const res = await client.get<AdminMessagingAnalytics>('/admin/messaging/analytics');
    return res.data;
  },

  getAdminReports: async (): Promise<any[]> => {
    const res = await client.get('/admin/messaging/reports');
    return res.data;
  },

  // WebSocket Connection Handshake
  connectWebSocket: (onMessage: (data: any) => void): WebSocket => {
    const wsUrl = `ws://localhost:8080/api/v1/messages/ws?token=${MOCK_USER_ID}`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (e) {
        console.warn('WebSocket message payload parse failed:', event.data);
      }
    };

    return socket;
  },
};
