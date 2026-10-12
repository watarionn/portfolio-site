import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mergeLayerModel,identicalComposite} from '../src/layers/merge.js';
import {composeLayers,segmentImage} from '../src/layers/decompose.js';
import {semanticLayerModel} from '../src/layers/semantic.js';
function fixture(){
 const width=8,height=8,data=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4,zone=(x<4?0:1)+(y<4?0:2);
  const colors=[[240,50,50],[50,90,240],[30,190,75],[220,180,40]];
  data.set([...colors[zone],(x+y)%7===0?0:255],i);
 }
 return {width,height,data};
}
const model=()=>segmentImage(fixture(),{colorGroups:6});
test('two disjoint layers merge with exact composite and unchanged original model',()=>{
 const original=model();const before=composeLayers(original).data;
 const merged=mergeLayerModel(original,[0,1],{label:'衣装'}).model;
 assert.equal(merged.layers.length,original.layers.length-1);
 assert.equal(merged.layers[0].label,'衣装');
 assert.ok(identicalComposite(original,merged));
 assert.deepEqual(composeLayers(merged).data,before);
 assert.deepEqual(composeLayers(original).data,before);
 assert.notStrictEqual(merged.owner,original.owner);
 assert.notStrictEqual(merged.source,original.source);
 for(let p=0;p<merged.owner.length;p++)assert.ok(merged.owner[p]<merged.layers.length);
});
test('alpha baking exact for heterogeneous opacity, hidden layer, transparent pixels',()=>{
 const m=model(),rgbaBefore=new Uint8ClampedArray(m.source);
 m.layers[0].opacity=41;
 m.layers[1].visible=false;
 const visibleBefore=composeLayers(m).data;
 const {model:after}=mergeLayerModel(m,[0,1],{label:'ブレンド済'});
 assert.deepEqual(composeLayers(after).data,visibleBefore);
 assert.deepEqual(m.source,rgbaBefore);
 assert.equal(after.layers[0].visible,true);
 assert.equal(after.layers[0].opacity,100);
 const exported=composeLayers(after,{onlyIndex:0,ignoreVisibility:true,ignoreOpacity:true});
 for(let i=0;i<after.owner.length;i++){
  if(after.owner[i]===0)assert.equal(exported.data[i*4+3],visibleBefore[i*4+3]);
 }
});
test('non-contiguous merge keeps unselected layers intact',()=>{
 const m=model(),before=composeLayers(m).data;
 m.layers[1].opacity=27;
 const after=mergeLayerModel(m,[0,2]).model;
 assert.equal(after.layers.length,m.layers.length-1);
 assert.ok(identicalComposite(m,after));
 assert.deepEqual(mergeLayerModel(m,[0,2]).model.owner,after.owner);
 assert.equal(m.layers[1].opacity,27);
 assert.notDeepEqual(composeLayers(m).data,before);
});
test('multiple merges and undo snapshot preserve source',()=>{
 const m=model(),r1=mergeLayerModel(m,[0,1]).model,r2=mergeLayerModel(r1,[0,1]).model;
 assert.ok(identicalComposite(m,r1));
 assert.ok(identicalComposite(r1,r2));
 assert.equal(r2.layers.length,m.layers.length-2);
 assert.ok(m.layers.length>=4);
 assert.deepEqual(composeLayers(m).data,composeLayers(r2).data);
});
test('semantic layer names and merged export work',()=>{
 const img=fixture(),labels=new Uint8Array([2,2,4,4,11,11,0,0,2,2,4,4,11,11,0,0]);
 const m=semanticLayerModel(img,labels,4,4);
 assert.ok(m?.layers?.length>=3);
 const hair=m.layers.findIndex(x=>x.label==='髪'),clothes=m.layers.findIndex(x=>x.label==='上の服');
 assert.ok(hair>=0&&clothes>=0);
 const {model:after}=mergeLayerModel(m,[hair,clothes],{label:'頭と服'});
 assert.ok(identicalComposite(m,after));
 assert.ok(after.layers.some(x=>x.label==='頭と服'));
});
test('one selected layer, invalid indices, duplicate selections are refused',()=>{
 const m=model();
 assert.throws(()=>mergeLayerModel(m,[0]),/2枚/);
 assert.throws(()=>mergeLayerModel(m,[0,0]),/2枚/);
 assert.throws(()=>mergeLayerModel(m,[0,999]),/2枚/);
});
