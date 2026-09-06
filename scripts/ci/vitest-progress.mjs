import fs from 'node:fs';
import path from 'node:path';
// Runs in the coordinator, so a synchronous worker loop cannot prevent the timeout.
export default class ProgressReporter {
  timer;
  arm(label) {
    clearTimeout(this.timer);
    console.log(`[unit-progress] ${label}`);
    this.timer = setTimeout(() => {
      const file = path.resolve('../artifacts/unit-stall.json');
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify({ status: 'failed', reason: 'No completion within 120 seconds', lastOperation: label }));
      console.error(`UNIT_STALL: ${label}`);
      process.exit(1);
    }, 120_000);
    this.timer.unref();
  }
  onInit() { this.arm('initializing test collection'); }
  onTestModuleQueued(module) { this.arm(`loading ${module.moduleId}`); }
  onTestModuleStart(module) { this.arm(`running ${module.moduleId}`); }
  onTestCaseReady(test) { this.arm(`test ${test.fullName}`); }
  onTestCaseResult(test) { this.arm(`completed ${test.fullName}`); }
  onTestRunEnd() { clearTimeout(this.timer); }
}
