import fs from 'node:fs/promises';
const base='http://localhost:3074';
const log=(message)=>console.log(message);
async function post(route,body){const r=await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(75000)});const d=await r.json();return {ok:r.ok,status:r.status,data:d};}
const health=await (await fetch(base+'/api/health')).json();log('Server health: '+health.status);
const response=await fetch(base+'/api/forecast',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:{lat:18.5204,lon:73.8567,name:'Pune'},reference:{lat:18.1517,lon:74.577,name:'Baramati'}}),signal:AbortSignal.timeout(60000)});
const events=(await response.text()).trim().split('\n').map(x=>JSON.parse(x));
const result=events.find(x=>x.type==='result')?.data;
log(result?`Forecast: ${result.local.days.length} days; ${result.local.hours.length} hours; source ${result.local.source.name}`:'Forecast failed: '+events.find(x=>x.type==='error')?.message);
const [assistant,voice]=await Promise.all([
  post('/api/assistant',{message:'In two sentences, what is the difference between a weather model forecast and a measured observation? Do not give weather values.',runId:result?.runId,language:'English'}),
  post('/api/voice/speak',{text:'Welcome to MeghSetu. Let us explore the weather together.',language:'English'})
]);
log(assistant.ok?'Assistant: returned a real response with '+assistant.data.sources.length+' sources':'Assistant error: '+assistant.status+' '+assistant.data.error);
log(voice.ok?'Voice synthesis: received WAV audio':'Voice error: '+voice.status+' '+voice.data.error);
let stt={ok:false,skipped:true};
if(voice.ok){const audio=Buffer.from(voice.data.audio,'base64');const form=new FormData();form.append('audio',new Blob([audio],{type:'audio/wav'}),'generated-smoke-test.wav');const r=await fetch(base+'/api/voice/transcribe',{method:'POST',body:form,signal:AbortSignal.timeout(60000)});const d=await r.json();stt={ok:r.ok,data:d};log(r.ok?'Transcription: '+d.text:'Transcription error: '+d.error);}
await fs.mkdir('.cache',{recursive:true});await fs.writeFile('.cache/live-smoke.json',JSON.stringify({health,forecast:result?{runId:result.runId,days:result.local.days.length,source:result.local.source.name}:null,assistant:{ok:assistant.ok,status:assistant.status,text:assistant.data.text,error:assistant.data.error},voice:{ok:voice.ok,status:voice.status},transcription:stt},null,2));
if(!result||!assistant.ok||!voice.ok||!stt.ok)process.exitCode=1;
