import test from 'node:test';
import assert from 'node:assert/strict';
import {createNetlifyApi,createNetlifyForecast} from '../server/netlify-handlers.mjs';
import {createBlobRunStore,createMemoryRunStore,RUN_TTL_MS} from '../server/run-store.mjs';
import {normalizeForecast} from '../server/weather.mjs';
import {createApi} from '../server/api.mjs';
import {once} from 'node:events';

const point={name:'Test village',lat:18.52,lon:73.85};
const context={ip:'192.0.2.10',requestId:'test-request'};
const origin='https://meghsetu-example.netlify.app';
function request(path,body,headers={}){
  return new Request(origin+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,...(body===undefined?{}:{'Content-Type':'application/json'}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});
}
const fixture=location=>normalizeForecast({
  latitude:18.5,longitude:73.8,current:{time:'2026-10-01T10:00',temperature_2m:28},
  daily:{time:['2026-10-01','2026-10-02','2026-10-03'],precipitation_sum:[12,9,3],temperature_2m_max:[28,29,30]},
  hourly:{time:['2026-10-01T10:00'],precipitation:[1]},
},location,'2026-10-01T05:00:00Z');
const events=async response=>(await response.text()).trim().split('\n').map(line=>JSON.parse(line));
function sharedBlobBackend(){
  const data=new Map();
  return {data,open:()=>({
    async setJSON(key,value){data.set(key,structuredClone(value));},
    async get(key){return structuredClone(data.get(key)||null);},
    async delete(key){data.delete(key);},
  })};
}

test('forecast streams progress before the weather provider completes',async()=>{
  let release;
  const waiting=new Promise(resolve=>{release=resolve;});
  const handler=createNetlifyForecast({runStore:createMemoryRunStore(),forecastProvider:async location=>{await waiting;return fixture(location);}});
  const response=await handler(request('/api/forecast',{location:point}),context);
  assert.equal(response.headers.get('content-type'),'application/x-ndjson; charset=utf-8');
  const reader=response.body.getReader();
  const first=await reader.read();
  assert.equal(JSON.parse(new TextDecoder().decode(first.value)).id,'coordinates');
  release();
  let remaining='';
  while(true){const {value,done}=await reader.read();if(done)break;remaining+=new TextDecoder().decode(value);}
  assert.equal(JSON.parse(remaining.trim().split('\n').at(-1)).type,'result');
});

test('a separate function instance reads the forecast and generates the selected crop plan',async()=>{
  const blobs=sharedBlobBackend();
  const forecast=createNetlifyForecast({runStore:createBlobRunStore(blobs.open),forecastProvider:fixture});
  const trace=await events(await forecast(request('/api/forecast',{location:point}),context));
  const result=trace.at(-1).data;
  assert.equal(result.processing.downscalingApplied,false);
  assert.equal(trace.filter(e=>e.type==='step'&&e.status==='done').length,5);
  assert.equal(blobs.data.get(result.runId).local.hours,undefined,'unneeded hourly data must not be persisted');
  const coldApi=createNetlifyApi({runStore:createBlobRunStore(blobs.open)});
  const response=await coldApi(request('/api/advisory',{runId:result.runId,crop:'Wheat',stage:'Harvest'}),context);
  assert.equal(response.status,200);
  const plan=await response.json();
  assert.equal(plan.items[1].title,'Wheat: harvest stage');
  assert.match(plan.items[0].basis,/24 mm/);
});

test('forecast and persistence failures never return a successful run',async()=>{
  for(const options of [
    {runStore:createMemoryRunStore(),forecastProvider:async()=>{throw new Error('provider offline');}},
    {runStore:{async set(){throw new Error('store offline');}},forecastProvider:fixture},
  ]){
    const handler=createNetlifyForecast(options);
    const trace=await events(await handler(request('/api/forecast',{location:point}),context));
    assert.equal(trace.at(-1).type,'error');
    assert.equal(trace.some(e=>e.type==='result'||e.id==='ready'),false);
  }
});

test('expired and malformed session IDs cannot be used for an advisory',async()=>{
  let now=1000;
  const blobs=sharedBlobBackend();
  const store=createBlobRunStore(blobs.open,{now:()=>now});
  const forecast=createNetlifyForecast({runStore:store,forecastProvider:fixture});
  const trace=await events(await forecast(request('/api/forecast',{location:point}),context));
  const id=trace.at(-1).data.runId;
  now+=RUN_TTL_MS;
  const api=createNetlifyApi({runStore:store});
  assert.equal((await api(request('/api/advisory',{runId:id}),context)).status,409);
  assert.equal(blobs.data.has(id),false);
  assert.equal((await api(request('/api/advisory',{runId:'../../other-store'}),context)).status,409);
});

