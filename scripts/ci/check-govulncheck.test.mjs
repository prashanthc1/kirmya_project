import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkGovulncheck } from './check-govulncheck.mjs';
const prefix = JSON.stringify({config:{scanner_name:'govulncheck',scan_level:'symbol',scan_mode:'source'}})+'\n'+JSON.stringify({SBOM:{modules:[]}})+'\n';
test('Go JSON gate rejects reachable findings even when scanner exits zero',()=>{
 assert.doesNotThrow(()=>checkGovulncheck(prefix));
 assert.doesNotThrow(()=>checkGovulncheck(prefix+JSON.stringify({finding:{osv:'fixture',trace:[{module:'unused'}]}})));
 assert.throws(()=>checkGovulncheck(prefix+JSON.stringify({finding:{osv:'GO-fixture',trace:[{function:'Parse'}]}})),/GOVULNCHECK_GATE/);
 for(const report of ['', '{}',prefix+'{',prefix+JSON.stringify({finding:{}})]) assert.throws(()=>checkGovulncheck(report));
});
