import React,{Component,useMemo,useRef,useState,useEffect} from 'react';
import {Canvas,useFrame} from '@react-three/fiber';
import {useReducedMotion} from 'motion/react';
import * as THREE from 'three';

function roundedLand(width,depth,radius){
  const s=new THREE.Shape(),x=-width/2,y=-depth/2;
  s.moveTo(x+radius,y);s.lineTo(x+width-radius,y);s.quadraticCurveTo(x+width,y,x+width,y+radius);s.lineTo(x+width,y+depth-radius);s.quadraticCurveTo(x+width,y+depth,x+width-radius,y+depth);s.lineTo(x+radius,y+depth);s.quadraticCurveTo(x,y+depth,x,y+depth-radius);s.lineTo(x,y+radius);s.quadraticCurveTo(x,y,x+radius,y);return s;
}
function Cloud({position,scale=1,phase=0,rainy,reduced}){
  const group=useRef();
  useFrame(({clock})=>{if(group.current&&!reduced){group.current.position.x=position[0]+Math.sin(clock.elapsedTime*.18+phase)*.22;group.current.position.y=position[1]+Math.cos(clock.elapsedTime*.24+phase)*.09;}});
  const puffs=[[-.8,0,0,.6],[-.27,.28,-.08,.82],[.47,.18,0,.7],[1,.03,.02,.46],[.17,-.14,.35,.74],[-.58,-.16,.3,.55],[.32,.53,-.12,.53]];
  return <group ref={group} position={position} scale={scale}>{puffs.map(([x,y,z,r],i)=><mesh key={i} position={[x,y,z]} scale={[r,r*.77,r*.82]}><sphereGeometry args={[1,28,20]}/><meshStandardMaterial color={rainy?'#b5cfdd':i%2?'#ffffff':'#f0f9ff'} roughness={.85} emissive="#c2e6fc" emissiveIntensity={.055}/></mesh>)}</group>;
}
function Tree({position,scale=1}){return <group position={position} scale={scale}><mesh position={[0,.23,0]} castShadow><cylinderGeometry args={[.055,.075,.6,8]}/><meshStandardMaterial color="#896447"/></mesh>{[[0,.74,0,.4],[-.2,.61,0,.27],[.2,.62,.06,.3]].map(([x,y,z,r],i)=><mesh key={i} position={[x,y,z]} scale={[r,r*1.18,r]} castShadow><sphereGeometry args={[1,14,12]}/><meshStandardMaterial color={['#5d9b54','#377a53','#81b76b'][i]} roughness={.9}/></mesh>)}</group>}
function House({position,scale=1}){return <group position={position} scale={scale}><mesh position={[0,.2,0]} castShadow><boxGeometry args={[.55,.4,.55]}/><meshStandardMaterial color="#fff2d9"/></mesh><mesh position={[0,.5,0]} rotation={[0,Math.PI/4,0]} castShadow><coneGeometry args={[.48,.29,4]}/><meshStandardMaterial color="#d08b61"/></mesh><mesh position={[0,.14,.278]}><planeGeometry args={[.13,.26]}/><meshStandardMaterial color="#598d9d"/></mesh><mesh position={[.17,.26,.279]}><planeGeometry args={[.1,.1]}/><meshStandardMaterial color="#8dd4e8"/></mesh></group>}
function Satellite({reduced}){const ref=useRef();useFrame(({clock})=>{if(ref.current&&!reduced){ref.current.position.y=3.7+Math.sin(clock.elapsedTime*.6)*.14;ref.current.rotation.z=.28+Math.sin(clock.elapsedTime*.35)*.07;}});return <group ref={ref} position={[3.25,3.7,-1]} rotation={[.18,-.4,.28]} scale={.57}><mesh castShadow><boxGeometry args={[.5,.45,.55]}/><meshStandardMaterial color="#f6e9c6" metalness={.35} roughness={.35}/></mesh>{[-1,1].map(side=><group key={side} position={[side*.82,0,0]}><mesh><boxGeometry args={[1,.035,.65]}/><meshStandardMaterial color="#137bab" metalness={.45} roughness={.4}/></mesh>{[0,1,2,3].map(i=><mesh key={i} position={[-.4+i*.26,.023,0]}><boxGeometry args={[.014,.015,.64]}/><meshStandardMaterial color="#b9edff"/></mesh>)}</group>)}<mesh position={[0,.38,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.21,.025,8,24]}/><meshStandardMaterial color="#83b5c3" metalness={.5} roughness={.4}/></mesh></group>}
function Rain({active,reduced}){
  const ref=useRef(),points=useMemo(()=>{const a=new Float32Array(140*3);for(let i=0;i<140;i++){a[i*3]=Math.sin(i*13.48)*3.2;a[i*3+1]=(i*.039)%3.3+.3;a[i*3+2]=Math.cos(i*8.23)*2.1;}return a;},[]);
  useFrame((_,delta)=>{if(!active||reduced||!ref.current)return;const a=ref.current.geometry.attributes.position.array;for(let i=1;i<a.length;i+=3){a[i]-=delta*2.4;if(a[i]<.2)a[i]=3.8;}ref.current.geometry.attributes.position.needsUpdate=true;});
  return <points ref={ref} visible={active}><bufferGeometry><bufferAttribute attach="attributes-position" args={[points,3]}/></bufferGeometry><pointsMaterial color="#3d9dce" size={.055} transparent opacity={.7}/></points>;
}
function WeatherIsland({weather,reduced}){
  const group=useRef(),land=useMemo(()=>roundedLand(7.3,5,.55),[]),top=useMemo(()=>roundedLand(7.4,5.1,.6),[]);
  const river=useMemo(()=>{const s=new THREE.Shape();s.moveTo(.2,-2.55);s.bezierCurveTo(-.6,-1.8,.9,-.8,.3,.2);s.bezierCurveTo(-.15,1.1,.7,1.6,.1,2.55);s.lineTo(.43,2.55);s.bezierCurveTo(1.1,1.6,.2,1.1,.68,.2);s.bezierCurveTo(1.25,-.8,-.2,-1.8,.57,-2.55);s.closePath();return s;},[]);
  const fields=useMemo(()=>Array.from({length:48},(_,i)=>({x:(i%8-3.5)*.85,z:(Math.floor(i/8)-2.5)*.78,color:['#98bc70','#b9cc7c','#77ac69','#d5d695','#66a06a','#a1c58e'][i%6]})).filter(f=>Math.abs(f.x-.4)>.4),[]);
  useFrame(({clock,pointer},delta)=>{if(!group.current)return;group.current.rotation.y=THREE.MathUtils.damp(group.current.rotation.y,-.32+(reduced?0:pointer.x*.16),3,delta);group.current.rotation.x=THREE.MathUtils.damp(group.current.rotation.x,reduced?0:pointer.y*.025,3,delta);if(!reduced)group.current.position.y=Math.sin(clock.elapsedTime*.45)*.055;});
  return <group ref={group} rotation={[0,-.32,0]}>
    <mesh position={[0,-.58,0]} rotation={[-Math.PI/2,0,0]} castShadow><extrudeGeometry args={[land,{depth:.5,bevelEnabled:true,bevelSize:.07,bevelThickness:.06,bevelSegments:3,steps:1}]}/><meshStandardMaterial color="#c8ae83" roughness={.95}/></mesh>
    <mesh position={[0,.015,0]} rotation={[-Math.PI/2,0,0]} receiveShadow><shapeGeometry args={[top]}/><meshStandardMaterial color="#77a86b" roughness={.9}/></mesh>
    {fields.map((f,i)=><group key={i} position={[f.x,.07,f.z]}><mesh receiveShadow><boxGeometry args={[.81,.08,.73]}/><meshStandardMaterial color={f.color} roughness={.9}/></mesh>{i%2===0&&Array.from({length:5},(_,j)=><mesh key={j} position={[-.3+j*.15,.05,0]}><boxGeometry args={[.035,.023,.65]}/><meshStandardMaterial color="#4e8d5c"/></mesh>)}</group>)}
    <mesh position={[0,.12,0]} rotation={[-Math.PI/2,0,0]}><shapeGeometry args={[river]}/><meshStandardMaterial color="#63cddd" metalness={.25} roughness={.2}/></mesh>
    <mesh position={[0,.13,.42]}><boxGeometry args={[7.1,.018,.11]}/><meshStandardMaterial color="#e5d4a3"/></mesh>
    <mesh position={[.45,.19,.42]}><boxGeometry args={[.75,.09,.24]}/><meshStandardMaterial color="#d9c199"/></mesh>
    {[[-2.95,.13,-1.8],[-3.05,.13,-1.13],[2.95,.13,1.75],[2.45,.13,1.85],[-1.5,.13,1.85],[2.8,.13,-1.7]].map((position,i)=><Tree key={i} position={position} scale={.7+(i%3)*.1}/>)}
    <House position={[-1.35,.12,-1.3]}/><House position={[-2.03,.12,-1.15]} scale={.8}/>
    <Cloud position={[-1.75,3.2,-1.25]} scale={1.02} phase={1} rainy={weather==='rain'} reduced={reduced}/><Cloud position={[1.15,2.8,1.25]} scale={.92} phase={4} rainy={weather==='rain'} reduced={reduced}/><Cloud position={[1.55,3.55,-1.7]} scale={.61} phase={6} rainy={weather==='rain'} reduced={reduced}/>
    <group position={[-.2,3.8,-2.15]}><mesh><sphereGeometry args={[weather==='sun'?.58:.44,28,24]}/><meshBasicMaterial color="#ffd271"/></mesh><mesh><sphereGeometry args={[weather==='sun'?.73:.56,24,20]}/><meshBasicMaterial color="#ffe59e" transparent opacity={.14} depthWrite={false}/></mesh></group>
    <Rain active={weather==='rain'} reduced={reduced}/><Satellite reduced={reduced}/>
  </group>;
}
class SceneBoundary extends Component{state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?<div className="scene-fallback"><img src="/assets/ministry-landscape.png" alt="Illustrated green farmland beneath monsoon clouds"/><span>Explore your local weather</span></div>:this.props.children;}}
export default function CloudScene({weather='clouds',paused=false}){
  const prefersReduced=useReducedMotion(),reduced=prefersReduced||paused,container=useRef(),[visible,setVisible]=useState(true);
  useEffect(()=>{const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting));if(container.current)observer.observe(container.current);return()=>observer.disconnect();},[]);
  return <div className="cloud-canvas" ref={container} aria-label="Interactive 3D farmland, river, village and drifting clouds. Move your pointer to gently rotate the landscape."><SceneBoundary><Canvas shadows dpr={[1,1.5]} frameloop={!visible?'never':reduced?'demand':'always'} camera={{position:[9,8.5,13],fov:36}} gl={{antialias:true,alpha:true,powerPreference:'low-power'}} onCreated={({camera})=>camera.lookAt(0,1.15,0)}><ambientLight intensity={1.4}/><hemisphereLight args={['#e1f5ff','#c1d7bc',1.4]}/><directionalLight castShadow position={[-5,10,5]} intensity={2.3} color="#fff4d9" shadow-mapSize={[1024,1024]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-normalBias={.04}/><directionalLight position={[5,5,-6]} intensity={1.2} color="#bbebff"/><WeatherIsland weather={weather} reduced={reduced}/><mesh rotation={[-Math.PI/2,0,0]} position={[0,-.84,0]} receiveShadow><planeGeometry args={[18,18]}/><shadowMaterial transparent opacity={.12}/></mesh></Canvas></SceneBoundary></div>;
}
