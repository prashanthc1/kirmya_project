import type {
  ContractStatus,
  DisputeOutcome,
  DisputeReason,
  DisputeStatus,
  MilestoneStatus,
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
