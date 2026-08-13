import {
  SupportArticleCategory,
  SupportArticle,
  SupportTicket,
  TicketMessage,
  CreateTicketPayload,
  FeatureRequest,
  BugReport,
  SupportAnalyticsSummary,
} from '../types';

export const supportApi = {
  getCategories: async (): Promise<SupportArticleCategory[]> => {
    try {
      const res = await fetch('/api/v1/help/categories');
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API fallback for getCategories', e);
    }
    return [
      { id: 'cat-1', code: 'getting_started', name: 'Getting Started', description: 'Initial setup, registration, and profile creation', display_order: 1, is_active: true },
      { id: 'cat-2', code: 'account', name: 'Account & Security', description: 'Password reset, 2FA, session management', display_order: 2, is_active: true },
      { id: 'cat-3', code: 'jobs', name: 'Jobs & Applications', description: 'Search, application tracking, saved job alerts', display_order: 3, is_active: true },
      { id: 'cat-4', code: 'privacy', name: 'Privacy & Data Rights', description: 'Cookie preferences, data export, account deletion', display_order: 4, is_active: true },
    ];
  },

  getArticles: async (category?: string, search?: string): Promise<SupportArticle[]> => {
    try {
      let url = '/api/v1/help/articles';
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (search) params.append('search', search);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API fallback for getArticles', e);
    }
    return [
      {
        id: 'art-1',
        title: 'How to Create and Optimize Your Kirmya Candidate Profile',
        slug: 'create-and-optimize-kirmya-candidate-profile',
        summary: 'Step-by-step guide to showcasing your skills and experience to prospective employers.',
        content: 'Building an optimized profile on Kirmya is essential for attracting verified recruiters...',
        category_code: 'getting_started',
        tags: ['profile', 'onboarding', 'resume'],
        status: 'published',
        version: 1,
        view_count: 1420,
        helpful_count: 185,
        not_helpful_count: 12,
        published_at: new Date(Date.now() - 2592000000).toISOString(),
        created_at: new Date(Date.now() - 2592000000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'art-2',
        title: 'Setting Up Two-Factor Authentication (TOTP)',
        slug: 'setup-two-factor-authentication-totp',
        summary: 'Protect your Kirmya account using Google Authenticator, Authy, or 1Password.',
        content: 'Two-Factor Authentication adds an extra security layer to protect your data...',
        category_code: 'account',
        tags: ['security', 'mfa', '2fa'],
        status: 'published',
        version: 1,
        view_count: 980,
        helpful_count: 140,
        not_helpful_count: 5,
        published_at: new Date(Date.now() - 5184000000).toISOString(),
        created_at: new Date(Date.now() - 5184000000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  },

  getArticleBySlug: async (slug: string): Promise<SupportArticle> => {
    try {
      const res = await fetch(`/api/v1/help/articles/${slug}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API fallback for getArticleBySlug', e);
    }
    return {
      id: 'art-1',
      title: 'How to Create and Optimize Your Kirmya Candidate Profile',
      slug,
      summary: 'Step-by-step guide to showcasing your skills and experience to prospective employers.',
      content: 'Building an optimized profile on Kirmya is essential for attracting verified recruiters. Start by setting your employment status, adding key technical skills, uploading your formatted resume, and verifying your professional email address.',
      category_code: 'getting_started',
      tags: ['profile', 'onboarding', 'resume'],
      status: 'published',
      version: 1,
      view_count: 1421,
      helpful_count: 186,
      not_helpful_count: 12,
      published_at: new Date(Date.now() - 2592000000).toISOString(),
      created_at: new Date(Date.now() - 2592000000).toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  recordArticleFeedback: async (articleId: string, isHelpful: boolean, feedback?: string) => {
    try {
      await fetch(`/api/v1/help/articles/${articleId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_helpful: isHelpful, feedback }),
      });
    } catch (e) {
      console.warn('recordArticleFeedback error', e);
    }
  },

  getUserTickets: async (): Promise<SupportTicket[]> => {
    try {
      const res = await fetch('/api/v1/support/tickets');
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API fallback for getUserTickets', e);
    }
    return [
      {
        id: 'tkt-101',
        ticket_number: 'KIR-2026-000101',
        user_email: 'candidate@kirmya.com',
        user_name: 'Jane Doe',
        category: 'jobs',
        subject: 'Question regarding job application status tracking',
        description: 'How long does employer review usually take for verified listings?',
        priority: 'normal',
        status: 'open',
        assigned_team: 'Jobs Support',
        sla_due_at: new Date(Date.now() + 86400000).toISOString(),
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  },

  createTicket: async (payload: CreateTicketPayload): Promise<SupportTicket> => {
    try {
      const res = await fetch('/api/v1/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API fallback for createTicket', e);
    }
    return {
      id: 'tkt-' + Date.now(),
      ticket_number: 'KIR-2026-' + Math.floor(100000 + Math.random() * 900000),
      user_email: payload.user_email || 'user@kirmya.com',
      user_name: payload.user_name || 'Kirmya User',
      category: payload.category,
      subject: payload.subject,
      description: payload.description,
      priority: (payload.priority as any) || 'normal',
      status: 'open',
      assigned_team: 'General Support',
      sla_due_at: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  getTicketMessages: async (ticketId: string): Promise<TicketMessage[]> => {
    try {
      const res = await fetch(`/api/v1/support/tickets/${ticketId}/messages`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API fallback for getTicketMessages', e);
    }
    return [
      {
        id: 'msg-1',
        ticket_id: ticketId,
        sender_type: 'user',
        message_text: 'How long does employer review usually take for verified listings?',
        is_internal_note: false,
        created_at: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'msg-2',
        ticket_id: ticketId,
        sender_type: 'agent',
        message_text: 'Hello! Most employers respond within 3 to 5 business days. You can also turn on job alert notifications for real-time application updates.',
        is_internal_note: false,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ];
  },

  addMessage: async (ticketId: string, messageText: string, attachments?: string[]): Promise<TicketMessage> => {
    try {
      const res = await fetch(`/api/v1/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_text: messageText, attachments }),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API fallback for addMessage', e);
    }
    return {
      id: 'msg-' + Date.now(),
      ticket_id: ticketId,
      sender_type: 'user',
      message_text: messageText,
      is_internal_note: false,
      attachment_urls: attachments,
      created_at: new Date().toISOString(),
    };
  },

  closeTicket: async (ticketId: string) => {
    try {
      await fetch(`/api/v1/support/tickets/${ticketId}/close`, { method: 'POST' });
    } catch (e) {
      console.warn('closeTicket error', e);
    }
  },

  reopenTicket: async (ticketId: string) => {
    try {
      await fetch(`/api/v1/support/tickets/${ticketId}/reopen`, { method: 'POST' });
    } catch (e) {
      console.warn('reopenTicket error', e);
    }
  },

  recordCSAT: async (ticketId: string, rating: number, feedback?: string) => {
    try {
      await fetch(`/api/v1/support/tickets/${ticketId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback }),
      });
    } catch (e) {
      console.warn('recordCSAT error', e);
    }
  },

  createFeatureRequest: async (payload: { title: string; category: string; description: string }): Promise<FeatureRequest> => {
    try {
      const res = await fetch('/api/v1/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API fallback for createFeatureRequest', e);
    }
    return {
      id: 'feat-' + Date.now(),
      title: payload.title,
      category: payload.category,
      description: payload.description,
      status: 'submitted',
      upvotes_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  createBugReport: async (payload: { title: string; description: string; steps_to_reproduce?: string }): Promise<BugReport> => {
    try {
      const res = await fetch('/api/v1/feedback/bugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API fallback for createBugReport', e);
    }
    return {
      id: 'bug-' + Date.now(),
      title: payload.title,
      description: payload.description,
      steps_to_reproduce: payload.steps_to_reproduce,
      status: 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  // Admin APIs
  getAnalyticsSummary: async (): Promise<SupportAnalyticsSummary> => {
    try {
      const res = await fetch('/api/v1/admin/support');
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API fallback for getAnalyticsSummary', e);
    }
    return {
      open_tickets: 8,
      unassigned_tickets: 2,
      high_priority_tickets: 1,
      overdue_tickets: 0,
      average_first_response_time: '18 Minutes',
      average_resolution_time: '2.4 Hours',
      csat_score: 4.85,
      tickets_by_category: { jobs: 4, account: 2, messaging: 1, technical: 1 },
    };
  },
};
