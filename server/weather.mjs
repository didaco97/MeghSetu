const cache = new Map();
export const source = {name:'Open-Meteo',url:'https://open-meteo.com/',description:'Numerical weather model forecast; not a station observation or IMD downscaled product.'};
export function coordinates(value) {
  if (!value || value.lat === '' || value.lon === '' || value.lat == null || value.lon == null) throw new Error('Select a location first.');
  const lat=Number(value.lat), lon=Number(value.lon);
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat<6||lat>38||lon<67||lon>98) throw new Error('Choose a location within India for this prototype.');
  return {lat,lon,name:String(value.name||'Selected location').slice(0,100)};
}
export async function fetchJSON(url,options={}) {
  const response=await fetch(url,{...options,signal:options.signal||AbortSignal.timeout(25000)});
  if(!response.ok){const error=new Error(`Data service returned ${response.status}. Please try again.`);error.status=response.status;throw error;}
  return response.json();
}
const n=(value)=>typeof value==='number'&&Number.isFinite(value)?value:null;
export function normalizeForecast(raw,point,retrievedAt=new Date().toISOString()) {
  if(!raw.daily?.time?.length||!raw.hourly?.time?.length||!raw.current) throw new Error('The weather service returned incomplete data.');
  const days=raw.daily.time.map((date,i)=>({date,high:n(raw.daily.temperature_2m_max?.[i]),low:n(raw.daily.temperature_2m_min?.[i]),rain:n(raw.daily.precipitation_sum?.[i]),probability:n(raw.daily.precipitation_probability_max?.[i]),wind:n(raw.daily.wind_speed_10m_max?.[i]),code:n(raw.daily.weather_code?.[i])}));
  const hours=raw.hourly.time.map((time,i)=>({time,temp:n(raw.hourly.temperature_2m?.[i]),rain:n(raw.hourly.precipitation?.[i]),probability:n(raw.hourly.precipitation_probability?.[i]),humidity:n(raw.hourly.relative_humidity_2m?.[i])}));
  return {location:point,grid:{lat:raw.latitude,lon:raw.longitude,elevation:raw.elevation},timezone:raw.timezone||'Asia/Kolkata',retrievedAt,modelIssueTime:null,current:{time:raw.current.time,temp:n(raw.current.temperature_2m),humidity:n(raw.current.relative_humidity_2m),rain:n(raw.current.precipitation),wind:n(raw.current.wind_speed_10m),cloud:n(raw.current.cloud_cover),code:n(raw.current.weather_code)},days,hours,source};
}
export async function forecast(point) {
  const key=`${point.lat.toFixed(4)},${point.lon.toFixed(4)}`;
  const prior=cache.get(key);
  if(prior&&Date.now()-prior.at<600000)return {...prior.value,location:point,cached:true};
  const params=new URLSearchParams({latitude:String(point.lat),longitude:String(point.lon),current:'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,cloud_cover,weather_code',hourly:'temperature_2m,precipitation,precipitation_probability,relative_humidity_2m',daily:'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,weather_code',timezone:'Asia/Kolkata',forecast_days:'7'});
  const value=normalizeForecast(await fetchJSON(`https://api.open-meteo.com/v1/forecast?${params}`),point);
  if(cache.size>80)cache.delete(cache.keys().next().value);
  cache.set(key,{at:Date.now(),value});return {...value,cached:false};
}
export function indicators(value) {
  const days=value.days.slice(0,3);
  const hasRain=days.length===3&&days.every(x=>Number.isFinite(x.rain));
  const rain=hasRain?Math.round(days.reduce((s,x)=>s+x.rain,0)*10)/10:null;
  const highs=value.days.map(x=>x.high).filter(Number.isFinite);
  return {rain72h:rain,hottest:highs.length?Math.max(...highs):null,coverage:value.days.filter(x=>x.rain!==null).length,totalDays:value.days.length};
}
export function advisory(value,crop='Rice',stage='Vegetative') {
  const stats=indicators(value);
  const items=[];
  if(stats.rain72h==null)items.push({tone:'neutral',title:'Rainfall data needs a check',detail:'The three-day rain series has missing values. Do not infer a dry spell from missing data.',basis:'Incomplete forecast series'});
  else if(stats.rain72h>=20)items.push({tone:'amber',title:'Inspect drainage before field work',detail:'Review low-lying areas and field drainage. Check the local agromet bulletin before scheduling weather-sensitive work.',basis:`${stats.rain72h} mm forecast across the next three calendar days`});
  else if(stats.rain72h<3)items.push({tone:'sage',title:'Check moisture at the root zone',detail:'A low-rainfall outlook is a reason to inspect soil moisture. Irrigation needs still depend on soil, crop stage and local conditions.',basis:`${stats.rain72h} mm forecast across the next three calendar days`});
  else items.push({tone:'sage',title:'Keep the field plan flexible',detail:'Some rainfall is forecast. Recheck the outlook and local agromet bulletin before finalising outdoor operations.',basis:`${stats.rain72h} mm forecast across the next three calendar days`});
  items.push({tone:'neutral',title:`${crop}: ${stage.toLowerCase()} stage`,detail:stage==='Sowing'?'Assess soil moisture and field access with a local adviser before choosing a sowing window.':stage==='Harvest'?'Review local drying, storage and harvest guidance before planning field operations.':'Inspect the crop and use the local crop-stage bulletin to interpret weather changes.',basis:'Crop and stage selected by you; local conditions have not been measured'});
  if(stats.hottest>=35)items.push({tone:'amber',title:'Review heat exposure',detail:'A hot day appears in the forecast. Inspect crop stress and consult local crop-specific guidance.',basis:`Weekly forecast high: ${stats.hottest} °C`});
  items.push({tone:'neutral',title:'Check the official local bulletin',detail:'These are transparent prototype rules. IMD / local agricultural advisers remain the source for validated crop-specific recommendations.',basis:'Illustrative thresholds: 3 mm and 20 mm over three calendar days; not calibrated agronomic triggers',url:'https://mausam.imd.gov.in/imd_latest/contents/agromet/kalp/kalp.pdf'});
  return items;
}
