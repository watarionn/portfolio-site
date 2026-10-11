import {voronoi as makeVoronoi} from 'd3-voronoi';
import Delaunator from 'delaunator';
import earcut from 'earcut';
import rough from 'roughjs';
import {Pt, Line} from 'pts';
import paper from 'paper';
import * as glfx from 'glfx';

const $=id=>document.getElementById(id);
const source=$('source'), output=$('result');
const srcCtx=source.getContext('2d',{willReadFrequently:true});
const status=$('status'), svgButton=$('svgButton'), pngButton=$('pngButton');
const desc={
  voronoi:'d3-voronoi。点から領域を分割し、それぞれの元画像の色で塗る。図形の境界をSVGでも保存できる。',
  delaunay:'Delaunator。画像上に点を撒いて三角形で再構成。小さな三角形ほど細部が残る。',
  earcut:'Earcut。穴のある多角形を三角形へ分ける。画像を「抜き窓のあるタイル」へ変換する。',
  pts:'Pts.js。点と線の距離・中心を計算し、画像の色からネットワーク模様を描く。',
  rough:'Rough.js。画像の色を拾い、手描き風の塗りと線に置き換える。',
  paper:'Paper.js。規則的な図形を色付きベクタータイルとして再描画。SVGとして取り出せる。',
  glfx:'glfx.js。WebGLで写真に色調補正と周辺効果をかける。GPUに対応しない端末では利用できない場合がある。'
};
let sourceName='sample', vectorSvg='', inProgress=false, pending=false, debounce=0;
const setStatus=message=>{status.textContent=message;};
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const randFromSeed=seed=>{let n=(seed|0)||1;return ()=>{n=(Math.imul(n,1664525)+1013904223)|0;return (n>>>0)/4294967296;};};
const escapeAttr=str=>String(str).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const n=v=>Math.round(v*100)/100;
const rgb=(image,x,y)=>{
  const ix=clamp(Math.floor(x),0,image.width-1),iy=clamp(Math.floor(y),0,image.height-1);
  const i=(iy*image.width+ix)*4;
  return '#'+Array.from(image.data.slice(i,i+3),v=>v.toString(16).padStart(2,'0')).join('');
};
function prepare(sizeW,sizeH){
  const w=clamp(Math.floor(sizeW)||512,1,1200),h=clamp(Math.floor(sizeH)||512,1,1200);
  source.width=w;source.height=h;output.width=w;output.height=h;
  srcCtx.imageSmoothingEnabled=true;srcCtx.imageSmoothingQuality='high';
}
function paintSample(){
  prepare(720,540);
  const g=srcCtx.createLinearGradient(0,0,720,540);
  g.addColorStop(0,'#ead4b1');g.addColorStop(.45,'#9bb3aa');g.addColorStop(1,'#385b71');
  srcCtx.fillStyle=g;srcCtx.fillRect(0,0,720,540);
  srcCtx.fillStyle='#e9b574';srcCtx.beginPath();srcCtx.arc(555,145,88,0,Math.PI*2);srcCtx.fill();
  srcCtx.fillStyle='#193849';srcCtx.beginPath();srcCtx.moveTo(0,440);srcCtx.lineTo(240,170);srcCtx.lineTo(435,440);srcCtx.fill();
  srcCtx.fillStyle='#517e70';srcCtx.beginPath();srcCtx.moveTo(220,440);srcCtx.lineTo(560,210);srcCtx.lineTo(720,420);srcCtx.lineTo(720,540);srcCtx.lineTo(0,540);srcCtx.fill();
  srcCtx.fillStyle='#c65f49';srcCtx.fillRect(100,325,105,165);
  srcCtx.fillStyle='#f4e8cc';srcCtx.fillRect(126,349,52,52);
  srcCtx.fillStyle='#c1d0ce';srcCtx.fillRect(310,395,140,80);
  sourceName='sample';$('meta').textContent='作例 · 720 × 540 px · 処理は端末内のみ';
  queueRender();
}
function sampleSites(count,w,h,seed,includeCorners=true){
  const rand=randFromSeed(seed);
  const pts=[];
  if(includeCorners)pts.push([0,0],[w,0],[0,h],[w,h],[w*.5,0],[w*.5,h],[0,h*.5],[w,h*.5]);
  for(let i=0;i<count;i++)pts.push([rand()*w,rand()*h]);
  return pts;
}
function startVector(w,h){vectorSvg='';svgButton.disabled=true;return [];}
function finishVector(paths,w,h){
  if(!paths.length){vectorSvg='';svgButton.disabled=true;return;}
  vectorSvg='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'">'+paths.join('')+'</svg>';
  svgButton.disabled=false;
}
function polygon(ctx,points,fill,strokeWidth=0){
  if(points.length<3)return;
  ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
  for(let j=1;j<points.length;j++)ctx.lineTo(points[j][0],points[j][1]);
  ctx.closePath();ctx.fillStyle=fill;ctx.fill();
  if(strokeWidth){ctx.strokeStyle='rgba(36,26,18,.42)';ctx.lineWidth=strokeWidth;ctx.stroke();}
}
function svgPoly(points,fill,stroke='none',width=0){
  return '<polygon points="'+points.map(p=>n(p[0])+','+n(p[1])).join(' ')+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+n(width)+'"/>';
}
function renderVoronoi(ctx,image,density,weight,seed){
  const {width:w,height:h}=image, amount=Math.floor(20+density*5);
  const sites=sampleSites(amount,w,h,seed);
  const vor=makeVoronoi().extent([[0,0],[w,h]])(sites);
  const polys=vor.polygons(), paths=[];
  ctx.fillStyle='#fff9ef';ctx.fillRect(0,0,w,h);
  polys.forEach((pts,i)=>{
    if(!pts||pts.length<3)return;
    const fill=rgb(image,sites[i][0],sites[i][1]);
    polygon(ctx,pts,fill,weight*.015);
    paths.push(svgPoly(pts,fill,weight?'#40382d':'none',weight*.015));
  });
  finishVector(paths,w,h);
}
function renderDelaunay(ctx,image,density,weight,seed){
  const {width:w,height:h}=image, pts=sampleSites(25+density*6,w,h,seed);
  const tris=Delaunator.from(pts).triangles,paths=[];
  ctx.fillStyle='#eee7d9';ctx.fillRect(0,0,w,h);
  for(let i=0;i<tris.length;i+=3){
    const a=pts[tris[i]],b=pts[tris[i+1]],c=pts[tris[i+2]];
    const fill=rgb(image,(a[0]+b[0]+c[0])/3,(a[1]+b[1]+c[1])/3);
    polygon(ctx,[a,b,c],fill,weight*.009);
    paths.push(svgPoly([a,b,c],fill,weight?'#302b28':'none',weight*.009));
  }
  finishVector(paths,w,h);
}
function renderEarcut(ctx,image,density,weight,seed){
  const {width:w,height:h}=image;
  const cols=Math.floor(5+density*.24),size=w/cols,rows=Math.ceil(h/size);
  const rng=randFromSeed(seed),paths=[];
  ctx.fillStyle='#222f35';ctx.fillRect(0,0,w,h);
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
    const x=col*size,y=row*size,s=Math.min(size,w-x),t=Math.min(size,h-y);
    if(s<1||t<1)continue;
    const r=.13+(weight/100)*.26;
    const hole=[[x+s*r,y+t*r],[x+s*r,y+t*(1-r)],[x+s*(1-r),y+t*(1-r)],[x+s*(1-r),y+t*r]];
    const outer=[[x,y],[x+s,y],[x+s,y+t],[x,y+t]];
    const loop=[...outer,...hole],flat=loop.flat();
    const tris=earcut(flat,[4],2),fill=rgb(image,x+s*(.35+rng()*.3),y+t*(.35+rng()*.3));
    for(let k=0;k<tris.length;k+=3){
      const a=loop[tris[k]],b=loop[tris[k+1]],c=loop[tris[k+2]];
      polygon(ctx,[a,b,c],fill);
      paths.push(svgPoly([a,b,c],fill));
    }
  }
  finishVector(['<rect width="'+w+'" height="'+h+'" fill="#222f35"/>',...paths],w,h);
}
function renderPts(ctx,image,density,weight,seed){
  const {width:w,height:h}=image,rand=randFromSeed(seed);
  const points=sampleSites(35+density*2,w,h,seed,false).map(x=>new Pt(x[0],x[1]));
  const radius=14+weight*1.2,paths=[];
  ctx.fillStyle='#f9f4eb';ctx.fillRect(0,0,w,h);
  paths.push('<rect width="'+w+'" height="'+h+'" fill="#f9f4eb"/>');
  for(let i=0;i<points.length;i++){
    const a=points[i],c=rgb(image,a[0],a[1]);
    ctx.fillStyle=c;ctx.beginPath();ctx.arc(a[0],a[1],2+weight*.025,0,Math.PI*2);ctx.fill();
    paths.push('<circle cx="'+n(a[0])+'" cy="'+n(a[1])+'" r="'+n(2+weight*.025)+'" fill="'+c+'"/>');
    for(let j=i+1;j<points.length;j++){
      const b=points[j],length=Line.magnitude([a,b]);
      if(length>radius||rand()<.34)continue;
      ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);
      ctx.strokeStyle=c;ctx.globalAlpha=clamp((radius-length)/radius,.12,.7);ctx.lineWidth=.7+weight*.015;ctx.stroke();ctx.globalAlpha=1;
      paths.push('<line x1="'+n(a[0])+'" y1="'+n(a[1])+'" x2="'+n(b[0])+'" y2="'+n(b[1])+'" stroke="'+c+'" stroke-opacity=".45" stroke-width="'+n(.7+weight*.015)+'"/>');
    }
  }
  finishVector(paths,w,h);
}
function renderRough(ctx,image,density,weight,seed){
  const {width:w,height:h}=image,cols=Math.floor(7+density*.17),step=w/cols,rows=Math.ceil(h/step),rc=rough.canvas(output);
  ctx.fillStyle='#f7f1e7';ctx.fillRect(0,0,w,h);
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    const x=i*step,y=j*step;
    const c=rgb(image,x+step*.5,y+step*.5);
    rc.rectangle(x+2,y+2,step-4,step-4,{
      seed:seed*10000+j*cols+i,roughness:.35+weight*.025,stroke:c,
      strokeWidth:.5+weight*.013,fill:c,fillStyle:'hachure',hachureGap:2+weight*.075
    });
  }
}
function renderPaper(image,density,weight,seed){
  const scope=new paper.PaperScope();
  const layer=document.createElement('canvas');layer.width=image.width;layer.height=image.height;
  scope.setup(layer);scope.activate();
  try{
    const {width:w,height:h}=image,cols=Math.floor(5+density*.22),step=w/cols,rows=Math.ceil(h/step);
    const bg=new scope.Path.Rectangle(new scope.Rectangle(0,0,w,h));bg.fillColor='#f8f3e9';
    const paths=[];
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const px=x*step,py=y*step,fill=rgb(image,px+step*.5,py+step*.5);
      const rect=new scope.Path.RegularPolygon(new scope.Point(px+step/2,py+step/2),3+((x+y+seed)%5),Math.max(2,step*.55));
      rect.rotate((seed+x*17+y*11)%100);
      rect.fillColor=fill;rect.strokeColor=weight?new scope.Color('#534b43'):null;
      rect.strokeWidth=weight*.014;
      paths.push(rect);
    }
    scope.view.draw();
    output.getContext('2d').drawImage(layer,0,0);
    vectorSvg=scope.project.exportSVG({asString:true});
    svgButton.disabled=false;
  }finally{scope.project.clear();scope.remove();}
}
let gpuFx=null;
function renderGlfx(ctx,image,density,weight,seed){
  const fx=gpuFx||(gpuFx=glfx.canvas());
  const tex=fx.texture(source);
  try{
    fx.draw(tex)
      .brightnessContrast((weight-50)/240,(density-45)/110)
      .hueSaturation((seed-50)/130,(weight-30)/115)
      .vignette(.12+weight*.003,.05+weight*.006)
      .update();
    ctx.drawImage(fx,0,0,image.width,image.height);
  }finally{tex.destroy();}
}
function render(){
  if(inProgress){pending=true;return;}
  inProgress=true;
  $('runButton').disabled=true;
  try{
    const effect=$('effect').value,detail=+$('detail').value,weight=+$('weight').value,seed=+$('seed').value;
    const image=srcCtx.getImageData(0,0,source.width,source.height),ctx=output.getContext('2d');
    output.width=source.width;output.height=source.height;
    svgButton.disabled=true;vectorSvg='';
    switch(effect){
      case 'voronoi':renderVoronoi(ctx,image,detail,weight,seed);break;
      case 'delaunay':renderDelaunay(ctx,image,detail,weight,seed);break;
      case 'earcut':renderEarcut(ctx,image,detail,weight,seed);break;
      case 'pts':renderPts(ctx,image,detail,weight,seed);break;
      case 'rough':renderRough(ctx,image,detail,weight,seed);break;
      case 'paper':renderPaper(image,detail,weight,seed);break;
      case 'glfx':renderGlfx(ctx,image,detail,weight,seed);break;
    }
    setStatus(effect+' · '+source.width+' × '+source.height+' px · 完了。設定を変えて比較できるよ。');
  }catch(error){
    output.width=source.width;output.height=source.height;
    output.getContext('2d').drawImage(source,0,0);
    svgButton.disabled=true;vectorSvg='';
    setStatus('このモードで処理できなかった：'+(error?.message||String(error)));
    console.error('Image Lab renderer failed',error);
  }finally{
    inProgress=false;$('runButton').disabled=false;
    if(pending){pending=false;setTimeout(render,0);}
  }
}
function queueRender(){clearTimeout(debounce);debounce=setTimeout(render,110);}
async function loadFile(file){
  if(!file||!file.type.startsWith('image/')){setStatus('画像ファイルを選んでね。');return;}
  if(file.size>25*1024*1024){setStatus('25MB以下の画像を選んでね。');return;}
  const url=URL.createObjectURL(file);
  const img=new Image();
  try{
    await new Promise((resolve,reject)=>{
      img.onload=resolve;
      img.onerror=()=>reject(new Error('画像をデコードできなかったよ。'));
      img.src=url;
    });
    const w=img.naturalWidth,h=img.naturalHeight;
    if(!w||!h||w*h>140000000)throw Error('画像サイズが大きすぎるよ。');
    const scale=Math.min(1,1200/Math.max(w,h));
    prepare(Math.round(w*scale),Math.round(h*scale));
    srcCtx.drawImage(img,0,0,source.width,source.height);
    sourceName=file.name.replace(/\\.[^.]+$/,'').replace(/[^a-zA-Z0-9-_]/g,'_').slice(0,40)||'image';
    $('meta').textContent=file.name+' · '+w+' × '+h+' → '+source.width+' × '+source.height+'px';
    queueRender();
  }catch(error){setStatus('画像を開けなかった：'+(error?.message||String(error)));}
  finally{URL.revokeObjectURL(url);}
}
function downloadBlob(blob,extension){
  if(!blob){setStatus('書き出しに失敗したよ。');return;}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='image-lab-'+sourceName+'-'+$('effect').value+'.'+extension;
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),30000);
}
$('upload').addEventListener('change',e=>{loadFile(e.target.files?.[0]);e.target.value='';});
$('sampleButton').addEventListener('click',paintSample);
$('runButton').addEventListener('click',render);
$('randomButton').addEventListener('click',()=>{$('seed').value=1+Math.floor(Math.random()*99);$('seedValue').textContent=$('seed').value;queueRender();});
$('effect').addEventListener('change',()=>{$('description').textContent=desc[$('effect').value];queueRender();});
['detail','weight','seed'].forEach(id=>$(id).addEventListener('input',()=>{$(id+'Value').textContent=$(id).value;queueRender();}));
pngButton.addEventListener('click',()=>output.toBlob(blob=>downloadBlob(blob,'png'),'image/png'));
svgButton.addEventListener('click',()=>{if(vectorSvg)downloadBlob(new Blob([vectorSvg],{type:'image/svg+xml'}),'svg');});
window.addEventListener('dragover',event=>{event.preventDefault();});
window.addEventListener('drop',event=>{event.preventDefault();if(event.dataTransfer?.files?.length)loadFile(event.dataTransfer.files[0]);});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js',{scope:'./'}).catch(console.warn),{once:true});
$('description').textContent=desc[$('effect').value];
paintSample();
