import type {
  ContractStatus,
  DisputeOutcome,
  DisputeReason,
  DisputeStatus,
  MilestoneStatus,
  PayoutAccountStatus,
  PayoutStatus,
  PersonRef,
} from '../../features/freelance/types';

type ChipColor = 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';

/**
 * An amount in its own currency's precision: AED and USD to two places, KWD to
 * three, JPY to none. Escrow shows exact money, so it never rounds to whole
 * units the way salary ranges do.
 */
export function formatMoney(amount: number | null | undefined, currency: string): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '—';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(amount);
  } catch {
    // An unknown code is shown as the server sent it rather than guessed at.
    return `${currency} ${amount}`;
  }
}

export function formatDate(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const MILESTONE_STATUS: Record<MilestoneStatus, { label: string; color: ChipColor }> = {
  pending: { label: 'Awaiting payment', color: 'default' },
  funded: { label: 'Funded', color: 'info' },
  in_progress: { label: 'In progress', color: 'info' },
  submitted: { label: 'Awaiting review', color: 'warning' },
  approved: { label: 'Approved', color: 'success' },
  released: { label: 'Paid', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'default' },
  disputed: { label: 'In dispute', color: 'error' },
};

export const CONTRACT_STATUS: Record<ContractStatus, { label: string; color: ChipColor }> = {
  pending: { label: 'Awaiting first payment', color: 'default' },
  active: { label: 'Active', color: 'info' },
  in_progress: { label: 'In progress', color: 'info' },
  submitted: { label: 'Awaiting review', color: 'warning' },
  revision_requested: { label: 'Changes requested', color: 'warning' },
  completed: { label: 'Completed', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'default' },
  disputed: { label: 'In dispute', color: 'error' },
};

export const DISPUTE_STATUS: Record<DisputeStatus, { label: string; color: ChipColor }> = {
  open: { label: 'Open', color: 'error' },
  under_review: { label: 'Under review', color: 'warning' },
  awaiting_evidence: { label: 'Awaiting evidence', color: 'warning' },
  escalated: { label: 'Escalated', color: 'error' },
  resolved: { label: 'Resolved', color: 'success' },
  withdrawn: { label: 'Withdrawn', color: 'default' },
};

export const DISPUTE_REASONS: Record<DisputeReason, string> = {
  work_not_delivered: 'Work not delivered',
  quality: 'Quality of the work',
  scope: 'Disagreement about scope',
  unresponsive: 'The other party is unresponsive',
  other: 'Something else',
};

export const DISPUTE_OUTCOMES: Record<DisputeOutcome, { label: string; explanation: string }> = {
  release_to_freelancer: {
    label: 'Release to the freelancer',
    explanation: 'The escrowed money is paid to the freelancer, as if the client had approved the work.',
  },
  refund_to_client: {
    label: 'Refund the client',
    explanation: 'The escrowed money is returned to the client and the milestone is cancelled.',
  },
  resume_work: {
    label: 'Resume work',
    explanation: 'No money moves. The milestone goes back to in progress and the freelancer continues.',
  },
};

export const PAYOUT_STATUS: Record<PayoutStatus, { label: string; color: ChipColor }> = {
  pending: { label: 'Waiting to be sent', color: 'default' },
  processing: { label: 'Sending', color: 'info' },
  paid: { label: 'Sent', color: 'success' },
  failed: { label: 'Delayed', color: 'warning' },
  cancelled: { label: 'Cancelled', color: 'default' },
};

export const PAYOUT_ACCOUNT_STATUS: Record<PayoutAccountStatus, { label: string; color: ChipColor; explanation: string }> = {
  not_started: {
    label: 'Not set up',
    color: 'default',
    explanation: 'Set up payouts to receive the money clients release to you.',
  },
  onboarding: {
    label: 'Setup not finished',
    color: 'warning',
    explanation: 'Finish setting up with our payment processor to receive payouts.',
  },
  action_required: {
    label: 'Action required',
    color: 'error',
    explanation: 'Our payment processor needs more information from you before it can pay you.',
  },
  in_review: {
    label: 'Being verified',
    color: 'info',
    explanation: 'Your details are with our payment processor for verification. Payouts start when it is done.',
  },
  enabled: {
    label: 'Active',
    color: 'success',
    explanation: 'Released milestones are sent to your payout account automatically.',
  },
};

/**
 * How an administrator's screen names an account: by name, else by email,
 * else by the start of its id - never by nothing.
 */
export function personLabel(person: PersonRef | undefined, fallbackID?: string): string {
  if (person?.name?.trim()) return person.name.trim();
  if (person?.email) return person.email;
  const id = person?.id || fallbackID;
  return id ? `Account ${id.slice(0, 8)}` : 'Unknown account';
}
