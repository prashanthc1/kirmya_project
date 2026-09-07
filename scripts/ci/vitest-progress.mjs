import fs from 'node:fs';
import path from 'node:path';
// Runs in the coordinator, so a synchronous worker loop cannot prevent the timeout.
export default class ProgressReporter {
  timer;
  counts = { passed: 0, failed: 0, skipped: 0 };
  arm(label, timeout = 120_000) {
    clearTimeout(this.timer);
    console.log(`[unit-progress] ${label}`);
    this.timer = setTimeout(() => {
      const file = path.resolve('../artifacts/unit-stall.json');
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify({ status: 'failed', reason: `No completion within ${timeout / 1000} seconds`, lastOperation: label }));
      console.error(`UNIT_STALL: ${label}`);
      process.exit(1);
    }, timeout);
    this.timer.unref();
  }
  onInit() { this.arm('initializing test collection', 300_000); }
  onTestModuleQueued(module) { this.arm(`loading ${module.moduleId}`, 300_000); }
  onTestModuleStart(module) { this.arm(`running ${module.moduleId}`); }
  onTestCaseReady(test) { this.arm(`test ${test.fullName}`); }
  onTestCaseResult(test) {
    const state = test.result().state;
    if (state in this.counts) this.counts[state] += 1;
    this.arm(`completed ${test.fullName}`);
  }
  onTestRunEnd(_modules, errors) {
    clearTimeout(this.timer);
    errors ??= [];
    const report = {
      numPassedTests: this.counts.passed,
      numFailedTests: this.counts.failed + errors.length,
      numPendingTests: this.counts.skipped,
      numTodoTests: 0,
      success: this.counts.failed === 0 && errors.length === 0,
      errors,
    };
    const file = path.resolve('../artifacts/vitest.json');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(report, null, 2));
  }
}
