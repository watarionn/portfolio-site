/**
 * Image Lab Layer Decomposer v0.3
 * Deterministic, source-only color clustering + connected components.
 * Every original pixel belongs to exactly one layer. No generative filling.
 * Keep only one full-size owner map rather than a full-size RGBA canvas per layer.
 */
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const dist=(r,g,b,c)=>{const x=r-c[0],y=g-c[1],z=b-c[2];return x*x*1.1+y*y*1.4+z*z*.8;};
const hex=c=>'#'+c.map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('');
const sizeLimit=300,maxLayers=18;
export function segmentImage(image,{colorGroups=10}={}){
 const {width:w,height:h,data}=image;
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w>1200||h>1200||data?.length!==w*h*4)
   throw Error('分解できない画像サイズです。');
 const k=clamp(Math.floor(colorGroups)||10,3,15),scale=Math.min(1,sizeLimit/Math.max(w,h));
 const sw=Math.max(1,Math.round(w*scale)),sh=Math.max(1,Math.round(h*scale)),np=sw*sh;
 const cellRGBA=new Uint8Array(np*4),cellIDs=new Int16Array(np);
 let nonempty=0;
 for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){
   const sx=Math.min(w-1,Math.floor((x+.5)*w/sw));
   const sy=Math.min(h-1,Math.floor((y+.5)*h/sh));
   const src=(sy*w+sx)*4,dst=(y*sw+x)*4;
   cellRGBA.set(data.subarray(src,src+4),dst);
   if(cellRGBA[dst+3]>0)nonempty++;
 }
 if(!nonempty)throw Error('透明な画像には分解可能な色がありません。');
 // Seed with the darkest pixel, then distant colors from a spatially sampled grid.
 let initial=0,bestLight=Infinity;
 for(let p=0;p<np;p++){
   const t=p*4;if(cellRGBA[t+3]===0)continue;
   const lum=.3*cellRGBA[t]+.59*cellRGBA[t+1]+.11*cellRGBA[t+2];
   if(lum<bestLight){bestLight=lum;initial=p;}
 }
 const centerAt=p=>[cellRGBA[p*4],cellRGBA[p*4+1],cellRGBA[p*4+2]];
 const centers=[centerAt(initial)];
 const stride=Math.max(1,Math.floor(np/20000));
 for(let j=1;j<k;j++){
  let best=-1,far=-1;
  for(let p=0;p<np;p+=stride){
   const off=p*4;if(cellRGBA[off+3]===0)continue;
   let closest=Infinity;
   for(const c of centers)closest=Math.min(closest,dist(cellRGBA[off],cellRGBA[off+1],cellRGBA[off+2],c));
   if(closest>far){far=closest;best=p;}
  }
  if(best<0||far<1)break;
  centers.push(centerAt(best));
 }
 for(let iter=0;iter<5;iter++){
   const sums=centers.map(()=>[0,0,0,0]);
   for(let p=0;p<np;p++){
    const t=p*4;
    if(!cellRGBA[t+3]){cellIDs[p]=-1;continue;}
    let best=0,d=Infinity;
    for(let i=0;i<centers.length;i++){
     const next=dist(cellRGBA[t],cellRGBA[t+1],cellRGBA[t+2],centers[i]);
     if(next<d){d=next;best=i;}
    }
    cellIDs[p]=best;
    const s=sums[best];s[0]+=cellRGBA[t];s[1]+=cellRGBA[t+1];s[2]+=cellRGBA[t+2];s[3]++;
   }
   for(let i=0;i<centers.length;i++)if(sums[i][3]){
    centers[i]=sums[i].slice(0,3).map(v=>v/sums[i][3]);
   }
 }
 // Region grouping is 4-connected, never diagonal bridging.
 const visited=new Uint8Array(np),componentAt=new Int32Array(np).fill(-1);
 const queue=new Int32Array(np),groups=[];
 for(let start=0;start<np;start++){
  if(visited[start]||cellIDs[start]<0)continue;
  const label=cellIDs[start],groupId=groups.length;
  let head=0,tail=1,count=0,sumX=0,sumY=0;
  queue[0]=start;visited[start]=1;
  while(head<tail){
   const p=queue[head++],x=p%sw,y=(p-x)/sw;
   componentAt[p]=groupId;count++;sumX+=x;sumY+=y;
   const neighbors=[x>0?p-1:-1,x+1<sw?p+1:-1,y>0?p-sw:-1,y+1<sh?p+sw:-1];
   for(const q of neighbors)if(q>=0&&!visited[q]&&cellIDs[q]===label){
    visited[q]=1;queue[tail++]=q;
   }
  }
  groups.push({id:groupId,color:centers[label],count,sumX,sumY});
 }
 // Keep largest meaningful regions; all small/remainder fragments are preserved
 // pixel-exact in the last "その他" layer. Never drop a pixel or invent occluded pixels.
 const minCells=Math.max(3,Math.floor(nonempty/2500));
 const ranked=groups.filter(g=>g.count>=minCells)
   .sort((a,b)=>b.count-a.count||a.id-b.id).slice(0,maxLayers-1);
 if(!ranked.length)ranked.push([...groups].sort((a,b)=>b.count-a.count)[0]);
 const assignedGroups=new Int16Array(groups.length).fill(-1);
 ranked.forEach((g,i)=>{assignedGroups[g.id]=i;});
 const chosen=ranked.reduce((n,g)=>n+g.count,0),hasResidual=chosen<nonempty;
 const layers=ranked.map((g,i)=>({
  id:'r'+g.id,label:'領域 '+String(i+1).padStart(2,'0'),hex:hex(g.color),
  visible:true,opacity:100,cellCount:g.count
 }));
 if(hasResidual)layers.push({id:'remainder',label:'その他の領域',hex:'#929292',
  visible:true,opacity:100,cellCount:nonempty-chosen});
 const residual=hasResidual?layers.length-1:0;
 const coarseOwner=new Uint8Array(np);
 for(let p=0;p<np;p++){
  const id=componentAt[p];
  coarseOwner[p]=id>=0&&assignedGroups[id]>=0?assignedGroups[id]:residual;
 }
 const owner=new Uint8Array(w*h),pixelCounts=new Uint32Array(layers.length);
 for(let y=0;y<h;y++){
  const cy=Math.min(sh-1,Math.floor((y+.5)*sh/h));
  for(let x=0;x<w;x++){
   const cx=Math.min(sw-1,Math.floor((x+.5)*sw/w)),p=y*w+x;
   const index=coarseOwner[cy*sw+cx];
   owner[p]=index;
   if(data[p*4+3]>0)pixelCounts[index]++;
  }
 }
 layers.forEach((l,i)=>{l.pixelCount=pixelCounts[i];});
 return {width:w,height:h,source:new Uint8ClampedArray(data),owner,layers,
  sampleWidth:sw,sampleHeight:sh,groupsFound:groups.length};
}
/** Exact original RGBA when all layers are visible with opacity 100. */
export function composeLayers(model,{soloIndex=-1,onlyIndex=-1,ignoreVisibility=false,ignoreOpacity=false}={}){
 const {width:w,height:h,owner,layers,source}=model;
 const out=new Uint8ClampedArray(source);
 for(let p=0;p<owner.length;p++){
  const id=owner[p],layer=layers[id],idx=p*4+3;
  const visible=(onlyIndex<0||id===onlyIndex)&&(soloIndex<0||id===soloIndex)&&
    (ignoreVisibility||id===soloIndex||layer.visible);
  if(!visible)out[idx]=0;
  else if(!ignoreOpacity&&layer.opacity!==100)out[idx]=Math.round(out[idx]*layer.opacity/100);
 }
 return {width:w,height:h,data:out};
}
