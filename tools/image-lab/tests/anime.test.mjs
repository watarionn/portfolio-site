import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {animeArgmax,animeLayerModel,ANIME_LABELS} from '../src/layers/anime.js';
import {composeLayers} from '../src/layers/decompose.js';
test('anime ONNX output is seven-class and argmax uses NCHW softmax',()=>{
 const data=new Float32Array(7*6);
 for(let p=0;p<6;p++)data[(p+1)*6+p]=.95;
 const result=animeArgmax(data,[1,7,2,3]);
 assert.deepEqual(Array.from(result.labels),[1,2,3,4,5,6]);
 assert.equal(result.confidence[0],242);
 assert.throws(()=>animeArgmax(data,[1,18,2,3]),/7分類/);
});
test('anime model restores every source RGBA pixel and has separate labels',()=>{
 const w=8,h=8;
 const img={width:w,height:h,data:new Uint8ClampedArray(Array.from({length:w*h},(_,i)=>
  [i*3%255,i*5%255,i*7%255,i%11===0?0:255]).flat())};
 const map=new Uint8Array(Array.from({length:w*h},(_,i)=>i%7));
 const model=animeLayerModel(img,map,w,h);
 assert.ok(model);
 assert.deepEqual(Array.from(composeLayers(model).data),Array.from(img.data));
 assert.deepEqual(ANIME_LABELS,['背景','髪','目','口','顔','肌','服']);
 assert.ok(model.layers.some(x=>x.label==='髪'));
 assert.ok(!model.layers.some(x=>x.label==='上の服'));
 assert.equal(animeLayerModel({...img,data:new Uint8ClampedArray(img.data.length)},map,w,h),null);
});
test('anime model contract and comparison controls are bundled as release files',async()=>{
 const model=new URL('../assets/models/anime-face-unet-7.onnx',import.meta.url);
 const bin=await readFile(model);assert.ok(bin.byteLength>1_000_000);
 assert.ok(bin.byteLength<12_000_000);
 const page=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const ui=await readFile(new URL('../src/layers/ui.js',import.meta.url),'utf8');
 for(const id of ['semanticCompare','semanticPhotoPreview','semanticAnimePreview',
  'semanticUsePhoto','semanticUseAnime'])assert.ok(page.includes('id="'+id+'"'));
 for(const token of ['segmentAnime(source','segmentSemantic(source','applyDecomposition('])assert.ok(ui.includes(token));
 const build=await readFile(new URL('../scripts/build.mjs',import.meta.url),'utf8');
 assert.ok(!build.includes('await unlink('),'new release must not remove old hashed chunks');
});
