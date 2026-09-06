import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const scanner = process.argv[2];
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kirmya-scanner-control-'));
const reportDir = path.resolve('artifacts');
fs.mkdirSync(reportDir, { recursive: true });
const run = (command, args) => spawnSync(command, args, { cwd: dir, encoding: 'utf8', timeout: 180000 });
try {
 let result;
 let marker;
 if (scanner === 'npm' || scanner === 'trivy') {
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({name:'disposable-vulnerable-fixture',version:'1.0.0',private:true,dependencies:{lodash:'4.17.20'}}));
  const lock = run('npm', ['install','--package-lock-only','--ignore-scripts','--no-audit']);
  if (lock.status !== 0) throw new Error(`Fixture install failed: ${lock.stderr}`);
  result = scanner === 'npm' ? run('npm', ['audit','--audit-level=high','--json']) : run('trivy', ['fs','--scanners','vuln','--severity','HIGH,CRITICAL','--exit-code','1','--format','json',dir]);
  marker = 'lodash';
 } else if (scanner === 'govulncheck') {
  fs.writeFileSync(path.join(dir, 'go.mod'), 'module fixture\n\ngo 1.26.8\n\nrequire golang.org/x/text v0.3.6\n');
  fs.writeFileSync(path.join(dir, 'main.go'), 'package main\nimport "golang.org/x/text/language"\nfunc main(){ _,_ = language.Parse("en") }\n');
  const tidy = run('go',['mod','tidy']);
  if (tidy.status !== 0) throw new Error(`Fixture modules failed: ${tidy.stderr}`);
  result = run('govulncheck',['-json','./...']);
  marker = '"finding"';
 } else { throw new Error('Unknown scanner'); }
 fs.writeFileSync(path.join(reportDir, `negative-${scanner}.json`),result.stdout || '');
 fs.writeFileSync(path.join(reportDir, `negative-${scanner}.log`),result.stderr || '');
 if (result.error || result.status !== 1 || !result.stdout.includes(marker)) throw new Error(`${scanner}: expected vulnerability exit 1 and diagnostic evidence, got ${result.status}`);
 // Parsing also rejects infrastructure output accidentally containing the marker.
 if (scanner !== 'govulncheck') JSON.parse(result.stdout);
 console.log(`${scanner}: deliberately vulnerable fixture rejected with exit 1`);
} finally { fs.rmSync(dir, {recursive:true, force:true}); }
