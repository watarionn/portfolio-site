import {segmentImage,composeLayers} from './decompose.js';
import {mergeLayerModel,identicalComposite} from './merge.js';
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
 let multi=false,picked=new Set(),merges=[];
 let previewScheduled=false;
 const ui=$('layerList'),section=$('layerResults'),meta=$('layerMeta');
 const nameInput=$('layerName'),opacity=$('layerOpacity'),opacityValue=$('layerOpacityValue');
 const saveSingle=$('saveLayerButton'),exit=$('leaveLayersButton'),start=$('decomposeButton');
 const multiButton=$('layerMultiSelectButton'),bulk=$('layerBulkControls');
 const mergeButton=$('layerMergeButton'),cancelMulti=$('layerCancelSelectButton');
 const undoMerge=$('layerUndoMergeButton'),mergeName=$('layerMergeName');
 const selectionMeta=$('layerSelectionMeta');
 const effectInputs=['effect','detail','weight','seed','runButton','randomButton','commitButton','undoButton','clearButton'];
 function lockEffects(value){
  for(const id of effectInputs)$(id).disabled=value;
  $('effectSection').classList.toggle('muted-section',value);
  $('tuneSection').classList.toggle('muted-section',value);
 }
 function reset(){
  active=false;model=null;selected=0;solo=-1;processing=false;
  multi=false;picked.clear();merges=[];updateBulk();
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
 function updateBulk(){
  multiButton.textContent=multi?'選択中':'複数選択';
  multiButton.disabled=!active||processing||!model||model.layers.length<2;
  bulk.hidden=!multi;
  selectionMeta.textContent=picked.size+'枚選択中';
  mergeButton.disabled=!multi||picked.size<2;
  undoMerge.disabled=!active||!merges.length;
  undoMerge.textContent='統合を1つ戻す'+(merges.length?'（'+merges.length+'）':'');
 }
 function togglePicked(i){
  if(picked.has(i))picked.delete(i);else picked.add(i);
  refreshRows();updateBulk();
 }
 function setMulti(value){
  if(!active||processing)return;
  multi=value;picked.clear();solo=-1;mergeName.value='';
  refreshRows();updateBulk();scheduleDraw();
 }
 function mergePicked(){
  if(!multi||picked.size<2||processing||!model)return;
  try{
   const result=mergeLayerModel(model,[...picked],{label:mergeName.value});
   if(!identicalComposite(model,result.model))throw Error('統合前後で表示が変わるため中止しました');
   merges.push({model,selected});
   if(merges.length>3)merges.shift();
   model=result.model;selected=result.index;solo=-1;
   multi=false;picked.clear();mergeName.value='';
   refreshRows();refreshSelection();updateBulk();
   meta.textContent=model.layers.length+'レイヤー · 統合済み';
   status(result.mergedCount+'枚を1枚に統合しました。元画像は変更していません。');
  }catch(error){status('統合できませんでした：'+(error?.message||String(error)));}
 }
 function restoreMerge(){
  if(!merges.length||processing)return;
  const previous=merges.pop();
  model=previous.model;selected=previous.selected;solo=-1;
  multi=false;picked.clear();mergeName.value='';
  refreshRows();refreshSelection();updateBulk();
  meta.textContent=model.layers.length+'レイヤー · 統合を元に戻しました';
  status('直前のレイヤー統合を元に戻しました。');
 }
 function refreshRows(){
  if(!model)return;
  const nodes=[];
  model.layers.forEach((layer,i)=>{
   const row=named('div','layer-row'+(i===selected?' is-selected':'')+(multi&&picked.has(i)?' is-picked':''));
   if(multi){
    const check=named('input','layer-checkbox');
    check.type='checkbox';check.checked=picked.has(i);
    check.setAttribute('aria-label',layer.label+'を統合対象に選択');
    check.addEventListener('change',()=>togglePicked(i));
    row.append(check);
   }
   const pick=named('button','layer-pick');
   pick.type='button';pick.setAttribute('aria-label',layer.label+'を編集');
   pick.setAttribute('aria-pressed',i===selected?'true':'false');
   pick.append(makeThumbnail(i));
   const text=named('span','layer-caption');
   const label=named('strong','',layer.label);
   const sub=named('small','',Math.round(100*layer.pixelCount/(model.width*model.height))+'% の画素');
   text.append(label,sub);pick.append(text);
   pick.addEventListener('click',()=>{if(multi){togglePicked(i);return;}selected=i;refreshRows();refreshSelection();});
   const eye=named('button','layer-mini',layer.visible?'表示':'非表示');
   eye.type='button';eye.disabled=multi;eye.hidden=multi;eye.setAttribute('aria-label',layer.label+'の表示切替');
   eye.setAttribute('aria-pressed',String(layer.visible));
   eye.addEventListener('click',()=>{
    layer.visible=!layer.visible;
    refreshRows();scheduleDraw();
    status(layer.label+'を'+(layer.visible?'表示':'非表示')+'にしたよ。');
   });
   const isolate=named('button','layer-mini',solo===i?'戻す':'単独');
   isolate.type='button';isolate.disabled=multi;isolate.hidden=multi;isolate.setAttribute('aria-label',layer.label+'のみ表示');
   isolate.setAttribute('aria-pressed',String(solo===i));
   isolate.addEventListener('click',()=>{
    solo=solo===i?-1:i;selected=i;
    refreshRows();refreshSelection();
    status(solo<0?'全レイヤーの合成表示に戻したよ。':layer.label+'を単独表示中。');
   });
   row.append(pick,eye,isolate);nodes.push(row);
  });
  ui.replaceChildren(...nodes);
  updateBulk();
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
   const mode=$('layerMode').value;
   let next;
   if(mode==='semantic'){
    const {segmentSemantic}=await import('./semantic.js');
    next=await segmentSemantic(source,{progress:status});
    if(!next){
     status('人物を認識できなかったため、色・領域で分解します…');
     next=segmentImage(src,{colorGroups:groups});
    }
   }else{
    next=segmentImage(src,{colorGroups:groups});
   }
   model=next;selected=0;solo=-1;active=true;
   merges=[];multi=false;picked.clear();mergeName.value='';
   lockEffects(true);section.hidden=false;
   meta.textContent=(next.method==='semantic'?'AI意味分離 · ':'色・領域分解 · ')+next.layers.length+'レイヤー・'+next.groupsFound+'領域候補・'+next.sampleWidth+'×'+next.sampleHeight+'の解析';
   refreshRows();refreshSelection();updateBulk();
   status((next.method==='semantic'?'AI意味分離':'色分解')+'完了。'+next.layers.length+'枚のレイヤーを作成したよ。');
  }catch(e){
   active=false;section.hidden=true;lockEffects(false);
   status('レイヤー分解に失敗：'+(e?.message||String(e)));
  }finally{processing=false;start.disabled=false;updateBulk();}
 }

 $('layerMode').addEventListener('change',()=>{
   const ai=$('layerMode').value==='semantic';
   $('layerDetail').disabled=ai;
   start.textContent=ai?'AIで人物・髪・服を分ける':'元画像をレイヤー分解';
 });
 multiButton.addEventListener('click',()=>setMulti(!multi));
 cancelMulti.addEventListener('click',()=>setMulti(false));
 mergeButton.addEventListener('click',mergePicked);
 undoMerge.addEventListener('click',restoreMerge);
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
 return {reset,active:()=>active,start:startDecomposition};
}
