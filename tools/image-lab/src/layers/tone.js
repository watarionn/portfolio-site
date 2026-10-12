/** v0.7: source-preserving, per-owner scalar tone adjustments.
 * This does not duplicate full-resolution RGBA buffers per layer. */
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
export const NEUTRAL_TONE=Object.freeze({brightness:0,contrast:0,saturation:0});
export function normalizedTone(value={}){
 const next={};
 for(const key of ['brightness','contrast','saturation']){
  const n=Number(value?.[key]??0);
  if(!Number.isFinite(n))throw Error('レイヤー調整値が不正です');
  next[key]=clamp(Math.round(n),-100,100);
 }
 return next;
}
export function hasTone(value){
 return Boolean(value&&(value.brightness||value.contrast||value.saturation));
}
/** Only source RGB changes; alpha is always handled separately by the compositor. */
export function toneRGB(r,g,b,value){
 if(!hasTone(value))return [r,g,b];
 const contrast=1+value.contrast/100,sat=1+value.saturation/100,bright=value.brightness*1.2;
 const mean=r*.2126+g*.7152+b*.0722;
 const fn=channel=>clamp(Math.round((mean+(channel-mean)*sat-127.5)*contrast+127.5+bright),0,255);
 return [fn(r),fn(g),fn(b)];
}
export function applyToneToLayer(model,index,value){
 if(!model||!Array.isArray(model.layers)||!Number.isInteger(index)||
    index<0||index>=model.layers.length)throw Error('調整対象のレイヤーが不正です');
 const tone=normalizedTone(value);
 const layers=model.layers.map((layer,i)=>i===index?{...layer,tone}:layer);
 return {...model,layers};
}
