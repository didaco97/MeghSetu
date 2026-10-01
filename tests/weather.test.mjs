import test from 'node:test';
import assert from 'node:assert/strict';
import {coordinates,normalizeForecast,indicators,advisory} from '../server/weather.mjs';
const point={name:'Test point',lat:18.52,lon:73.85};
test('Reject missing, non-numeric and out-of-region coordinates',()=>{
  for(const value of [null,{lat:'',lon:73},{lat:18,lon:null},{lat:'x',lon:73},{lat:0,lon:0},{lat:50,lon:73}])assert.throws(()=>coordinates(value));
  assert.deepEqual(coordinates({lat:'18.52',lon:'73.85',name:'Test point'}),point);
});
test('Missing rain stays missing and cannot become a dry-spell recommendation',()=>{
  const raw={latitude:18.5,longitude:73.8,current:{time:'2026-10-01T10:00',temperature_2m:28},daily:{time:['2026-10-01','2026-10-02','2026-10-03'],precipitation_sum:[1,null,0],temperature_2m_max:[28,29,30]},hourly:{time:['2026-10-01T10:00'],precipitation:[null]}};
  const value=normalizeForecast(raw,point,'2026-10-01T05:00:00Z');
  assert.equal(value.days[1].rain,null);assert.equal(value.hours[0].rain,null);
  assert.equal(indicators(value).rain72h,null);
  assert.match(advisory(value)[0].title,/needs a check/);
  assert.equal(value.modelIssueTime,null);
});
test('Calendar-day totals and rule branches use the actual input amounts',()=>{
  const value={days:[{rain:12,high:29},{rain:9,high:30},{rain:3,high:31}]};
  assert.equal(indicators(value).rain72h,24);
  assert.match(advisory(value,'Wheat','Harvest')[0].title,/drainage/);
  assert.equal(advisory(value,'Wheat','Harvest')[1].title,'Wheat: harvest stage');
  assert.match(advisory(value)[3-1].detail,/prototype rules/);
});
test('Reject malformed forecast payload rather than generating replacement data',()=>{
  assert.throws(()=>normalizeForecast({daily:{time:[]}},point),/incomplete/);
});
