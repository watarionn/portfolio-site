import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FX_TYPES,normalizeFx,updateLayerFx} from '../src/layers/fx-stack.js';
import {composeLayers} from '../src/layers/decompose.js';
import {mergeLayerModel,identicalComposite} from '../src/layers/merge.js';
import {reorderLayers} from '../src/layers/retouch.js';
function sample(){
 const width=8,height=8,source=new Uint8ClampedArray(width*height*4),owner=new Uint8Array(width*height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const p=y*width+x;owner[p]=x<4?0:1;source.set([20+x*25,30+y*24,15+(x+y)*12,(x+y)%9===0?0:200],p*4);}
 return {width,height,source,owner,layers:[{id:'left',visible:true,opacity:100,pixelCount:32},{id:'right',visible:true,opacity:100,pixelCount:32}]};
}
const px=(data,p)=>Array.from(data.slice(p*4,p*4+4));
test('all eight FX preserve alpha, original and other owner pixels',()=>{
 assert.equal(FX_TYPES.length,8);
 for(const {kind} of FX_TYPES){
  const m=sample(),raw=new Uint8ClampedArray(m.source),next=updateLayerFx(m,0,{type:'add',kind,amount:83});
  const composite=composeLayers(next).data;
  for(let p=0;p<m.owner.length;p++){
   assert.equal(composite[p*4+3],raw[p*4+3],kind);
   if(m.owner[p]===1)assert.deepEqual(px(composite,p),px(raw,p),kind);
  }
  assert.deepEqual(m.source,raw);assert.strictEqual(next.owner,m.owner);
 }
});
test('disabled and zero effects are neutral',()=>{
 const m=sample(),original=composeLayers(m).data;
 for(const {kind} of FX_TYPES){
  const no=updateLayerFx(m,0,{type:'add',kind,amount:0});
  assert.deepEqual(composeLayers(no).data,original);
  const off=updateLayerFx(updateLayerFx(m,0,{type:'add',kind,amount:100}),0,{type:'toggle',position:0});
  assert.deepEqual(composeLayers(off).data,original);
 }
});
test('stack changes are immutable, ordered and reversible',()=>{
 const m=sample(),a=updateLayerFx(m,0,{type:'add',kind:'grayscale',amount:100});
 const b=updateLayerFx(a,0,{type:'add',kind:'invert',amount:100});
 const c=updateLayerFx(b,0,{type:'move',position:1,delta:-1});
 assert.deepEqual(b.layers[0].fx.map(x=>x.kind),['grayscale','invert']);
 assert.deepEqual(c.layers[0].fx.map(x=>x.kind),['invert','grayscale']);
 assert.equal(m.layers[0].fx,undefined);
 assert.equal(updateLayerFx(b,0,{type:'toggle',position:0}).layers[0].fx[0].enabled,false);
 assert.deepEqual(updateLayerFx(b,0,{type:'delete',position:1}).layers[0].fx.map(x=>x.kind),['grayscale']);
 assert.equal(updateLayerFx(b,0,{type:'amount',position:0,amount:11}).layers[0].fx[0].amount,11);
 assert.equal(b.layers[0].fx[0].amount,100);
});
test('merge retains exact visible FX result and original data',()=>{
 let m=sample();for(const kind of ['grayscale','mosaic','blur','edges'])m=updateLayerFx(m,0,{type:'add',kind,amount:86});
 m.layers[0].opacity=72;m.layers[1].visible=false;
 const before=composeLayers(m).data,merged=mergeLayerModel(m,[0,1]).model;
 assert.ok(identicalComposite(m,merged));assert.deepEqual(composeLayers(merged).data,before);
 assert.equal(merged.layers[0].fx,undefined);assert.notStrictEqual(merged.source,m.source);
});
test('reorder keeps FX attached to original layer',()=>{
 const m=updateLayerFx(sample(),0,{type:'add',kind:'halftone',amount:97}),before=composeLayers(m).data;
 const next=reorderLayers(m,0,1).model;
 assert.deepEqual(composeLayers(next).data,before);
 assert.equal(next.layers[1].fx[0].kind,'halftone');
});
test('invalid operations are rejected and stack cap applies',()=>{
 const m=sample();
 assert.throws(()=>updateLayerFx(m,0,{type:'add',kind:'other'}),/未対応/);
 assert.throws(()=>updateLayerFx(m,2,{type:'add',kind:'blur'}),/対象/);
 assert.throws(()=>updateLayerFx(m,0,{type:'toggle',position:2}),/位置/);
 assert.throws(()=>normalizeFx({kind:'blur',amount:NaN}),/強度/);
 let next=m;for(let i=0;i<8;i++)next=updateLayerFx(next,0,{type:'add',kind:'invert'});
 assert.throws(()=>updateLayerFx(next,0,{type:'add',kind:'invert'}),/8個/);
});
test('library atlas distinguishes supported and research modes',async()=>{
 const {LIBRARY_ATLAS}=await import('../src/library-atlas.js');
 assert.ok(LIBRARY_ATLAS.length>=14);
 assert.ok(LIBRARY_ATLAS.some(x=>x.name==='ONNX Runtime Web'&&!x.mode));
 assert.ok(LIBRARY_ATLAS.some(x=>x.name==='glfx.js'&&x.mode==='glfx'));
});
test('spatial FX order changes output pixels',()=>{
 const m=sample();
 let a=updateLayerFx(m,0,{type:'add',kind:'mosaic',amount:100});
 a=updateLayerFx(a,0,{type:'add',kind:'threshold',amount:100});
 let b=updateLayerFx(m,0,{type:'add',kind:'threshold',amount:100});
 b=updateLayerFx(b,0,{type:'add',kind:'mosaic',amount:100});
 assert.notDeepEqual(composeLayers(a).data,composeLayers(b).data);
});
