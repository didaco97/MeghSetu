import serverless from 'serverless-http';
import {withLambda} from '@netlify/aws-lambda-compat';
import {createApi} from './api.mjs';
import {forecastPoints,forecastEvents} from './forecast-run.mjs';
import {checkRequest,createRequestLimiter,jsonResponse,readJSON,MAX_AUDIO_BYTES,MAX_JSON_BYTES} from './request-policy.mjs';

export function createNetlifyApi({runStore}={}){
  const invoke=withLambda(serverless(createApi({runStore,netlify:true})));
  const allowRequest=createRequestLimiter();
  return async(request,context={})=>{
    const denied=checkRequest(request,context,allowRequest);
    if(denied)return denied;
    // The native forecast handler owns this route; never accidentally buffer it.
    if(new URL(request.url).pathname==='/api/forecast')return jsonResponse({error:'Use the streaming forecast endpoint.'},404);
    const max=request.headers.get('content-type')?.startsWith('multipart/form-data')?MAX_AUDIO_BYTES+65536:MAX_JSON_BYTES;
    if(Number(request.headers.get('content-length'))>max)return jsonResponse({error:'The request is too large.'},413);
    try{return await invoke(request,context);}catch{return jsonResponse({error:'The service is temporarily unavailable. Please try again.'},503);}
  };
}

export function createNetlifyForecast({runStore,forecastProvider}={}){
  const allowRequest=createRequestLimiter();
  return async(request,context={})=>{
    const denied=checkRequest(request,context,allowRequest);
    if(denied)return denied;
    if(request.method!=='POST')return jsonResponse({error:'Use POST for forecast requests.'},405,{Allow:'POST'});
    let points;
    try{points=forecastPoints(await readJSON(request));}catch(error){return jsonResponse({error:error.message},error.status||400);}
    const iterator=forecastEvents(points,{runStore,forecastProvider});
    const encoder=new TextEncoder();
    const body=new ReadableStream({
      async pull(controller){
        const {value,done}=await iterator.next();
        if(done)controller.close();
        else controller.enqueue(encoder.encode(JSON.stringify(value)+'\n'));
      },
      async cancel(){await iterator.return();},
    });
    return new Response(body,{headers:{'Content-Type':'application/x-ndjson; charset=utf-8','Cache-Control':'no-store','X-Accel-Buffering':'no'}});
  };
}
