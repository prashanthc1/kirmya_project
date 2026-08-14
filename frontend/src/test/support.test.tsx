import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useParams: () => ({
    id: 'tkt-101',
    slug: 'create-and-optimize-kirmya-candidate-profile',
  }),
}));

import HelpCenter from '../components/support/HelpCenter';
import ContactSupport from '../components/support/ContactSupport';
import SupportTicketList from '../components/support/SupportTicketList';
import SupportTicketDetails from '../components/support/SupportTicketDetails';
import FeedbackForm from '../components/support/FeedbackForm';
import AdminSupportDashboard from '../components/admin/support/AdminSupportDashboard';

describe('Support & Help Center Module Test Suite', () => {
  it('renders HelpCenter search header and category tiles', () => {
    render(<HelpCenter />);
    expect(screen.getByText(/Kirmya Help & Support Center/i)).toBeInTheDocument();
    expect(screen.getByText(/Browse Knowledge Base Categories/i)).toBeInTheDocument();
  });

  it('renders ContactSupport form', () => {
    render(<ContactSupport />);
    expect(screen.getByText(/Create Support Request/i)).toBeInTheDocument();
  });

  it('renders SupportTicketList table', () => {
    render(<SupportTicketList />);
    expect(screen.getByText(/My Support Requests/i)).toBeInTheDocument();
  });

  it('renders SupportTicketDetails conversation thread', () => {
    render(<SupportTicketDetails ticketId="tkt-101" />);
    expect(screen.getByText(/Support Conversation Thread/i)).toBeInTheDocument();
  });

  it('renders FeedbackForm feature request and bug report tabs', () => {
    render(<FeedbackForm />);
    expect(screen.getAllByText(/Submit Feature Request/i).length).toBeGreaterThan(0);
  });

  it('renders AdminSupportDashboard executive console', () => {
    render(<AdminSupportDashboard />);
    expect(screen.getByText(/Executive Support & Help Desk Console/i)).toBeInTheDocument();
  });
});
