import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/v1';
const MOCK_USER_ID = '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config: any) => {
  config.headers.Authorization = `Bearer ${MOCK_USER_ID}`;
  return config;
});

export const messagingApi = {
  getMockUserId: () => MOCK_USER_ID,

  listConversations: async () => {
    const response = await client.get('/messaging/conversations');
    return response.data;
  },

  getOrCreateConversation: async (participantId: string) => {
    const response = await client.post('/messaging/conversations', { participantId });
    return response.data;
  },

  listMessages: async (conversationId: string) => {
    const response = await client.get(`/messaging/conversations/${conversationId}/messages`);
    return response.data;
  },

  sendMessage: async (conversationId: string, content: string, attachments?: any[]) => {
    const response = await client.post(`/messaging/conversations/${conversationId}/messages`, { content, attachments });
    return response.data;
  },

  // WebSocket Connection Handshake
  connectWebSocket: (onMessage: (data: any) => void): WebSocket => {
    // Note: Standard browser WebSockets do not support sending custom headers.
    // In production, token authentication is passed via query params or subprotocols.
    const wsUrl = `ws://localhost:8080/api/v1/messaging/ws?token=${MOCK_USER_ID}`;
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
