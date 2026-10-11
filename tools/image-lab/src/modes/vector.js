/* SVGPathCommander and SVGO work from generated, bounded in-memory geometry. */
import SVGPathCommander from 'svg-path-commander';
import {optimize} from 'svgo/browser';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const n=x=>Math.round(x*100)/100;
function sample(image,x,y){
 const w=image.width,h=image.height,ix=clamp(Math.floor(x),0,w-1),iy=clamp(Math.floor(y),0,h-1);
 const i=(iy*w+ix)*4;
 return '#'+[image.data[i],image.data[i+1],image.data[i+2]].map(v=>v.toString(16).padStart(2,'0')).join('');
}
async function drawSvg(svg,ctx,w,h){
 const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
 try{
  const img=new Image();
  img.src=url;
  if(img.decode)await img.decode();
  else await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;});
  ctx.clearRect(0,0,w,h);
  ctx.drawImage(img,0,0,w,h);
 }finally{URL.revokeObjectURL(url);}
}
function shell(w,h,paths){
 return '<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'"><rect width="'+w+'" height="'+h+'" fill="#fbf6ed"/>'+paths.join('')+'</svg>';
}
export async function renderPath({ctx,image,detail,weight,seed}){
 const w=image.width,h=image.height,cols=Math.max(6,Math.floor(5+detail*.22)),step=w/cols,rows=Math.ceil(h/step);
 const shapes=[];
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const x=i*step,y=j*step,r=step*.45,fill=sample(image,x+r,y+r);
  const offset=Math.sin((seed+i*17+j*13)*.17)*step*.25;
  const path='M'+n(x+r)+','+n(y)+' Q'+n(x+step+offset)+','+n(y+r)+' '+n(x+r)+','+n(y+step)+' Q'+n(x+offset)+','+n(y+r)+' '+n(x+r)+','+n(y)+' Z';
  const d=new SVGPathCommander(path,{round:2}).optimize().toString();
  shapes.push('<path d="'+d+'" fill="'+fill+'" opacity="'+n(.5+weight*.005)+'" stroke="#403b34" stroke-width="'+n(weight*.012)+'"/>');
 }
 const svg=shell(w,h,shapes);
 await drawSvg(svg,ctx,w,h);
 return {svg,message:'SVGPathCommanderでパスを構成・最適化'};
}
export async function renderSVGO({ctx,image,detail,weight,seed}){
 const w=image.width,h=image.height,cols=Math.max(5,Math.floor(detail*.23+4)),step=w/cols,rows=Math.ceil(h/step);
 const items=[];
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const x=i*step+step*.5,y=j*step+step*.5;
  const radius=step*(.2+weight*.003)*(.75+.25*Math.sin(i+j+seed));
  const fill=sample(image,x,y);
  items.push('<circle cx="'+n(x)+'" cy="'+n(y)+'" r="'+n(radius)+'" fill="'+fill+'"/>');
 }
 const before=shell(w,h,items);
 // Conservative browser optimizer, with all source geometry generated locally.
 const result=optimize(before,{multipass:false,plugins:[{name:'preset-default',params:{overrides:{removeViewBox:false,convertShapeToPath:false}}}]});
 if(!result?.data?.includes('<svg'))throw Error('SVGOが有効なSVGを返さなかった');
 const svg=result.data;
 await drawSvg(svg,ctx,w,h);
 const saved=Math.max(0,new TextEncoder().encode(before).length-new TextEncoder().encode(svg).length);
 return {svg,message:'SVGO最適化 '+saved+' bytes削減（実験用SVG）'};
}
