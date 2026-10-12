/** Image Lab v0.8: deterministic, non-generative per-owned-pixel FX stacks.
 * Operations are native CPU reference experiments, not glfx.js/PixiJS calls.
 * Do not borrow pixels from another owner during spatial filtering.
 */
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export const FX_TYPES=Object.freeze([
 {kind:'invert',label:'反転'},
 {kind:'grayscale',label:'グレースケール'},
 {kind:'posterize',label:'ポスタライズ'},
 {kind:'threshold',label:'二値化'},
 {kind:'mosaic',label:'モザイク'},
 {kind:'blur',label:'ぼかし'},
 {kind:'halftone',label:'網点'},
 {kind:'edges',label:'エッジ強調'}
]);
const kinds=new Set(FX_TYPES.map(x=>x.kind));
export function normalizeFx(effect){
 if(!effect||typeof effect!=='object'||!kinds.has(effect.kind))throw Error('未対応のレイヤーFXです');
 const amount=Number(effect.amount??60);
 if(!Number.isFinite(amount))throw Error('FX強度が不正です');
 return {id:String(effect.id||''),kind:effect.kind,enabled:effect.enabled!==false,amount:clamp(Math.round(amount),0,100)};
}
export function updateLayerFx(model,index,change){
 if(!model||!Array.isArray(model.layers)||!Number.isInteger(index)||index<0||index>=model.layers.length)
  throw Error('FX対象レイヤーが不正です');
 const stack=(model.layers[index].fx||[]).map(normalizeFx),at=Number(change?.position);
 if(!change||typeof change.type!=='string')throw Error('FX操作が不正です');
 let seq=model.fxSeq||0;
 if(change.type==='add'){
  if(stack.length>=8)throw Error('レイヤーごとのFXは8個までです');
  const fx=normalizeFx({kind:change.kind,amount:change.amount});
  seq++;fx.id='fx-'+seq;stack.push(fx);
 }else{
  if(!Number.isInteger(at)||at<0||at>=stack.length)throw Error('FXの位置が不正です');
  if(change.type==='toggle')stack[at].enabled=!stack[at].enabled;
  else if(change.type==='delete')stack.splice(at,1);
  else if(change.type==='amount')stack[at].amount=normalizeFx({...stack[at],amount:change.amount}).amount;
  else if(change.type==='move'){
   const to=at+Number(change.delta);
   if(!Number.isInteger(to)||to<0||to>=stack.length)throw Error('FXの移動先が不正です');
   const [fx]=stack.splice(at,1);stack.splice(to,0,fx);
  }else throw Error('未対応のFX操作です');
 }
 return {...model,fxSeq:seq,layers:model.layers.map((layer,i)=>i===index?{...layer,fx:stack}:layer)};
}
const lum=(r,g,b)=>Math.round(r*.2126+g*.7152+b*.0722);
const blend=(a,b,t)=>clamp(Math.round(a+(b-a)*t),0,255);
function pointwise(out,owner,index,kind,amount,width){
 const t=amount/100;
 for(let p=0;p<owner.length;p++){
  if(owner[p]!==index||out[p*4+3]===0)continue;
  const o=p*4,r=out[o],g=out[o+1],b=out[o+2];
  let nr=r,ng=g,nb=b;
  if(kind==='invert'){nr=255-r;ng=255-g;nb=255-b;}
  if(kind==='grayscale'){nr=ng=nb=lum(r,g,b);}
  if(kind==='posterize'){
   const levels=2+Math.floor((100-amount)*0.06);
   const q=v=>Math.round(Math.round(v*(levels-1)/255)*255/(levels-1));
   nr=q(r);ng=q(g);nb=q(b);
  }
  if(kind==='threshold'){nr=ng=nb=lum(r,g,b)>=128?255:0;}
  if(kind==='halftone'){
   const x=p%width,y=(p-x)/width;
   const spacing=4+Math.floor((100-amount)/17),dx=((x%spacing)+.5)/spacing-.5,dy=((y%spacing)+.5)/spacing-.5;
   const dot=Math.sqrt(dx*dx+dy*dy)<Math.sqrt(Math.max(0,1-lum(r,g,b)/255))*.64;
   nr=ng=nb=dot?25:245;
  }
  out[o]=blend(r,nr,t);out[o+1]=blend(g,ng,t);out[o+2]=blend(b,nb,t);
 }
}
function spatial(out,owner,index,kind,amount,w,h){
 const snapshot=new Uint8ClampedArray(out),t=amount/100;
 const valid=p=>p>=0&&p<owner.length&&owner[p]===index&&snapshot[p*4+3]>0;
 if(kind==='mosaic'){
  const size=Math.max(2,Math.floor(amount/7)+2),cells=new Map();
  for(let p=0;p<owner.length;p++){
   if(!valid(p))continue;
   const x=p%w,y=(p-x)/w,key=Math.floor(y/size)*Math.ceil(w/size)+Math.floor(x/size);
   let s=cells.get(key);if(!s){s=[0,0,0,0];cells.set(key,s);}
   const o=p*4;s[0]+=snapshot[o];s[1]+=snapshot[o+1];s[2]+=snapshot[o+2];s[3]++;
  }
  for(let p=0;p<owner.length;p++){
   if(!valid(p))continue;
   const x=p%w,y=(p-x)/w,key=Math.floor(y/size)*Math.ceil(w/size)+Math.floor(x/size),s=cells.get(key),o=p*4;
   if(!s||!s[3])continue;
   for(let c=0;c<3;c++)out[o+c]=blend(snapshot[o+c],Math.round(s[c]/s[3]),t);
  }
  return;
 }
 const radius=kind==='blur'?Math.max(1,Math.ceil(amount/34)):1;
 for(let p=0;p<owner.length;p++){
  if(!valid(p))continue;
  const x=p%w,y=(p-x)/w,o=p*4;
  if(kind==='blur'){
   const sums=[0,0,0];let count=0;
   for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
    const xx=x+dx,yy=y+dy;if(xx<0||xx>=w||yy<0||yy>=h)continue;
    const n=yy*w+xx;if(!valid(n))continue;
    const q=n*4;for(let c=0;c<3;c++)sums[c]+=snapshot[q+c];count++;
   }
   if(count)for(let c=0;c<3;c++)out[o+c]=blend(snapshot[o+c],sums[c]/count,t);
  }else if(kind==='edges'){
   const middle=lum(snapshot[o],snapshot[o+1],snapshot[o+2]);
   let maxDiff=0;
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const xx=x+dx,yy=y+dy;if(xx<0||xx>=w||yy<0||yy>=h)continue;
    const n=yy*w+xx;if(!valid(n))continue;
    const q=n*4;maxDiff=Math.max(maxDiff,Math.abs(middle-lum(snapshot[q],snapshot[q+1],snapshot[q+2])));
   }
   const value=clamp(Math.round(maxDiff*3),0,255);
   for(let c=0;c<3;c++)out[o+c]=blend(snapshot[o+c],value,t);
  }
 }
}
/** Mutates only a fresh compositing buffer. Source and owner are read-only. */
export function applyFxStacks(out,model){
 const {width:w,height:h,owner,layers}=model;
 for(let index=0;index<layers.length;index++){
  for(const raw of layers[index].fx||[]){
   const fx=normalizeFx(raw);
   if(!fx.enabled||fx.amount===0)continue;
   if(['blur','mosaic','edges'].includes(fx.kind))spatial(out,owner,index,fx.kind,fx.amount,w,h);
   else pointwise(out,owner,index,fx.kind,fx.amount,w);
  }
 }
 return out;
}
