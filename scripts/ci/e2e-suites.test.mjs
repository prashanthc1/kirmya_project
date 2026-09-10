/*
 * The suite partition is what stands between a spec and never running at all,
 * so these assert the two properties that matter: the real definition owns
 * every spec on disk exactly once, and the planner errs towards running more.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, plan, matrixFor, specsFor, projectsFor, prSuiteIds, validate } from './e2e-suites.mjs';

const definition = load();

test('the real suite definition owns every spec exactly once, with no orphans', () => {
  assert.deepEqual(validate(definition), []);
});

test('every pull-request suite resolves to spec paths and a known project', () => {
  for (const id of prSuiteIds(definition)) {
    const specs = specsFor(definition, id);
    assert.ok(specs.length, `${id} resolved to no specs`);
    for (const spec of specs) assert.match(spec, /^test\/e2e\/[\w.-]+\.spec\.ts$/);
    assert.ok(projectsFor(definition, id).length, `${id} names no projects`);
  }
});

test('an unknown suite is an error rather than an empty run', () => {
  assert.throws(() => specsFor(definition, 'does-not-exist'), /unknown E2E suite/);
});

test('a domain change runs the suites that own it, plus the real-backend guard', () => {
  // api-critical claims every backend/ and frontend/ path on purpose: it is the
  // spec that proves the shipped bundle addresses one real API base, and that
  // claim is not owned by any one domain.
  const { suites } = plan(definition, ['frontend/src/components/auth/SignInForm.tsx']);
  assert.deepEqual(suites, ['auth', 'api-critical']);

  const jobs = plan(definition, ['backend/internal/jobs/service.go']);
  assert.deepEqual(jobs.suites, ['jobs-recruiting', 'api-critical']);

  const social = plan(definition, ['frontend/src/features/messaging/useThread.ts']);
  assert.deepEqual(social.suites, ['social-workspace', 'api-critical']);
});

test('editing a spec runs the suite that owns it, and nothing else', () => {
  // test/e2e paths are outside api-critical's backend/frontend claim, so this
  // is the case that proves the mapping is genuinely selective.
  assert.deepEqual(plan(definition, ['test/e2e/workspace-switcher.spec.ts']).suites, ['social-workspace']);
  assert.deepEqual(plan(definition, ['test/e2e/jobs.spec.ts']).suites, ['jobs-recruiting']);
  assert.deepEqual(plan(definition, ['test/e2e/real-api.spec.ts']).suites, ['api-critical']);
});

test('a regression-only spec selects no pull-request suite', () => {
  const { suites } = plan(definition, ['test/e2e/accessibility.spec.ts']);
  assert.deepEqual(suites, []);
});

test('shared, infrastructure and unattributed changes run every critical suite', () => {
  const all = prSuiteIds(definition);
  for (const file of [
    'backend/internal/shared/middleware/auth.go',
    'backend/internal/auth/service.go',
    'backend/scripts/migrations/0042_add_column.sql',
    'frontend/src/components/shell/AppShell.tsx',
    'frontend/src/services/api.ts',
    'frontend/src/shared/routes.ts',
    'frontend/src/app/layout.tsx',
    'playwright.config.ts',
    'test/e2e/helpers.ts',
    'test/e2e/suites.json',
    '.github/workflows/05-e2e-smoke.yml',
    'scripts/ci/e2e-suites.mjs',
    'package-lock.json',
    'some/unmapped/path.txt',
  ]) {
    assert.deepEqual(plan(definition, [file]).suites, all, `${file} should have selected every suite`);
  }
});

test('an undeterminable diff runs every critical suite', () => {
  assert.deepEqual(plan(definition, []).suites, prSuiteIds(definition));
  assert.deepEqual(plan(definition, ['frontend/src/components/auth/x.tsx'], { runAllReason: 'dispatch' }).suites, prSuiteIds(definition));
});

test('validate reports an orphaned spec rather than passing silently', () => {
  const problems = validate(definition, {
    specFiles: [...definition.suites.flatMap((s) => s.specs), 'brand-new.spec.ts'],
  });
  assert.ok(problems.some((p) => p.includes('brand-new.spec.ts') && p.includes('orphaned')), problems.join('\n'));
});

test('validate reports a spec claimed by two suites', () => {
  const doubled = structuredClone(definition);
  doubled.suites[1].specs = [...doubled.suites[1].specs, doubled.suites[0].specs[0]];
  const problems = validate(doubled, { specFiles: doubled.suites.flatMap((s) => s.specs) });
  assert.ok(problems.some((p) => p.includes('is claimed by both')), problems.join('\n'));
});

test('validate notices if the smoke workflow stops building its matrix from here', () => {
  const problems = validate(definition, { workflow: 'name: 05 E2E Browser Smoke\n' });
  assert.ok(problems.some((p) => p.includes('no longer builds its matrix')), problems.join('\n'));
});

test('a documentation-only change selects nothing', () => {
  for (const file of [
    'docs/ci/e2e.md',
    'README.md',
    'k8s/deployment.yaml',
    'monitoring/dashboard.json',
    'mobile/App.tsx',
    '.github/workflows/07-security.yml',
  ]) {
    assert.deepEqual(plan(definition, [file]).suites, [], `${file} should have selected nothing`);
  }
});

test('one browser-visible path in a documentation change still selects its suite', () => {
  const { suites } = plan(definition, ['docs/ci/e2e.md', 'frontend/src/app/jobs/page.tsx']);
  assert.deepEqual(suites, ['jobs-recruiting', 'api-critical']);
});

test('the matrix carries an id and a label for every selected suite', () => {
  const matrix = matrixFor(definition, prSuiteIds(definition));
  assert.equal(matrix.suite.length, prSuiteIds(definition).length);
  for (const entry of matrix.suite) {
    assert.ok(entry.id && entry.label, JSON.stringify(entry));
    assert.deepEqual(Object.keys(entry).sort(), ['id', 'label']);
  }
  // Empty stays empty: the workflow gates on the count rather than shipping an
  // empty matrix vector, which GitHub rejects.
  assert.deepEqual(matrixFor(definition, []).suite, []);
});
