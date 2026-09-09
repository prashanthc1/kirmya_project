/**
 * The application stages the platform actually has.
 *
 * Four different lists existed in the web client and none of them was this one.
 * `PipelineBoard` offered "New", "Review", "Recruiter Screen", "Final
 * Interview" and "Hired"; `CandidatePipeline` offered "Screening" and
 * "Technical Round"; the ATS board and filter panel each had a fifth and sixth
 * variation. No application ever holds any of those values, so the kanban
 * columns were permanently empty — and a real candidate, whose stage is
 * "Applied", matched no column and was rendered nowhere at all. The board was
 * legible only while it was showing invented candidates carrying invented
 * stages.
 *
 * These are the values the server writes and the values its transition table
 * accepts (`UpdateOwnedApplicationStage` in the recruiter repository). A stage
 * added here without being added there will be rejected by the API, which is
 * the correct failure.
 */
export const APPLICATION_STAGES = [
  'Applied',
  'Viewed',
  'Shortlisted',
  'Interview',
  'Offer',
  'Accepted',
  'Rejected',
] as const;

export type ApplicationStage = (typeof APPLICATION_STAGES)[number];

/**
 * Which moves the server will accept, mirroring its own table. Offering a move
 * the API refuses is how a recruiter ends up watching a card slide back.
 */
const ALLOWED_TRANSITIONS: Record<string, readonly ApplicationStage[]> = {
  Applied: ['Viewed', 'Shortlisted', 'Interview', 'Rejected'],
  Viewed: ['Shortlisted', 'Interview', 'Rejected'],
  Shortlisted: ['Interview', 'Offer', 'Rejected'],
  Interview: ['Shortlisted', 'Offer', 'Rejected'],
  Offer: ['Accepted', 'Rejected'],
  Accepted: [],
  Rejected: [],
};

export function allowedNextStages(from: string): readonly ApplicationStage[] {
  return ALLOWED_TRANSITIONS[from] ?? [];
}

/** Colour per stage, so the several hand-rolled palettes agree. */
export const STAGE_COLORS: Record<ApplicationStage, string> = {
  Applied: '#6366f1',
  Viewed: '#06b6d4',
  Shortlisted: '#3b82f6',
  Interview: '#f59e0b',
  Offer: '#10b981',
  Accepted: '#16a34a',
  Rejected: '#ef4444',
};
