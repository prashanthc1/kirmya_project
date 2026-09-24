export interface PortfolioItem {
  title: string;
  url: string;
}

/**
 * The freelancer capability lifecycle, as the server resolves it.
 *
 * 'none' means the account has never started onboarding. Freelancing is not the
 * same as having a Kirmya account, and it is not the same as having a freelancer
 * profile row either - a saved draft is 'pending' until onboarding completes.
 */
export type FreelancerCapability = 'none' | 'pending' | 'active' | 'suspended';

export interface SaveFreelancerProfilePayload {
  hourly_rate: number;
  tagline: string;
  skills: string[];
  portfolio_links?: PortfolioItem[];
}

export interface FreelancerOnboardingStatus {
  capability: FreelancerCapability;
  /** Profile fields still required before the capability can be activated. */
  missing?: string[];
  profile?: FreelancerProfile;
}

export interface FreelancerProfile {
  id: string;
  user_id: string;
  capability_status: FreelancerCapability;
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

/**
 * A contract's lifecycle, as the server's CHECK constraint lists it. The escrow
 * flow keeps a working contract in 'active'; 'disputed' while a dispute is open.
 */
export type ContractStatus =
  | 'pending'
  | 'active'
  | 'in_progress'
  | 'submitted'
  | 'revision_requested'
  | 'completed'
  | 'cancelled'
  | 'disputed';

/**
 * Amounts are decimal major units of `currency` (1000.5 is AED 1,000.50): the
 * server stores minor units and converts at the edge, so they arrive exact.
 */
export interface Contract {
  id: string;
  project_id: string;
  proposal_id: string;
  project_title: string;
  client_id: string;
  freelancer_id: string;
  total_amount: number;
  currency: string;
  status: ContractStatus;
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

/* ---------------------------------------------------------------------------
 * Escrow: a contract's milestones and the money that funds them.
 * ------------------------------------------------------------------------- */

export type MilestoneStatus =
  | 'pending'
  | 'funded'
  | 'in_progress'
  | 'submitted'
  | 'approved'
  | 'released'
  | 'cancelled'
  | 'disputed';

export interface ContractMilestone {
  id: string;
  contract_id: string;
  position: number;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  status: MilestoneStatus;
  due_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

/** Where a contract's money stands. Computed by the server from the milestones. */
export interface EscrowSummary {
  currency: string;
  contract_total: number;
  allocated: number;
  unallocated: number;
  in_escrow: number;
  released: number;
}

export interface ContractDetail extends Contract {
  milestones: ContractMilestone[];
  escrow: EscrowSummary;
}

export type PaymentIntentStatus =
  | 'requires_payment'
  | 'processing'
  | 'held_in_escrow'
  | 'released'
  | 'refunded'
  | 'failed'
  | 'cancelled';

export interface PaymentIntent {
  id: string;
  contract_id: string;
  milestone_id?: string;
  amount: number;
  currency: string;
  status: PaymentIntentStatus;
  provider?: string;
  provider_reference?: string;
  created_at: string;
}

/**
 * What funding a milestone returns. It is a request, not a payment: the
 * milestone becomes funded only when the processor confirms the money.
 */
export interface FundingResult {
  payment_intent: PaymentIntent;
  /** Where the processor collects the payment, when it uses a hosted page. */
  checkout_url?: string;
}

export interface CreateMilestonePayload {
  title: string;
  description?: string;
  amount: number;
  due_at?: string;
}

export interface SubmitMilestonePayload {
  summary: string;
  attachments?: string[];
}

/* ---------------------------------------------------------------------------
 * Disputes and refunds.
 * ------------------------------------------------------------------------- */

export type DisputeReason = 'work_not_delivered' | 'quality' | 'scope' | 'unresponsive' | 'other';

export type DisputeStatus =
  | 'open'
  | 'under_review'
  | 'awaiting_evidence'
  | 'resolved'
  | 'withdrawn'
  | 'escalated';

export type DisputeOutcome = 'release_to_freelancer' | 'refund_to_client' | 'resume_work';

export interface Dispute {
  id: string;
  contract_id: string;
  milestone_id?: string;
  raised_by: string;
  reason: DisputeReason;
  detail: string;
  status: DisputeStatus;
  outcome?: DisputeOutcome;
  resolution?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export type EvidenceKind = 'note' | 'link' | 'file';

export interface DisputeEvidence {
  id: string;
  dispute_id: string;
  uploaded_by: string;
  kind: EvidenceKind;
  body: string;
  file_url?: string;
  created_at: string;
}

export interface DisputeDetail extends Dispute {
  milestone?: ContractMilestone;
  evidence: DisputeEvidence[];
}

export interface OpenDisputePayload {
  reason: DisputeReason;
  detail: string;
}

export interface AddEvidencePayload {
  kind: EvidenceKind;
  body?: string;
  file_url?: string;
}

export interface ResolveDisputePayload {
  outcome: DisputeOutcome;
  resolution: string;
}

/** Statuses in which a dispute still awaits a decision. */
export const OPEN_DISPUTE_STATUSES: DisputeStatus[] = ['open', 'under_review', 'awaiting_evidence', 'escalated'];

/* ----- Payouts. ----- */

export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';

/** Money released to a freelancer, on its way to their payout account. */
export interface Payout {
  id: string;
  contract_id?: string;
  milestone_id?: string;
  payee_id: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  attempts: number;
  next_attempt_at?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

/** A payout as the administrator's queue shows it. */
export interface AdminPayout extends Payout {
  provider?: string;
  provider_reference?: string;
  last_error?: string;
  destination_account?: string;
  payee?: PersonRef;
  project_title?: string;
}

export type PayoutAccountStatus = 'not_started' | 'onboarding' | 'action_required' | 'in_review' | 'enabled';

export interface PayoutAccountView {
  /** False when this deployment cannot send payouts at all. */
  available: boolean;
  status: PayoutAccountStatus;
  account?: {
    provider: string;
    details_submitted: boolean;
    payouts_enabled: boolean;
    transfers_active: boolean;
    requirements_due: boolean;
    disabled_reason?: string;
  };
  /** Released and not yet paid, per currency. */
  waiting: Record<string, number>;
}

export interface PayoutOnboarding {
  /** The processor's onboarding page; absent when there is nothing to fill in. */
  url?: string;
  account: PayoutAccountView;
}

export interface Paginated<T> {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
  data: T[];
}

/* ----- Administrative views: the names behind the ids. ----- */

/** An account as an administrator sees it. name is empty when the account has none. */
export interface PersonRef {
  id: string;
  name: string;
  email: string;
}

export interface ContractSummary {
  id: string;
  project_title: string;
  client: PersonRef;
  freelancer: PersonRef;
}

export interface AdminDispute extends Dispute {
  contract?: ContractSummary;
  raised_by_person?: PersonRef;
}

export interface AdminDisputeDetail extends DisputeDetail {
  contract?: ContractSummary;
  raised_by_person?: PersonRef;
}
