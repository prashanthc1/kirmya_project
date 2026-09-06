import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { checkResults } from './check-results.mjs';

test('mandatory report gates reject failure, skip, empty, malformed and missing evidence', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kirmya-gates-'));
  try {
    for (const kind of ['go', 'vitest', 'playwright']) {
      const file = path.join(dir, kind);
      assert.throws(() => checkResults(kind, file));
      for (const state of ['pass', 'fail', 'skip', 'empty', 'malformed']) {
        const value = kind === 'go' ? (state === 'empty' ? '' : JSON.stringify({ Test: 'fixture', Action: state })) : JSON.stringify(kind === 'playwright' ? { stats: { expected: state === 'pass' ? 1 : 0, unexpected: state === 'fail' ? 1 : 0, skipped: state === 'skip' ? 1 : 0, flaky: 0 } } : { numPassedTests: state === 'pass' ? 1 : 0, numFailedTests: state === 'fail' ? 1 : 0, numPendingTests: state === 'skip' ? 1 : 0, numTodoTests: 0 });
        fs.writeFileSync(file, state === 'malformed' ? '{' : value);
        if (state === 'pass') assert.doesNotThrow(() => checkResults(kind, file));
        else assert.throws(() => checkResults(kind, file));
      }
    }
  } finally { fs.rmSync(dir, { recursive: true }); }
});
