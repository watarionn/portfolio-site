/* Isolated optional browser WASM image experiments. */
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const maxSide=160;
const traceOptions={binary:false,mode:'polygon',hierarchical:'stacked',cornerThreshold:60,lengthThreshold:4,
 maxIterations:10,spliceThreshold:45,filterSpeckle:4,colorPrecision:6,layerDifference:16,pathPrecision:3};
const svgSafe=svg=>typeof svg==='string'&&svg.startsWith('<svg')||typeof svg==='string'&&svg.includes('<svg');
function cleanSvg(svg){
 if(!svgSafe(svg)||!svg.includes('</svg>')||svg.length>850000||
  /<script|<foreignObject|<image|\shref\s*=|xlink:href|<iframe/i.test(svg))throw Error('ベクター化で安全なSVGを取得できなかった');
 return svg;
}
async function drawSvg(svg,ctx,w,h){
 const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
 try{
  const img=new Image();img.src=url;
  if(img.decode)await img.decode();
  else await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;});
  ctx.clearRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
 }finally{URL.revokeObjectURL(url);}
}
let vtracerPromise;
async function vtracer(){
 if(!vtracerPromise)vtracerPromise=(async()=>{
  const mod=await import(new URL('./vendor/vtracer.js',import.meta.url).href);
  const response=await fetch(new URL('./vendor/vtracer.wasm',import.meta.url));
  if(!response.ok)throw Error('VTracer WASMアセットなし');
  await mod.default({module_or_path:new Uint8Array(await response.arrayBuffer())});
  return mod;
 })().catch(err=>{vtracerPromise=null;throw err;});
 return vtracerPromise;
}
export async function renderVTracer({ctx,source,image,detail,weight,seed}){
 const mod=await vtracer(),w=image.width,h=image.height,k=Math.min(1,maxSide/Math.max(w,h));
 const sw=Math.max(1,Math.round(w*k)),sh=Math.max(1,Math.round(h*k));
 const c=document.createElement('canvas');c.width=sw;c.height=sh;
 const temp=c.getContext('2d',{willReadFrequently:true});
 temp.drawImage(source,0,0,sw,sh);
 const pixels=new Uint8Array(temp.getImageData(0,0,sw,sh).data);
 const options={...traceOptions,colorPrecision:clamp(Math.floor(3+detail/16),3,8),
  filterSpeckle:clamp(Math.floor(12-weight/11),1,12),
  lengthThreshold:clamp(Math.floor(10-detail/15),2,10)};
 const traced=cleanSvg(mod.to_svg(pixels,sw,sh,options));
 // SVG output keeps the sampled coordinate space, with scaled dimensions for download.
 const svg=traced.replace(/<svg([^>]*)>/,(_m,attrs)=>
   '<svg'+attrs.replace(/\swidth="[^"]*"/g,'').replace(/\sheight="[^"]*"/g,'')+
   ' width="'+w+'" height="'+h+'" viewBox="0 0 '+sw+' '+sh+'">');
 await drawSvg(svg,ctx,w,h);
 return {svg,message:'VTracer WASM · '+sw+'×'+sh+'の縮小サンプルをSVG化（元画像は不変）'};
}
let clipperPromise;
async function clipper(){
 if(!clipperPromise)clipperPromise=(async()=>{
  const lib=await import(new URL('./vendor/clipper2z.js',import.meta.url).href);
  const api=lib.default||lib;
  return await api({locateFile:name=>{
   if(name!=='clipper2z.wasm')throw Error('不明なWASMファイル');
   return new URL('./vendor/clipper2z.wasm',import.meta.url).href;
  }});
 })().catch(e=>{clipperPromise=null;throw e;});
 return clipperPromise;
}
const scale=16;
function intersectPolygon(mod,a,b){
 const pathsA=new mod.Paths64(),pathsB=new mod.Paths64();
 let sol;
 try{
  const p1=mod.MakePath64(a.flatMap(p=>p.map(v=>Math.round(v*scale))));
  const p2=mod.MakePath64(b.flatMap(p=>p.map(v=>Math.round(v*scale))));
  try{pathsA.push_back(p1);pathsB.push_back(p2);}finally{p1.delete();p2.delete();}
  sol=mod.Intersect64(pathsA,pathsB,mod.FillRule.EvenOdd);
  const rings=[];
  for(let i=0;i<Math.min(sol.size(),8);i++){
   const path=sol.get(i);
   try{
    const view=path.view(),ring=[];
    for(let j=0;j<view.length;j+=3)ring.push([Number(view[j])/scale,Number(view[j+1])/scale]);
    if(ring.length>=3)rings.push(ring);
   }finally{path.delete();}
  }
  return rings;
 }finally{sol?.delete();pathsA.delete();pathsB.delete();}
}
function sampled(image,x,y){
 const ix=clamp(Math.floor(x),0,image.width-1),iy=clamp(Math.floor(y),0,image.height-1),i=(iy*image.width+ix)*4;
 return '#'+[image.data[i],image.data[i+1],image.data[i+2]].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export async function renderClipper({ctx,source,image,detail,weight,seed}){
 const mod=await clipper(),w=image.width,h=image.height,cols=clamp(Math.floor(3+detail/10),4,13);
 const step=w/cols,rows=Math.ceil(h/step),paths=[];
 ctx.fillStyle='#f3ede4';ctx.fillRect(0,0,w,h);
 ctx.globalAlpha=.2;ctx.drawImage(source,0,0);ctx.globalAlpha=1;
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const x=i*step,y=j*step,cx=x+step/2,cy=y+step/2;
  const square=[[x,y],[x+step,y],[x+step,y+step],[x,y+step]];
  const rad=step*(.55+weight*.0025),angle=(seed+i+j)*Math.PI/31;
  const ngon=Array.from({length:5},(_,k)=>[cx+rad*Math.cos(angle+k*Math.PI*2/5),cy+rad*Math.sin(angle+k*Math.PI*2/5)]);
  const rings=intersectPolygon(mod,square,ngon);
  const color=sampled(image,cx,cy);
  for(const ring of rings){
   ctx.beginPath();ctx.moveTo(...ring[0]);
   for(let k=1;k<ring.length;k++)ctx.lineTo(...ring[k]);
   ctx.closePath();ctx.fillStyle=color;ctx.fill();
   paths.push('<polygon points="'+ring.map(p=>p.map(x=>Math.round(x*100)/100).join(',')).join(' ')+'" fill="'+color+'"/>');
  }
 }
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'"><rect width="'+w+'" height="'+h+'" fill="#f3ede4"/>'+paths.join('')+'</svg>';
 return {svg,message:'Clipper2-WASM · 実図形の交差演算 '+paths.length+'片'};
}
