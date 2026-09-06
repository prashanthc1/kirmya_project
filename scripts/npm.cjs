const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const cli = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
if (!fs.existsSync(cli)) throw new Error(`Bundled npm not found: ${cli}`);
const result = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
