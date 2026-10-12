import {composeLayers} from './decompose.js';
/** Merge disjoint pixel-owned layers, baking their visible alpha without changing the original source. */
export function mergeLayerModel(model, indices, {label}={}){
 const {width,height,source,owner,layers}=model;
 if(!Number.isInteger(width)||!Number.isInteger(height)||source?.length!==width*height*4||
    owner?.length!==width*height||!Array.isArray(layers)||layers.length<2)
   throw Error('統合可能なレイヤーがありません');
 const chosen=[...new Set(indices)].sort((a,b)=>a-b);
 if(chosen.length<2||chosen.some(id=>!Number.isInteger(id)||id<0||id>=layers.length))
   throw Error('統合するレイヤーを2枚以上選択してください');
 const picked=new Uint8Array(layers.length);
 chosen.forEach(i=>{picked[i]=1;});
 const labels=chosen.map(i=>layers[i].label);
 const defaultName=labels.length===2?labels.join(' + '):labels[0]+' ほか'+(labels.length-1)+'枚';
 const name=typeof label==='string'&&label.trim()?label.trim():defaultName;
 const mapping=new Uint8Array(layers.length);
 const nextLayers=[];
 let target=-1;
 for(let i=0;i<layers.length;i++){
  if(picked[i]){
   if(i===chosen[0]){
    target=nextLayers.length;
    nextLayers.push({
      id:'merged-'+layers[i].id+'-'+chosen.join('-'),
      label:name.slice(0,36),kind:'merged',source:'merged',
      visible:true,opacity:100,hex:layers[i].hex||'#777777',pixelCount:0
    });
   }
   mapping[i]=target;
  }else{
   mapping[i]=nextLayers.length;
   nextLayers.push({...layers[i]});
  }
 }
 // Bake the exact visible composite RGB/alpha of selected layers. Any per-layer
 // tone effect must survive merging without double-application.
 const visible=composeLayers(model).data;
 const newSource=new Uint8ClampedArray(source),newOwner=new Uint8Array(owner);
 let pixels=0;
 for(let p=0;p<owner.length;p++){
  const index=owner[p];
  if(index>=layers.length)throw Error('画素とレイヤーの対応が不正です');
  newOwner[p]=mapping[index];
  if(!picked[index])continue;
  const t=p*4,visibleAlpha=visible[t+3];
  newSource.set(visible.subarray(t,t+4),t);
  if(visibleAlpha>0)pixels++;
 }
 nextLayers[target].pixelCount=pixels;
 return {model:{...model,source:newSource,owner:newOwner,layers:nextLayers},
   index:target,mergedCount:chosen.length};
}
export function identicalComposite(a,b){
 const x=composeLayers(a).data,y=composeLayers(b).data;
 if(x.length!==y.length)return false;
 for(let i=0;i<x.length;i++)if(x[i]!==y[i])return false;
 return true;
}
