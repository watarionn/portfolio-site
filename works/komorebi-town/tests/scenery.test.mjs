// Run: node works/komorebi-town/tests/scenery.test.mjs
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root=dirname(dirname(fileURLToPath(import.meta.url)));
const html=readFileSync(join(root,'public/index.html'),'utf8');
const decor=readFileSync(join(root,'public/scenery.js'),'utf8');
assert.match(html, /await import\('\.\/scenery\.js\?v=20261115-v1'\)/);
assert.match(html, /const mobile=matchMedia/);
assert.match(html, /flowerBatches=flowers\.map/);
assert.match(html, /const buildingText=/);
assert.match(html, /id="time-button"/);
assert.match(html, /href="\.\.\/komorebi-town-2d\/"/);
assert.match(html, /href="\.\.\/komorebi-town-25d\/"/);

const scratch=mkdtempSync(join(tmpdir(),'komorebi-3d-check-'));
try{
  const inline=html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(inline,'module script should exist');
  const main=join(scratch,'main.mjs'),extra=join(scratch,'scenery.mjs');
  writeFileSync(main,inline);writeFileSync(extra,decor);
  for(const p of [main,extra]){
    const res=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});
    assert.equal(res.status,0,p+': '+res.stderr);
  }
}finally{rmSync(scratch,{recursive:true,force:true});}

class V {
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
  setScalar(x){return this.set(x,x,x);}
  setHex(x){this.hex=x;return this;}
  clone(){return new V(this.x,this.y,this.z);}
  multiplyScalar(){return this;}
}
class Item {
  constructor(...args){this.args=args;this.material=args.length===1?args[0]:args[1];this.children=[];this.position=new V;this.rotation=new V;this.scale=new V(1,1,1);this.matrix={};}
  add(o){this.children.push(o);}
  updateMatrix(){}
}
class Material {constructor(o){Object.assign(this,o);}clone(){return new this.constructor({...this});}}
class SpriteMaterial extends Material {constructor(o){super(o);this.isSpriteMaterial=true;}}
class InstancedMesh extends Item {
  constructor(g,m,n){super();this.geometry=g;this.material=m;this.count=n;this.instanceMatrix={needsUpdate:false};this.instanceColor={needsUpdate:false};}
  setMatrixAt(i,m){}
  setColorAt(i,c){}
}
class Color {constructor(hex){this.hex=hex;}clone(){return new Color(this.hex);}multiplyScalar(){return this;}setHex(hex){this.hex=hex;}}
class CanvasTexture {constructor(canvas){this.image=canvas;this.colorSpace='';}}
const Three={
  BoxGeometry:Item,IcosahedronGeometry:Item,TorusGeometry:Item,CircleGeometry:Item,ConeGeometry:Item,PlaneGeometry:Item,
  Mesh:Item,Group:Item,Sprite:Item,InstancedMesh,Object3D:Item,MeshStandardMaterial:Material,
  MeshBasicMaterial:Material,SpriteMaterial,CanvasTexture,Color,DoubleSide:2,SRGBColorSpace:'srgb'
};
const fakeCtx={fillRect(){},fillText(){},createRadialGradient(){return {addColorStop(){}};}};
globalThis.document={createElement(t){assert.equal(t,'canvas');return {getContext:()=>fakeCtx};}};
const {createScenery}=await import('data:text/javascript;base64,'+Buffer.from(decor).toString('base64'));
const scene=new Item();scene.background=new Color(0xc5e6db);scene.fog={color:new Color(0xc5e6db)};
const sun={intensity:3,color:new Color(0xffefcf)};
const skylight={intensity:2.1};
const homes=[[-13,-13,0xd78975,1],[13,-13,0x82b5b7,1],[-13,13,0xd4a362,-1],[13,13,0xb191b9,-1]];
const collisions=[];
const instance=createScenery({THREE:Three,scene,collision:collisions,homes,sun,skylight,quality:'mobile'});
assert.equal(instance.label(),'昼');
assert.equal(instance.stats.roofInstances,288,'4 houses have instanced roof details');
assert.ok(instance.stats.meadowInstances>50,'grass tufts are instanced');
assert.equal(collisions.length,1,'pond collision is registered');
assert.deepEqual([collisions[0].x,collisions[0].z],[-8,8]);
instance.update(1);assert.equal(instance.nextMode(),'夕方');
instance.update(3);assert.equal(instance.nextMode(),'夜');
instance.update(5);assert.equal(instance.nextMode(),'昼');
assert.equal(sun.intensity,3);
assert.ok(scene.children.length>8);
console.log('KOMOREBI_3D_SCENERY_CONTRACT_PASS',instance.stats);
