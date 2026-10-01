import React,{useEffect,useRef,useState} from 'react';
import * as maplibregl from 'maplibre-gl';
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import {MapPin,Expand} from 'lucide-react';
maplibregl.setWorkerUrl(mapWorkerUrl);
export default function MapView({location,reference,onSelect,temperature}){
  const container=useRef(),map=useRef(),handler=useRef(onSelect),markers=useRef([]),[failed,setFailed]=useState(false),[loaded,setLoaded]=useState(false);
  handler.current=onSelect;
  useEffect(()=>{
    let m;
    try{
      m=new maplibregl.Map({container:container.current,style:{version:8,sources:{osm:{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',maxzoom:19}},layers:[{id:'base',type:'raster',source:'osm',paint:{'raster-saturation':-.65,'raster-opacity':.86}}]},center:[location.lon,location.lat],zoom:9,attributionControl:true});
      map.current=m;m.addControl(new maplibregl.NavigationControl({showCompass:false}),'bottom-right');
      m.on('load',()=>setLoaded(true));m.on('click',e=>handler.current?.({lat:e.lngLat.lat,lon:e.lngLat.lng,name:'Selected map point',region:'India'}));
      m.on('error',e=>{if(!m.isStyleLoaded())setFailed(true);});
    }catch{setFailed(true);}
    const resize=new ResizeObserver(()=>m?.resize());if(container.current)resize.observe(container.current);
    return()=>{resize.disconnect();markers.current.forEach(x=>x.remove());markers.current=[];m?.remove();map.current=null;};
  },[]);
  useEffect(()=>{if(!map.current)return;map.current.flyTo({center:[location.lon,location.lat],zoom:9,duration:700,essential:false});markers.current.forEach(x=>x.remove());markers.current=[];
    for(const [point,isReference] of [[reference,true],[location,false]]){
      if(!point)continue;const el=document.createElement('div');el.className='map-point '+(isReference?'reference':'');
      const dot=document.createElement('span');dot.className='map-point-dot';el.append(dot);
      const label=document.createElement('span');label.className='map-point-label';label.textContent=isReference?'Reference':`${point.name}${temperature==null?'':` · ${Math.round(temperature)}°`}`;el.append(label);
      markers.current.push(new maplibregl.Marker({element:el,anchor:'bottom'}).setLngLat([point.lon,point.lat]).addTo(map.current));
    }
  },[location,reference,temperature,loaded]);
  return <div className="map-wrap"><div ref={container} className="map-canvas" aria-label="Interactive location map. Click a point in India to load its forecast."/>{failed&&<div className="map-fallback"><MapPin size={30}/><strong>Map tiles are unavailable</strong><p>Location search and forecast tools still work.</p></div>}<div className="map-overlay-label"><span className="live-dot"/> LOCATION EXPLORER</div><button className="map-fit icon-btn" title="Recenter the map" aria-label="Recenter map" onClick={()=>map.current?.flyTo({center:[location.lon,location.lat],zoom:9})}><Expand size={17}/></button><div className="map-bottom-label">Click a location to explore its forecast</div></div>;
}
