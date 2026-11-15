// Run: node works/komorebi-town-25d/tests/performance.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const here=dirname(fileURLToPath(import.meta.url));
const html=readFileSync(join(here,'../public/index.html'),'utf8');
const artSource=readFileSync(join(here,'../public/art-layer.js'),'utf8');
const inline=html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
assert.ok(inline,'inline game initialization exists');
assert.match(html, /art-layer\.js\?v=20261115-perf/, 'new runtime bypasses stale Safari asset cache');

const counts={offscreenTiles:0,drawImage:0,gradients:0,frames:0};
const gradient=()=>({addColorStop(){}});
const fakeContext=(offscreen=false)=>new Proxy({
  createRadialGradient(){counts.gradients++;return gradient();},
  createLinearGradient(){counts.gradients++;return gradient();},
  measureText(){return {width:55};},
  drawImage(){counts.drawImage++;},
  beginPath(){if(offscreen)counts.offscreenTiles++;},
}, {get(target,key){return key in target?target[key]:()=>{};},set(target,key,value){target[key]=value;return true;}});
const mainCtx=fakeContext();
const listeners={};
const fakeElement=()=>({style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},
  addEventListener(type,fn){(this.events ||= {})[type]=fn;},setAttribute(){},
  getContext(){return mainCtx;},textContent:'',hidden:false});
const elems=new Map();
const element=(id)=>{if(!elems.has(id))elems.set(id,fakeElement());return elems.get(id);};
let offscreenCreated=0,now=0,raf;
const document={hidden:false,getElementById:element,querySelectorAll:()=>[],
  addEventListener(type,fn){listeners['document:'+type]=fn;},
  createElement(tag){assert.equal(tag,'canvas');offscreenCreated++;
    return {width:0,height:0,getContext:()=>fakeContext(true)};}};
const window={};
const env={window,document,innerWidth:393,innerHeight:852,Math,console,
  performance:{now:()=>now},
  matchMedia:(query)=>({matches:query==='(pointer:coarse)'}),
  addEventListener:(type,fn)=>{listeners[type]=fn;},
  requestAnimationFrame:(fn)=>{raf=fn;return 1;}};
runInNewContext(artSource,env);
runInNewContext(inline,env);
assert.equal(offscreenCreated,1,'ground is cached once on startup');
assert.ok(counts.offscreenTiles>=729,'all 27x27 static tiles are painted into cache');
const painted=counts.offscreenTiles;
for(let frame=1;frame<=14;frame++){
  now=frame*35;raf(now);counts.frames++;
}
assert.ok(counts.drawImage>=5,'game renders cached background with drawImage');
assert.equal(counts.offscreenTiles,painted,'static tiles do not repaint during idle animation');
const gradientCount=counts.gradients;
for(let frame=15;frame<=23;frame++){now=frame*35;raf(now);}
assert.equal(counts.gradients,gradientCount,'unchanged daylight gradients are reused');
const time=element('time-button');
assert.equal(typeof time.events.click,'function');
time.events.click();now+=50;raf(now);
const duskGradients=counts.gradients;
for(let frame=1;frame<=8;frame++){now+=35;raf(now);}
assert.equal(counts.gradients,duskGradients,'dusk lamp/window gradients are reused');
time.events.click();now+=50;raf(now);
const nightGradients=counts.gradients;
for(let frame=1;frame<=8;frame++){now+=35;raf(now);}
assert.equal(counts.gradients,nightGradients,'night gradients are reused');
assert.ok(counts.drawImage>20,'rendering continues across all day phases');
listeners.resize();
assert.equal(offscreenCreated,2,'viewport resize regenerates cached geometry once');
console.log('KOMOREBI_25D_PERFORMANCE_CONTRACT_PASS',counts);
