/** Image Lab v0.6: ordering and non-generative owner-mask brush. */
export function reorderLayers(model,from,to){
 const {layers,owner}=model;
 if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||
 from>=layers.length||to>=layers.length)throw Error('移動先のレイヤーが不正です');
 if(from===to)return {model,index:from};
 const next=layers.map(x=>({...x}));
 const [item]=next.splice(from,1);next.splice(to,0,item);
 const indexById=new Map(next.map((layer,i)=>[layer.id,i]));
 // IDs are not guaranteed unique after repeated merge/restore, so remap by
 // original object identity using tracked indexes instead.
 const order=layers.map((_,i)=>i);const [moved]=order.splice(from,1);order.splice(to,0,moved);
 const map=new Uint8Array(layers.length);
 order.forEach((oldIndex,newIndex)=>{map[oldIndex]=newIndex;});
 const nextOwner=new Uint8Array(owner.length);
 for(let p=0;p<owner.length;p++){
  if(owner[p]>=layers.length)throw Error('所有者マップが不正です');
  nextOwner[p]=map[owner[p]];
 }
 return {model:{...model,owner:nextOwner,layers:next},index:to};
}
export function strokeSegment(model,original,{from,to,radius,mode,selected,target}){
 const {width:w,height:h,source,owner,layers}=model;
 if(!original||original.length!==source.length||owner.length!==w*h)throw Error('元画像の参照が不正です');
 if(!Number.isInteger(selected)||selected<0||selected>=layers.length)throw Error('選択レイヤーが不正です');
 if(mode==='remove'&&(!Number.isInteger(target)||target<0||target>=layers.length||target===selected))
  throw Error('除外先レイヤーを指定してください');
 if(mode!=='add'&&mode!=='remove')throw Error('ブラシモードが不正です');
 const r=Math.max(1,Math.min(90,Math.floor(radius)||8)),dx=to.x-from.x,dy=to.y-from.y;
 const steps=Math.min(Math.ceil(Math.hypot(dx,dy)/Math.max(1,r/2)),Math.max(w,h)*2);
 let changed=0;
 for(let step=0;step<=steps;step++){
  const t=steps?step/steps:0,cx=from.x+dx*t,cy=from.y+dy*t;
  const xmin=Math.max(0,Math.floor(cx-r)),xmax=Math.min(w-1,Math.ceil(cx+r));
  const ymin=Math.max(0,Math.floor(cy-r)),ymax=Math.min(h-1,Math.ceil(cy+r)),sq=r*r;
  for(let y=ymin;y<=ymax;y++)for(let x=xmin;x<=xmax;x++){
   if((x-cx)**2+(y-cy)**2>sq)continue;
   const p=y*w+x,old=owner[p];
   if(mode==='remove'&&old!==selected)continue;
   const next=mode==='add'?selected:target;
   if(old===next)continue;
   owner[p]=next;
   // Restore only actual pixels of the uploaded source, never synthesize content.
   source.set(original.subarray(p*4,p*4+4),p*4);
   changed++;
  }
 }
 return changed;
}
export function recalcLayerCounts(model){
 const counts=new Uint32Array(model.layers.length);
 for(let p=0;p<model.owner.length;p++)if(model.source[p*4+3]>0)counts[model.owner[p]]++;
 model.layers.forEach((layer,i)=>{layer.pixelCount=counts[i];});
}