test('exact deployed, preview and custom-domain origins work; cross-site origins fail',async()=>{
  const api=createNetlifyApi({runStore:createMemoryRunStore()});
  for(const host of [origin,'https://preview--meghsetu-example.netlify.app','https://weather.example.org']){
    const response=await api(new Request(host+'/api/health',{headers:{Origin:host}}),context);
    assert.equal(response.status,200);
    assert.equal((await response.json()).capabilities.satelliteIngestion,false);
  }
  for(const badOrigin of ['https://attacker.example','null',origin+'.attacker.example']){
    assert.equal((await api(request('/api/assistant',{message:'test'},{Origin:badOrigin}),context)).status,403);
    const forecast=createNetlifyForecast({runStore:createMemoryRunStore(),forecastProvider:()=>{throw new Error('must not call');}});
    assert.equal((await forecast(request('/api/forecast',{location:point},{Origin:badOrigin}),context)).status,403);
  }
  assert.equal((await api(request('/api/not-a-route'),context)).status,404);
});

test('forecast rejects invalid coordinates, methods, JSON and oversized payloads',async()=>{
  const handler=createNetlifyForecast({runStore:createMemoryRunStore(),forecastProvider:()=>{throw new Error('must not call');}});
  assert.equal((await handler(request('/api/forecast',{location:{lat:0,lon:0}}),context)).status,400);
  assert.equal((await handler(request('/api/forecast'),context)).status,405);
  assert.equal((await handler(request('/api/forecast',{} ,{'Content-Type':'text/plain'}),context)).status,415);
  assert.equal((await handler(new Request(origin+'/api/forecast',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'}),context)).status,400);
  assert.equal((await handler(request('/api/forecast',{padding:'a'.repeat(82*1024)}),context)).status,413);
});

test('voice multipart survives the Lambda adapter without invoking a paid service',async t=>{
  const before=process.env.SARVAM_API_KEY;
  process.env.SARVAM_API_KEY='test-only-key';
  t.after(()=>{if(before===undefined)delete process.env.SARVAM_API_KEY;else process.env.SARVAM_API_KEY=before;});
  t.mock.method(globalThis,'fetch',async(url,options)=>{
    assert.equal(url,'https://api.sarvam.ai/speech-to-text');
    assert.equal(await options.body.get('file').text(),'test-audio-bytes');
    return Response.json({transcript:'Test transcript',language_code:'en-IN'});
  });
  const api=createNetlifyApi({runStore:createMemoryRunStore()});
  const form=new FormData();
  form.append('audio',new Blob(['test-audio-bytes'],{type:'audio/webm'}),'question.webm');
  const response=await api(new Request(origin+'/api/voice/transcribe',{method:'POST',headers:{Origin:origin},body:form}),context);
  assert.equal(response.status,200,await response.clone().text());
  assert.equal((await response.json()).text,'Test transcript');
});

test('API adapter rejects malformed JSON and rate-limits by the trusted context IP',async()=>{
  const api=createNetlifyApi({runStore:createMemoryRunStore()});
  const separateClient={...context,ip:'192.0.2.12'};
  assert.equal((await api(request('/api/advisory',null),separateClient)).status,400);
  assert.equal((await api(request('/api/advisory',[]),separateClient)).status,400);
  const bad=new Request(origin+'/api/advisory',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'});
  assert.equal((await api(bad,context)).status,400);
  for(let i=0;i<24;i++)assert.equal((await api(request('/api/advisory',{runId:'missing'}),context)).status,409);
  assert.equal((await api(request('/api/advisory',{}),context)).status,429);
  assert.equal((await api(request('/api/advisory',{}),{...context,ip:'192.0.2.11'})).status,409);
});

test('local Express server still streams forecasts and serves crop plans',async t=>{
  const app=createApi({forecastProvider:fixture});
  const server=app.listen(0,'127.0.0.1');
  await once(server,'listening');
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base=`http://127.0.0.1:${server.address().port}`;
  const trace=await events(await fetch(base+'/api/forecast',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:point})}));
  const runId=trace.at(-1).data.runId;
  const response=await fetch(base+'/api/advisory',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({runId,crop:'Maize',stage:'Sowing'})});
  assert.equal(response.status,200);
  assert.equal((await response.json()).items[1].title,'Maize: sowing stage');
});
