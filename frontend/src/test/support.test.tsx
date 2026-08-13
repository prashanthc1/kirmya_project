import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import HelpCenter from '../components/support/HelpCenter';
import ContactSupport from '../components/support/ContactSupport';
import SupportTicketList from '../components/support/SupportTicketList';
import SupportTicketDetails from '../components/support/SupportTicketDetails';
import FeedbackForm from '../components/support/FeedbackForm';
import AdminSupportDashboard from '../components/admin/support/AdminSupportDashboard';

describe('Help Center & Support Module Test Suite', () => {
  it('renders HelpCenter public knowledge base hub', () => {
    render(<HelpCenter />);
    expect(screen.getByText(/Kirmya Help & Support Center/i)).toBeInTheDocument();
    expect(screen.getByText(/Browse Knowledge Base Categories/i)).toBeInTheDocument();
    expect(screen.getByText(/Popular Knowledge Base Articles/i)).toBeInTheDocument();
  });

  it('renders ContactSupport ticket creation form', () => {
    render(<ContactSupport />);
    expect(screen.getByText(/Create Support Request/i)).toBeInTheDocument();
  });

  it('renders SupportTicketList user tickets list', () => {
    render(<SupportTicketList />);
    expect(screen.getByText(/My Support Requests/i)).toBeInTheDocument();
  });

  it('renders SupportTicketDetails conversation thread', () => {
    render(<SupportTicketDetails ticketId="tkt-101" />);
    expect(screen.getByText(/Support Conversation Thread/i)).toBeInTheDocument();
    expect(screen.getByText(/How would you rate your support experience?/i)).toBeInTheDocument();
  });

  it('renders FeedbackForm feature request & bug report form', () => {
    render(<FeedbackForm />);
    expect(screen.getByRole('heading', { name: /Submit Feature Request/i })).toBeInTheDocument();
  });

  it('renders AdminSupportDashboard executive console', () => {
    render(<AdminSupportDashboard />);
    expect(screen.getByText(/Executive Support & Help Desk Console/i)).toBeInTheDocument();
    expect(screen.getByText(/Open Tickets/i)).toBeInTheDocument();
    expect(screen.getByText(/First Response SLA/i)).toBeInTheDocument();
  });
});
