import {test} from 'node:test';
import assert from 'node:assert/strict';
import {segmentImage,composeLayers} from '../src/layers/decompose.js';
import {mergeLayerModel} from '../src/layers/merge.js';
import {reorderLayers,strokeSegment,recalcLayerCounts} from '../src/layers/retouch.js';
function picture(){
 const width=40,height=30,data=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const col=(x<20?0:1)+(y<15?0:2);
  const cs=[[200,60,90],[60,190,80],[45,80,215],[230,200,50]];
  data.set([...cs[col],(x+y)%13===0?0:255],(y*width+x)*4);
 }
 return {width,height,data};
}
test('reorder keeps visible image and exact layer identities',()=>{
 const m=segmentImage(picture(),{colorGroups:5}),old=composeLayers(m).data;
 const moved=reorderLayers(m,0,m.layers.length-1);
 assert.equal(moved.model.layers[moved.index].id,m.layers[0].id);
 assert.deepEqual(composeLayers(moved.model).data,old);
 for(let p=0;p<m.owner.length;p++)
  assert.equal(m.layers[m.owner[p]].id,moved.model.layers[moved.model.owner[p]].id);
 assert.throws(()=>reorderLayers(m,-1,1));
});
test('add brush changes selected ownership and preserves original RGBA',()=>{
 const img=picture(),m=segmentImage(img,{colorGroups:5});
 const edited={...m,owner:new Uint8Array(m.owner),source:new Uint8ClampedArray(m.source),layers:m.layers.map(x=>({...x}))};
 const original=m.owner[7*img.width+7],chosen=(original+1)%m.layers.length;
 const n=strokeSegment(edited,img.data,{from:{x:7,y:7},to:{x:7,y:7},radius:3,mode:'add',selected:chosen});
 assert.ok(n>0);
 assert.equal(edited.owner[7*img.width+7],chosen);
 assert.deepEqual(edited.source,img.data);
 recalcLayerCounts(edited);
 assert.equal(m.owner[7*img.width+7],original);
});
test('remove requires explicit other layer and transfers only selected pixels',()=>{
 const img=picture(),m=segmentImage(img,{colorGroups:5});
 const p=8*img.width+8,selected=m.owner[p],dest=(selected+1)%m.layers.length;
 const next={...m,owner:new Uint8Array(m.owner),source:new Uint8ClampedArray(m.source)};
 assert.throws(()=>strokeSegment(next,img.data,{from:{x:8,y:8},to:{x:8,y:8},radius:4,mode:'remove',selected,target:selected}));
 strokeSegment(next,img.data,{from:{x:8,y:8},to:{x:10,y:8},radius:4,mode:'remove',selected,target:dest});
 assert.equal(next.owner[p],dest);
});
test('merged alpha is restored from the true source when brush retags a pixel',()=>{
 const img=picture(),m=segmentImage(img,{colorGroups:5});m.layers[0].opacity=32;
 const merged=mergeLayerModel(m,[0,1]).model;
 const pixel=merged.owner.findIndex((id,p)=>id===0&&img.data[p*4+3]>0);
 assert.ok(pixel>=0);
 const next={...merged,owner:new Uint8Array(merged.owner),source:new Uint8ClampedArray(merged.source)};
 const point={x:pixel%img.width,y:Math.floor(pixel/img.width)};
 strokeSegment(next,img.data,{from:point,to:point,radius:1,mode:'add',selected:1});
 assert.equal(next.owner[pixel],1);
 assert.equal(next.source[pixel*4+3],img.data[pixel*4+3]);
});
test('brush stroke interpolates from pointer start to end',()=>{
 const img=picture(),m=segmentImage(img,{colorGroups:5});
 const selected=(m.owner[2*img.width+2]+1)%m.layers.length;
 const next={...m,owner:new Uint8Array(m.owner),source:new Uint8ClampedArray(m.source)};
 strokeSegment(next,img.data,{from:{x:2,y:2},to:{x:35,y:2},radius:2,mode:'add',selected});
 for(let x=2;x<=35;x++)assert.equal(next.owner[2*img.width+x],selected);
});
