import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkGovulncheck } from './check-govulncheck.mjs';
const config = JSON.stringify({config:{scanner_name:'govulncheck',scan_level:'symbol',scan_mode:'source'}});
const sbom = JSON.stringify({SBOM:{modules:[]}});
const fetching = JSON.stringify({progress:{message:'Fetching vulnerabilities from the database...'}});
const checking = JSON.stringify({progress:{message:'Checking the code against the vulnerabilities...'}});
const prefix = [config, sbom, fetching, checking].join('\n')+'\n';
test('Go JSON gate rejects reachable findings even when scanner exits zero',()=>{
 assert.doesNotThrow(()=>checkGovulncheck(prefix));
 assert.doesNotThrow(()=>checkGovulncheck(prefix+JSON.stringify({finding:{osv:'fixture',trace:[{module:'unused'}]}})));
 assert.throws(()=>checkGovulncheck(prefix+JSON.stringify({finding:{osv:'GO-fixture',trace:[{function:'Parse'}]}})),/GOVULNCHECK_GATE/);
 for(const report of ['', '{}',prefix+'{',prefix+JSON.stringify({finding:{}})]) assert.throws(()=>checkGovulncheck(report));
});
test('Go JSON gate rejects a scan that never reached the vulnerability database',()=>{
 // What a blocked or unavailable vuln.go.dev actually produces: config, SBOM, the fetch
 // announcement, and then nothing. Reported as clean before this control existed.
 assert.throws(()=>checkGovulncheck([config, sbom, fetching].join('\n')+'\n'),/never consulted/);
 assert.throws(()=>checkGovulncheck([config, sbom].join('\n')+'\n'),/never consulted/);
});
