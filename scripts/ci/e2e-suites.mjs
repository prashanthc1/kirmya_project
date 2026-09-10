/*
 * Resolves the E2E suite partition in test/e2e/suites.json.
 *
 * One definition drives three consumers, so they cannot drift:
 *   - the smoke and full-suite workflows, which ask for a suite's spec paths,
 *   - the pull-request planner, which decides which suites a diff needs,
 *   - `validate`, which proves every spec under test/e2e is owned exactly once.
 *
 * Every command fails closed. An unknown suite, a spec named here that does not
 * exist, or a spec on disk that no suite claims is an error rather than a
 * silently smaller test run.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const definitionPath = path.join(root, 'test', 'e2e', 'suites.json');
const specDir = path.join(root, 'test', 'e2e');
const smokeWorkflow = path.join(root, '.github', 'workflows', '05-e2e-smoke.yml');

/** The parsed suite definition. */
export function load(file = definitionPath) {
  const definition = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(definition.suites) || !definition.suites.length) {
    throw new Error('suites.json defines no suites');
  }
  for (const field of ['sharedPathPatterns', 'ignoredPathPatterns']) {
    if (!Array.isArray(definition[field])) throw new Error(`suites.json defines no ${field}`);
  }
  return definition;
}

/** Repository-relative spec paths for one suite, in declaration order. */
export function specsFor(definition, id) {
  const suite = definition.suites.find((s) => s.id === id);
  if (!suite) {
    throw new Error(`unknown E2E suite "${id}"; known suites: ${definition.suites.map((s) => s.id).join(', ')}`);
  }
  return suite.specs.map((spec) => `test/e2e/${spec}`);
}

/** The Playwright projects a suite is meaningful on. */
export function projectsFor(definition, id) {
  const suite = definition.suites.find((s) => s.id === id);
  if (!suite) throw new Error(`unknown E2E suite "${id}"`);
  return suite.projects?.length ? suite.projects : ['chromium'];
}

/** The suite ids that run on pull requests. */
export function prSuiteIds(definition) {
  return definition.suites.filter((s) => s.pr).map((s) => s.id);
}

const matchesAny = (patterns, file) => patterns.some((pattern) => new RegExp(pattern).test(file));

/**
 * Decides which pull-request suites a set of changed files needs.
 *
 * Deliberately biased towards running more: anything shared, anything no suite
 * claims, and an empty or unavailable diff all select every suite. A suite that
 * runs when it did not need to costs runner minutes; one that does not run when
 * it was needed costs a regression on main. Only the paths declared in
 * ignoredPathPatterns - documentation, manifests, other workflows - may select
 * nothing at all.
 */
export function plan(definition, changedFiles, { runAllReason = '' } = {}) {
  const all = prSuiteIds(definition);
  if (runAllReason) return { suites: all, reason: runAllReason };
  if (!changedFiles.length) {
    return { suites: all, reason: 'no changed files could be determined, so every critical suite runs' };
  }

  const shared = [];
  const unattributed = [];
  const selected = new Set();

  for (const file of changedFiles) {
    // Shared first: a path that is both shared and domain-owned is shared.
    if (matchesAny(definition.sharedPathPatterns, file)) {
      shared.push(file);
      continue;
    }
    let claimed = false;
    for (const suite of definition.suites) {
      const owns =
        matchesAny(suite.pathPatterns ?? [], file) ||
        suite.specs.some((spec) => file === `test/e2e/${spec}`);
      if (!owns) continue;
      claimed = true;
      if (suite.pr) selected.add(suite.id);
    }
    if (claimed) continue;
    // Only paths declared to have no browser-visible effect may select nothing.
    if (matchesAny(definition.ignoredPathPatterns ?? [], file)) continue;
    unattributed.push(file);
  }

  if (shared.length) return { suites: all, reason: `shared or infrastructure paths changed (${sample(shared)}), so every critical suite runs` };
  // A changed file that matches nothing is an unknown blast radius, not a
  // no-op: run everything rather than guess.
  if (unattributed.length) {
    return { suites: all, reason: `changes outside every suite's declared paths (${sample(unattributed)}), so every critical suite runs` };
  }

  const suites = all.filter((id) => selected.has(id));
  return {
    suites,
    reason: suites.length
      ? `changes map to ${suites.join(', ')}`
      : 'nothing a browser can observe changed, so no pull-request suite runs',
  };
}

const sample = (files) => `${files.slice(0, 5).join(', ')}${files.length > 5 ? `, +${files.length - 5} more` : ''}`;

/** The GitHub Actions matrix for a selection, labels included. */
export function matrixFor(definition, suiteIds) {
  return {
    suite: suiteIds.map((id) => {
      const suite = definition.suites.find((s) => s.id === id);
      return { id: suite.id, label: suite.label };
    }),
  };
}

/**
 * Proves the partition is complete and unambiguous.
 *
 * Returns the list of problems rather than throwing, so a caller can report all
 * of them at once.
 */
