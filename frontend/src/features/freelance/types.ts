export interface PortfolioItem {
  title: string;
  url: string;
}

export interface FreelancerProfile {
  id: string;
  user_id: string;
  hourly_rate: number;
  tagline: string;
  skills: string[];
  portfolio_links: PortfolioItem[];
  availability_status: 'available' | 'busy';
  created_at: string;
  updated_at: string;
}

export interface Proposal {
  id: string;
  project_id: string;
  freelancer_id: string;
  freelancer_name: string;
  bid_amount: number;
  estimated_days: number;
  cover_letter: string;
  status: 'submitted' | 'accepted' | 'rejected';
  created_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  title: string;
  description: string;
  budget: number;
  budget_type: 'fixed' | 'hourly';
  skills_required: string[];
  status: 'open' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
  proposals_count?: number;
  proposals?: Proposal[];
}

export interface Contract {
  id: string;
  project_id: string;
  proposal_id: string;
  project_title: string;
  client_id: string;
  freelancer_id: string;
  total_amount: number;
  status: 'active' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface SubmitProposalPayload {
  bid_amount: number;
  estimated_days: number;
  cover_letter: string;
}

export interface CreateProjectPayload {
  title: string;
  description: string;
  budget: number;
  budget_type: 'fixed' | 'hourly';
  skills_required: string[];
}
