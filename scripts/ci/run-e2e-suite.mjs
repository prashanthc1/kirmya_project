/*
 * Runs one E2E suite the way CI runs it.
 *
 * `npm run test:e2e:suite -- auth` executes exactly the specs
 * .github/workflows/05-e2e-smoke.yml gives the auth matrix job, on the same
 * Chromium project, so a local reproduction and the CI job cannot diverge.
 * Anything after the suite name is passed through to Playwright, so
 * `-- auth --headed --project=firefox` works.
 */
import { spawn } from 'node:child_process';
import { load, specsFor, projectsFor, prSuiteIds } from './e2e-suites.mjs';

const [id, ...passthrough] = process.argv.slice(2);
const definition = load();

if (!id || id === '--help') {
  console.error('usage: npm run test:e2e:suite -- <suite> [playwright args]');
  console.error(`suites: ${definition.suites.map((s) => `${s.id}${s.pr ? '' : ' (regression only)'}`).join(', ')}`);
  console.error(`pull-request suites: ${prSuiteIds(definition).join(', ')}`);
  process.exit(1);
}

const specs = specsFor(definition, id);
// accessibility.spec.ts is testMatched only by the axe projects, so a suite
// names the projects it is meaningful on rather than assuming Chromium.
const projects = passthrough.some((arg) => arg.startsWith('--project'))
  ? []
  : projectsFor(definition, id).map((project) => `--project=${project}`);
const args = ['playwright', 'test', '--config=playwright.config.ts', ...projects, ...specs, ...passthrough];

console.log(`> npx ${args.join(' ')}`);
const child = spawn('npx', args, { stdio: 'inherit', shell: process.platform === 'win32' });
child.on('exit', (code, signal) => process.exit(signal ? 1 : code ?? 1));
