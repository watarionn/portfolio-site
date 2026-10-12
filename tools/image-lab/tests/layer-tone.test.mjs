import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizedTone,hasTone,toneRGB,applyToneToLayer} from '../src/layers/tone.js';
import {composeLayers} from '../src/layers/decompose.js';
import {mergeLayerModel,identicalComposite} from '../src/layers/merge.js';
import {reorderLayers,strokeSegment} from '../src/layers/retouch.js';

function fixture(){
 return {width:3,height:1,
  source:new Uint8ClampedArray([100,150,200,255,20,70,90,180,240,20,110,60]),
  owner:new Uint8Array([0,1,0]),
  layers:[{id:'a',label:'A',visible:true,opacity:100,pixelCount:2},
          {id:'b',label:'B',visible:true,opacity:100,pixelCount:1}]};
}
const bytes=(data,p)=>Array.from(data.slice(p*4,p*4+4));
test('neutral effect round trip is pixel-exact and no buffers are duplicated',()=>{
 const m=fixture(),raw=new Uint8ClampedArray(m.source);
 const next=applyToneToLayer(m,0,{brightness:0,contrast:0,saturation:0});
 assert.deepEqual(composeLayers(next).data,raw);
 assert.strictEqual(next.source,m.source);
 assert.strictEqual(next.owner,m.owner);
 assert.strictEqual(next.layers[1],m.layers[1]);
 assert.deepEqual(m.source,raw);
 assert.equal(hasTone(next.layers[0].tone),false);
});
test('only selected owned pixels are transformed, alpha and other layer remain exact',()=>{
 const m=fixture(),before=new Uint8ClampedArray(m.source);
 const next=applyToneToLayer(m,0,{brightness:25,contrast:10,saturation:-20});
 const data=composeLayers(next).data;
 assert.notDeepEqual(bytes(data,0),bytes(before,0));
 assert.deepEqual(bytes(data,1),bytes(before,1));
 assert.equal(data[3],255);
 assert.equal(data[11],60);
 assert.deepEqual(m.source,before);
 assert.deepEqual(next.owner,m.owner);
 assert.deepEqual(bytes(composeLayers(next,{onlyIndex:0,ignoreVisibility:true}).data,1).slice(-1),[0]);
});
test('RGB channels clamp, no nonfinite values, and valid slider bounds',()=>{
 assert.deepEqual(normalizedTone({brightness:110,contrast:-150,saturation:4.3}),
   {brightness:100,contrast:-100,saturation:4});
 assert.throws(()=>normalizedTone({brightness:NaN}),/不正/);
 assert.throws(()=>normalizedTone({contrast:Infinity}),/不正/);
 assert.throws(()=>applyToneToLayer(fixture(),99,{brightness:3}),/不正/);
 assert.deepEqual(toneRGB(0,0,0,{brightness:-100,contrast:0,saturation:0}),[0,0,0]);
 assert.deepEqual(toneRGB(255,255,255,{brightness:100,contrast:0,saturation:0}),[255,255,255]);
});
test('effects merge without visual change and without mutating the pre-merge model',()=>{
 const m=applyToneToLayer(fixture(),0,{brightness:36,contrast:12,saturation:-30});
 m.layers[0].opacity=43;m.layers[1].visible=false;
 const before=composeLayers(m).data;
 const merged=mergeLayerModel(m,[0,1]).model;
 assert.ok(identicalComposite(m,merged));
 assert.deepEqual(composeLayers(merged).data,before);
 assert.equal(merged.layers[0].tone,undefined);
 assert.deepEqual(composeLayers(m).data,before);
 assert.strictEqual(m.source.length,12);
 assert.notStrictEqual(merged.source,m.source);
});
test('reorder tracks layer tone by object identity, reassigning only owner IDs',()=>{
 const m=applyToneToLayer(fixture(),0,{saturation:100});
 const reordered=reorderLayers(m,0,1).model;
 assert.deepEqual(composeLayers(reordered).data,composeLayers(m).data);
 assert.deepEqual(reordered.layers[1].tone,m.layers[0].tone);
 assert.deepEqual(Array.from(reordered.owner),[1,0,1]);
});
test('brush retags restored original pixels and uses new owner tone, not previous owner tone',()=>{
 const m=applyToneToLayer(fixture(),0,{brightness:-60});
 const initial=Array.from(m.source);
 const next={...m,source:new Uint8ClampedArray(m.source),owner:new Uint8Array(m.owner),layers:m.layers.map(x=>({...x}))};
 const changed=strokeSegment(next,new Uint8ClampedArray(initial),{from:{x:1,y:0},to:{x:1,y:0},radius:1,
   mode:'add',selected:0,target:1});
 assert.ok(changed>0);
 assert.deepEqual(Array.from(next.source),initial);
 assert.equal(next.owner[1],0);
 assert.notDeepEqual(bytes(composeLayers(next).data,1),bytes(m.source,1));
});
