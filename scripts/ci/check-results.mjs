import fs from 'node:fs';

// Fail closed: a missing/empty report, failed test, or mandatory skip is an error.
export function checkResults(kind, file) {
  const text = fs.readFileSync(file, 'utf8');
  if (kind === 'go') {
    const events = text.trim().split('\n').map(line => JSON.parse(line));
    const tests = events.filter(e => e.Test && ['pass', 'fail', 'skip'].includes(e.Action));
    const counts = Object.fromEntries(['pass', 'fail', 'skip'].map(action => [action, tests.filter(e => e.Action === action).length]));
    console.log(JSON.stringify(counts));
    if (!counts.pass || counts.fail || counts.skip || events.some(e => e.Action === 'fail')) throw new Error('Go mandatory test gate failed');
  } else {
    const report = JSON.parse(text);
    const stats = kind === 'playwright' ? report.stats : {
      expected: report.numPassedTests,
      unexpected: report.numFailedTests,
      skipped: report.numPendingTests + report.numTodoTests,
    };
    if (!stats || ['expected','unexpected','skipped'].some(key => !Number.isInteger(stats[key]) || stats[key] < 0)) throw new Error('Invalid test counts');
    console.log(JSON.stringify(stats));
    if (!stats.expected || stats.unexpected || stats.skipped || stats.flaky || report.errors?.length || report.success === false) throw new Error(`${kind} mandatory test gate failed`);
  }
}
if (process.argv[1] === new URL(import.meta.url).pathname || process.argv[1]?.replaceAll('\\', '/').endsWith('/check-results.mjs')) {
  try { checkResults(process.argv[2], process.argv[3]); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
