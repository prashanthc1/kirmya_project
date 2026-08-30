import { authApiClient, getAccessToken } from '../../../services/authService';
import {
  MessageAttachment,
  MessageReaction,
  MessageItem,
  ConversationItem,
  MessageRequestItem,
  WSEvent,
  AdminMessagingAnalytics,
} from '../types';

export * from '../types';

const client = authApiClient;

export const messagingApi = {
  getCurrentUserId: (): string => {
    // In production, user details are in memory/token payload or fetched from /profile/me
    return 'me';
  },

  // Conversations
  listConversations: async (): Promise<ConversationItem[]> => {
    const res = await client.get<ConversationItem[]>('/messages/conversations');
    return res.data;
  },

  getOrCreateConversation: async (participantId: string, initialNote?: string): Promise<ConversationItem> => {
    const res = await client.post<ConversationItem>('/messages/conversations', {
      participantId,
      initialNote,
    });
    return res.data;
  },

  archiveConversation: async (conversationId: string): Promise<{ message: string }> => {
    const res = await client.post<{ message: string }>(`/messages/conversations/${conversationId}/archive`);
    return res.data;
  },

  muteConversation: async (conversationId: string): Promise<{ message: string }> => {
    const res = await client.post<{ message: string }>(`/messages/conversations/${conversationId}/mute`);
    return res.data;
  },

  pinConversation: async (conversationId: string): Promise<{ message: string }> => {
    const res = await client.post<{ message: string }>(`/messages/conversations/${conversationId}/pin`);
    return res.data;
  },

  // Messages
  listMessages: async (conversationId: string): Promise<MessageItem[]> => {
    const res = await client.get<MessageItem[]>(`/messages/conversations/${conversationId}/messages`);
    return res.data;
  },

  sendMessage: async (
    conversationId: string,
    content: string,
    attachments?: MessageAttachment[]
  ): Promise<MessageItem> => {
    const res = await client.post<MessageItem>(`/messages/conversations/${conversationId}/messages`, {
      content,
      attachments,
    });
    return res.data;
  },

  markRead: async (conversationId: string): Promise<{ message: string }> => {
    const res = await client.post<{ message: string }>(`/messages/conversations/${conversationId}/read`);
    return res.data;
  },

  addReaction: async (messageId: string, emoji: string): Promise<{ message: string }> => {
    const res = await client.post<{ message: string }>(`/messages/messages/${messageId}/reaction`, { emoji });
    return res.data;
  },

  searchMessages: async (query: string): Promise<MessageItem[]> => {
    const res = await client.get<MessageItem[]>('/messages/search', { params: { query } });
    return res.data;
  },

  // Message Requests (Outreach from Non-Connections)
  listRequests: async (): Promise<MessageRequestItem[]> => {
    const res = await client.get<MessageRequestItem[]>('/messages/requests');
    return res.data;
  },

  sendRequest: async (receiverId: string, initialMessage: string): Promise<MessageRequestItem> => {
    const res = await client.post<MessageRequestItem>('/messages/requests', {
      receiverId,
      initialMessage,
    });
    return res.data;
  },

  acceptRequest: async (requestId: string): Promise<ConversationItem> => {
    const res = await client.post<ConversationItem>(`/messages/requests/${requestId}/accept`);
    return res.data;
  },

  declineRequest: async (requestId: string): Promise<{ message: string }> => {
    const res = await client.post<{ message: string }>(`/messages/requests/${requestId}/decline`);
    return res.data;
  },

  reportMessage: async (payload: {
    conversationId: string;
    messageId?: string;
    reason: string;
    details?: string;
  }): Promise<{ message: string }> => {
    const res = await client.post<{ message: string }>('/messages/report', payload);
    return res.data;
  },

  // Admin APIs
  getAdminAnalytics: async (): Promise<AdminMessagingAnalytics> => {
    const res = await client.get<AdminMessagingAnalytics>('/admin/messaging/analytics');
    return res.data;
  },

  getAdminReports: async (): Promise<any[]> => {
    const res = await client.get<any[]>('/admin/messaging/reports');
    return res.data;
  },

  // WebSocket Connection Handshake
  connectWebSocket: (
    onMessage: (event: WSEvent) => void,
    onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting') => void
  ): { socket: WebSocket | null; send: (data: any) => void; close: () => void } => {
    if (typeof window === 'undefined') {
      return { socket: null, send: () => {}, close: () => {} };
    }

    let socket: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let isClosedExplicitly = false;
    let retryCount = 0;
    const maxRetries = 5;

    const connect = () => {
      if (isClosedExplicitly) return;
      if (onStatusChange) onStatusChange(retryCount === 0 ? 'connecting' : 'reconnecting');

      const token = getAccessToken() || '';
      const baseWs = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/api/v1/messages/ws';
      const wsUrl = token ? `${baseWs}?token=${encodeURIComponent(token)}` : baseWs;

      try {
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          retryCount = 0;
          if (onStatusChange) onStatusChange('connected');
        };

        socket.onmessage = (event) => {
          try {
            const data: WSEvent = JSON.parse(event.data);
            onMessage(data);
          } catch (e) {
            console.warn('Failed to parse WebSocket event payload:', event.data);
          }
        };

        socket.onclose = () => {
          if (!isClosedExplicitly) {
            if (onStatusChange) onStatusChange('disconnected');
            if (retryCount < maxRetries) {
              const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
              retryCount++;
              reconnectTimer = setTimeout(connect, delay);
            }
          }
        };

        socket.onerror = () => {
          if (socket) socket.close();
        };
      } catch (err) {
        if (onStatusChange) onStatusChange('disconnected');
      }
    };

    connect();

    return {
      get socket() {
        return socket;
      },
      send: (data: any) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(typeof data === 'string' ? data : JSON.stringify(data));
        }
      },
      close: () => {
        isClosedExplicitly = true;
        if (reconnectTimer) clearTimeout(reconnectTimer);
        if (socket) {
          socket.close();
          socket = null;
        }
        if (onStatusChange) onStatusChange('disconnected');
      },
    };
  },
};
