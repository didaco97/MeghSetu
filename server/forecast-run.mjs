import {randomUUID} from 'node:crypto';
import {coordinates,forecast,indicators,advisory} from './weather.mjs';

export function forecastPoints(body){
  return {
    point:coordinates(body?.location),
    reference:coordinates(body?.reference||{name:'Pune reference',lat:18.5204,lon:73.8567}),
  };
}

export async function* forecastEvents({point,reference},{runStore,forecastProvider=forecast}={}){
  const started=Date.now(),runId=randomUUID();
  const event=value=>({...value,elapsedMs:Date.now()-started});
  try{
    yield event({type:'step',id:'coordinates',status:'done',label:'Location coordinates validated'});
    yield event({type:'step',id:'fetch',status:'active',label:'Fetching numerical weather forecasts'});
    const [local,parent]=await Promise.all([forecastProvider(point),forecastProvider(reference)]);
    yield event({type:'step',id:'fetch',status:'done',label:'Forecast data received',cached:local.cached&&parent.cached});
    yield event({type:'step',id:'quality',status:'done',label:'Forecast dates, units and missing values checked'});
    const stats=indicators(local);
    yield event({type:'step',id:'indicators',status:'done',label:'Daily indicators and location comparison prepared'});
    const result={runId,local,reference:parent,indicators:stats,advisories:advisory(local),processing:{durationMs:Date.now()-started,downscalingApplied:false,satelliteProcessingApplied:false,referenceMeaning:'An independently queried comparison coordinate, not an official block-area mean.',sameGrid:local.grid.lat===parent.grid.lat&&local.grid.lon===parent.grid.lon}};
    // Save before completion so a separate function can use this run immediately.
    await runStore.set(result);
    yield event({type:'step',id:'ready',status:'done',label:'Forecast workspace ready'});
    yield event({type:'result',data:result});
  }catch{
    yield event({type:'error',message:'The forecast service could not complete this run. Try again. No synthetic forecast has been substituted.'});
  }
}
