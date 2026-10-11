import {test} from 'node:test';
import assert from 'node:assert/strict';
import {segmentImage,composeLayers} from '../src/layers/decompose.js';
function fixture(w,h,{transparent=false}={}){
 const data=new Uint8ClampedArray(w*h*4);
 const colors=[[242,77,48],[43,121,199],[28,178,113],[242,192,38]];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const id=(x<w/2?0:1)+(y<h/2?0:2),i=(y*w+x)*4;
  data.set([...colors[id],transparent&&(x+y)%7===0?0:255],i);
 }
 return {width:w,height:h,data};
}
test('4-connected color regions become independent nonempty layers',()=>{
 const m=segmentImage(fixture(100,80),{colorGroups:6});
 assert.ok(m.layers.length>=4 && m.layers.length<=18,m.layers.length);
 assert.equal(m.owner.length,8000);
 assert.equal(m.layers.reduce((s,l)=>s+l.pixelCount,0),8000);
 const seen=new Set([m.owner[0],m.owner[99],m.owner[79*100],m.owner[79*100+99]]);
 assert.equal(seen.size,4,'quadrants should remain separable');
});
test('pixel-for-pixel reconstruction of source pixels, including alpha',()=>{
 const img=fixture(105,85,{transparent:true});
 const m=segmentImage(img,{colorGroups:10}),merged=composeLayers(m);
 assert.deepEqual(merged.data,img.data);
 assert.deepEqual(composeLayers(m).data,img.data);
});
test('visibility, solo, opacity, export preserve original layer data',()=>{
 const img=fixture(64,64),m=segmentImage(img,{colorGroups:8});
 const first=m.owner[0];
 m.layers[first].visible=false;
 const hidden=composeLayers(m);
 assert.equal(hidden.data[3],0);
 assert.equal(hidden.data[4*63+3],m.owner[63]===first?0:255);
 const solo=composeLayers(m,{soloIndex:first});
 assert.equal(solo.data[3],255);
 assert.equal(solo.data[4*63+3],m.owner[63]===first?255:0);
 m.layers[first].opacity=50;
 const translucent=composeLayers(m,{soloIndex:first});
 assert.equal(translucent.data[3],128);
 const exported=composeLayers(m,{onlyIndex:first,ignoreVisibility:true,ignoreOpacity:true});
 assert.equal(exported.data[3],255);
 assert.equal(exported.data[4*63+3],m.owner[63]===first?255:0);
});
test('deterministic segmentation and bounded output on a large noisy gradient',()=>{
 const w=640,h=480,data=new Uint8ClampedArray(w*h*4);
 let n=7;for(let i=0;i<w*h;i++){n=(Math.imul(n,1664525)+1013904223)>>>0;
  data[i*4]=i%256;data[i*4+1]=(i/w|0)%256;data[i*4+2]=n%256;data[i*4+3]=255;
 }
 const img={width:w,height:h,data},a=segmentImage(img,{colorGroups:14}),b=segmentImage(img,{colorGroups:14});
 assert.ok(a.layers.length<=18);assert.deepEqual(a.owner,b.owner);
 assert.deepEqual(composeLayers(a).data,data);
});
test('transparent-only images, invalid sizes fail explicitly',()=>{
 assert.throws(()=>segmentImage({width:0,height:50,data:new Uint8ClampedArray()}));
 assert.throws(()=>segmentImage({width:4,height:4,data:new Uint8ClampedArray(4*4*4)}),/透明/);
});
