// Step 1 only: repository metadata and documentation. No runtime/configuration mutations.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const out = 'docs/project-baseline-2026-09-06';
const abs = p => path.join(root, p);
const read = p => fs.readFileSync(abs(p), 'utf8').replace(/^\uFEFF/, '');
const exists = p => fs.existsSync(abs(p));
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(abs(p))).digest('hex');
const relative = (from, to) => path.relative(path.dirname(abs(from)), abs(to)).replaceAll('\\', '/');
const unique = a => [...new Set(a)];
const esc = s => String(s).replaceAll('|', '\\|').replaceAll('\n', ' ');
const write = (p, s) => { fs.mkdirSync(path.dirname(abs(p)), { recursive: true }); fs.writeFileSync(abs(p), s); };
const json = (p, data) => write(`${out}/${p}.json`, JSON.stringify(data, null, 2) + '\n');
const files = dir => {
  if (!exists(dir)) return [];
  return fs.readdirSync(abs(dir), { withFileTypes: true }).flatMap(e => {
    if (e.name.startsWith('.') || ['node_modules', 'vendor', 'dist', 'build'].includes(e.name) || e.isSymbolicLink()) return [];
    const p = `${dir}/${e.name}`;
    return e.isDirectory() ? files(p) : [p];
  });
};
const command = (program, args) => {
  const r = cp.spawnSync(program, args, { cwd: root, encoding: 'utf8', timeout: 20000, windowsHide: true });
  return { command: [program, ...args], exit_code: r.status, output: (r.stdout || '').trim(), diagnostic: (r.stderr || r.error?.message || '').trim() };
};
const markdownLinks = (text, visit) => {
  let fenced = false;
  return text.split('\n').map((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) { fenced = !fenced; return line; }
    if (fenced) return line;
    return line.replace(/\[([^\]\n]+)\]\(([^)\n]+)\)/g, (all, label, target) => visit({ all, label, target, line: i + 1 }));
  }).join('\n');
};

