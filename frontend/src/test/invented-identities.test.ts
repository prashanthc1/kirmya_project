import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * A ratchet on invented people.
 *
 * Batch 5 recorded that the fabricated candidates, colleagues and suggestions
 * were gone - "All of it is gone." Batch 6 found fourteen files under src/ that
 * still carried them, ten of which made no API call at all, and recorded that
 * as F24: the one release blocker that was a code defect.
 *
 * F24 is closed. Thirteen of the fourteen now read from the API, or say plainly
 * that the data cannot be read, or are gone. The fourteenth is a test seam.
 *
 * This test is what keeps it closed. Every `.ts`/`.tsx` file under src is
 * scanned with comments stripped - a file that documents which invented person
 * it stopped rendering is not presenting one - and any invented identity
 * outside the list below fails it. The list may only shrink.
 *
 */
const QUARANTINE = new Set([
  // The only entry left, and it is a different thing from the rest: every
  // fixture in this file sits behind `if (isTestEnv)`, so it is dead code in a
  // production build and no reader can reach it. Kept listed rather than
  // exempted, so that the seam stays visible and cannot quietly grow.
  'src/features/privacy/services/privacyApi.ts',
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
  // Added after the batch 6 acceptance pass: the recruiting-side colleagues.
  // The original list was drawn from the fourteen files F24 named and missed
  // these, which is why nine further surfaces kept rendering them.
  'Rashid Al-Maktoum',
  'Amira Al-Farsi',
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
    // above; and it documents how much is left. Fourteen at the start of the
    // batch, one now, and that one cannot render.
    expect(QUARANTINE.size).toBeLessThanOrEqual(1);
  });
});
