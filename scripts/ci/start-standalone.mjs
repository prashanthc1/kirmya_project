// Serve the production artifact the way the image serves it.
//
// frontend/next.config.mjs sets `output: 'standalone'`, and frontend/Dockerfile
// runs `node server.js` from that tree. `next start` refuses the combination -
// Next prints `"next start" does not work with "output: standalone"
// configuration` and serves through a different path - so a browser suite
// driven by `next start` verifies a server no deployment runs.
//
// The standalone tree ships the server and its traced dependencies but not the
// static assets or `public/`; the Dockerfile copies both in beside it. This does
// the same, then starts the same entry point.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const frontend = path.resolve('frontend');
const standalone = path.join(frontend, '.next', 'standalone');
const server = path.join(standalone, 'server.js');
if (!fs.existsSync(server)) {
  console.error(`No standalone build at ${server}. Run "npm --prefix frontend run build" first.`);
  process.exit(1);
}

for (const [from, to] of [
  [path.join(frontend, 'public'), path.join(standalone, 'public')],
  [path.join(frontend, '.next', 'static'), path.join(standalone, '.next', 'static')],
]) {
  if (!fs.existsSync(from)) continue;
  fs.rmSync(to, { recursive: true, force: true });
  fs.cpSync(from, to, { recursive: true });
}

const child = spawn(process.execPath, [server], {
  stdio: 'inherit',
  env: { ...process.env, HOSTNAME: process.env.HOSTNAME || '127.0.0.1', PORT: process.env.PORT || '3000' },
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', code => process.exit(code ?? 1));
