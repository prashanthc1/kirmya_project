export interface MessageAttachment {
  id: string;
  messageId?: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  createdAt?: string;
}

export interface MessageReaction {
  id?: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt?: string;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
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
  participantId?: string;
  participantUsername?: string;
  participantName?: string;
  participantAvatar?: string;
  participantHeadline?: string;
  participantStatus?: 'online' | 'offline' | string;
  lastSeen?: string;
}

export interface MessageRequestItem {
  id: string;
  senderId: string;
  senderUsername?: string;
  senderName?: string;
  senderHeadline?: string;
  senderAvatar?: string;
  receiverId: string;
  initialMessage: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked' | string;
  createdAt: string;
  updatedAt?: string;
}

export interface WSEvent {
  type: 'chat' | 'typing' | 'presence' | 'read' | 'request' | string;
  id?: string;
  conversationId?: string;
  senderId?: string;
  receiverId?: string;
  content?: string;
  isTyping?: boolean;
  status?: string;
  attachments?: MessageAttachment[];
  timestamp?: string;
}

export interface AdminMessagingAnalytics {
  totalConversationsCount: number;
  totalMessagesSent: number;
  pendingRequestsCount: number;
  reportedMessagesCount: number;
}
