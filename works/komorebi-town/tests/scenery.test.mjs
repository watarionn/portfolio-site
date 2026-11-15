import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const source=readFileSync(join(root,'town-details.js'),'utf8');
assert.match(source,/export function buildTownDetails/);
assert.match(source,/InstancedMesh/);
class Vec {constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}set(x,y,z){this.x=x;this.y=y;this.z=z;return this}setScalar(x){return this.set(x,x,x)}}
class Obj {constructor(){this.position=new Vec;this.rotation=new Vec;this.scale=new Vec(1,1,1);this.children=[];this.matrix={};}add(...o){this.children.push(...o)}updateMatrix(){}}
class Mesh extends Obj {constructor(g,m){super();this.geometry=g;this.material=m;}clone(){return new Mesh(this.geometry,this.material)}}
class InstancedMesh extends Mesh {constructor(g,m,c){super(g,m);this.count=c;this.instanceMatrix={needsUpdate:false};this.instanceColor={needsUpdate:false};}setMatrixAt(i){assert(i>=0&&i<this.count)}setColorAt(i){assert(i>=0&&i<this.count)}}
class Mat {constructor(o={}){Object.assign(this,o);this.color=o.color??0xffffff;}}
class Color {constructor(c){this.value=c}clone(){return new Color(this.value)}multiplyScalar(){return this}}
class Geo{constructor(){}}
const THREE={BoxGeometry:Geo,MeshStandardMaterial:Mat,MeshBasicMaterial:Mat,IcosahedronGeometry:Geo,Object3D:Obj,
  Color,InstancedMesh,Mesh,Group:Obj,CylinderGeometry:Geo,RingGeometry:Geo,PlaneGeometry:Geo,DoubleSide:2};
const mod=await import(pathToFileURL(join(root,'town-details.js')));
for(const lowPower of [false,true]){
 const scene=new Obj,collisions=[];
 const houses=[-13,13,-13,13].map((x,i)=>({x,z:i<2?-13:13,group:new Obj,roofs:[new Obj,new Obj]}));
 let v=15;const rnd=()=>((v=Math.imul(v,1664525)+1013904223>>>0)/4294967296);
 const art=mod.buildTownDetails({THREE,scene,houses,collision:collisions,rnd,lowPower});
 assert.equal(art.summary().houses,4);
 assert.equal(art.summary().shingles,504);
 assert(art.summary().flowers>80);
 assert(art.summary().fountain&&art.summary().pier);
 assert(collisions.some(x=>x.r===1.35));
 for(const h of houses)assert(h.roofs.every(r=>r.children.some(x=>x instanceof InstancedMesh)));
 for(let p=0;p<3;p++){art.setMood(p);assert.equal(art.summary().mood,p);art.update(p+.9);}
}
console.log('KOMOREBI_3D_SCENERY_CONTRACT_PASS');
