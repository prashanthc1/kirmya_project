import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

export function parseStream(text) {
  const events = [];
  let start = -1, depth = 0, quoted = false, escaped = false;
  for (let i=0;i<text.length;i++) {
    const char = text[i];
    if (start < 0) {
      if (/\s/.test(char)) continue;
      if (char !== '{') throw new Error('Invalid govulncheck JSON stream');
      start = i;
    }
    if (quoted) { if (escaped) escaped=false; else if (char === '\\') escaped=true; else if (char === '"') quoted=false; }
    else if (char === '"') quoted=true;
    else if (char === '{') depth++;
    else if (char === '}') { if (--depth === 0) { events.push(JSON.parse(text.slice(start,i+1))); start=-1; } }
  }
  if (start >= 0 || !events.length) throw new Error('Empty or truncated govulncheck report');
  return events;
}
export function checkGovulncheck(text) {
  const events = parseStream(text);
  const config = events.find(e=>e.config)?.config;
  if (config?.scanner_name !== 'govulncheck' || config.scan_level !== 'symbol' || config.scan_mode !== 'source' || !events.some(e=>e.SBOM)) throw new Error('Missing source/symbol scan evidence');
  // govulncheck announces "Fetching vulnerabilities from the database..." before it reads the
  // database and "Checking the code against the vulnerabilities..." once it has. A run whose
  // fetch is refused - a blocked host, an outage, a proxy answering 403 - stops after the
  // first announcement having consulted no vulnerability data at all, yet still emits the
  // config and SBOM above and no findings. Without this, that report is indistinguishable
  // from a clean scan.
  if (events.filter(e=>e.progress).length < 2) throw new Error('Vulnerability database was never consulted');
  const findings = events.filter(e=>e.finding).map(e=>e.finding);
  if (findings.some(f=>!Array.isArray(f.trace) || !f.trace.length)) throw new Error('Malformed vulnerability finding');
  const reachable = [...new Set(findings.filter(f=>f.trace[0].function).map(f=>f.osv))];
  console.log(JSON.stringify({reachable, reportedFindings:findings.length}));
  if (reachable.length) throw new Error(`GOVULNCHECK_GATE: reachable vulnerabilities: ${reachable.join(', ')}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { checkGovulncheck(fs.readFileSync(process.argv[2],'utf8')); } catch(error) { console.error(error.message); process.exitCode=1; }
}