export function validate(definition, { specFiles, workflow, projects } = {}) {
  const problems = [];
  const knownProjects = projects ?? readConfiguredProjects();
  const files =
    specFiles ?? fs.readdirSync(specDir).filter((name) => name.endsWith('.spec.ts')).sort();

  const owner = new Map();
  const ids = new Set();
  const labels = new Set();

  for (const suite of definition.suites) {
    if (!suite.id || !suite.label) problems.push(`a suite is missing an id or a label`);
    if (ids.has(suite.id)) problems.push(`duplicate suite id "${suite.id}"`);
    if (labels.has(suite.label)) problems.push(`duplicate suite label "${suite.label}"`);
    ids.add(suite.id);
    labels.add(suite.label);
    if (!Array.isArray(suite.specs) || !suite.specs.length) {
      problems.push(`suite "${suite.id}" claims no specs`);
      continue;
    }
    if (!suite.owns) problems.push(`suite "${suite.id}" documents no ownership`);
    for (const spec of suite.specs) {
      if (!files.includes(spec)) problems.push(`suite "${suite.id}" claims "${spec}", which is not a spec under test/e2e`);
      if (owner.has(spec)) problems.push(`"${spec}" is claimed by both "${owner.get(spec)}" and "${suite.id}"`);
      else owner.set(spec, suite.id);
    }
    if (!Array.isArray(suite.projects) || !suite.projects.length) {
      problems.push(`suite "${suite.id}" names no Playwright projects`);
    } else {
      for (const project of suite.projects) {
        if (!knownProjects.includes(project)) problems.push(`suite "${suite.id}" names unknown Playwright project "${project}"`);
      }
    }
    for (const pattern of suite.pathPatterns ?? []) {
      try {
        new RegExp(pattern);
      } catch {
        problems.push(`suite "${suite.id}" has an invalid pathPattern "${pattern}"`);
      }
    }
  }

  for (const [field, patterns] of [
    ['sharedPathPatterns', definition.sharedPathPatterns],
    ['ignoredPathPatterns', definition.ignoredPathPatterns ?? []],
  ]) {
    for (const pattern of patterns) {
      try {
        new RegExp(pattern);
      } catch {
        problems.push(`invalid ${field} entry "${pattern}"`);
      }
    }
  }

  for (const file of files) {
    if (!owner.has(file)) problems.push(`"${file}" is orphaned: no suite runs it, so it runs nowhere in CI`);
  }

  if (!prSuiteIds(definition).length) problems.push('no suite runs on pull requests');

  // The smoke workflow builds its matrix from this file at run time, so there
  // is no second copy of the suite list to drift - but the workflow does have
  // to still be reading it.
  const yaml = workflow ?? (fs.existsSync(smokeWorkflow) ? fs.readFileSync(smokeWorkflow, 'utf8') : null);
  if (yaml !== null && !yaml.includes('e2e-suites.mjs plan')) {
    problems.push('05-e2e-smoke.yml no longer builds its matrix from e2e-suites.mjs plan');
  }

  return problems;
}

/**
 * The project names playwright.config.ts declares, read as text rather than by
 * importing it: this script runs before dependencies are installed in the plan
 * job, and importing the config would need @playwright/test.
 */
function readConfiguredProjects(file = path.join(root, 'playwright.config.ts')) {
  if (!fs.existsSync(file)) return [];
  return [...fs.readFileSync(file, 'utf8').matchAll(/\{\s*name:\s*'([^']+)'/g)].map((m) => m[1]);
}

function emit(name, value) {
  const file = process.env.GITHUB_OUTPUT;
  // A newline in a value would end the assignment early and corrupt every
  // output after it, so paths quoted into a reason are flattened first.
  if (file) fs.appendFileSync(file, `${name}=${String(value).replaceAll(/[\r\n]+/g, ' ')}\n`);
}

function main(argv) {
  const [command, ...rest] = argv;
  const definition = load();

  switch (command) {
    case 'specs': {
      process.stdout.write(`${specsFor(definition, rest[0]).join(' ')}\n`);
      return 0;
    }
    case 'list': {
      const suites = rest.includes('--pr') ? definition.suites.filter((s) => s.pr) : definition.suites;
      process.stdout.write(`${suites.map((s) => s.id).join('\n')}\n`);
      return 0;
    }
    case 'validate': {
      const problems = validate(definition);
      if (problems.length) {
        for (const problem of problems) console.error(`::error::${problem}`);
        return 1;
      }
      const owned = definition.suites.reduce((n, s) => n + s.specs.length, 0);
      console.log(`E2E suite map is complete: ${owned} specs across ${definition.suites.length} suites, ${prSuiteIds(definition).length} of them on pull requests.`);
      return 0;
    }
    case 'plan': {
      const changedIndex = rest.indexOf('--changed');
      const runAll = rest.includes('--all');
      let changed = [];
      if (!runAll) {
        if (changedIndex === -1) throw new Error('plan needs --changed <file> or --all');
        const file = rest[changedIndex + 1];
        changed = fs.existsSync(file)
          ? fs.readFileSync(file, 'utf8').split('\n').map((line) => line.trim()).filter(Boolean)
          : [];
      }
      const requested = rest.includes('--only') ? rest[rest.indexOf('--only') + 1] : '';
      let result = plan(definition, changed, {
        runAllReason: runAll ? 'the full critical set was requested' : '',
      });
      if (requested && requested !== 'all') {
        const wanted = requested.split(',').map((id) => id.trim()).filter(Boolean);
        const unknown = wanted.filter((id) => !prSuiteIds(definition).includes(id));
        if (unknown.length) throw new Error(`unknown suite(s) requested: ${unknown.join(', ')}`);
        result = { suites: wanted, reason: `explicitly requested: ${wanted.join(', ')}` };
      }
      console.log(`${result.reason}\nselected: ${result.suites.join(', ') || '(none)'}`);
      emit('suites', JSON.stringify(result.suites));
      emit('count', String(result.suites.length));
      // An empty matrix vector is a workflow error rather than an empty run, so
      // the job that consumes this is gated on count instead.
      emit('matrix', JSON.stringify(matrixFor(definition, result.suites)));
      emit('reason', result.reason);
      return 0;
    }
    default:
      console.error('usage: e2e-suites.mjs <specs <id> | list [--pr] | validate | plan (--all | --changed <file>) [--only <ids>]>');
      return 1;
  }
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/e2e-suites.mjs')) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    console.error(`::error::${error.message}`);
    process.exitCode = 1;
  }
}
