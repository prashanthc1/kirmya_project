import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kirmya-negative-'));
const out = path.resolve('artifacts');
fs.mkdirSync(out, { recursive: true });
function mustFail(name, command, args, options, marker) {
 const result = spawnSync(command, args, { encoding: 'utf8', timeout: 120000, ...options });
 const text = `${result.stdout || ''}\n${result.stderr || ''}`;
 fs.writeFileSync(path.join(out, `${name}.log`), text);
 if (result.error || result.status === 0 || result.status === null || !text.includes(marker)) throw new Error(`${name}: expected diagnostic failure was not detected (${result.status})`);
 console.log(`${name}: expected failure detected (exit ${result.status})`);
}
try {
 // A disposable migration directory; the invalid statement cannot change schema.
 fs.mkdirSync(path.join(dir, 'scripts/migrations'), { recursive: true });
 fs.writeFileSync(path.join(dir, 'scripts/migrations/9999_ci_deliberately_broken.up.sql'), 'SELECT ci_deliberately_missing_column;');
 mustFail('negative-sql', path.resolve('backend/bin/ci-migrate'), [], { cwd: dir, env: process.env }, 'ci_deliberately_missing_column');
 // Start fixture in a separate process: spawnSync must not block its HTTP loop.
 const fixture = path.join(dir, 'fixture.cjs');
 fs.writeFileSync(fixture, `require('http').createServer((q,s)=>{s.writeHead(200);s.end('{}')}).listen(18089,'127.0.0.1')`);
 const { spawn } = await import('node:child_process');
 const server = spawn(process.execPath, [fixture], { stdio: 'ignore' });
 try {
  let ready = false;
  for (let i=0;i<50;i++) { try { await fetch('http://127.0.0.1:18089/health'); ready=true; break; } catch { await new Promise(r=>setTimeout(r,100)); } }
  if (!ready) throw new Error('negative authorization fixture did not start');
  mustFail('negative-authorization', 'go', ['test','-tags=ciintegration','./test/ci','-run','^TestHTTP$','-count=1','-v'], { cwd: 'backend', env: {...process.env,TEST_API_URL:'http://127.0.0.1:18089'} }, 'got 200 want 401');
 } finally { server.kill(); }
} finally { fs.rmSync(dir, { recursive: true, force: true }); }