// Refine derived planning records without replacing the immutable initial baseline.
if (process.argv.includes('--refine')) {
  assert(!exists(`${out}/refinement.json`), 'Derived intake was already refined. Maintain issue records explicitly; do not duplicate refinement.');
  const get = name => JSON.parse(read(`${out}/${name}.json`));
  let issues = get('issue-register');
  const removed = issues.filter(i => /^H/.test(i.id) && (/^\*(Date|Auditor|Status|This is not|Why it was|What guards)/.test(i.title) || i.title.includes('**Transactions (SQL)**')));
  issues = issues.filter(i => !removed.includes(i));
  json('intake-exclusions', removed.map(i => ({ id:i.id, text:i.title, sources:i.sources, reason:'Metadata, explanatory prose or an operational claim; retained in report-claims.json, not an actionable issue.' })));
  let next = Math.max(...issues.filter(i=>/^H/.test(i.id)).map(i=>Number(i.id.slice(1))));
  for (const r of get('report-register')) {
    const lines=read(r.path).split('\n');
    lines.forEach((line,index)=>{
      const m=line.match(/^\s*\* \*\*(P[0-3]) Issues[^*]*\*\*:\s*(.+)/);
      if(!m || /^\*\*\d+\*\*$/.test(m[2].trim()) || m[2].length<15) return;
      if(issues.some(i=>i.title===m[2].trim()))return;
      const item={id:`H${String(++next).padStart(3,'0')}`,title:m[2].trim(),priority:m[1],status:'unverified',evidence_class:'historical',owner:r.owner,owner_assignment:'responsible role; individual not assigned',workstream:r.workstream,plan_steps:r.plan_steps,scope:'historical remediation requiring verification',impact:'Inline residual-work item from a historical audit; not a freshly reproduced defect.',action:'Trace the current implementation and implement or evidence the described behavior.',acceptance:[`Demonstrate this requirement on the selected SHA: ${m[2].trim()} Retain relevant command/result and database/API/browser or provider evidence; a historical PASS alone is insufficient.`],sources:[{file:r.path,line:index+1}],acceptance_evidence:[],related_issues:[]};
      issues.push(item);
    });
  }
  const relationships=[[/revocation|blacklist|token blacklist/i,['R02']], [/pub.?sub|distributed fan.out|websocket.*replica/i,['F16']], [/DSR|privacy|consent|data export/i,['F02']], [/mock.*(?:user|identity)|axios|client instances/i,['F07']], [/OpenAPI.*(?:type|generation)|API.*contract/i,['F05','F17']], [/Playwright|end.to.end.*database|integration test/i,['F11']], [/migration/i,['R06']], [/rate.limit/i,['R03']], [/upload|pre.signed/i,['F03','F04']], [/MFA|TOTP/i,['R02']]];
  for(const i of issues){
    if(/^H/.test(i.id)){
      i.related_issues=unique(relationships.flatMap(([p,ids])=>p.test(i.title)?ids:[]));
      // Rejoin paragraph continuations accidentally split by line-oriented intake.
      const s=i.sources[0];
      if(s.line && !i.title.startsWith('|')){
        const ls=read(s.file).split('\n');let continuation=[];
        for(let k=s.line;k<ls.length && ls[k].trim() && !/^\s*(?:#|\*|[-]|\d+\.|\|)/.test(ls[k]);k++)continuation.push(ls[k].trim());
        if(continuation.length)i.title+=' '+continuation.join(' ');
      }
      if(/Resolved|Aligned|Standardized|Mentorship Identity Spoofing|Mentorship Router Nil|Unauthenticated Billing|Missing Password Reset|Trust & Safety Route Omission|Missing `schema_migrations`/i.test(i.title)){
        i.scope='historical fix claim; regression verification required';
        i.evidence_class='historical claimed fix or superseded gap; no current test evidence';
      }
      i.acceptance=[`Requirement to verify: ${i.title.replace(/\*\*/g,'')} Establish current scope and reproduce the affected path; retain a failing-before/passing-after test or evidence of an existing fix on the selected SHA. For an enhancement, record commitment or a reasoned deferral first.`,...i.acceptance];
    }
  }
  for(const [id,owner,workstream,steps] of [['B01','Platform and QA lead','Toolchain and release gates','2'],['B02','Product owner','Scope and free-access commitments','1, 10, 11'],['B03','Mobile engineering lead','Mobile release acceptance','10H'],['B04','Technical lead','Evidence governance','1, 12']])Object.assign(issues.find(i=>i.id===id),{owner,workstream,plan_steps:steps});
  json('issue-register',issues);
  const reports=get('report-register');
  for(const r of reports){r.issue_ids=unique([...r.finding_ids,...issues.filter(i=>i.sources.some(s=>s.file===r.path)).map(i=>i.id)]);}
  json('report-register',reports);
  write(`${out}/ISSUE_REGISTER.md`,'# Consolidated issue register\n\nSource of truth: [issue-register.json](issue-register.json). F01–F20 priorities are preserved. Historical rows are intake records, not a count of distinct confirmed bugs; related issue IDs retain overlaps. Previously claimed fixes await regression evidence. Enhancement candidates are not automatically committed scope. Owners are responsible roles; individual staffing remains pending. [Excluded metadata/prose](intake-exclusions.json) is retained separately.\n\n| ID | Priority | Status | Owner | Workstream / steps | Work |\n|---|---|---|---|---|---|\n'+issues.map(i=>`| ${i.id} | ${i.priority} | ${i.status} | ${i.owner} | ${esc(i.workstream)} / ${i.plan_steps} | ${esc(i.title)} |`).join('\n')+'\n\nEach JSON row has source, acceptance, evidence classification and closure-evidence fields. No empty evidence array counts as PASS.\n');
  write(`${out}/REPORT_OWNERSHIP.md`,'# Report ownership and classification\n\nAll 92 reconciled reports have responsible roles, workstreams and issue mappings. [report-register.json](report-register.json) preserves hashes and [classified historical statements](report-claims.json). No current runtime PASS was produced by this task.\n\n| Report | Owner | Workstream | Related issues |\n|---|---|---|---|\n'+reports.map(r=>`| [${r.path}](${relative(`${out}/REPORT_OWNERSHIP.md`,r.path)}) | ${r.owner} | ${r.workstream} | ${r.issue_ids.join(', ')} |`).join('\n')+'\n');
  let intro=read(`${out}/README.md`).replace(/194 items, including F01–F20, 8 security residuals, 162 historical backlog statements/,`${issues.length} intake items, including F01–F20, 8 security residuals, ${issues.filter(i=>/^H/.test(i.id)).length} historical backlog/fix-verification statements`).replace('[1 unavailable references]','[1 unavailable reference]');
  intro+='\nThe intake was refined to exclude metadata and explanatory prose, retain inline residuals, and link overlapping records. Intake totals are not distinct confirmed defect counts.\n';write(`${out}/README.md`,intro);
  const inv=get('inventories');
  for(const r of inv.api_golden_routes.filter(r=>r.route.startsWith('/api/v1/mobile/')&&!r.sources.length))Object.assign(r,{module:'mobile',owner:'Mobile engineering lead',workstream:'Mobile route reconciliation',scope:'full-platform',mapping_basis:'Path-prefix responsibility only; source declaration mapping unresolved'});
  json('inventories',inv);
  json('refinement',{completed_at:new Date().toISOString(),issues:issues.length,excluded_nonissues:removed.length,initial_baseline_preserved:true});
  console.log(JSON.stringify({refined_issues:issues.length,excluded_nonissues:removed.length}));
  process.exit(0);
}

if (process.argv.includes('--check')) {
  const reg = JSON.parse(read(`${out}/issue-register.json`));
  const reports = JSON.parse(read(`${out}/report-register.json`));
  const modules = JSON.parse(read(`${out}/module-matrix.json`));
  const inv = JSON.parse(read(`${out}/inventories.json`));
  assert.equal(unique(reg.map(x => x.id)).length, reg.length, 'duplicate issue IDs');
  for (let n = 1; n <= 20; n++) assert(reg.some(x => x.id === `F${String(n).padStart(2, '0')}`));
  for (const i of reg) assert(i.owner && i.workstream && i.acceptance.length && i.sources.length, `incomplete issue ${i.id}`);
  assert.equal(reports.length, 92);
  for (const r of reports) assert(exists(r.path) && r.owner && r.workstream && r.issue_ids.every(id => reg.some(i => i.id === id)), r.path);
  for (const m of modules) assert(m.owner && m.scope && m.acceptance && 'database_tables' in m && 'provider_dependencies' in m, m.module);
  assert.equal(inv.web_pages.length, inv.web_pages.filter(p => modules.some(m => m.web_pages.includes(p.file))).length);
  assert.equal(inv.api_golden_routes.length, unique(inv.api_golden_routes.map(x => `${x.method} ${x.route}`)).length);
  for (const r of inv.api_golden_routes) assert(r.owner && r.workstream && r.scope, r.route);
  for (const r of reports) assert.equal(r.sha256_after_link_repair, hash(r.path), `report changed since capture: ${r.path}`);
  const linkProblems = [];
  const docs = unique([...reports.map(r => r.path), ...files(out).filter(p => p.endsWith('.md')), ...files('audit-review/reports').filter(p => p.endsWith('.md')), 'docs/PROJECT_COMPLETION_PLAN_2026-09-06.md', 'docs/AUDIT_REPORT_REVIEW_INDEX_2026-09-06.md']);
  for (const doc of docs) markdownLinks(read(doc), l => {
    if (/^(https?:|mailto:|#)/i.test(l.target)) return l.all;
    if (/^file:/i.test(l.target)) { linkProblems.push({ doc, ...l }); return l.all; }
    const target = decodeURIComponent(l.target.split('#')[0]).replace(/^<|>$/g, '');
    if (!fs.existsSync(path.resolve(path.dirname(abs(doc)), target))) linkProblems.push({ doc, ...l });
    return l.all;
  });
  assert.equal(linkProblems.length, 0, JSON.stringify(linkProblems.slice(0, 8)));
  const before = JSON.parse(read(`${out}/baseline.json`));
  assert.equal(command('git', ['diff', '--cached', '--raw']).output, before.git.staged_raw.output, 'staged changes were altered');
  for (const f of before.protected_runtime_files) assert.equal(hash(f.path), f.sha256, `runtime source altered: ${f.path}`);
  console.log(JSON.stringify({ check: 'PASS', issues: reg.length, reports: reports.length, modules: modules.length, web_pages: inv.web_pages.length, api_snapshot_routes: inv.api_golden_routes.length, migrations: inv.migrations.length, broken_local_links: 0, existing_staged_and_runtime_changes_preserved: true }));
  process.exit(0);
}
assert(process.argv.includes('--write'), 'Use --write for initial capture or --check to validate.');
assert(!exists(`${out}/baseline.json`), 'Baseline already exists; preserve it and create a separately dated snapshot for a future capture.');

const captured = new Date().toISOString();
const reconciliationPath = 'audit-review/reports/AUDIT_RECONCILIATION.md';
const reconciliation = read(reconciliationPath);
const reportPaths = [...reconciliation.matchAll(/^\| \[([^\]]+\.md)\]\(https:\/\/github[^\n]+?\| ([^|]+) \| ([^|]+) \|/gm)].map(m => ({ path: m[1], prior_status: m[2].trim(), finding_ids: m[3].trim().split(/,\s*/) }));
assert.equal(reportPaths.length, 92);
const originalReports = new Map(reportPaths.map(r => [r.path, read(r.path)]));
const sourceFiles = [...files('backend'), ...files('frontend/src'), ...files('mobile')].filter(p => /\.(go|tsx?|sql)$/.test(p));
const git = {
  head: command('git', ['rev-parse', 'HEAD']),
  branch: command('git', ['branch', '--show-current']),
  status: command('git', ['status', '--porcelain=v1', '--untracked-files=all']),
  staged_raw: command('git', ['diff', '--cached', '--raw']),
  unstaged_names: command('git', ['diff', '--name-status']),
};
const installed = p => exists(p) ? JSON.parse(read(p)).version : 'not installed at this path';
const npmCli = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
const baseline = {
  captured_at: captured, repository_head: git.head.output, release_verdict: 'HOLD', capture_scope: 'Local working tree metadata before Step 1 report-link repairs. Runtime tests and deployment inspection not performed.',
  git,
  toolchains: { node: command(process.execPath, ['--version']), go: command('go', ['version']), git: command('git', ['--version']), docker_cli: command('docker', ['--version']), npm_direct_cli: command(process.execPath, [npmCli, '--version']), npm_shell_launcher: { status: 'observed failure before capture', evidence: 'PowerShell npm --version failed MODULE_NOT_FOUND for AppData/Roaming/npm/node_modules/npm/bin/npm-cli.js; direct bundled npm CLI works.', next_step: 'Repair PATH/launcher or use documented direct CLI in Step 2; no global changes made.' } },
  declared: { backend_go: read('backend/go.mod').match(/^go (.+)$/m)?.[1], frontend: JSON.parse(read('frontend/package.json')), mobile: JSON.parse(read('mobile/package.json')) },
  installed_frontend: Object.fromEntries(['next', 'react', 'typescript', 'vitest', 'eslint'].map(n => [n, installed(`frontend/node_modules/${n}/package.json`)])),
  workflow_sources: files('.github/workflows').map(p => ({ path: p, sha256: hash(p), toolchain_declarations: read(p).split('\n').filter(l => /(?:node-version|go-version):/.test(l)).map(l => l.trim()) })),
  protected_runtime_files: sourceFiles.map(p => ({ path: p, sha256: hash(p) })),
  limitations: ['Git global-ignore configuration produced access warnings; status output retained.', 'Docker CLI version is not daemon connectivity evidence; Docker configuration access is restricted.', 'No .env, credentials, private tool settings or production data contents read or copied.', 'Toolchain versions describe this machine, not deployed runtime.', 'Snapshot route list is a committed test expectation, not a fresh router execution.'],
};
json('baseline', baseline);

function responsibility(text) {
  const t = text.toLowerCase();
  if (/privacy|legal|consent|compliance|deletion|export.*data/.test(t)) return ['Backend privacy lead', 'Privacy and data lifecycle', '7'];
  if (/security|auth|identity|rbac|session|token|mfa/.test(t)) return ['Backend security lead', 'Identity and access', '3'];
  if (/database|migration|repository|persistence|schema/.test(t)) return ['Backend data lead', 'Persistence and migrations', '4'];
  if (/application|ats|resume|document|interview|recruit/.test(t)) return ['Hiring domain lead', 'Hiring workflow', '6'];
  if (/api|contract|client|axios/.test(t)) return ['Frontend integration lead', 'API contracts', '5'];
  if (/test|qa|ci\/|cicd|deployment|devops|readiness|recovery|performance|reliability|infrastructure|observability|backup/.test(t)) return ['Platform and QA lead', 'Release evidence and operations', '2, 9'];
  if (/frontend|design|landing|home|accessibility|search|notification|messaging|network/.test(t)) return ['Frontend experience lead', 'Public experience and communications', '8'];
  return ['Domain engineering lead', 'Full-platform domain acceptance', '10'];
}
const stepOverrides = { F01:'3',F02:'7',F03:'6',F04:'6',F05:'5',F06:'5',F07:'5',F08:'8',F09:'8',F10:'8',F11:'2',F12:'2',F13:'4',F14:'8, 10C',F15:'8',F16:'8, 9',F17:'5',F18:'4',F19:'2',F20:'1, 12' };
const ownerByStep = { '1':['Technical lead','Evidence governance'], '2':['Platform and QA lead','Release gates'], '3':['Backend security lead','Identity and access'], '4':['Backend data lead','Persistence and migrations'], '5':['Frontend integration lead','API contracts'], '6':['Hiring domain lead','Hiring workflow'], '7':['Backend privacy lead','Privacy and data lifecycle'], '8':['Frontend and communications lead','Public experience and communications'] };
const issues = JSON.parse(read('audit-review/reports/findings.json')).map(f => {
  const [owner, workstream] = ownerByStep[stepOverrides[f.id][0]];
  return { id:f.id, title:f.title, priority:f.p, status:'open', evidence_class:'historical finding; source references supplied by September 5 audit', owner, owner_assignment:'responsible role; individual not assigned', workstream, plan_steps:stepOverrides[f.id], scope:'affected feature before broad release; all required for full-platform acceptance', impact:f.impact, action:f.fix, acceptance:[f.test], sources:f.refs.map(([file,line]) => ({file,line})), acceptance_evidence:[], related_issues:[] };
});
function addIssue(id,title,description,acceptance,sources,priority='untriaged',evidence='historical',scope='verify before affected domain release') {
  const [owner,workstream,steps] = responsibility(title+' '+description);
  const issue = {id,title,priority,status:'unverified',evidence_class:evidence,owner,owner_assignment:'responsible role; individual not assigned',workstream,plan_steps:steps,scope,impact:description,action:'Trace current implementation and reproduce the gap; implement or link existing fix evidence. Do not treat historical statements as current proof.',acceptance:[acceptance],sources,acceptance_evidence:[],related_issues:[]};
  issues.push(issue); return issue;
}
const residuals = [
 ['Identity resolution across remaining modules','Legacy caller context reads and synthetic UUID fallbacks in Phase 1 section 4.1. Current literal reads were observed; historical counts not re-certified.','Every reachable protected handler uses verified caller identity. Two users and two organizations remain isolated through real HTTP/database tests; anonymous analytics behavior matches its explicit contract.','P1'],
 ['Access-token session revocation after password reset','Phase 1 section 4.2 says issued access tokens survive reset until expiry.','Exercise old access and refresh tokens after reset, logout and remote session termination; requests follow a documented revocation policy with regression evidence.','P2'],
 ['Distributed rate limiting','Phase 1 section 4.3 reports per-process buckets.','Requests alternating between two replicas share the agreed limit; restart cannot reset durable security limits; limiter failure has documented behavior.','P2'],
 ['Unused MustGetUserID panic helper','Phase 1 section 4.4 identifies an unused panic accessor.','Verify call sites; remove or make intended failure behavior safe, and prove missing identity never unexpectedly yields a panic path.','P3'],
 ['Required handler registration completeness','Phase 1 section 4.5 describes silent nil-handler omissions.','Omitting any required handler fails startup or the registration completeness gate; optional routes are explicitly declared and tested.','P3'],
 ['Migration concurrency and missing assets','Phase 1 section 4.6 reports unlocked migrations. Current runner also returns nil if migration assets are missing.','Two concurrent migrators cannot race; missing required assets fail deployment; failed migrations can be safely retried with matching schema/version records.','P1'],
 ['Mock AI providers and advertised capabilities','Phase 1 section 4.6 retains provider completion work.','Every advertised AI capability has a configured/evaluated provider or honestly labeled deterministic behavior, with failure, isolation and output-quality evidence.','untriaged'],
 ['Refresh cookie deployment compatibility','Phase 1 section 4.6 identifies SameSite behavior requiring validation.','Production-artifact login/refresh/logout work in supported browsers on the actual frontend/API origins while CSRF and origin restrictions remain effective.','untriaged'],
];
residuals.forEach((r,i) => addIssue(`R${String(i+1).padStart(2,'0')}`,r[0],r[1],r[2],[{file:'SECURITY_PHASE1_COMPLETION.md',section:'4. Residual risks'}],r[3]));

// Preserve all explicitly unfinished sections, including nested bullets, and standalone managed debt rows.
let legacyCount = 0;
const seenLegacy = new Map();
for (const report of reportPaths) {
  const lines = originalReports.get(report.path).split('\n');
  let section = '', depth = 0, active = false, fenced = false;
  lines.forEach((line,index) => {
    if (/^\s*```/.test(line)) { fenced=!fenced; return; }
    if (fenced) return;
    const h = line.match(/^(#{1,4})\s+(.+)/);
    if (h) {
      if (h[1].length <= depth) active = false;
      if (/remaining|residual|defect inventory|technical debt|focus areas|risks still|next steps/i.test(h[2])) { active=true;depth=h[1].length;section=h[2]; }
      return;
    }
    const standaloneDebt = /^\|/.test(line) && /Managed|Deferred|\[ \]|Not (?:Implemented|Complete)|Unwired/i.test(line);
    if ((!active && !standaloneDebt) || !line.trim() || /^>/.test(line)) return;
    if (!/^\s*(?:[-*]|\d+\.|\|)/.test(line)) return;
    if (/^\s*[-*]\s*\*\*P[0-3] Issues|^\|\s*[-:]|^\|.*Issue Description|100% ready|Zero Critical Blockers/i.test(line)) return;
    let title = line.trim().replace(/^[-*]\s*|^\d+\.\s*/,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1');
    if (title.length < 12 || /^[-*]+$/.test(title)) return;
    const key = title.toLowerCase().replace(/[^a-z0-9]/g,'');
    if (seenLegacy.has(key)) { seenLegacy.get(key).sources.push({file:report.path,line:index+1,section}); return; }
    const optional = /focus areas|top 10|next steps/i.test(section) && !/security|reliability/.test(report.path);
    const item = addIssue(`H${String(++legacyCount).padStart(3,'0')}`,title,`Historical unfinished-work statement from ${section || 'managed debt table'}. Current status and overlap with F/R items require verification.`,optional ? 'Product owner records whether this is committed scope. If committed, document the user journey and pass its API/database/browser acceptance; otherwise retain a reasoned enhancement/deferred decision without counting it complete.' : 'Reproduce the described condition on the selected release candidate. Demonstrate the stated behavior with a relevant automated test and, where user-facing, an API/browser journey; retain command, result, SHA and evidence. If already fixed, link that evidence before closing.',[{file:report.path,line:index+1,section}],(line.match(/\bP[0-3]\b/)||[])[0]||'untriaged','historical',optional?'enhancement candidate; commitment not established':'historical remediation requiring verification');
    seenLegacy.set(key,item);
  });
}
addIssue('B01','Local npm shell launcher is broken','npm --version fails through the shell launcher; the npm CLI bundled beside node runs successfully. Local and CI Node/Go versions also differ.','npm --version and the required package scripts run through the documented toolchain; CI/runtime versions are deliberately aligned and recorded.',[{file:`${out}/baseline.json`}],'P1','source-inspected / command-observed','Step 2 development prerequisite');
addIssue('B02','Full-platform scope and monetization contradictions','July product specifications are Draft / Pending Approval and describe monetization/SSO/escrow plans while newer reports promise free access.','Record named product ownership and explicit commitments before implementing charges or claiming all draft features are delivered; preserve free access under the current working scope.',[{file:'docs/product/03-product-requirements.md'},{file:'docs/product/08-features-documentation.md'},{file:'docs/recruiter/recruiter-platform-audit.md'}],'untriaged','source-inspected','product decision before affected expansion');
addIssue('B03','Native mobile authentication and release inventory need validation','mobile/App.tsx initializes isAuthenticated to true. Device builds and authentication were not exercised by this task. This is not a claim that the server permits unauthenticated access.','Cold launch requires a validated session; login/logout/expiry work on supported devices against the real API. Reproducible native build artifacts and device test evidence exist.',[{file:'mobile/App.tsx',line:14}],'untriaged','source-inspected','full-platform mobile release');

// Structural inventory: paths and parsed SQL names establish presence, never functional readiness.
const backendFiles = files('backend/internal');
const moduleNames = fs.readdirSync(abs('backend/internal'),{withFileTypes:true}).filter(e=>e.isDirectory()&&!e.name.startsWith('.')).map(e=>e.name).sort();
const core = new Set('auth onboarding profile resume media jobs applications candidate_search company organization recruiter interview notification job_alerts legal compliance trust_safety admin security verification support backup data_operations system_health shared router common docs landing'.split(' '));
const aliases = { applications:['applications','saved-jobs','documents'], auth:['auth','login','register','signin','signup','forgot-password','reset-password','verify-email'], profile:['profile'], resume:['resume','resumes'], company:['company','companies'], organization:['organization','organizations'], recruiter:['recruiter','recruiters','employer'], networking:['network','networking','people'], community:['communities','community'], messaging:['messages','messaging'], notification:['notifications'], ai:['ai'], ai_job_match:['ai-matching','job-match'], career_ai:['career-ai','career-assistant'], career_companion:['career-companion'], interview:['interviews','interview'], interview_prep:['interview-prep'], job_alerts:['job-alerts','alerts'], landing:['','feed','dashboard'], legal:['legal','privacy','terms','cookies','compliance'], security:['security','settings'], trust_safety:['trust-safety','safety','appeals'], referral:['referrals'], assessment:['assessments','assessment'], learning:['learning','courses'], global_marketplace:['marketplace','global-marketplace'], workforce_intelligence:['workforce-intelligence'], enterprise_hiring:['enterprise','enterprise-hiring'] };
const webPages = files('frontend/src/app').filter(p=>/\/page\.tsx$/.test(p)).map(file=>{
  const segments = file.slice('frontend/src/app/'.length).replace(/\/?page\.tsx$/,'').split('/').filter(s=>s&&!/^\(.*\)$/.test(s)&&!s.startsWith('@'));
  const first = segments[0]||'';
  const module = moduleNames.find(m=>(aliases[m]||[m.replaceAll('_','-')]).includes(first))||'web-shell';
  return {file,route:'/'+segments.join('/'),module,evidence:'filesystem route candidate; redirects/route groups and reachability require runtime verification',status:'unverified'};
});
const migrationFiles = files('backend/scripts/migrations').filter(p=>p.endsWith('.sql')).sort();
const migrations = migrationFiles.map(file=>({file,sha256:hash(file),direction:/\.up\.sql$/.test(file)?'up':/\.down\.sql$/.test(file)?'down':'other',numeric_prefix:path.basename(file).match(/^\d+/)?.[0]||null,paired_file:exists(file.replace(/\.(up|down)\.sql$/,(_,d)=>`.${d==='up'?'down':'up'}.sql`))?file.replace(/\.(up|down)\.sql$/,(_,d)=>`.${d==='up'?'down':'up'}.sql`):null,declared_tables:unique([...read(file).matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([\w.]+)/gi)].map(m=>m[1])),execution_status:'not run'}));
const apiDeclarations=[];
for (const file of backendFiles.filter(p=>p.endsWith('.go')&&!p.endsWith('_test.go'))) {
  const module=file.split('/')[2];
  let groups={};
  read(file).split('\n').forEach((line,i)=>{
    if (/^func /.test(line)) {
      groups={};
      for(const match of line.matchAll(/(\w+)\s+\*gin\.(RouterGroup|Engine)/g)) groups[match[1]]=match[2]==='Engine'?'':'/api/v1';
    }
    const group=line.match(/(\w+)\s*:?=\s*(\w+)\.Group\("([^"]*)"/);
    if(group && groups[group[2]]!==undefined) groups[group[1]]=groups[group[2]]+group[3];
    const route=line.match(/\b(\w+)\.(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|Any)\("([^"]*)"\s*,\s*(.*)/);
    if(route) apiDeclarations.push({file,line:i+1,module,method:route[2],literal_path:route[3],inferred_path:groups[route[1]]!==undefined?groups[route[1]]+route[3]:null,handler_expression:route[4].slice(0,180),evidence:'static literal declaration; group base inferred; mounting/auth chain not proven'});
  });
}
const goldenPath='backend/internal/router/testdata/routes.golden';
const golden=read(goldenPath).split(/\r?\n/).filter(Boolean).map((s,i)=>{
  const [method,route]=s.split(/\s+/); const candidates=apiDeclarations.filter(d=>d.method===method&&d.inferred_path===route);
  const owners=unique(candidates.map(c=>c.module));const module=owners.length===1?owners[0]:'router';
  return {method,route,module,module_candidates:owners,owner:responsibility(module)[0],workstream:responsibility(module)[1],scope:core.has(module)?'core-beta route candidate; exact feature exposure gated':'full-platform',sources:candidates.map(c=>({file:c.file,line:c.line})),snapshot_source:{file:goldenPath,line:i+1},evidence:'committed golden expectation; not live route enumeration',status:'unverified'};
});
const providerMarkers=/redis|pubsub|nats|opensearch|smtp|mailer|s3|minio|gemini|anthropic|openai|fcm|apns|stripe|provider/i;
const modules=moduleNames.map(module=>{
  const mf=backendFiles.filter(p=>p.startsWith(`backend/internal/${module}/`));
  const implementation=mf.filter(p=>p.endsWith('.go')&&!p.endsWith('_test.go'));
  const [owner,workstream]=responsibility(module);
  const tables=unique(implementation.flatMap(f=>[...read(f).matchAll(/\b(?:FROM|JOIN|INTO|UPDATE)\s+([a-z_][\w.]*)/g)].map(m=>m[1]))).filter(t=>!['SET','IF','SELECT'].includes(t));
  const permissions=implementation.flatMap(f=>read(f).split('\n').flatMap((l,i)=>/AuthRequired|RequireRole|RequireAdmin|GetUserID|candidate_id\s*=|organization_id\s*=|owner_id\s*=/.test(l)?[{file:f,line:i+1,marker:l.trim().slice(0,220)}]:[]));
  const provider_dependencies=implementation.flatMap(f=>read(f).split('\n').flatMap((l,i)=>providerMarkers.test(l)&&(/import|"|New\w+|Provider/.test(l))?[{file:f,line:i+1,marker:l.trim().slice(0,180)}]:[]));
  const issue_ids=issues.filter(x=>x.sources.some(s=>s.file?.startsWith(`backend/internal/${module}/`))).map(x=>x.id);
  return {module,scope:core.has(module)?'core-beta foundation or required hiring workflow':'full-platform expansion',scope_basis:'working completion-plan assumption; module membership does not enable every route',user_outcome:['shared','router','common','docs'].includes(module)?'Reliable shared composition, contracts and runtime boundaries':`Complete the ${module.replaceAll('_',' ')} user workflow with durable state and authorized access`,owner,workstream,status:issue_ids.length?'open':'unverified',evidence_class:'source-inspected structural inventory',web_pages:webPages.filter(p=>p.module===module).map(p=>p.file),api_operations:apiDeclarations.filter(d=>d.module===module),service_files:mf.filter(p=>/\/service\//.test(p)&&!p.endsWith('_test.go')),repository_files:mf.filter(p=>/\/repository\//.test(p)&&!p.endsWith('_test.go')),database_tables:{names:tables,evidence:'SQL-token candidates; comments/CTEs may be included; not live schema validation'},provider_dependencies,role_ownership_rules:{source_markers:permissions,required_acceptance:'Owner/foreign-user/foreign-organization/anonymous and privileged cases must be checked per operation; marker presence is not enforcement proof.'},automated_tests:mf.filter(p=>p.endsWith('_test.go')),manual_evidence:[],issue_ids,acceptance:'Pass real HTTP/database and relevant browser/device journeys for create/read/update/delete, invalid/foreign/missing records, provider failure, retry and restart on the selected SHA.'};
});
modules.push({module:'web-shell',scope:'core-beta cross-cutting plus unclassified routes',scope_basis:'unmatched routes retain explicit scope review',user_outcome:'Consistent public and authenticated navigation, accessible states and correct route redirects',owner:'Frontend experience lead',workstream:'Frontend route reconciliation',status:'unverified',web_pages:webPages.filter(p=>p.module==='web-shell').map(p=>p.file),api_operations:[],service_files:[],database_tables:{names:[],evidence:'no direct storage mapping inferred'},provider_dependencies:[],role_ownership_rules:{required_acceptance:'Classify unmatched routes and verify authentication, redirects and privacy.'},automated_tests:files('frontend/src').filter(p=>/\.(test|spec)\.tsx?$/.test(p)),manual_evidence:[],issue_ids:['F05','F06','F07','F08','F10','F15','F19'],acceptance:'Every route is assigned and tested; public/account separation, loading/error/empty states and supported viewport journeys pass.'});
modules.push({module:'native-client',scope:'full-platform expansion',user_outcome:'Use supported career workflows on a real mobile device with a valid session',owner:'Mobile engineering lead',workstream:'Mobile release acceptance',status:'unverified',web_pages:[],mobile_screens:files('mobile/src/screens'),api_operations:[{file:'mobile/src/api/client.ts',evidence:'client exists; API parity not verified'}],service_files:[],database_tables:{names:[],evidence:'uses API; no local database inferred'},provider_dependencies:[{file:'mobile/package.json',evidence:'declared React Native dependencies'}],role_ownership_rules:{required_acceptance:'Cold-start session validation, token expiry/logout and two-user isolation'},automated_tests:files('mobile').filter(p=>/\.(test|spec)\./.test(p)),manual_evidence:[],issue_ids:['B03'],acceptance:'Reproducible Android/iOS builds and physical-device login, apply, uploads, push, offline recovery and logout evidence for the declared supported surface.'});
for (const p of webPages) { const m=modules.find(m=>m.module===p.module);p.owner=m.owner;p.scope=m.scope; }
const inventories={captured_at:captured,evidence_scope:'Source files, static route declarations and committed golden snapshot only. No database migrations or runtime routes executed.',web_pages:webPages,api_golden_routes:golden,api_source_declarations:apiDeclarations,migrations,mobile_screens:files('mobile/src/screens'),backend_modules:moduleNames,unmatched_api_routes:golden.filter(r=>!r.sources.length).map(r=>`${r.method} ${r.route}`),ambiguous_api_routes:golden.filter(r=>r.module_candidates.length>1).map(r=>`${r.method} ${r.route}`),migration_notes:{up:migrations.filter(m=>m.direction==='up').length,down:migrations.filter(m=>m.direction==='down').length,unpaired_up:migrations.filter(m=>m.direction==='up'&&!m.paired_file).map(m=>m.file),table_names_are_static_declarations_not_live_counts:true}};
json('inventories',inventories);json('module-matrix',modules);

// Retain every historical assertion as classified source text instead of recertifying PASS claims.
const claims=[];
for(const report of reportPaths){
  let historical=false,section='current addendum',fenced=false;
  originalReports.get(report.path).split('\n').forEach((line,i)=>{
    if(/^---\s*$/.test(line)&&!historical)historical=true;
    if(/^\s*```/.test(line)){fenced=!fenced;return;}
    if(fenced||!line.trim()||/^<!--|^---|^\|\s*[-:]/.test(line))return;
    if(/^#+ /.test(line)){section=line.replace(/^#+ /,'');return;}
    claims.push({id:`C${String(claims.length+1).padStart(5,'0')}`,source:report.path,line_before_link_repair:i+1,section,text:line.trim(),evidence_class:historical?'historical':'unverified (prior review addendum; not newly executed)',current_test_evidence:[],rule:'Original PASS/percentage words are quoted claims, not present verification.'});
  });
}
json('report-claims',claims);

const repairs=[],missing=[];
const auditDocs=unique([...reportPaths.map(r=>r.path),...files('audit-review/reports').filter(p=>p.endsWith('.md'))]);
for(const doc of auditDocs){
  const before=read(doc);
  const after=markdownLinks(before,l=>{
    if(/^(https?:|mailto:|#)/i.test(l.target))return l.all;
    let resolved,fragment='';
    const split=l.target.split('#');fragment=split[1]?'#'+split.slice(1).join('#'):'';
    if(l.label==='current audit' && /KIRMYA_AUDIT_REPORT_2026-09-05\.md/.test(split[0]))resolved=abs('audit-review/reports/KIRMYA_AUDIT_REPORT_2026-09-05.md');
    else if(split[0].startsWith('updated-audit-reports/'))resolved=abs(split[0].slice('updated-audit-reports/'.length));
    else if(/^file:/i.test(split[0])){
      const decoded=decodeURIComponent(split[0]).replace(/^file:\/+/i,'').replaceAll('\\','/');
      const marker=decoded.toLowerCase().indexOf('/my_project/');
      if(marker>=0)resolved=abs(decoded.slice(marker+'/my_project/'.length));
    }else resolved=path.resolve(path.dirname(abs(doc)),decodeURIComponent(split[0]));
    let label=l.label,target;
    if(resolved&&resolved.toLowerCase().startsWith(root.toLowerCase()+path.sep)&&fs.existsSync(resolved))target=path.relative(path.dirname(abs(doc)),resolved).replaceAll('\\','/')+fragment;
    else{
      const id=`M${String(missing.length+1).padStart(3,'0')}`;
      missing.push({id,source:doc,line_before_repair:l.line,original_target:l.target,label:l.label,status:'unavailable in this checkout',classification:/verification|snapshot|updated-audit/i.test(l.target)?'missing historical evidence':'unresolved historical reference',owner:'Technical lead',closure:'Recover the original artifact and verify its SHA/scope or replace the claim with new dated evidence; do not create a fabricated result.'});
      label=l.label+' — unavailable reference';target=relative(doc,`${out}/MISSING_REFERENCES.md`)+'#'+id.toLowerCase();
    }
    const replacement=`[${label}](${target})`;
    if(replacement!==l.all)repairs.push({file:doc,line:l.line,before:l.all,after:replacement});
    return replacement;
  });
  if(after!==before)write(doc,after);
}
json('link-repairs',{scope:auditDocs,repairs,missing_references:missing,external_links:'Historical immutable GitHub links retained; external reachability not tested.'});
write(`${out}/MISSING_REFERENCES.md`,'# Unavailable historical references\n\nThese references could not be resolved in the current checkout. This ledger makes missing evidence visible; it does not replace the original result or certify the linked claim. External GitHub evidence was not fetched.\n\n'+missing.map(m=>`<a id="${m.id.toLowerCase()}"></a>\n## ${m.id}: ${m.label}\n\n- Source: [${m.source}](${relative(`${out}/MISSING_REFERENCES.md`,m.source)})\n- Original target: \`${m.original_target}\`\n- Status: ${m.status}; ${m.classification}.\n- Owner: ${m.owner}.\n- Closure: ${m.closure}\n`).join('\n'));
addIssue('B04','Unavailable historical audit evidence',`${missing.length} local references could not be resolved; recorded in the missing-reference ledger rather than fabricating artifacts.`,'Every release PASS has a retrievable dated artifact on the selected SHA; recover original evidence or run a new check. Missing references remain explicitly unavailable until then.',[{file:`${out}/MISSING_REFERENCES.md`}],'P1','source-inspected','full-platform release evidence').related_issues=['F20'];

// Previously fixed boundaries still require regression evidence on the release candidate.
const existingFixes=[
 ['Password reset routes','backend/internal/auth/delivery/http/routes.go','forgot-password|reset-password','Register/login, request recovery, consume once, expire/replay, rate-limit and session-revocation checks'],
 ['Mentorship caller identity','backend/internal/mentorship/delivery/http/mentorship_handler.go','GetUserID','Foreign user/header/query spoof attempts cannot replace the verified caller'],
 ['Billing role guards','backend/internal/billing/delivery/http/routes.go','RequireAdmin|AuthRequired','Anonymous/ordinary/admin and cross-account billing plus webhook signature cases'],
 ['Trust-safety typed mounting','backend/internal/router/router.go','TrustSafety','Required routes register and enforce role/ownership at HTTP boundaries'],
 ['SQL repository implementation exists','backend/internal/applications/repository/applications_repository.go','INSERT INTO|SELECT','Real SQL writes/readback/rollback and restart survive with tenant isolation'],
].map(([title,file,pattern,acceptance])=>({title,file,source_markers:read(file).split('\n').flatMap((l,i)=>new RegExp(pattern).test(l)?[{line:i+1,text:l.trim().slice(0,200)}]:[]),classification:'source-inspected presence; historical fix, not test-verified',status:'unverified',acceptance,acceptance_evidence:[]}));
json('existing-fixes',existingFixes);

const reports=reportPaths.map(r=>{
 const [owner,workstream,steps]=responsibility(r.path);
 return {...r,owner,owner_assignment:'responsible role; individual not assigned',workstream,plan_steps:steps,evidence_class:'historical; addendum unverified for this run',sha256_before_link_repair:crypto.createHash('sha256').update(originalReports.get(r.path)).digest('hex'),sha256_after_link_repair:hash(r.path),hash_note:'before hash uses UTF-8 text after BOM removal; after hash is exact file bytes',issue_ids:unique([...r.finding_ids,...issues.filter(i=>i.sources.some(s=>s.file===r.path)).map(i=>i.id)]),claim_ids:claims.filter(c=>c.source===r.path).map(c=>c.id)};
});
json('report-register',reports);json('issue-register',issues);
write(`${out}/ISSUE_REGISTER.md`,'# Consolidated issue register\n\nSource of truth: [issue-register.json](issue-register.json). Priorities F01–F20 are preserved. R/H/B items require current verification; historical suggestions are not automatically committed scope. Owners are responsible roles, with individual assignment pending. No item is test-verified by Step 1. Exact-source duplicates are combined; semantic overlap remains linked/reviewable rather than silently discarded.\n\n| ID | Priority | Status | Owner | Workstream / steps | Work |\n|---|---|---|---|---|---|\n'+issues.map(i=>`| ${i.id} | ${i.priority} | ${i.status} | ${i.owner} | ${esc(i.workstream)} / ${i.plan_steps} | ${esc(i.title)} |`).join('\n')+'\n\nEach JSON row retains source, action, acceptance criterion, evidence class and closure evidence. Close only after relevant evidence is attached; no empty evidence array counts as a PASS.\n');
write(`${out}/MODULE_MATRIX.md`,'# Core beta and full-platform module matrix\n\nDetailed [module-matrix.json](module-matrix.json) maps services, repository SQL table candidates, provider markers, authorization markers, web pages and existing tests. [inventories.json](inventories.json) lists every page file, golden API route, parsed API declaration and migration. Structural matches are candidates, not proof of routing, permissions, live tables or provider configuration. Empty mappings mean unverified, not unnecessary.\n\nCore beta is the hiring loop and its required access/privacy/operations foundations. Core membership does not release every module feature: advanced admin, organization and security screens remain gated. All existing domains and the native client remain in the full-platform inventory; disabled/deferred features never count as complete.\n\n| Module | Scope | Owner | Status | Page files | Declared API operations | Existing local tests |\n|---|---|---|---|---|---|---|\n'+modules.map(m=>`| ${m.module} | ${m.scope} | ${m.owner} | ${m.status} | ${m.web_pages.length} | ${m.api_operations.length} | ${m.automated_tests.length} |`).join('\n')+'\n');
write(`${out}/REPORT_OWNERSHIP.md`,'# Report ownership and classification\n\nAll 92 reconciled reports are mapped below. [report-register.json](report-register.json) retains current hashes, finding IDs and [classified historical source statements](report-claims.json). Original sign-offs remain historical; missing evidence is explicit. No current runtime PASS was produced by this task.\n\n| Report | Owner | Workstream | Related issues |\n|---|---|---|---|\n'+reports.map(r=>`| [${r.path}](${relative(`${out}/REPORT_OWNERSHIP.md`,r.path)}) | ${r.owner} | ${r.workstream} | ${r.issue_ids.join(', ')} |`).join('\n')+'\n');
write(`${out}/README.md`,`# Step 1 baseline and backlog\n\nCaptured ${captured} from commit \`${baseline.repository_head}\` plus the existing working tree. **Step 1 deliverables complete; release HOLD remains.** No application fixes, tests, migrations, deployment, credentials or production data were changed/executed as part of this capture. Inventory validation is separate from application verification.\n\n- [Baseline and toolchains](baseline.json): HEAD, branch, full staged/unstaged/untracked path inventory, installed/declared versions and source hashes.\n- [Consolidated issue register](ISSUE_REGISTER.md): ${issues.length} items, including F01–F20, ${residuals.length} security residuals, ${legacyCount} historical backlog statements and four baseline findings. Every row has a responsible role, workstream, source and acceptance condition.\n- [Module and scope matrix](MODULE_MATRIX.md): ${moduleNames.length} backend namespaces plus web-shell and native-client; ${webPages.length} web page files and ${golden.length} committed API route expectations.\n- [Exact structural inventories](inventories.json): ${migrations.length} migration files (${inventories.migration_notes.up} up / ${inventories.migration_notes.down} down), routes, screens and declarations. Table names are not a live database count.\n- [Report ownership](REPORT_OWNERSHIP.md): all 92 reconciled reports and ${claims.length} classified historical source statements.\n- [Existing fixes](existing-fixes.json): source-supported boundaries awaiting release-candidate regression evidence.\n- [Link repair log](link-repairs.json): ${repairs.length} local link replacements; [${missing.length} unavailable references](MISSING_REFERENCES.md) are explicitly recorded. External links were not tested.\n\n## Working scope\n\nCore beta: real public jobs/company details → valid account/profile/document → save/apply → scoped recruiter review/interview → candidate update, supported by privacy, moderation, support and recovery controls. Full platform adds all remaining existing domains and native mobile. Proposed capabilities in draft product specifications (including monetization, escrow and enterprise expansion) require an explicit scope decision before they become commitments. Current free-access assumptions remain.\n\n## Baseline discoveries\n\nThe shell npm launcher is broken; Node's bundled npm CLI works. Installed Node/Go differ from CI declarations. Docker CLI availability does not establish daemon access. The native app starts with an authenticated UI boolean; server behavior is untested. See B01–B04 for closure requirements. Missing legacy verification files are not reconstructed as PASS results.\n\n## Step 1 exit check\n\n1. Repository/changes/toolchains/routes/migrations captured without environment secrets.\n2. Current findings, explicit historical residual work and enhancement candidates retained with acceptance criteria.\n3. Existing fixes classified source-supported/historical, never newly test-verified.\n4. Audit-local links repaired or redirected to an explicit unavailable-reference record.\n5. Core/full scope and responsible owner roles recorded for all reports and inventory rows. Individual staffing is pending; it does not turn findings into completed work.\n\nValidate with \`node scripts/build-project-baseline.cjs --check\` from the repository root. The generator intentionally refuses to overwrite the dated initial snapshot. Future captures belong in a new dated directory; maintain issue closure evidence deliberately.\n\nNext action: Step 2 — fix the local npm entry point/use the documented bundled CLI, reproduce frontend checks and establish required real PostgreSQL/Redis/Playwright gates. F20 remains open until release evidence is complete in Step 12.\n`);
// Keep the previous report index honest after link-only changes.
const indexPath='docs/AUDIT_REPORT_REVIEW_INDEX_2026-09-06.md';
let idx=read(indexPath);
for(const r of reports)idx=idx.split('\n').map(l=>l.startsWith(`| [${r.path}]`)?l.replace(/`[a-f0-9]{64}`/,`\`${r.sha256_after_link_repair}\``):l).join('\n');
idx+='\nStep 1 ownership, historical classification, link repair and consolidated backlog: [baseline handoff](project-baseline-2026-09-06/README.md). Hashes refreshed after link-only repairs; pre-repair text hashes are retained in its report register.\n';write(indexPath,idx);
const planPath='docs/PROJECT_COMPLETION_PLAN_2026-09-06.md';
let plan=read(planPath).replace('## Step 1 — Establish a trustworthy baseline and backlog','## Step 1 — Establish a trustworthy baseline and backlog\n\n**Deliverables completed 6 September 2026:** [baseline, issue register and module/report ownership](project-baseline-2026-09-06/README.md). This completes Step 1 planning artifacts, not runtime verification or F20 release closure.');
write(planPath,plan);
console.log(JSON.stringify({written:out,issues:issues.length,reports:reports.length,modules:modules.length,links_repaired:repairs.length,missing_references:missing.length}));
