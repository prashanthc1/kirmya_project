export interface SupportArticleCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
}

export interface SupportArticle {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category_code: string;
  tags?: string[];
  status: 'draft' | 'review' | 'published' | 'archived';
  author_id?: string;
  version: number;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id?: string;
  user_email: string;
  user_name: string;
  category: string;
  subject: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'pending' | 'in_progress' | 'waiting_for_user' | 'waiting_for_internal' | 'escalated' | 'resolved' | 'closed' | 'reopened';
  assigned_agent_id?: string;
  assigned_team: string;
  related_resource_type?: string;
  related_resource_id?: string;
  sla_due_at?: string;
  satisfaction_rating?: number;
  satisfaction_feedback?: string;
  resolved_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id?: string;
  sender_type: 'user' | 'agent' | 'system';
  message_text: string;
  is_internal_note: boolean;
  attachment_urls?: string[];
  created_at: string;
}

export interface CreateTicketPayload {
  user_email?: string;
  user_name?: string;
  category: string;
  subject: string;
  description: string;
  priority?: string;
  related_resource_type?: string;
  related_resource_id?: string;
  attachments?: string[];
}

export interface FeatureRequest {
  id: string;
  user_id?: string;
  title: string;
  category: string;
  description: string;
  status: 'submitted' | 'under_review' | 'planned' | 'in_development' | 'released' | 'declined';
  upvotes_count: number;
  created_at: string;
  updated_at: string;
}

export interface BugReport {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  steps_to_reproduce?: string;
  expected_behavior?: string;
  actual_behavior?: string;
  browser?: string;
  os?: string;
  device?: string;
  screenshot_urls?: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SupportAnalyticsSummary {
  open_tickets: number;
  unassigned_tickets: number;
  high_priority_tickets: number;
  overdue_tickets: number;
  average_first_response_time: string;
  average_resolution_time: string;
  csat_score: number;
  tickets_by_category: Record<string, number>;
}
