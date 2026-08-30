import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme';
import { ChatHeader } from '../components/messaging/ChatHeader';
import { MessageBubble } from '../components/messaging/MessageBubble';
import { MessageComposer } from '../components/messaging/MessageComposer';
import { ConversationList } from '../components/messaging/ConversationList';
import { MessageReportDialog } from '../components/messaging/MessageReportDialog';
import { ConversationItem, MessageItem } from '../features/messaging/types';
import { messagingApi } from '../features/messaging/services/messagingApi';
import { authApiClient } from '../services/authService';

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(''),
  usePathname: () => '/messages',
}));

vi.mock('../services/authService', () => ({
  authApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  getAccessToken: () => 'mock-jwt-token',
}));

const theme = getTheme('light');

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('Messaging, Conversations & Real-Time Chat Experience (Prompt 20/50)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ChatHeader Component', () => {
    const mockConversation: ConversationItem = {
      id: 'conv-101',
      userId1: 'me',
      userId2: 'user-202',
      participantName: 'Salim Al-Harthy',
      participantAvatar: '',
      participantHeadline: 'Senior Infrastructure Engineer',
      participantStatus: 'online',
      lastMessageText: 'Hello there!',
      lastMessageTime: '2026-08-30T12:00:00Z',
      createdAt: '2026-08-20T10:00:00Z',
    };

    it('renders participant name, online presence, and avatar', () => {
      renderWithTheme(<ChatHeader conversation={mockConversation} />);
      expect(screen.getByText('Salim Al-Harthy')).toBeDefined();
      expect(screen.getByText('Online')).toBeDefined();
    });

    it('displays typing state when peer is typing', () => {
      renderWithTheme(<ChatHeader conversation={mockConversation} isTyping={true} />);
      expect(screen.getByText('Typing...')).toBeDefined();
    });

    it('opens options menu on click', () => {
      const mockMute = vi.fn();
      renderWithTheme(<ChatHeader conversation={mockConversation} onMute={mockMute} />);
      const moreBtn = screen.getByLabelText(/Conversation options/i);
      fireEvent.click(moreBtn);
      expect(screen.getByText(/View Public Profile/i)).toBeDefined();
      expect(screen.getByText(/Mute Notifications/i)).toBeDefined();
    });
  });

  describe('MessageBubble Component', () => {
    const outgoingMessage: MessageItem = {
      id: 'msg-1',
      conversationId: 'conv-101',
      senderId: 'me',
      content: 'Let us connect on the upcoming cloud roadmap.',
      isRead: true,
      createdAt: '2026-08-30T14:30:00Z',
    };

    const incomingMessage: MessageItem = {
      id: 'msg-2',
      conversationId: 'conv-101',
      senderId: 'user-202',
      content: 'Sounds great! I will share the architectural spec.',
      isRead: true,
      createdAt: '2026-08-30T14:32:00Z',
    };

    it('renders outgoing message content with read indicator', () => {
      renderWithTheme(<MessageBubble message={outgoingMessage} isOutgoing={true} />);
      expect(screen.getByText('Let us connect on the upcoming cloud roadmap.')).toBeDefined();
    });

    it('renders incoming message content', () => {
      renderWithTheme(<MessageBubble message={incomingMessage} isOutgoing={false} />);
      expect(screen.getByText('Sounds great! I will share the architectural spec.')).toBeDefined();
    });

    it('renders attachment chip when message contains file attachment', () => {
      const messageWithAttachment: MessageItem = {
        ...outgoingMessage,
        attachments: [
          {
            id: 'att-1',
            fileName: 'architecture_diagram.pdf',
            fileUrl: 'http://example.com/arch.pdf',
            fileSize: 204800,
          },
        ],
      };
      renderWithTheme(<MessageBubble message={messageWithAttachment} isOutgoing={true} />);
      expect(screen.getByText(/architecture_diagram.pdf/i)).toBeDefined();
    });
  });

  describe('MessageComposer Component', () => {
    it('handles message typing and submission on Enter', () => {
      const mockSend = vi.fn();
      const mockTyping = vi.fn();
      renderWithTheme(<MessageComposer onSend={mockSend} onTyping={mockTyping} />);

      const input = screen.getByLabelText(/Message input text/i);
      fireEvent.change(input, { target: { value: 'Hello Kirmya team' } });
      expect(mockTyping).toHaveBeenCalledWith(true);

      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: false });
      expect(mockSend).toHaveBeenCalledWith('Hello Kirmya team', undefined);
    });

    it('does not send whitespace-only messages', () => {
      const mockSend = vi.fn();
      renderWithTheme(<MessageComposer onSend={mockSend} />);

      const input = screen.getByLabelText(/Message input text/i);
      fireEvent.change(input, { target: { value: '   ' } });

      const sendBtn = screen.getByRole('button', { name: /Send message/i });
      expect(sendBtn).toBeDisabled();
    });
  });

  describe('ConversationList Component', () => {
    const mockConversations: ConversationItem[] = [
      {
        id: 'c1',
        userId1: 'me',
        userId2: 'u2',
        participantName: 'Amina Mansoor',
        lastMessageText: 'Can you review the candidate profile?',
        lastMessageTime: '2026-08-30T10:00:00Z',
        createdAt: '2026-08-20T10:00:00Z',
        unreadCount: 2,
        participantStatus: 'online',
      },
      {
        id: 'c2',
        userId1: 'me',
        userId2: 'u3',
        participantName: 'David Lee',
        lastMessageText: 'Thanks for the referral!',
        lastMessageTime: '2026-08-29T15:00:00Z',
        createdAt: '2026-08-15T10:00:00Z',
        unreadCount: 0,
        participantStatus: 'offline',
      },
    ];

    it('renders conversation list with participant names, message snippet, and unread badge', () => {
      const mockSelect = vi.fn();
      renderWithTheme(<ConversationList conversations={mockConversations} onSelect={mockSelect} />);

      expect(screen.getByText('Amina Mansoor')).toBeDefined();
      expect(screen.getByText('Can you review the candidate profile?')).toBeDefined();
      expect(screen.getByText('David Lee')).toBeDefined();
      expect(screen.getByText('Thanks for the referral!')).toBeDefined();
      expect(screen.getByText('2')).toBeDefined();
    });

    it('filters conversations by search term', () => {
      const mockSelect = vi.fn();
      renderWithTheme(<ConversationList conversations={mockConversations} onSelect={mockSelect} />);

      const searchInput = screen.getByLabelText(/Search conversations/i);
      fireEvent.change(searchInput, { target: { value: 'David' } });

      expect(screen.getByText('David Lee')).toBeDefined();
      expect(screen.queryByText('Amina Mansoor')).toBeNull();
    });
  });

  describe('MessageReportDialog Component', () => {
    it('allows selecting report reason and submitting report', () => {
      const mockClose = vi.fn();
      const mockSubmit = vi.fn();
      renderWithTheme(<MessageReportDialog open={true} onClose={mockClose} onSubmit={mockSubmit} />);

      expect(screen.getByText(/Report Message \/ Conversation/i)).toBeDefined();
      const submitBtn = screen.getByRole('button', { name: /Submit Report/i });
      fireEvent.click(submitBtn);

      expect(mockSubmit).toHaveBeenCalledWith('spam', '');
      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('messagingApi Methods', () => {
    it('listConversations calls GET /messages/conversations', async () => {
      const mockData = [{ id: 'conv-1' }];
      (authApiClient.get as any).mockResolvedValueOnce({ data: mockData });

      const res = await messagingApi.listConversations();
      expect(authApiClient.get).toHaveBeenCalledWith('/messages/conversations');
      expect(res).toEqual(mockData);
    });

    it('sendMessage calls POST /messages/conversations/:id/messages', async () => {
      const mockMsg = { id: 'msg-1', content: 'Testing message' };
      (authApiClient.post as any).mockResolvedValueOnce({ data: mockMsg });

      const res = await messagingApi.sendMessage('conv-1', 'Testing message');
      expect(authApiClient.post).toHaveBeenCalledWith('/messages/conversations/conv-1/messages', {
        content: 'Testing message',
        attachments: undefined,
      });
      expect(res).toEqual(mockMsg);
    });

    it('markRead calls POST /messages/conversations/:id/read', async () => {
      (authApiClient.post as any).mockResolvedValueOnce({ data: { message: 'read' } });

      const res = await messagingApi.markRead('conv-1');
      expect(authApiClient.post).toHaveBeenCalledWith('/messages/conversations/conv-1/read');
      expect(res.message).toBe('read');
    });

    it('acceptRequest calls POST /messages/requests/:id/accept', async () => {
      const mockConv = { id: 'conv-new' };
      (authApiClient.post as any).mockResolvedValueOnce({ data: mockConv });

      const res = await messagingApi.acceptRequest('req-1');
      expect(authApiClient.post).toHaveBeenCalledWith('/messages/requests/req-1/accept');
      expect(res).toEqual(mockConv);
    });
  });
});
