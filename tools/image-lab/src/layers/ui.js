import {segmentImage,composeLayers} from './decompose.js';
const $=id=>document.getElementById(id);
const named=(tag,className,text)=>{
 const el=document.createElement(tag);if(className)el.className=className;
 if(text!==undefined)el.textContent=text;return el;
};
const safeName=(name,index)=>{
 const value=name.trim().replace(/[^\p{L}\p{N} _-]/gu,'_').slice(0,36);
 return value||'layer-'+String(index+1).padStart(2,'0');
};
export function createLayerLab({source,output,status,download,onLeave}){
 let active=false,model=null,selected=0,solo=-1,processing=false;
 let previewScheduled=false;
 const ui=$('layerList'),section=$('layerResults'),meta=$('layerMeta');
 const nameInput=$('layerName'),opacity=$('layerOpacity'),opacityValue=$('layerOpacityValue');
 const saveSingle=$('saveLayerButton'),exit=$('leaveLayersButton'),start=$('decomposeButton');
 const effectInputs=['effect','detail','weight','seed','runButton','randomButton','commitButton','undoButton','clearButton'];
 function lockEffects(value){
  for(const id of effectInputs)$(id).disabled=value;
  $('effectSection').classList.toggle('muted-section',value);
  $('tuneSection').classList.toggle('muted-section',value);
 }
 function reset(){
  active=false;model=null;selected=0;solo=-1;processing=false;
  section.hidden=true;ui.replaceChildren();meta.textContent='';
  $('svgButton').disabled=true;
  lockEffects(false);start.disabled=false;
 }
 function leave(){
  if(processing)return;
  reset();onLeave();
 }
 function draw(){
  if(!active||!model)return;
  const image=composeLayers(model,{soloIndex:solo});
  if(output.width!==image.width||output.height!==image.height){
   output.width=image.width;output.height=image.height;
  }
  output.getContext('2d',{willReadFrequently:true}).putImageData(
   new ImageData(image.data,image.width,image.height),0,0
  );
  $('svgButton').disabled=true;
  $('pngButton').disabled=false;
 }
 function scheduleDraw(){
  if(previewScheduled)return;
  previewScheduled=true;
  requestAnimationFrame(()=>{previewScheduled=false;draw();});
 }
 function makeThumbnail(index){
  const thumb=document.createElement('canvas'),w=76,h=57;
  thumb.width=w;thumb.height=h;thumb.className='layer-thumb';
  const img=thumb.getContext('2d').createImageData(w,h);
  const m=model;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const sx=Math.min(m.width-1,Math.floor((x+.5)*m.width/w));
   const sy=Math.min(m.height-1,Math.floor((y+.5)*m.height/h));
   const p=sy*m.width+sx;
   if(m.owner[p]!==index)continue;
   const t=(y*w+x)*4;
   img.data.set(m.source.subarray(p*4,p*4+4),t);
  }
  thumb.getContext('2d').putImageData(img,0,0);
  return thumb;
 }
 function refreshRows(){
  if(!model)return;
  const nodes=[];
  model.layers.forEach((layer,i)=>{
   const row=named('div','layer-row'+(i===selected?' is-selected':''));
   const pick=named('button','layer-pick');
   pick.type='button';pick.setAttribute('aria-label',layer.label+'を編集');
   pick.setAttribute('aria-pressed',i===selected?'true':'false');
   pick.append(makeThumbnail(i));
   const text=named('span','layer-caption');
   const label=named('strong','',layer.label);
   const sub=named('small','',Math.round(100*layer.pixelCount/(model.width*model.height))+'% の画素');
   text.append(label,sub);pick.append(text);
   pick.addEventListener('click',()=>{selected=i;refreshRows();refreshSelection();});
   const eye=named('button','layer-mini',layer.visible?'表示':'非表示');
   eye.type='button';eye.setAttribute('aria-label',layer.label+'の表示切替');
   eye.setAttribute('aria-pressed',String(layer.visible));
   eye.addEventListener('click',()=>{
    layer.visible=!layer.visible;
    refreshRows();scheduleDraw();
    status(layer.label+'を'+(layer.visible?'表示':'非表示')+'にしたよ。');
   });
   const isolate=named('button','layer-mini',solo===i?'戻す':'単独');
   isolate.type='button';isolate.setAttribute('aria-label',layer.label+'のみ表示');
   isolate.setAttribute('aria-pressed',String(solo===i));
   isolate.addEventListener('click',()=>{
    solo=solo===i?-1:i;selected=i;
    refreshRows();refreshSelection();
    status(solo<0?'全レイヤーの合成表示に戻したよ。':layer.label+'を単独表示中。');
   });
   row.append(pick,eye,isolate);nodes.push(row);
  });
  ui.replaceChildren(...nodes);
 }
 function refreshSelection(){
  if(!model)return;
  const layer=model.layers[selected];
  nameInput.value=layer.label;opacity.value=String(layer.opacity);
  opacityValue.textContent=layer.opacity+'%';
  saveSingle.disabled=false;
  scheduleDraw();
 }
 function applyName(){
  if(!model)return;
  const layer=model.layers[selected];
  layer.label=safeName(nameInput.value,selected);
  nameInput.value=layer.label;refreshRows();
 }
 function saveLayer(){
  if(!model)return;
  const layer=model.layers[selected];
  const img=composeLayers(model,{onlyIndex:selected,ignoreVisibility:true,ignoreOpacity:true});
  const canvas=document.createElement('canvas');
  canvas.width=img.width;canvas.height=img.height;
  canvas.getContext('2d').putImageData(new ImageData(img.data,img.width,img.height),0,0);
  canvas.toBlob(blob=>{
   download(blob,'png','layer-'+String(selected+1).padStart(2,'0')+'-'+safeName(layer.label,selected));
  },'image/png');
 }
 async function startDecomposition(){
  if(processing)return;
  processing=true;start.disabled=true;
  status('元画像を色・連続領域に分解中…');
  // Yield to paint the progress message before bounded CPU work.
  await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
  try{
   const src=source.getContext('2d',{willReadFrequently:true})
     .getImageData(0,0,source.width,source.height);
   const groups=Number($('layerDetail').value);
   const next=segmentImage(src,{colorGroups:groups});
   model=next;selected=0;solo=-1;active=true;
   lockEffects(true);section.hidden=false;
   meta.textContent=next.layers.length+'レイヤー・'+next.groupsFound+'領域候補・'+next.sampleWidth+'×'+next.sampleHeight+'の解析';
   refreshRows();refreshSelection();
   status('レイヤー分解完了。'+next.layers.length+'枚に分離したよ。各領域の表示・透明度・個別PNG保存を試してね。');
  }catch(e){
   active=false;section.hidden=true;lockEffects(false);
   status('レイヤー分解に失敗：'+(e?.message||String(e)));
  }finally{processing=false;start.disabled=false;}
 }
 start.addEventListener('click',startDecomposition);
 exit.addEventListener('click',leave);
 nameInput.addEventListener('change',applyName);
 nameInput.addEventListener('blur',applyName);
 opacity.addEventListener('input',()=>{
  if(!model)return;
  const layer=model.layers[selected];
  layer.opacity=Number(opacity.value);opacityValue.textContent=opacity.value+'%';
  scheduleDraw();
 });
 saveSingle.addEventListener('click',saveLayer);
 return {reset,active:()=>active};
}
