import {test} from 'node:test';
import assert from 'node:assert/strict';
import {semanticLayerModel,argmaxLogits,ATR_LABELS} from '../src/layers/semantic.js';
import {composeLayers} from '../src/layers/decompose.js';
const image=()=>({width:8,height:8,data:new Uint8ClampedArray(Array.from({length:64},(_,i)=>[i%255,(i*2)%255,(i*3)%255,i%9===0?0:255]).flat())});
test('ATR classes include hair face clothes arms legs background',()=>{
 for(const s of ['髪','顔','上の服','下の服・ズボン','腕','脚','背景'])assert.ok(ATR_LABELS.includes(s));
});
test('argmax uses class-major NCHW logits',()=>{
 const area=4,logits=new Float32Array(18*area).fill(-99);
 for(let p=0;p<area;p++)logits[(p+1)*area+p]=50;
 assert.deepEqual([...argmaxLogits(logits,[1,18,2,2])],[1,2,3,4]);
 assert.throws(()=>argmaxLogits(logits,[1,12,2,2]),/18/);
});
test('semantic owners faithfully reconstruct RGBA pixels and exports',()=>{
 const img=image(),classes=new Uint8Array([2,2,4,4,11,11,14,0,2,2,4,4,11,11,14,0]);
 const model=semanticLayerModel(img,classes,4,4);
 assert.ok(model);
 assert.equal(model.method,'semantic');
 assert.ok(model.layers.some(x=>x.label==='髪'));
 assert.ok(model.layers.some(x=>x.label==='上の服'));
 assert.ok(model.layers.some(x=>x.label==='顔'));
 assert.deepEqual(composeLayers(model).data,img.data);
 const hair=model.layers.findIndex(x=>x.label==='髪');
 const mask=composeLayers(model,{onlyIndex:hair,ignoreVisibility:true});
 assert.ok(mask.data.some((n,i)=>i%4===3&&n===0));
});
test('no detected person does not invent semantic labels',()=>{
 const img=image(),bg=new Uint8Array(4*4);
 assert.equal(semanticLayerModel(img,bg,4,4),null);
});
test('invalid logits and maps reject',()=>{
 assert.throws(()=>argmaxLogits(new Float32Array(5),[1,18,4,4]));
 assert.throws(()=>semanticLayerModel(image(),new Uint8Array(3),2,2));
});
