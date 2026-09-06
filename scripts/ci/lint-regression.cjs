const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const files = ['src/app/jobs/recommendations/page.tsx','src/components/recommendations/DiscoveryCard.tsx','src/components/upload/FileUploadZone.tsx'];
const root = path.resolve(__dirname, '../..');
const results = [];
for (const file of files) {
 const old = spawnSync('git',['show',`ae1eea7:frontend/${file}`],{cwd:root,encoding:'utf8'});
 if (old.status !== 0) throw new Error(`Historical source unavailable: ${file}`);
 for (const [label,input] of [['before',old.stdout],['after',fs.readFileSync(path.join(root,'frontend',file),'utf8')]]) {
  const result = spawnSync(process.execPath,[path.join(root,'frontend/node_modules/eslint/bin/eslint.js'),'--stdin','--stdin-filename',file,'--format','json'],{cwd:path.join(root,'frontend'),input,encoding:'utf8',timeout:120000});
  if (result.error || result.status === null || result.status > 1) throw new Error(`ESLint infrastructure error: ${result.stderr}`);
  const report = JSON.parse(result.stdout);
  const errors = report.flatMap(x=>x.messages).filter(x=>x.severity===2);
  results.push({file,label,exit:result.status,errors});
  if (label === 'before' ? !errors.some(x=>x.ruleId==='no-restricted-syntax') : errors.length>0) throw new Error(`Lint regression expectation failed: ${file} ${label}`);
 }
}
fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});
fs.writeFileSync(path.join(root,'artifacts/lint-regression.json'),JSON.stringify(results,null,2));
console.log('Three historical transition errors reproduced; all three corrected files pass.');
