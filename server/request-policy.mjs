export const MAX_AUDIO_BYTES=4*1024*1024;
export const MAX_JSON_BYTES=80*1024;

export function sameOrigin(origin,requestOrigin){
  if(!origin)return true;
  try{return origin===new URL(requestOrigin).origin;}catch{return false;}
}

export function createRequestLimiter({limit=25,windowMs=60000,now=Date.now}={}){
  const clients=new Map();
  return key=>{
    const time=now();
    for(const [ip,value] of clients)if(time-value.at>=windowMs)clients.delete(ip);
    const prior=clients.get(key)||{at:time,count:0};
    prior.count++;
    if(!clients.has(key)&&clients.size>=5000)clients.delete(clients.keys().next().value);
    clients.set(key,prior);
    return prior.count<=limit;
  };
}

export function jsonResponse(value,status=200,extraHeaders={}){
  return Response.json(value,{status,headers:{'Cache-Control':'no-store',...extraHeaders}});
}

export function checkRequest(request,context,allowRequest){
  if(!sameOrigin(request.headers.get('origin'),request.url))return jsonResponse({error:'This service only accepts same-origin requests.'},403);
  if(request.method!=='GET'&&!allowRequest(context.ip||'unknown'))return jsonResponse({error:'Please wait a minute before sending more requests.'},429,{'Retry-After':'60'});
  return null;
}

export async function readJSON(request){
  if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')||''))throw Object.assign(new Error('Send an application/json request.'),{status:415});
  if(Number(request.headers.get('content-length'))>MAX_JSON_BYTES)throw Object.assign(new Error('Keep text requests below 80 KB.'),{status:413});
  const reader=request.body?.getReader();
  if(!reader)throw Object.assign(new Error('A JSON request body is required.'),{status:400});
  let length=0,text='';
  const decoder=new TextDecoder();
  try{
    while(true){
      const {value,done}=await reader.read();
      if(done)break;
      length+=value.byteLength;
      if(length>MAX_JSON_BYTES){await reader.cancel();throw Object.assign(new Error('Keep text requests below 80 KB.'),{status:413});}
      text+=decoder.decode(value,{stream:true});
    }
    text+=decoder.decode();
  }finally{reader.releaseLock();}
  try{return JSON.parse(text);}catch{throw Object.assign(new Error('The JSON request is invalid.'),{status:400});}
}
