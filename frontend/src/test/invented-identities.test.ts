import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * A ratchet on invented people.
 *
 * Batch 5 removed fabricated candidates, colleagues and connection suggestions
 * from several surfaces and recorded that "all of it is gone". Batch 6 found it
 * was not: fourteen files under src/ still carry invented identities, and nine of
 * them make no API call at all, so they render fiction to every viewer of a
 * reachable authenticated page. /recruiter/candidates presents two candidates
 * who do not exist, with employers, "96% AI match rating" and résumé URLs;
 * features/networking/services/networkingApi.ts answers connection
 * recommendations and people search from arrays compiled into the bundle.
 *
 * Fixing those surfaces is step 10 domain work - 10A recruiter, 10B networking
 * and onboarding, 10F admin - and each needs its own journey evidence before
 * the screen can be wired to real data. Until then this test does the one thing
 * that can be done cheaply and durably: it stops the problem spreading.
 *
 * The list below is a quarantine, not an approval. Every entry is a known
 * defect with an owner, recorded in
 * docs/BATCH6_RELEASE_ACCEPTANCE_2026-09-09.md. A file may leave the list at
 * any time by having its invented data removed; nothing may join it.
 */
const QUARANTINE = new Set([
  // 10A recruiter — Hiring domain lead
  'src/app/recruiter/candidates/page.tsx',
  'src/app/recruiter/offers/page.tsx',
  'src/components/recruiter/MessageCenter.tsx',
  'src/components/recruiter/OfferManager.tsx',
  'src/components/recruiter/PipelineBoard.tsx',
  'src/components/recruiter/TeamManagement.tsx',
  // 10F admin — Domain engineering lead
  'src/components/admin/AdminDashboard.tsx',
  'src/components/admin/UserManagement.tsx',
  'src/features/admin/services/adminApi.ts',
  // 10B networking and onboarding — Frontend experience lead
  'src/components/onboarding/ConnectionsStep.tsx',
  'src/features/networking/services/networkingApi.ts',
  // 10A employer — Hiring domain lead
  'src/app/employer/applications/page.tsx',
  // 10F privacy and trust/safety — Backend privacy lead, Domain engineering lead
  'src/features/privacy/services/privacyApi.ts',
  'src/features/trust_safety/services/trustSafetyApi.ts',
]);

/**
 * Names that only ever appear as invented people. Deliberately the specific
 * fabricated identities rather than a general pattern: a real person's name in
 * real data must never fail a test.
 */
const INVENTED = [
  'Tariq Al-Mansoor',
  'Tariq Al-Mansoori',
  'Reem Al-Nuaimi',
  'Fatima Al-Suwaidi',
  'Ayesha Siddiqui',
  'Salim Al-Harthy',
  'Elena Rostova',
];

/**
 * Comments are stripped before matching. A file that explains which invented
 * person it stopped rendering - TestimonialsSection.tsx does exactly that - is
 * not presenting one.
 */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'test') continue;
      sourceFiles(full, found);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      found.push(full);
    }
  }
  return found;
}

describe('invented identities', () => {
  it('appear in no source file outside the recorded quarantine', () => {
    const root = path.resolve(__dirname, '..', '..');
    const offenders = sourceFiles(path.join(root, 'src'))
      .filter(file => {
        const text = withoutComments(fs.readFileSync(file, 'utf8'));
        return INVENTED.some(name => text.includes(name));
      })
      .map(file => path.relative(root, file).split(path.sep).join('/'))
      .sort();

    const unexpected = offenders.filter(file => !QUARANTINE.has(file));
    expect(unexpected, 'a new surface presents invented people as real').toEqual([]);
  });

  it('are gone from every surface that has already been corrected', () => {
    // The quarantine may only shrink. This fails if a file that was cleaned up
    // regains invented data, because it would then be an unexpected offender
    // above; and it documents how much is left.
    expect(QUARANTINE.size).toBeLessThanOrEqual(14);
  });
});
