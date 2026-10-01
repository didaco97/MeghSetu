import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const env=await fs.readFile('.env.local','utf8');
const secrets=env.split(/\r?\n/).filter(x=>/API_KEY=/.test(x)).map(x=>x.slice(x.indexOf('=')+1)).filter(Boolean);
async function scan(dir){for(const item of await fs.readdir(dir,{withFileTypes:true})){const name=path.join(dir,item.name);if(item.isDirectory())await scan(name);else{const content=await fs.readFile(name);assert(!secrets.some(s=>content.includes(Buffer.from(s))),'Private server credential found in '+name);}}}
await scan('dist');await scan('src');await scan('public');
for(const route of ['/.env.local','/server/index.mjs']){const response=await fetch('http://localhost:3074'+route);const body=await response.text();assert(!secrets.some(s=>body.includes(s)),'Private credential returned by HTTP');assert(!body.includes('process.env.PERPLEXITY_API_KEY'),'Server implementation served to browser');}
const denied=await fetch('http://localhost:3074/api/assistant',{method:'POST',headers:{Origin:'https://example.org','Content-Type':'application/json'},body:JSON.stringify({message:'test'})});assert.equal(denied.status,403);
const invalid=await fetch('http://localhost:3074/api/forecast',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:{lat:0,lon:0}})});assert.equal(invalid.status,400);
console.log('Private configuration checks passed: no credentials in browser code, no server source serving, cross-origin POST rejected, invalid location rejected.');
