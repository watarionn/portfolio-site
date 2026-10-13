import {segmentImage,composeLayers} from './decompose.js';
import {mergeLayerModel,identicalComposite} from './merge.js';
import {reorderLayers,strokeSegment,recalcLayerCounts,canStartPointerStroke} from './retouch.js';
import {normalizedTone,applyToneToLayer,toneRGB} from './tone.js';
import {FX_TYPES,updateLayerFx} from './fx-stack.js';
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
 let brush=false,painting=null,brushChanged=false,lastPoint=null;
 let previewScheduled=false, toneDraft=null, fxDraft=null;
 const toneSliders={brightness:$('layerBrightness'),contrast:$('layerContrast'),saturation:$('layerSaturation')};
 const toneApply=$('layerToneApply'),toneReset=$('layerToneReset');
 const fxAdd=$('layerFxAdd'),fxKind=$('layerFxKind'),fxList=$('layerFxList');
 const ui=$('layerList'),section=$('layerResults'),meta=$('layerMeta');
 const nameInput=$('layerName'),opacity=$('layerOpacity'),opacityValue=$('layerOpacityValue');
 const saveSingle=$('saveLayerButton'),exit=$('leaveLayersButton'),start=$('decomposeButton');
 const multiButton=$('layerMultiSelectButton'),bulk=$('layerBulkControls');
 const mergeButton=$('layerMergeButton'),cancelMulti=$('layerCancelSelectButton');
 const undoMerge=$('layerUndoMergeButton'),mergeName=$('layerMergeName');
 const selectionMeta=$('layerSelectionMeta');
 const comparePanel=$('semanticCompare'),usePhoto=$('semanticUsePhoto'),useAnime=$('semanticUseAnime');
 let compared=null;
 const moveFront=$('layerMoveFront'),moveBack=$('layerMoveBack');
 const brushToggle=$('layerBrushToggle'),brushPanel=$('layerBrushPanel');
 const brushMode=$('layerBrushMode'),brushTarget=$('layerBrushTarget');
 const brushSize=$('layerBrushSize'),brushValue=$('layerBrushSizeValue');
 const cursor=$('brushCursor'),canvas=output;
 const effectInputs=['effect','detail','weight','seed','runButton','randomButton','commitButton','undoButton','clearButton'];
 function lockEffects(value){
  for(const id of effectInputs)$(id).disabled=value;
  $('effectSection').classList.toggle('muted-section',value);
  $('tuneSection').classList.toggle('muted-section',value);
 }
 function reset(){
  active=false;model=null;selected=0;solo=-1;processing=false;
  multi=false;picked.clear();merges=[];painting=null;brush=false;brushChanged=false;lastPoint=null;
  toneDraft=null;fxDraft=null;compared=null;comparePanel.hidden=true;
  output.classList.remove('brush-enabled');cursor.hidden=true;brushPanel.hidden=true;updateBulk();
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
  const preview=toneDraft&&toneDraft.index===selected?
   applyToneToLayer(model,selected,toneDraft.value):model;
  const fxPreview=fxDraft&&fxDraft.layer===selected?
   updateLayerFx(preview,selected,{type:'amount',position:fxDraft.position,amount:fxDraft.amount}):preview;
  const image=composeLayers(fxPreview,{soloIndex:solo});
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
   if(img.data[t+3]>0&&m.layers[index].tone){
    const [r,g,b]=toneRGB(img.data[t],img.data[t+1],img.data[t+2],m.layers[index].tone);
    img.data[t]=r;img.data[t+1]=g;img.data[t+2]=b;
   }
  }
  thumb.getContext('2d').putImageData(img,0,0);
  return thumb;
 }
 function remember(before=model,selection=selected){
  merges.push({model:{...before,layers:before.layers.map(x=>({...x}))},selected:selection});
  if(merges.length>5)merges.shift();
 }
 function readToneControls(){
  return normalizedTone(Object.fromEntries(Object.entries(toneSliders).map(([key,input])=>[key,input.value])));
 }
 function updateToneControls(){
  if(!model)return;
  const value=normalizedTone(toneDraft?.index===selected?toneDraft.value:model.layers[selected].tone);
  for(const [key,input] of Object.entries(toneSliders)){
   input.value=String(value[key]);$(input.id+'Value').textContent=String(value[key]);
   input.disabled=multi||brush||processing;
  }
  const current=normalizedTone(model.layers[selected].tone);
  const dirty=Object.keys(value).some(key=>value[key]!==current[key]);
  toneApply.disabled=!active||multi||brush||processing||!dirty;
  toneReset.disabled=!active||multi||brush||processing||!dirty;
 }
 function discardToneDraft(){
  toneDraft=null;fxDraft=null;
  if(model)updateToneControls();
 }
 function previewTone(){
  if(!active||!model||multi||brush||processing)return;
  toneDraft={index:selected,value:readToneControls()};
  updateToneControls();
  scheduleDraw();
 }
 function applyTone(){
  if(!active||!model||!toneDraft||toneDraft.index!==selected||multi||brush||processing)return;
  const before=model;
  const next=applyToneToLayer(model,selected,toneDraft.value);
  const old=normalizedTone(before.layers[selected].tone),now=normalizedTone(next.layers[selected].tone);
  if(Object.keys(now).every(key=>now[key]===old[key])){discardToneDraft();return;}
  remember(before,selected);
  model=next;toneDraft=null;
  refreshRows();refreshSelection();updateBulk();
  status('選択したレイヤーの色調整を適用したよ。操作を1つ戻すで復元できる。');
 }
 function renderFxRows(){
  if(!model){fxList.replaceChildren();fxAdd.disabled=true;return;}
  const safe=active&&!multi&&!brush&&!processing;
  const stack=model.layers[selected].fx||[];
  fxAdd.disabled=!safe||stack.length>=8;fxKind.disabled=!safe;
  const rows=stack.map((fx,i)=>{
   const row=named('div','fx-stack-row');
   const caption=named('strong','fx-stack-caption',(i+1)+'. '+(FX_TYPES.find(f=>f.kind===fx.kind)?.label||fx.kind));
   const toggle=named('button','layer-mini',fx.enabled?'ON':'OFF');
   toggle.type='button';toggle.disabled=!safe;toggle.setAttribute('aria-label','効果の有効切替 '+caption.textContent);
   toggle.setAttribute('aria-pressed',String(fx.enabled));
   const upper=named('button','layer-mini','↑');upper.type='button';upper.disabled=!safe||i===0;upper.setAttribute('aria-label','FXを上へ');
   const lower=named('button','layer-mini','↓');lower.type='button';lower.disabled=!safe||i===stack.length-1;lower.setAttribute('aria-label','FXを下へ');
   const remove=named('button','layer-mini','削除');remove.type='button';remove.disabled=!safe;
   const range=named('input','fx-strength');range.type='range';range.min='0';range.max='100';range.value=String(fx.amount);
   range.disabled=!safe;range.setAttribute('aria-label',caption.textContent+' の強さ');
   const value=named('output','fx-value',String(fx.amount));
   const applyChange=change=>mutateFx(change);
   toggle.addEventListener('click',()=>applyChange({type:'toggle',position:i}));
   upper.addEventListener('click',()=>applyChange({type:'move',position:i,delta:-1}));
   lower.addEventListener('click',()=>applyChange({type:'move',position:i,delta:1}));
   remove.addEventListener('click',()=>applyChange({type:'delete',position:i}));
   range.addEventListener('input',()=>{fxDraft={layer:selected,position:i,amount:Number(range.value)};value.textContent=range.value;scheduleDraw();});
   range.addEventListener('change',()=>applyChange({type:'amount',position:i,amount:Number(range.value)}));
   row.append(caption,toggle,upper,lower,remove,range,value);
   return row;
  });
  fxList.replaceChildren(...rows);
  if(!rows.length)fxList.append(named('p','micro','このレイヤーにはまだFXがありません。'));
 }
 function mutateFx(change){
  if(!active||!model||multi||brush||processing)return;
  discardToneDraft();
  try{
   const before=model,next=updateLayerFx(before,selected,change);
   fxDraft=null;remember(before,selected);model=next;
   refreshRows();refreshSelection();updateBulk();
   status('レイヤーFXを更新しました。操作を1つ戻すで復元できます。');
  }catch(e){fxDraft=null;status('FXの変更に失敗：'+(e?.message||String(e)));}
 }
 function updateEditor(){
  if(model)updateToneControls();
  renderFxRows();
  moveFront.disabled=!active||multi||brush||selected===0;
  moveBack.disabled=!active||multi||brush||!model||selected===model.layers.length-1;
  brushToggle.disabled=!active||multi||!model||model.layers.length<2;
  brushToggle.textContent=brush?'境界修正を終了':'境界修正を開始';
  brushPanel.hidden=!brush;
  brushValue.textContent=brushSize.value+'px';
  if(!model)return;
  const previous=brushTarget.value;
  brushTarget.replaceChildren();
  model.layers.forEach((layer,i)=>{
   if(i===selected)return;
   const opt=document.createElement('option');opt.value=String(i);opt.textContent=layer.label;
   brushTarget.append(opt);
  });
  if([...brushTarget.options].some(o=>o.value===previous))brushTarget.value=previous;
  const next=Number(brushTarget.value);
  if(next===selected||!Number.isInteger(next))brushTarget.selectedIndex=0;
  brushTarget.disabled=brushMode.value==='add'||!brush;
 }
 function updateBulk(){
  multiButton.textContent=multi?'選択中':'複数選択';
  multiButton.disabled=!active||processing||brush||!model||model.layers.length<2;
  bulk.hidden=!multi;
  selectionMeta.textContent=picked.size+'枚選択中';
  mergeButton.disabled=!multi||picked.size<2;
  undoMerge.disabled=!active||!merges.length;
  undoMerge.textContent='操作を1つ戻す'+(merges.length?'（'+merges.length+'）':'');
  updateEditor();
 }
 function togglePicked(i){
  if(picked.has(i))picked.delete(i);else picked.add(i);
  refreshRows();updateBulk();
 }
 function setMulti(value){
  if(!active||processing||brush)return;
  discardToneDraft();multi=value;picked.clear();solo=-1;mergeName.value='';
  refreshRows();updateBulk();scheduleDraw();
 }
 function mergePicked(){
  if(!multi||picked.size<2||processing||!model)return;
  discardToneDraft();
  try{
   const result=mergeLayerModel(model,[...picked],{label:mergeName.value});
   if(!identicalComposite(model,result.model))throw Error('統合前後で表示が変わるため中止しました');
   remember();
   model=result.model;selected=result.index;solo=-1;
   multi=false;picked.clear();mergeName.value='';
   refreshRows();refreshSelection();updateBulk();
   meta.textContent=model.layers.length+'レイヤー · 統合済み';
   status(result.mergedCount+'枚を1枚に統合しました。元画像は変更していません。');
  }catch(error){status('統合できませんでした：'+(error?.message||String(error)));}
 }
 function restoreMerge(){
  if(!merges.length||processing)return;
  discardToneDraft();
  const previous=merges.pop();
  model=previous.model;selected=previous.selected;solo=-1;
  multi=false;picked.clear();mergeName.value='';
  refreshRows();refreshSelection();updateBulk();
  meta.textContent=model.layers.length+'レイヤー · 統合を元に戻しました';
  status('直前のレイヤー操作を元に戻しました。');
 }
 function moveSelection(delta){
  if(!model||processing||multi||brush)return;
  discardToneDraft();
  const to=selected+delta;
  if(to<0||to>=model.layers.length)return;
  const before=model,index=selected;
  const next=reorderLayers(model,selected,to);
  remember(before,index);
  model=next.model;selected=next.index;solo=-1;
  refreshRows();refreshSelection();
  status('レイヤーの一覧順を変更したよ。各画素は1枚に属するため、この操作だけでは画像の重なりは変わりません。');
 }
 function endBrushMode(){
  if(painting)finishStroke(true);
  brush=false;cursor.hidden=true;output.classList.remove('brush-enabled');
  brushPanel.hidden=true;refreshRows();updateBulk();scheduleDraw();
 }
 function imagePoint(event){
  const rect=output.getBoundingClientRect(),ratio=model.width/model.height;
  const renderW=Math.min(rect.width,rect.height*ratio);
  const renderH=renderW/ratio;
  const left=rect.left+(rect.width-renderW)/2,top=rect.top+(rect.height-renderH)/2;
  const inside=event.clientX>=left&&event.clientX<left+renderW&&event.clientY>=top&&event.clientY<top+renderH;
  return {inside,x:Math.max(0,Math.min(model.width-1,(event.clientX-left)*model.width/renderW)),
   y:Math.max(0,Math.min(model.height-1,(event.clientY-top)*model.height/renderH)),
   scale:renderW/model.width};
 }
 function moveCursor(event,point){
  if(!brush)return;
  cursor.hidden=!point.inside;
  if(!point.inside)return;
  const r=Number(brushSize.value)*point.scale;
  cursor.style.width=2*r+'px';cursor.style.height=2*r+'px';
  cursor.style.left=event.clientX+'px';cursor.style.top=event.clientY+'px';
 }
 function startStroke(event){
  if(!brush||!model||multi||processing||event.button>0||
     !canStartPointerStroke(painting?.pointerId??null,event))return;
  const at=imagePoint(event);
  if(!at.inside)return;
  const original=source.getContext('2d',{willReadFrequently:true})
    .getImageData(0,0,source.width,source.height).data;
  painting={before:model,selection:selected,original,
   draft:{...model,source:new Uint8ClampedArray(model.source),
    owner:new Uint8Array(model.owner),layers:model.layers.map(x=>({...x}))},
   pointerId:event.pointerId};
  model=painting.draft;brushChanged=false;lastPoint={x:at.x,y:at.y};
  try{output.setPointerCapture(event.pointerId);}catch{}
  event.preventDefault();paintAt(lastPoint);
 }
 function paintAt(point){
  if(!painting||!model)return;
  const delta=strokeSegment(model,painting.original,{
   from:lastPoint||point,to:point,radius:Number(brushSize.value),
   mode:brushMode.value,selected,target:Number(brushTarget.value)});
  if(delta){brushChanged=true;scheduleDraw();}
  lastPoint=point;
 }
 function finishStroke(cancel=false){
  if(!painting)return;
  const before=painting.before,wasChanged=brushChanged;
  if(cancel||!wasChanged){model=before;}
  else{remember(before,painting.selection);recalcLayerCounts(model);}
  painting=null;brushChanged=false;lastPoint=null;
  refreshRows();refreshSelection();updateBulk();
  if(wasChanged&&!cancel)status('境界を修正したよ。操作を1つ戻すで復元できる。');
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
   const sub=named('small','',Math.round(100*layer.pixelCount/(model.width*model.height))+'% の画素'+(layer.fx?.length?' · FX '+layer.fx.length:''));
   text.append(label,sub);pick.append(text);
   pick.addEventListener('click',()=>{if(multi){togglePicked(i);return;}discardToneDraft();selected=i;refreshRows();refreshSelection();});
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
    discardToneDraft();solo=solo===i?-1:i;selected=i;
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
  discardToneDraft();
  nameInput.value=layer.label;opacity.value=String(layer.opacity);
  opacityValue.textContent=layer.opacity+'%';
  saveSingle.disabled=false;
  updateEditor();scheduleDraw();
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
  const preview=toneDraft?.index===selected?applyToneToLayer(model,selected,toneDraft.value):model;
  const img=composeLayers(preview,{onlyIndex:selected,ignoreVisibility:true,ignoreOpacity:true});
  const canvas=document.createElement('canvas');
  canvas.width=img.width;canvas.height=img.height;
  canvas.getContext('2d').putImageData(new ImageData(img.data,img.width,img.height),0,0);
  canvas.toBlob(blob=>{
   download(blob,'png','layer-'+String(selected+1).padStart(2,'0')+'-'+safeName(layer.label,selected));
  },'image/png');
 }
 function drawClassificationPreview(canvas,entry){
  if(!entry){canvas.width=1;canvas.height=1;return;}
  const w=Math.max(1,Math.round(Math.min(360/entry.width,270/entry.height,1)*entry.width));
  const h=Math.max(1,Math.round(Math.min(360/entry.width,270/entry.height,1)*entry.height));
  canvas.width=w;canvas.height=h;
  const c=canvas.getContext('2d');
  const data=c.createImageData(w,h);
  const palette=['#56616b','#d94d69','#3f8fb0','#f9b44c','#9e72cd','#5eac74','#e07f47','#c1b66c',
    '#506d9d','#b56578','#86a2a0','#a389cc','#7baf6a','#db8d82','#8c9aa3','#c3bba2'];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const sx=Math.min(entry.width-1,Math.floor((x+.5)*entry.width/w));
   const sy=Math.min(entry.height-1,Math.floor((y+.5)*entry.height/h));
   const source=(sy*entry.width+sx)*4,at=(y*w+x)*4;
   const color=palette[entry.owner[sy*entry.width+sx]%palette.length];
   const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
   for(let i=0;i<3;i++)data.data[at+i]=Math.round(entry.source[source+i]*.35+rgb[i]*.65);
   data.data[at+3]=entry.source[source+3];
  }
  c.putImageData(data,0,0);
 }
 function applyDecomposition(next){
  if(!next)throw Error('領域が見つかりませんでした');
  model=next;selected=0;solo=-1;active=true;toneDraft=null;fxDraft=null;
  compared=null;comparePanel.hidden=true;
  merges=[];multi=false;picked.clear();mergeName.value='';brush=false;
  output.classList.remove('brush-enabled');cursor.hidden=true;brushPanel.hidden=true;
  lockEffects(true);section.hidden=false;
  const sourceName=next.method==='anime'?'アニメ7分類':next.method==='semantic'?'写真18分類':'色・領域分解';
  meta.textContent=sourceName+' · '+next.layers.length+'レイヤー・'+next.groupsFound+'領域候補・'+next.sampleWidth+'×'+next.sampleHeight+'の解析';
  refreshRows();refreshSelection();updateBulk();
  status(sourceName+'を編集へ適用したよ。元画像の画素は変更していません。');
 }
 function showComparison(photo,anime,elapsed){
  compared={photo,anime};active=false;section.hidden=true;lockEffects(false);
  comparePanel.hidden=false;
  drawClassificationPreview($('semanticPhotoPreview'),photo);
  drawClassificationPreview($('semanticAnimePreview'),anime);
  $('semanticPhotoInfo').textContent=photo?photo.layers.map(x=>x.label).join('・'):'対象人物を検出できませんでした';
  $('semanticAnimeInfo').textContent=anime?anime.layers.map(x=>x.label).join('・'):'対象人物を検出できませんでした';
  usePhoto.disabled=!photo;useAnime.disabled=!anime;
  $('semanticCompareInfo').textContent='両モデルの推論終了（'+Math.round(elapsed)+'ms）。色は分類ラベルで、正解率を意味しません。編集する結果を選んでね。';
  status('AI比較完了。写真とアニメの領域マスクを確認してから採用できます。');
 }
 usePhoto.addEventListener('click',()=>{
  if(!compared?.photo||processing)return;
  applyDecomposition(compared.photo);
 });
 useAnime.addEventListener('click',()=>{
  if(!compared?.anime||processing)return;
  applyDecomposition(compared.anime);
 });
 async function startDecomposition(){
  if(processing)return;
  processing=true;start.disabled=true;comparePanel.hidden=true;compared=null;
  status('レイヤー分解を開始します…');
  await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
  try{
   const src=source.getContext('2d',{willReadFrequently:true})
    .getImageData(0,0,source.width,source.height);
   const groups=Number($('layerDetail').value),mode=$('layerMode').value;
   let next;
   if(mode==='compare'){
    const began=performance.now();
    const {segmentSemantic}=await import('./semantic.js');
    const photo=await segmentSemantic(source,{progress:status});
    const {segmentAnime}=await import('./anime.js');
    const anime=await segmentAnime(source,{progress:status});
    showComparison(photo,anime,performance.now()-began);
    return;
   }
   if(mode==='semantic'){
    const {segmentSemantic}=await import('./semantic.js');
    next=await segmentSemantic(source,{progress:status});
   }else if(mode==='anime'){
    const {segmentAnime}=await import('./anime.js');
    next=await segmentAnime(source,{progress:status});
   }else{
    next=segmentImage(src,{colorGroups:groups});
   }
   if(!next){
    status('AIで人物を認識できなかったので、色・領域で分解します…');
    next=segmentImage(src,{colorGroups:groups});
   }
   applyDecomposition(next);
  }catch(e){
   active=false;section.hidden=true;lockEffects(false);
   comparePanel.hidden=true;compared=null;
   status('レイヤー分解に失敗：'+(e?.message||String(e)));
  }finally{processing=false;start.disabled=false;updateBulk();}
 }
 $('layerMode').addEventListener('change',()=>{
  const mode=$('layerMode').value,ai=mode!=='color';
  $('layerDetail').disabled=ai;
  start.textContent=mode==='compare'?'写真とアニメのAI結果を比較':ai?'選んだAIでレイヤー分解':'元画像をレイヤー分解';
  comparePanel.hidden=true;compared=null;
 });
 moveFront.addEventListener('click',()=>moveSelection(-1));
 moveBack.addEventListener('click',()=>moveSelection(1));
 brushToggle.addEventListener('click',()=>{
  if(!active||!model||multi||processing)return;
  discardToneDraft();
  if(brush){endBrushMode();return;}
  solo=-1;brush=true;brushPanel.hidden=false;output.classList.add('brush-enabled');
  refreshRows();updateBulk();scheduleDraw();
  status('結果画像を指でなぞって境界を修正できるよ。');
 });
 brushMode.addEventListener('change',updateEditor);
 brushSize.addEventListener('input',updateEditor);
 output.addEventListener('pointerdown',startStroke);
 output.addEventListener('pointermove',event=>{
  if(!brush||!model)return;
  const point=imagePoint(event);moveCursor(event,point);
  if(painting&&event.pointerId===painting.pointerId){event.preventDefault();paintAt(point);}
 });
 output.addEventListener('pointerup',event=>{
  if(painting&&event.pointerId===painting.pointerId){event.preventDefault();finishStroke();}
 });
 output.addEventListener('pointercancel',event=>{
  if(painting&&event.pointerId===painting.pointerId)finishStroke(true);
 });
 output.addEventListener('lostpointercapture',()=>{
  if(painting)finishStroke();
 });
 output.addEventListener('pointerleave',()=>{if(!painting)cursor.hidden=true;});
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
 fxAdd.addEventListener('click',()=>mutateFx({type:'add',kind:fxKind.value,amount:65}));
 for(const input of Object.values(toneSliders))input.addEventListener('input',previewTone);
 toneApply.addEventListener('click',applyTone);
 toneReset.addEventListener('click',()=>{discardToneDraft();scheduleDraw();});
 saveSingle.addEventListener('click',saveLayer);
 return {reset,active:()=>active,start:startDecomposition};
}
