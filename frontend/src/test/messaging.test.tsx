import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ConversationList from '../components/messaging/ConversationList';
import MessageComposer from '../components/messaging/MessageComposer';
import MessageReportDialog from '../components/messaging/MessageReportDialog';
import AdminMessagingView from '../components/admin/messaging/AdminMessagingView';

describe('Messaging & Real-Time Module Test Suite', () => {
  const dummyConv: any = {
    id: 'c1',
    userId1: 'u1',
    userId2: 'u2',
    lastMessageText: 'Hello from Kirmya',
    lastMessageTime: new Date().toISOString(),
    participantName: 'Fatima Al-Suwaidi',
    unreadCount: 1,
  };

  it('renders ConversationList item with participant name and preview text', () => {
    render(<ConversationList conversations={[dummyConv]} onSelect={() => {}} />);
    expect(screen.getByText(/Fatima Al-Suwaidi/i)).toBeInTheDocument();
    expect(screen.getByText(/Hello from Kirmya/i)).toBeInTheDocument();
  });

  it('renders MessageComposer input and send action', () => {
    render(<MessageComposer onSend={() => {}} />);
    expect(screen.getByPlaceholderText(/Write a message/i)).toBeInTheDocument();
  });

  it('renders MessageReportDialog modal', () => {
    render(<MessageReportDialog open={true} onClose={() => {}} onSubmit={() => {}} />);
    expect(screen.getByText(/Report (Message|Conversation)/i)).toBeInTheDocument();
    expect(screen.getByText(/Submit Report/i)).toBeInTheDocument();
  });

  it('renders AdminMessagingView control desk', () => {
    render(<AdminMessagingView />);
    expect(screen.getByText(/Admin Real-Time Messaging & Safety Desk/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Active Conversations/i)).toBeInTheDocument();
  });
});
