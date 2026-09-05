/* ===========================
   PIXEL FORGE - script.js
   バケツ貫通 / 矩形選択（移動・コピー・ペースト・削除・貫通） 対応版
   =========================== */
'use strict';

// ══════════════════════════════════════
//  STATE
// ══════════════════════════════════════
const state = {
  tool: 'pen',
  symmetry: 'none',
  fgColor: '#2d2d2d',
  bgColor: '#ffffff',
  brushSize: 1,
  brushOpacity: 1.0,
  zoom: 8,
  isDrawing: false,
  lastX: -1, lastY: -1,
  lineStart: null, rectStart: null,
  canvasW: 32, canvasH: 32,
  gridVisible: true,
  fillRef: 'active',
  selRef: 'active',
  sel: null,
  selDragging: false,
  selDragStart: null,
  selFloat: null,
  selClipboard: null,
  selMarching: 0,
  selMarchTimer: null,
  frames: [], activeFrameIdx: 0, activeLayerIdx: 0,
  animPlaying: false, animMode: 'loop', animFps: 4, animDir: 1, animTimerId: null,
  palette: ['#2d2d2d','#f0c040','#e05a20','#4a8fc0','#5ab05a','#c04a4a','#a070c0','#50c8c8','#f0a080','#ffffff'],
  history: [], historyIndex: -1, maxHistory: 40,
};

let layerIdCounter = 0;
let frameIdCounter = 0;

const checkerCanvas  = document.getElementById('checker-canvas');
const layerCanvases  = document.getElementById('layer-canvases');
const previewCanvas  = document.getElementById('preview-canvas');
const gridCanvas     = document.getElementById('grid-canvas');
const symAxisCanvas  = document.getElementById('sym-axis-canvas');
const selectCanvas   = document.getElementById('select-canvas');
const container      = document.getElementById('canvas-container');
const canvasArea     = document.getElementById('canvas-area');
const symCanvas      = document.getElementById('sym-canvas');
const symCtx         = symCanvas.getContext('2d');
let preCtx, gridCtx, symAxisCtx, checkerCtx, selCtx;
const $ = id => document.getElementById(id);

function activeFrame()  { return state.frames[state.activeFrameIdx]; }
function activeLayers() { return activeFrame()?.layers || []; }
function activeLayer()  { return activeLayers()[state.activeLayerIdx]; }
function activeCtx()    { return activeLayer()?.ctx || null; }
function createLayerCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const cx = c.getContext('2d');
  cx.imageSmoothingEnabled = false;
  return { canvas: c, ctx: cx };
}
function makeLayer(name, w, h) {
  const { canvas, ctx } = createLayerCanvas(w, h);
  return { id: ++layerIdCounter, name, canvas, ctx, visible: true, opacity: 1.0 };
}
function makeFrame(name, w, h, layers) {
  return { id: ++frameIdCounter, name: name||`F${frameIdCounter}`, layers: layers||[makeLayer('Layer 1',w,h)] };
}
function cloneFrame(frame, w, h) {
  const layers = frame.layers.map(l => {
    const {canvas,ctx} = createLayerCanvas(w,h); ctx.drawImage(l.canvas,0,0);
    return { id:++layerIdCounter, name:l.name, canvas, ctx, visible:l.visible, opacity:l.opacity };
  });
  return { id:++frameIdCounter, name:frame.name+"'", layers };
}

function initCanvas(w, h, keepFrames=false) {
  state.canvasW=w; state.canvasH=h;
  checkerCanvas.width=w; checkerCanvas.height=h;
  checkerCtx=checkerCanvas.getContext('2d'); drawChecker();
  previewCanvas.width=w; previewCanvas.height=h;
  preCtx=previewCanvas.getContext('2d'); preCtx.imageSmoothingEnabled=false;
  gridCanvas.width=w; gridCanvas.height=h; gridCtx=gridCanvas.getContext('2d');
  symAxisCanvas.width=w; symAxisCanvas.height=h; symAxisCtx=symAxisCanvas.getContext('2d');
  selectCanvas.width=w; selectCanvas.height=h; selCtx=selectCanvas.getContext('2d');
  if (!keepFrames) {
    state.frames=[makeFrame('F1',w,h)]; state.activeFrameIdx=0; state.activeLayerIdx=0;
    layerIdCounter=1; frameIdCounter=1;
  }
  fitZoom(); applyZoom(); drawGrid(); drawSymAxis();
  clearHistory(); saveHistory();
  $('canvas-size-label').textContent=`${w} × ${h}`;
  $('input-w').value=w; $('input-h').value=h;
  renderFrameList(); renderLayerList();
  clearSelection();
}
function drawChecker() {
  const {canvasW:w,canvasH:h}=state; const sz=4;
  for(let y=0;y<h;y+=sz) for(let x=0;x<w;x+=sz) {
    checkerCtx.fillStyle=(Math.floor(x/sz)+Math.floor(y/sz))%2===0?'#c0c2c8':'#d0d2d8';
    checkerCtx.fillRect(x,y,sz,sz);
  }
}
function applyZoom() {
  const z=state.zoom, pw=state.canvasW*z, ph=state.canvasH*z;
  [checkerCanvas,previewCanvas,gridCanvas,symAxisCanvas,selectCanvas].forEach(c=>{c.style.width=pw+'px'; c.style.height=ph+'px';});
  layerCanvases.style.width=pw+'px'; layerCanvases.style.height=ph+'px';
  container.style.width=pw+'px'; container.style.height=ph+'px';
  $('zoom-label').textContent=`×${z}`;
  rebuildLayerDOM(); drawGrid(); drawSymAxis(); redrawSelectionOverlay();
}
function fitZoom() {
  const aW=canvasArea.clientWidth-40, aH=canvasArea.clientHeight-100;
  state.zoom=Math.max(1,Math.min(Math.min(Math.floor(aW/state.canvasW),Math.floor(aH/state.canvasH)),32));
}
function rebuildLayerDOM() {
  layerCanvases.innerHTML='';
  const z=state.zoom, pw=state.canvasW*z, ph=state.canvasH*z;
  activeLayers().forEach(layer=>{
    layer.canvas.style.width=pw+'px'; layer.canvas.style.height=ph+'px';
    layer.canvas.style.opacity=layer.visible?layer.opacity:0;
    layerCanvases.appendChild(layer.canvas);
  });
}

function drawGrid() {
  const{canvasW:w,canvasH:h,zoom:z,gridVisible}=state;
  gridCtx.clearRect(0,0,w,h); if(!gridVisible||z<3)return;
  gridCtx.strokeStyle='rgba(0,0,0,0.25)'; gridCtx.lineWidth=0.5/z;
  for(let x=0;x<=w;x++){gridCtx.beginPath();gridCtx.moveTo(x,0);gridCtx.lineTo(x,h);gridCtx.stroke();}
  for(let y=0;y<=h;y++){gridCtx.beginPath();gridCtx.moveTo(0,y);gridCtx.lineTo(w,y);gridCtx.stroke();}
}
function drawSymAxis() {
  const{canvasW:w,canvasH:h,zoom:z,symmetry}=state;
  symAxisCtx.clearRect(0,0,w,h); if(symmetry==='none')return;
  const cx=(w-1)/2,cy=(h-1)/2,lw=Math.max(.5,1/z);
  const line=(x1,y1,x2,y2,col)=>{symAxisCtx.save();symAxisCtx.strokeStyle=col;symAxisCtx.lineWidth=lw;symAxisCtx.setLineDash([3/z,2/z]);symAxisCtx.globalAlpha=.7;symAxisCtx.beginPath();symAxisCtx.moveTo(x1,y1);symAxisCtx.lineTo(x2,y2);symAxisCtx.stroke();symAxisCtx.restore();};
  switch(symmetry){
    case 'x': line(cx+.5,0,cx+.5,h,'#1090e0');break;
    case 'y': line(0,cy+.5,w,cy+.5,'#d06010');break;
    case 'xy': line(cx+.5,0,cx+.5,h,'#1090e0');line(0,cy+.5,w,cy+.5,'#d06010');break;
    case 'radial4':line(cx+.5,0,cx+.5,h,'#1090e0');line(0,cy+.5,w,cy+.5,'#1090e0');break;
    case 'radial8':{line(cx+.5,0,cx+.5,h,'#1090e0');line(0,cy+.5,w,cy+.5,'#1090e0');const L=Math.max(w,h);line(cx-L,cy-L,cx+L,cy+L,'#8020c0');line(cx+L,cy-L,cx-L,cy+L,'#8020c0');}break;
  }
}
function redrawSelectionOverlay() {
  selCtx.clearRect(0,0,state.canvasW,state.canvasH);
  const sel = state.sel; if(!sel)return;
  const z=state.zoom, dash=state.selMarching, lw=1/z;
  selCtx.save();
  selCtx.strokeStyle='rgba(255,255,255,0.9)'; selCtx.lineWidth=lw*2; selCtx.setLineDash([]); selCtx.strokeRect(sel.x,sel.y,sel.w,sel.h);
  selCtx.strokeStyle='rgba(0,80,200,0.85)'; selCtx.lineWidth=lw; selCtx.setLineDash([4/z,4/z]); selCtx.lineDashOffset=-dash/z; selCtx.strokeRect(sel.x,sel.y,sel.w,sel.h);
  selCtx.restore();
}
function startMarchingAnts() { if(state.selMarchTimer)return; state.selMarchTimer=setInterval(()=>{state.selMarching=(state.selMarching+1)%8;redrawSelectionOverlay();},80); }
function stopMarchingAnts() { clearInterval(state.selMarchTimer); state.selMarchTimer=null; state.selMarching=0; }
function clearSelection() { state.sel=null; state.selDragging=false; state.selDragStart=null; stopMarchingAnts(); selCtx?.clearRect(0,0,state.canvasW,state.canvasH); commitFloat(); }
function commitFloat() {
  if(!state.selFloat)return;
  const{x,y,imageData}=state.selFloat; const c=activeCtx(); if(c) c.putImageData(imageData,x,y);
  state.selFloat=null; saveHistory(); renderLayerList();
}
function flatCanvas() {
  const w=state.canvasW,h=state.canvasH; const flat=document.createElement('canvas'); flat.width=w; flat.height=h; const fc=flat.getContext('2d');
  activeLayers().forEach(l=>{if(l.visible){fc.globalAlpha=l.opacity;fc.drawImage(l.canvas,0,0);}}); fc.globalAlpha=1; return flat;
}
function floodFill(x, y, fillColor) {
  const c = activeCtx(); if(!c)return; const w=state.canvasW, h=state.canvasH;
  let refData;
  if (state.fillRef==='all') refData=flatCanvas().getContext('2d').getImageData(0,0,w,h).data;
  else refData=c.getImageData(0,0,w,h).data;
  const paintData=c.getImageData(0,0,w,h), pd=paintData.data, I=(px,py)=>(py*w+px)*4;
  const tR=refData[I(x,y)],tG=refData[I(x,y)+1],tB=refData[I(x,y)+2],tA=refData[I(x,y)+3];
  const fR=parseInt(fillColor.slice(1,3),16),fG=parseInt(fillColor.slice(3,5),16),fB=parseInt(fillColor.slice(5,7),16),fA=Math.round(state.brushOpacity*255);
  const match=(px,py)=>{const i=I(px,py);return refData[i]===tR&&refData[i+1]===tG&&refData[i+2]===tB&&refData[i+3]===tA;};
  const stack=[[x,y]],vis=new Uint8Array(w*h);
  while(stack.length){const[cx,cy]=stack.pop();if(cx<0||cy<0||cx>=w||cy>=h)continue;if(vis[cy*w+cx])continue;if(!match(cx,cy))continue;vis[cy*w+cx]=1;const i=I(cx,cy);pd[i]=fR;pd[i+1]=fG;pd[i+2]=fB;pd[i+3]=fA;stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);}
  c.putImageData(paintData,0,0);
}
function selCopy() { if(!state.sel)return; const{x,y,w,h}=state.sel,c=activeCtx(); if(!c)return; state.selClipboard={w,h,imageData:c.getImageData(x,y,w,h)}; }
function selCut() { if(!state.sel)return; selCopy(); deleteSelection(); }
function selDelete() { deleteSelection(); }
function deleteSelection() { if(!state.sel)return; const{x,y,w,h}=state.sel,c=activeCtx(); if(!c)return; c.clearRect(x,y,w,h); saveHistory(); renderLayerList(); }
function selPaste() {
  if(!state.selClipboard)return; commitFloat(); const{w,h,imageData}=state.selClipboard;
  const px=Math.floor((state.canvasW-w)/2), py=Math.floor((state.canvasH-h)/2), newId=new ImageData(new Uint8ClampedArray(imageData.data),w,h);
  state.selFloat={x:px,y:py,imageData:newId}; state.sel={x:px,y:py,w,h}; startMarchingAnts(); redrawSelectionOverlay(); renderFloatPreview();
}
function renderFloatPreview() {
  preCtx.clearRect(0,0,state.canvasW,state.canvasH); if(!state.selFloat)return;
  const{x,y,imageData}=state.selFloat,tmp=document.createElement('canvas');tmp.width=imageData.width;tmp.height=imageData.height;tmp.getContext('2d').putImageData(imageData,0,0);
  preCtx.globalAlpha=0.75;preCtx.drawImage(tmp,x,y);preCtx.globalAlpha=1;
}
function isInsideSel(x,y) { if(!state.sel)return false; const{x:sx,y:sy,w:sw,h:sh}=state.sel; return x>=sx&&x<sx+sw&&y>=sy&&y<sy+sh; }
function liftSelection() { if(!state.sel||state.selFloat)return; const{x,y,w,h}=state.sel,c=activeCtx(); if(!c)return; const id=c.getImageData(x,y,w,h); c.clearRect(x,y,w,h); state.selFloat={x,y,imageData:id}; renderFloatPreview(); }
function getSymPoints(x,y){
  const cx=(state.canvasW-1)/2,cy=(state.canvasH-1)/2,mx=state.canvasW-1-x,my=state.canvasH-1-y;
  const u=set=>[...new Set(set.map(p=>`${p[0]},${p[1]}`))].map(s=>s.split(',').map(Number));
  switch(state.symmetry){
    case 'x': return u([[x,y],[mx,y]]);
    case 'y': return u([[x,y],[x,my]]);
    case 'xy': return u([[x,y],[mx,y],[x,my],[mx,my]]);
    case 'radial4':{const dx=x-cx,dy=y-cy;return u([[Math.round(cx+dx),Math.round(cy+dy)],[Math.round(cx-dy),Math.round(cy+dx)],[Math.round(cx-dx),Math.round(cy-dy)],[Math.round(cx+dy),Math.round(cy-dx)]]);}
    case 'radial8':{const dx=x-cx,dy=y-cy;return u([[Math.round(cx+dx),Math.round(cy+dy)],[Math.round(cx-dy),Math.round(cy+dx)],[Math.round(cx-dx),Math.round(cy-dy)],[Math.round(cx+dy),Math.round(cy-dx)],[Math.round(cx+dy),Math.round(cy+dx)],[Math.round(cx-dx),Math.round(cy+dy)],[Math.round(cx-dy),Math.round(cy-dx)],[Math.round(cx+dx),Math.round(cy-dy)]]);}
    default:return[[x,y]];
  }
}
function paintPixel(c,x,y,col,alpha,size){if(x<0||y<0||x>=state.canvasW||y>=state.canvasH)return;const s=Math.floor(size),ox=x-Math.floor((s-1)/2),oy=y-Math.floor((s-1)/2);c.globalAlpha=alpha;c.fillStyle=col;c.fillRect(ox,oy,s,s);c.globalAlpha=1;}
function erasePixel(c,x,y,size){const s=Math.floor(size),ox=x-Math.floor((s-1)/2),oy=y-Math.floor((s-1)/2);c.clearRect(ox,oy,s,s);}
function applyToSym(fn,x,y){getSymPoints(x,y).forEach(([px,py])=>fn(px,py));}
function drawPen(c,x,y,erase){applyToSym((px,py)=>erase?erasePixel(c,px,py,state.brushSize):paintPixel(c,px,py,state.fgColor,state.brushOpacity,state.brushSize),x,y);}
function bresenham(x0,y0,x1,y1){const pts=[];let dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1,err=dx+dy;while(true){pts.push([x0,y0]);if(x0===x1&&y0===y1)break;const e2=2*err;if(e2>=dy){err+=dy;x0+=sx;}if(e2<=dx){err+=dx;y0+=sy;}}return pts;}
function drawLinePts(c,x0,y0,x1,y1,erase){bresenham(x0,y0,x1,y1).forEach(([x,y])=>applyToSym((px,py)=>erase?erasePixel(c,px,py,state.brushSize):paintPixel(c,px,py,state.fgColor,state.brushOpacity,state.brushSize),x,y));}
function drawRectPts(c,x0,y0,x1,y1,erase){const minX=Math.min(x0,x1),maxX=Math.max(x0,x1),minY=Math.min(y0,y1),maxY=Math.max(y0,y1);const p=(x,y)=>applyToSym((px,py)=>erase?erasePixel(c,px,py,state.brushSize):paintPixel(c,px,py,state.fgColor,state.brushOpacity,state.brushSize),x,y);for(let x=minX;x<=maxX;x++){p(x,minY);p(x,maxY);}for(let y=minY+1;y<maxY;y++){p(minX,y);p(maxX,y);}}
function pickColor(x,y){const flat=flatCanvas(),p=flat.getContext('2d').getImageData(x,y,1,1).data;if(p[3]===0)return;setFgColor('#'+[p[0],p[1],p[2]].map(v=>v.toString(16).padStart(2,'0')).join(''));}
function getCanvasXY(e) {const rect=container.getBoundingClientRect(),cx=e.touches?e.touches[0].clientX:e.clientX,cy=e.touches?e.touches[0].clientY:e.clientY;return[Math.max(0,Math.min(state.canvasW-1,Math.floor((cx-rect.left)/state.zoom))),Math.max(0,Math.min(state.canvasH-1,Math.floor((cy-rect.top)/state.zoom)))];}
function onPointerDown(e) {
  e.preventDefault(); if(state.animPlaying)stopAnim(); const[x,y]=getCanvasXY(e);
  if(state.tool==='select'){
    if(state.selFloat){if(isInsideSel(x,y)){state.selDragging=true;state.selDragStart={mx:x,my:y,sx:state.sel.x,sy:state.sel.y};}else{commitFloat();clearSelection();startNewSel(x,y);}return;}
    if(state.sel&&isInsideSel(x,y)){liftSelection();state.selDragging=true;state.selDragStart={mx:x,my:y,sx:state.sel.x,sy:state.sel.y};return;}
    commitFloat();clearSelection();startNewSel(x,y);return;
  }
  if(state.sel){commitFloat();clearSelection();}
  state.isDrawing=true;state.lastX=x;state.lastY=y;const c=activeCtx();if(!c)return;
  switch(state.tool){case'pen':drawPen(c,x,y,false);break;case'eraser':drawPen(c,x,y,true);break;case'fill':floodFill(x,y,state.fgColor);saveHistory();state.isDrawing=false;return;case'eyedropper':pickColor(x,y);state.isDrawing=false;return;case'line':state.lineStart=[x,y];break;case'rect':state.rectStart=[x,y];break;}
}
function startNewSel(x,y){state.isDrawing=true;state.lastX=x;state.lastY=y;state.sel={x,y,w:1,h:1};startMarchingAnts();redrawSelectionOverlay();}
function onPointerMove(e) {
  e.preventDefault(); const[x,y]=getCanvasXY(e);$('cursor-info').textContent=`${x}, ${y}`;if(!state.isDrawing&&!state.selDragging)return;
  if(state.selDragging&&state.selFloat){const{mx,my,sx,sy}=state.selDragStart,dx=x-mx,dy=y-my;state.sel={...state.sel,x:sx+dx,y:sy+dy};state.selFloat.x=sx+dx;state.selFloat.y=sy+dy;redrawSelectionOverlay();renderFloatPreview();return;}
  const c=activeCtx();
  switch(state.tool){case'pen':if(c&&(x!==state.lastX||y!==state.lastY)){drawLinePts(c,state.lastX,state.lastY,x,y,false);state.lastX=x;state.lastY=y;}break;case'eraser':if(c&&(x!==state.lastX||y!==state.lastY)){drawLinePts(c,state.lastX,state.lastY,x,y,true);state.lastX=x;state.lastY=y;}break;case'line':if(state.lineStart){preCtx.clearRect(0,0,state.canvasW,state.canvasH);drawLinePts(preCtx,state.lineStart[0],state.lineStart[1],x,y,false);}break;case'rect':if(state.rectStart){preCtx.clearRect(0,0,state.canvasW,state.canvasH);drawRectPts(preCtx,state.rectStart[0],state.rectStart[1],x,y,false);}break;case'select':{const ox=Math.min(state.lastX,x),oy=Math.min(state.lastY,y),ow=Math.max(1,Math.abs(x-state.lastX)+1),oh=Math.max(1,Math.abs(y-state.lastY)+1);state.sel={x:ox,y:oy,w:ow,h:oh};redrawSelectionOverlay();}break;}
}
function onPointerUp(e) {
  if(state.selDragging){state.selDragging=false;state.selDragStart=null;return;} if(!state.isDrawing)return; e.preventDefault();state.isDrawing=false;
  const[x,y]=e.changedTouches?(()=>{const t=e.changedTouches[0];return getCanvasXY({clientX:t.clientX,clientY:t.clientY});})():getCanvasXY(e),c=activeCtx();
  switch(state.tool){case'pen':case'eraser':if(c)saveHistory();break;case'line':if(state.lineStart&&c){preCtx.clearRect(0,0,state.canvasW,state.canvasH);drawLinePts(c,state.lineStart[0],state.lineStart[1],x,y,false);state.lineStart=null;saveHistory();}break;case'rect':if(state.rectStart&&c){preCtx.clearRect(0,0,state.canvasW,state.canvasH);drawRectPts(c,state.rectStart[0],state.rectStart[1],x,y,false);state.rectStart=null;saveHistory();}break;case'select':{const ox=Math.min(state.lastX,x),oy=Math.min(state.lastY,y),ow=Math.max(1,Math.abs(x-state.lastX)+1),oh=Math.max(1,Math.abs(y-state.lastY)+1);state.sel={x:ox,y:oy,w:ow,h:oh};redrawSelectionOverlay();}break;}
}
function flipAllLayers(horizontal){activeLayers().forEach(layer=>{const w=state.canvasW,h=state.canvasH,tmp=document.createElement('canvas');tmp.width=w;tmp.height=h;const tc=tmp.getContext('2d');tc.save();if(horizontal){tc.translate(w,0);tc.scale(-1,1);}else{tc.translate(0,h);tc.scale(1,-1);}tc.drawImage(layer.canvas,0,0);tc.restore();layer.ctx.clearRect(0,0,w,h);layer.ctx.drawImage(tmp,0,0);});saveHistory();renderLayerList();}
function rotateAllLayers(cw){
  const w=state.canvasW,h=state.canvasH;
  activeLayers().forEach(layer=>{const tmp=document.createElement('canvas');tmp.width=h;tmp.height=w;const tc=tmp.getContext('2d');tc.save();if(cw){tc.translate(h,0);tc.rotate(Math.PI/2);}else{tc.translate(0,w);tc.rotate(-Math.PI/2);}tc.drawImage(layer.canvas,0,0);tc.restore();layer.canvas.width=h;layer.canvas.height=w;layer.ctx.imageSmoothingEnabled=false;layer.ctx.drawImage(tmp,0,0);});
  state.canvasW=h;state.canvasH=w;checkerCanvas.width=state.canvasW;checkerCanvas.height=state.canvasH;checkerCtx=checkerCanvas.getContext('2d');drawChecker();previewCanvas.width=state.canvasW;previewCanvas.height=state.canvasH;preCtx=previewCanvas.getContext('2d');preCtx.imageSmoothingEnabled=false;gridCanvas.width=state.canvasW;gridCanvas.height=state.canvasH;gridCtx=gridCanvas.getContext('2d');symAxisCanvas.width=state.canvasW;symAxisCanvas.height=state.canvasH;symAxisCtx=symAxisCanvas.getContext('2d');selectCanvas.width=state.canvasW;selectCanvas.height=state.canvasH;selCtx=selectCanvas.getContext('2d');$('canvas-size-label').textContent=`${state.canvasW} × ${state.canvasH}`;$('input-w').value=state.canvasW;$('input-h').value=state.canvasH;fitZoom();applyZoom();drawGrid();drawSymAxis();saveHistory();renderLayerList();clearSelection();
}
function snapFrames(){return state.frames.map(f=>({id:f.id,name:f.name,layers:f.layers.map(l=>({id:l.id,name:l.name,visible:l.visible,opacity:l.opacity,data:l.ctx.getImageData(0,0,state.canvasW,state.canvasH)}))}));}
function saveHistory(){const snap={frames:snapFrames(),activeFrameIdx:state.activeFrameIdx,activeLayerIdx:state.activeLayerIdx};state.history.splice(state.historyIndex+1);state.history.push(snap);if(state.history.length>state.maxHistory)state.history.shift();state.historyIndex=state.history.length-1;updateHistoryBtns();updateFrameThumbs();renderLayerList();}
function clearHistory(){state.history=[];state.historyIndex=-1;}
function restoreSnap(snap){snap.frames.forEach((sf,fi)=>{if(!state.frames[fi])state.frames[fi]={id:sf.id,name:sf.name,layers:[]};const frame=state.frames[fi];frame.name=sf.name;sf.layers.forEach((sl,li)=>{if(!frame.layers[li]){const{canvas,ctx}=createLayerCanvas(state.canvasW,state.canvasH);frame.layers[li]={id:sl.id,name:sl.name,canvas,ctx,visible:sl.visible,opacity:sl.opacity};}frame.layers[li].name=sl.name;frame.layers[li].visible=sl.visible;frame.layers[li].opacity=sl.opacity;frame.layers[li].canvas.width=state.canvasW;frame.layers[li].canvas.height=state.canvasH;frame.layers[li].ctx.putImageData(sl.data,0,0);});frame.layers.length=sf.layers.length;});state.frames.length=snap.frames.length;state.activeFrameIdx=Math.min(snap.activeFrameIdx,state.frames.length-1);state.activeLayerIdx=Math.min(snap.activeLayerIdx,activeLayers().length-1);rebuildLayerDOM();renderFrameList();renderLayerList();updateHistoryBtns();clearSelection();}
function undo(){if(state.historyIndex<=0)return;state.historyIndex--;restoreSnap(state.history[state.historyIndex]);}
function redo(){if(state.historyIndex>=state.history.length-1)return;state.historyIndex++;restoreSnap(state.history[state.historyIndex]);}
function updateHistoryBtns(){$('btn-undo').disabled=state.historyIndex<=0;$('btn-redo').disabled=state.historyIndex>=state.history.length-1;}
function renderFrameList(){const list=$('frame-list');list.innerHTML='';state.frames.forEach((frame,fi)=>{const item=document.createElement('div');item.className='frame-item'+(fi===state.activeFrameIdx?' active':'');const thumb=document.createElement('canvas');thumb.className='frame-thumb';thumb.width=state.canvasW;thumb.height=state.canvasH;const tc=thumb.getContext('2d');frame.layers.forEach(l=>{if(l.visible){tc.globalAlpha=l.opacity;tc.drawImage(l.canvas,0,0);}});tc.globalAlpha=1;const num=document.createElement('span');num.className='frame-num';num.textContent=fi+1;const name=document.createElement('span');name.className='frame-name';name.textContent=frame.name;name.title=frame.name;name.ondblclick=e=>{e.stopPropagation();const n=prompt('フレーム名',frame.name);if(n?.trim()){frame.name=n.trim();renderFrameList();}};item.appendChild(thumb);item.appendChild(num);item.appendChild(name);item.onclick=()=>setActiveFrame(fi);item.addEventListener('contextmenu',e=>{e.preventDefault();if(state.frames.length>1&&confirm(`フレーム${fi+1}を削除?`)){state.frames.splice(fi,1);state.activeFrameIdx=Math.min(state.activeFrameIdx,state.frames.length-1);rebuildLayerDOM();renderFrameList();saveHistory();}});list.appendChild(item);});updateAnimLabel();}
function setActiveFrame(fi){state.activeFrameIdx=Math.max(0,Math.min(fi,state.frames.length-1));state.activeLayerIdx=Math.min(state.activeLayerIdx,activeLayers().length-1);rebuildLayerDOM();renderFrameList();renderLayerList();clearSelection();}
function updateFrameThumbs(){$('frame-list').querySelectorAll('.frame-item').forEach((item,fi)=>{const thumb=item.querySelector('.frame-thumb');if(!thumb)return;const tc=thumb.getContext('2d');tc.clearRect(0,0,state.canvasW,state.canvasH);state.frames[fi]?.layers.forEach(l=>{if(l.visible){tc.globalAlpha=l.opacity;tc.drawImage(l.canvas,0,0);}});tc.globalAlpha=1;});}
function renderLayerList(){const list=$('layer-list');list.innerHTML='';[...activeLayers()].reverse().forEach((layer,ri)=>{const realIdx=activeLayers().length-1-ri,isActive=realIdx===state.activeLayerIdx;const item=document.createElement('div');item.className='layer-item'+(isActive?' active':'')+((!layer.visible)?' hidden-layer':'');const vis=document.createElement('button');vis.className='layer-vis-btn';vis.textContent=layer.visible?'👁':'○';vis.onclick=e=>{e.stopPropagation();layer.visible=!layer.visible;rebuildLayerDOM();renderLayerList();};const thumb=document.createElement('canvas');thumb.className='layer-thumb';thumb.width=state.canvasW;thumb.height=state.canvasH;thumb.getContext('2d').drawImage(layer.canvas,0,0);const name=document.createElement('span');name.className='layer-name';name.textContent=layer.name;name.title=layer.name;name.ondblclick=e=>{e.stopPropagation();const n=prompt('レイヤー名',layer.name);if(n?.trim()){layer.name=n.trim();renderLayerList();}};item.appendChild(vis);item.appendChild(thumb);item.appendChild(name);item.onclick=()=>{state.activeLayerIdx=realIdx;renderLayerList();};list.appendChild(item);});}
function addLayer(){const f=activeFrame();if(!f)return;f.layers.push(makeLayer(`Layer ${f.layers.length+1}`,state.canvasW,state.canvasH));state.activeLayerIdx=f.layers.length-1;rebuildLayerDOM();renderLayerList();saveHistory();}
function dupLayer(){const f=activeFrame(),src=activeLayer();if(!src)return;const{canvas,ctx}=createLayerCanvas(state.canvasW,state.canvasH);ctx.drawImage(src.canvas,0,0);f.layers.splice(state.activeLayerIdx+1,0,{id:++layerIdCounter,name:src.name+"'",canvas,ctx,visible:true,opacity:src.opacity});state.activeLayerIdx++;rebuildLayerDOM();renderLayerList();saveHistory();}
function delLayer(){const f=activeFrame();if(!f||f.layers.length<=1){alert('最低1レイヤー必要');return;}f.layers.splice(state.activeLayerIdx,1);state.activeLayerIdx=Math.min(state.activeLayerIdx,f.layers.length-1);rebuildLayerDOM();renderLayerList();saveHistory();}
function mergeLayerDown(){const f=activeFrame(),idx=state.activeLayerIdx;if(idx<=0){alert('一番下は結合不可');return;}f.layers[idx-1].ctx.drawImage(f.layers[idx].canvas,0,0);f.layers.splice(idx,1);state.activeLayerIdx=idx-1;rebuildLayerDOM();renderLayerList();saveHistory();}
function moveLayerUp(){const f=activeFrame(),idx=state.activeLayerIdx;if(idx>=f.layers.length-1)return;[f.layers[idx],f.layers[idx+1]]=[f.layers[idx+1],f.layers[idx]];state.activeLayerIdx++;rebuildLayerDOM();renderLayerList();}
function moveLayerDown(){const f=activeFrame(),idx=state.activeLayerIdx;if(idx<=0)return;[f.layers[idx],f.layers[idx-1]]=[f.layers[idx-1],f.layers[idx]];state.activeLayerIdx--;rebuildLayerDOM();renderLayerList();}
function updateAnimLabel(){$('anim-frame-label').textContent=`F ${state.activeFrameIdx+1} / ${state.frames.length}`;}
function animStep(){const n=state.frames.length;if(n<=1){stopAnim();return;}if(state.animMode==='loop'){setActiveFrame((state.activeFrameIdx+1)%n);}else{let next=state.activeFrameIdx+state.animDir;if(next>=n){state.animDir=-1;next=n-2;}if(next<0){state.animDir=1;next=1;}setActiveFrame(next);}$('frame-list').querySelectorAll('.frame-item').forEach((el,i)=>el.classList.toggle('playing-indicator',i===state.activeFrameIdx));updateAnimLabel();}
function startAnim(){if(state.animPlaying)return;state.animPlaying=true;$('anim-play').classList.add('playing');$('anim-play').textContent='⏸';state.animDir=1;state.animTimerId=setInterval(animStep,1000/Math.max(1,state.animFps));}
function stopAnim(){if(!state.animPlaying)return;state.animPlaying=false;clearInterval(state.animTimerId);state.animTimerId=null;$('anim-play').classList.remove('playing');$('anim-play').textContent='▶';$('frame-list').querySelectorAll('.frame-item').forEach(el=>el.classList.remove('playing-indicator'));}
function toggleAnim(){state.animPlaying?stopAnim():startAnim();}
function setFgColor(hex){state.fgColor=hex;$('color-fg-box').style.background=hex;$('color-picker').value=hex;const h=hex.replace('#','');$('hex-input').value=h;const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);$('sl-r').value=r;$('val-r').textContent=r;$('sl-g').value=g;$('val-g').textContent=g;$('sl-b').value=b;$('val-b').textContent=b;}
function hexFromRGB(r,g,b){return'#'+[r,g,b].map(v=>Number(v).toString(16).padStart(2,'0')).join('');}
function renderPalette(){const grid=$('palette-grid');grid.innerHTML='';state.palette.forEach((color,i)=>{const sw=document.createElement('div');sw.className='palette-swatch';sw.style.background=color;sw.title=color;if(color===state.fgColor)sw.classList.add('selected');sw.addEventListener('click',()=>{document.querySelectorAll('.palette-swatch').forEach(s=>s.classList.remove('selected'));sw.classList.add('selected');setFgColor(color);});sw.addEventListener('contextmenu',e=>{e.preventDefault();state.palette.splice(i,1);renderPalette();});grid.appendChild(sw);});}
function drawSymPreview(){const s=58;symCtx.clearRect(0,0,s,s);symCtx.fillStyle='#2c2f3a';symCtx.fillRect(0,0,s,s);const cx=s/2,cy=s/2;symCtx.strokeStyle='rgba(240,192,64,.4)';symCtx.lineWidth=.5;const L=(x1,y1,x2,y2)=>{symCtx.beginPath();symCtx.moveTo(x1,y1);symCtx.lineTo(x2,y2);symCtx.stroke();};switch(state.symmetry){case'x':L(cx,0,cx,s);break;case'y':L(0,cy,s,cy);break;case'xy':L(cx,0,cx,s);L(0,cy,s,cy);break;case'radial4':L(cx,0,cx,s);L(0,cy,s,cy);break;case'radial8':L(cx,0,cx,s);L(0,cy,s,cy);L(0,0,s,s);L(s,0,0,s);break;}symCtx.fillStyle='#f0c040';getSymPoints(Math.round(cx*.45),Math.round(cy*.35)).forEach(([x,y])=>{const sx=(x/(state.canvasW-1))*s,sy=(y/(state.canvasH-1))*s;symCtx.beginPath();symCtx.arc(sx,sy,2,0,Math.PI*2);symCtx.fill();});}
function updateToolOptionPanel(tool){const fillOpts=$('fill-options'),selOpts=$('select-options'),label=$('tool-option-label'),icon=label.querySelector('.collapse-icon'),iconHTML=icon?' <span class="collapse-icon">'+icon.textContent+'</span>':'';if(tool==='fill'){fillOpts.classList.remove('hidden');selOpts.classList.add('hidden');label.innerHTML='FILL OPTION'+iconHTML;}else if(tool==='select'){fillOpts.classList.add('hidden');selOpts.classList.remove('hidden');label.innerHTML='SELECT OPTION'+iconHTML;}else{fillOpts.classList.remove('hidden');selOpts.classList.add('hidden');label.innerHTML='FILL OPTION'+iconHTML;}}
function flattenFrame(frame,w,h){const flat=document.createElement('canvas');flat.width=w;flat.height=h;const fc=flat.getContext('2d');frame.layers.forEach(l=>{if(l.visible){fc.globalAlpha=l.opacity;fc.drawImage(l.canvas,0,0);}});fc.globalAlpha=1;return flat;}
function exportPNG(){const flat=flattenFrame(activeFrame(),state.canvasW,state.canvasH),link=document.createElement('a');link.download='pixel-art.png';link.href=flat.toDataURL('image/png');link.click();}
function exportJSON(){const obj={_type:'pixelforge-project',_version:2,width:state.canvasW,height:state.canvasH,palette:state.palette,mappings:importMappings.map(m=>({...m})),frames:state.frames.map(f=>({name:f.name,layers:f.layers.map(l=>({name:l.name,visible:l.visible,opacity:l.opacity,dataURL:l.canvas.toDataURL('image/png')}))}))};const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}),link=document.createElement('a');link.download='pixel-art.json';link.href=URL.createObjectURL(blob);link.click();setTimeout(()=>URL.revokeObjectURL(link.href),5000);}
function lzwEncode(indexStream,colorDepth){const clearCode=1<<colorDepth,eofCode=clearCode+1;let codeSize=colorDepth+1,limit=1<<codeSize;const table=new Map(),initTable=()=>{table.clear();for(let i=0;i<clearCode;i++)table.set(String(i),i);};const bytes=[];let bitBuf=0,bitLen=0;const writeBits=code=>{bitBuf|=code<<bitLen;bitLen+=codeSize;while(bitLen>=8){bytes.push(bitBuf&0xff);bitBuf>>=8;bitLen-=8;}};initTable();writeBits(clearCode);let nextCode=eofCode+1,prefix=String(indexStream[0]);for(let i=1;i<indexStream.length;i++){const k=String(indexStream[i]),key=prefix+','+k;if(table.has(key)){prefix=key;}else{writeBits(table.get(prefix));if(nextCode<4096){table.set(key,nextCode++);if(nextCode>limit&&codeSize<12){codeSize++;limit<<=1;}}else{writeBits(clearCode);initTable();nextCode=eofCode+1;codeSize=colorDepth+1;limit=1<<codeSize;}prefix=k;}}writeBits(table.get(prefix));writeBits(eofCode);if(bitLen>0)bytes.push(bitBuf&0xff);return bytes;}
function buildGIF(framesData,w,h,delayMs){const buf=[],wr=v=>buf.push(v&0xff),wr2=v=>{wr(v);wr(v>>8);},wrS=s=>{for(let i=0;i<s.length;i++)wr(s.charCodeAt(i));},wrA=a=>{for(let i=0;i<a.length;i++)wr(a[i]);};wrS('GIF89a');wr2(w);wr2(h);wr(0x70);wr(0);wr(0);wr(0x21);wr(0xff);wr(11);wrS('NETSCAPE2.0');wr(3);wr(1);wr2(0);wr(0);const delayCentisec=Math.max(2,Math.round(delayMs/10));for(const{palette,indices}of framesData){wr(0x21);wr(0xf9);wr(4);wr(0x08);wr2(delayCentisec);wr(0);wr(0);wr(0x2c);wr2(0);wr2(0);wr2(w);wr2(h);wr(0x87);for(let i=0;i<256;i++){const c=palette[i]||[0,0,0];wr(c[0]);wr(c[1]);wr(c[2]);}const minCode=8;wr(minCode);const compressed=lzwEncode(indices,minCode);for(let i=0;i<compressed.length;i+=255){const chunk=compressed.slice(i,i+255);wr(chunk.length);wrA(chunk);}wr(0);}wr(0x3b);return new Uint8Array(buf);}
function canvasToGIFFrame(canvas){const w=canvas.width,h=canvas.height,ctx=canvas.getContext('2d'),raw=ctx.getImageData(0,0,w,h).data,colorMap=new Map(),palette=[[0,0,0]];colorMap.set('0,0,0,0',0);const indices=new Uint8Array(w*h);for(let i=0;i<w*h;i++){const r=raw[i*4],g=raw[i*4+1],b=raw[i*4+2],a=raw[i*4+3];if(a<128){indices[i]=0;continue;}const qr=Math.min(248,Math.floor(r/8)*8),qg=Math.min(248,Math.floor(g/8)*8),qb=Math.min(248,Math.floor(b/8)*8),key=`${qr},${qg},${qb}`;if(colorMap.has(key)){indices[i]=colorMap.get(key);}else if(palette.length<255){const idx=palette.length;palette.push([qr,qg,qb]);colorMap.set(key,idx);indices[i]=idx;}else{let best=1,bestD=Infinity;for(let ci=1;ci<palette.length;ci++){const[pr,pg,pb]=palette[ci],d=(r-pr)**2+(g-pg)**2+(b-pb)**2;if(d<bestD){bestD=d;best=ci;}}indices[i]=best;}}while(palette.length<256)palette.push([0,0,0]);return{palette,indices};}
function exportGIF(){const fps=parseInt($('gif-fps').value)||4,scale=parseInt($('gif-scale').value)||4,mode=$('gif-mode').value,bgMode=$('gif-bg').value,w=state.canvasW*scale,h=state.canvasH*scale;$('gif-progress-wrap').classList.remove('hidden');$('gif-progress-fill').style.width='0%';$('gif-progress-label').textContent='準備中...';$('gif-ok').disabled=true;setTimeout(()=>{try{let flatFrames=state.frames.map(f=>flattenFrame(f,state.canvasW,state.canvasH));if(mode==='bounce'&&flatFrames.length>2){const rev=[...flatFrames].reverse().slice(1,flatFrames.length-1);flatFrames=[...flatFrames,...rev];}const delayMs=Math.round(1000/Math.max(1,fps)),total=flatFrames.length,gifFrames=flatFrames.map((fc,i)=>{$('gif-progress-fill').style.width=((i/total)*80).toFixed(0)+'%';$('gif-progress-label').textContent=`フレーム変換中 ${i+1}/${total}`;const scaled=document.createElement('canvas');scaled.width=w;scaled.height=h;const sc=scaled.getContext('2d');sc.imageSmoothingEnabled=false;if(bgMode==='white'){sc.fillStyle='#ffffff';sc.fillRect(0,0,w,h);}else if(bgMode==='checker'){const sz=scale*4;for(let cy=0;cy<h;cy+=sz)for(let cx=0;cx<w;cx+=sz){sc.fillStyle=(Math.floor(cx/sz)+Math.floor(cy/sz))%2===0?'#c8c8c8':'#e8e8e8';sc.fillRect(cx,cy,sz,sz);}}sc.drawImage(fc,0,0,w,h);return canvasToGIFFrame(scaled);});$('gif-progress-fill').style.width='90%';$('gif-progress-label').textContent='GIFバイナリ生成中...';setTimeout(()=>{try{const gifBytes=buildGIF(gifFrames,w,h,delayMs),blob=new Blob([gifBytes],{type:'image/gif'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.download='pixel-art.gif';link.href=url;link.click();setTimeout(()=>URL.revokeObjectURL(url),5000);$('gif-progress-fill').style.width='100%';$('gif-progress-label').textContent='完成！';setTimeout(()=>{$('gif-progress-wrap').classList.add('hidden');$('gif-ok').disabled=false;$('gif-modal-overlay').classList.add('hidden');},800);}catch(err){console.error('GIF build error:',err);$('gif-progress-label').textContent='エラー: '+err.message;$('gif-ok').disabled=false;}},30);}catch(err){console.error('GIF export error:',err);$('gif-progress-label').textContent='エラー: '+err.message;$('gif-ok').disabled=false;}},50);}
function resizeCanvas(newW,newH){state.frames.forEach(f=>f.layers.forEach(l=>{const tmp=document.createElement('canvas');tmp.width=newW;tmp.height=newH;tmp.getContext('2d').drawImage(l.canvas,0,0);l.canvas.width=newW;l.canvas.height=newH;l.ctx.imageSmoothingEnabled=false;l.ctx.drawImage(tmp,0,0);}));initCanvas(newW,newH,true);}
document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;if(e.ctrlKey||e.metaKey){if(e.key==='z'){e.preventDefault();undo();return;}if(e.key==='y'){e.preventDefault();redo();return;}if(e.key==='c'&&state.sel){e.preventDefault();selCopy();return;}if(e.key==='x'&&state.sel){e.preventDefault();selCut();return;}if(e.key==='v'&&state.selClipboard){e.preventDefault();selectTool('select');selPaste();return;}return;}const map={p:'pen',e:'eraser',f:'fill',i:'eyedropper',l:'line',r:'rect',s:'select'};if(map[e.key])selectTool(map[e.key]);if(e.key==='h'||e.key==='H')flipAllLayers(true);if(e.key==='v'||e.key==='V')flipAllLayers(false);if(e.key==='g'||e.key==='G'){state.gridVisible=!state.gridVisible;$('btn-grid-toggle').classList.toggle('active',state.gridVisible);drawGrid();}if(e.key===' '){e.preventDefault();toggleAnim();}if(e.key===','||e.key==='ArrowLeft'){stopAnim();setActiveFrame(state.activeFrameIdx-1);}if(e.key==='.'||e.key==='ArrowRight'){stopAnim();setActiveFrame(state.activeFrameIdx+1);}if(e.key==='+'||e.key==='=')zoomIn();if(e.key==='-')zoomOut();if(e.key==='Delete'||e.key==='Backspace'){if(state.sel){e.preventDefault();selDelete();}}if(e.key==='Escape'){if(state.sel){commitFloat();clearSelection();}}});
function selectTool(tool){state.tool=tool;document.querySelectorAll('.tool-btn[data-tool]').forEach(b=>b.classList.toggle('active',b.dataset.tool===tool));updateToolOptionPanel(tool);if(tool!=='select'&&state.sel){commitFloat();clearSelection();}}
function zoomIn(){state.zoom=Math.min(state.zoom+1,32);applyZoom();}
function zoomOut(){state.zoom=Math.max(state.zoom-1,1);applyZoom();}
function bindUI(){document.querySelectorAll('.tool-btn[data-tool]').forEach(b=>b.addEventListener('click',()=>selectTool(b.dataset.tool)));$('btn-flip-h').addEventListener('click',()=>flipAllLayers(true));$('btn-flip-v').addEventListener('click',()=>flipAllLayers(false));$('btn-rot-cw').addEventListener('click',()=>rotateAllLayers(true));$('btn-rot-ccw').addEventListener('click',()=>rotateAllLayers(false));document.querySelectorAll('.sym-btn').forEach(b=>b.addEventListener('click',()=>{state.symmetry=b.dataset.sym;document.querySelectorAll('.sym-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');drawSymPreview();drawSymAxis();}));$('brush-size').addEventListener('input',e=>{state.brushSize=+e.target.value;$('brush-size-val').textContent=state.brushSize;});$('brush-opacity').addEventListener('input',e=>{state.brushOpacity=+e.target.value/100;$('brush-opacity-val').textContent=e.target.value+'%';});$('color-picker').addEventListener('input',e=>setFgColor(e.target.value));$('hex-input').addEventListener('change',e=>{const h=e.target.value.replace(/[^0-9a-fA-F]/g,'').slice(0,6);if(h.length===6)setFgColor('#'+h);});['r','g','b'].forEach(ch=>{$(`sl-${ch}`).addEventListener('input',()=>{$(`val-${ch}`).textContent=$(`sl-${ch}`).value;setFgColor(hexFromRGB($('sl-r').value,$('sl-g').value,$('sl-b').value));});});$('btn-swap-colors').addEventListener('click',()=>{const t=state.fgColor;state.fgColor=state.bgColor;state.bgColor=t;setFgColor(state.fgColor);$('color-bg-box').style.background=state.bgColor;});$('color-bg-box').addEventListener('click',()=>setFgColor(state.bgColor));$('btn-add-color').addEventListener('click',()=>{if(!state.palette.includes(state.fgColor)){state.palette.push(state.fgColor);renderPalette();}});$('btn-clear-palette').addEventListener('click',()=>{state.palette=[];renderPalette();});document.querySelectorAll('#fill-options .toggle-btn').forEach(b=>b.addEventListener('click',()=>{state.fillRef=b.dataset.ref;document.querySelectorAll('#fill-options .toggle-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');}));document.querySelectorAll('#select-options .toggle-btn').forEach(b=>b.addEventListener('click',()=>{state.selRef=b.dataset.ref;document.querySelectorAll('#select-options .toggle-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');}));$('btn-sel-copy').addEventListener('click',selCopy);$('btn-sel-cut').addEventListener('click',selCut);$('btn-sel-paste').addEventListener('click',()=>selPaste());$('btn-sel-delete').addEventListener('click',selDelete);$('btn-sel-clear').addEventListener('click',()=>{commitFloat();clearSelection();});$('btn-add-frame').addEventListener('click',()=>{state.frames.push(makeFrame(`F${state.frames.length+1}`,state.canvasW,state.canvasH));setActiveFrame(state.frames.length-1);saveHistory();});$('btn-dup-frame').addEventListener('click',()=>{const cl=cloneFrame(activeFrame(),state.canvasW,state.canvasH);state.frames.splice(state.activeFrameIdx+1,0,cl);setActiveFrame(state.activeFrameIdx+1);saveHistory();});$('btn-del-frame').addEventListener('click',()=>{if(state.frames.length<=1){alert('最低1フレーム');return;}state.frames.splice(state.activeFrameIdx,1);setActiveFrame(Math.min(state.activeFrameIdx,state.frames.length-1));saveHistory();});$('btn-frame-left').addEventListener('click',()=>{const i=state.activeFrameIdx;if(i<=0)return;[state.frames[i],state.frames[i-1]]=[state.frames[i-1],state.frames[i]];setActiveFrame(i-1);});$('btn-frame-right').addEventListener('click',()=>{const i=state.activeFrameIdx;if(i>=state.frames.length-1)return;[state.frames[i],state.frames[i+1]]=[state.frames[i+1],state.frames[i]];setActiveFrame(i+1);});$('btn-add-layer').addEventListener('click',addLayer);$('btn-dup-layer').addEventListener('click',dupLayer);$('btn-del-layer').addEventListener('click',delLayer);$('btn-merge-layer').addEventListener('click',mergeLayerDown);$('btn-layer-up').addEventListener('click',moveLayerUp);$('btn-layer-down').addEventListener('click',moveLayerDown);$('btn-undo').addEventListener('click',undo);$('btn-redo').addEventListener('click',redo);$('anim-play').addEventListener('click',toggleAnim);$('anim-prev').addEventListener('click',()=>{stopAnim();setActiveFrame(state.activeFrameIdx-1);});$('anim-next').addEventListener('click',()=>{stopAnim();setActiveFrame(state.activeFrameIdx+1);});$('anim-fps').addEventListener('change',e=>{state.animFps=Math.max(1,Math.min(60,+e.target.value||4));if(state.animPlaying){stopAnim();startAnim();}});$('anim-mode-loop').dataset.mode='loop';$('anim-mode-bounce').dataset.mode='bounce';document.querySelectorAll('.anim-mode-btn').forEach(b=>b.addEventListener('click',()=>{state.animMode=b.dataset.mode;document.querySelectorAll('.anim-mode-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');}));$('btn-export').addEventListener('click',exportPNG);$('btn-export-json').addEventListener('click',exportJSON);$('btn-export-gif').addEventListener('click',()=>{$('gif-fps').value=state.animFps;$('gif-mode').value=state.animMode;$('gif-progress-wrap').classList.add('hidden');$('gif-modal-overlay').classList.remove('hidden');});$('gif-ok').addEventListener('click',exportGIF);$('gif-cancel').addEventListener('click',()=>$('gif-modal-overlay').classList.add('hidden'));$('btn-grid-toggle').addEventListener('click',()=>{state.gridVisible=!state.gridVisible;$('btn-grid-toggle').classList.toggle('active',state.gridVisible);drawGrid();});$('btn-zoom-in').addEventListener('click',zoomIn);$('btn-zoom-out').addEventListener('click',zoomOut);$('btn-zoom-fit').addEventListener('click',()=>{fitZoom();applyZoom();});$('btn-resize').addEventListener('click',()=>{const w=+$('input-w').value,h=+$('input-h').value;if(w>=4&&h>=4&&w<=128&&h<=128)resizeCanvas(w,h);});$('btn-clear-canvas').addEventListener('click',()=>{if(confirm('現在レイヤーをクリア?')){const c=activeCtx();if(c)c.clearRect(0,0,state.canvasW,state.canvasH);saveHistory();}});$('btn-new').addEventListener('click',()=>$('modal-overlay').classList.remove('hidden'));$('modal-cancel').addEventListener('click',()=>$('modal-overlay').classList.add('hidden'));$('modal-ok').addEventListener('click',()=>{const w=+$('modal-w').value,h=+$('modal-h').value;if(w>=4&&h>=4&&w<=128&&h<=128){initCanvas(w,h);$('modal-overlay').classList.add('hidden');}});container.addEventListener('mousedown',onPointerDown);window.addEventListener('mousemove',onPointerMove);window.addEventListener('mouseup',onPointerUp);container.addEventListener('touchstart',onPointerDown,{passive:false});window.addEventListener('touchmove',onPointerMove,{passive:false});window.addEventListener('touchend',onPointerUp,{passive:false});canvasArea.addEventListener('wheel',e=>{e.preventDefault();e.deltaY<0?zoomIn():zoomOut();},{passive:false});window.addEventListener('resize',()=>{fitZoom();applyZoom();});}
const defaultMappings=[{num:0,color:null,label:'透明'},{num:1,color:'#1a1a1a',label:'黒'},{num:2,color:'#e03030',label:'赤'},{num:3,color:'#30a030',label:'緑'},{num:4,color:'#3060e0',label:'青'},{num:5,color:'#e0c030',label:'黄'},{num:6,color:'#e07030',label:'オレンジ'},{num:7,color:'#c030c0',label:'紫'},{num:8,color:'#30c0c0',label:'シアン'},{num:9,color:'#ffffff',label:'白'}];
let importMappings=defaultMappings.map(m=>({...m}));
const BASE_PRESET_DATA=[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,1,0,0,1,0,1,0,0,1,1,0,1,0,0,0,1,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,1,0,0,1,0,0,1,1,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,1,0,0,1,0,1,0,0,0,0,1,0,1,0,0,1,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,0,0,0,1,0,1,0,1,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,0,0,0,1,0,1,0,1,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]];
const PRESETS_KEY='pixelforge_presets';
function loadPresets(){try{const r=localStorage.getItem(PRESETS_KEY);return r?JSON.parse(r):[];}catch{return[];}}
function savePresets(p){localStorage.setItem(PRESETS_KEY,JSON.stringify(p));}
function ensureDefaultPreset(){const p=loadPresets();if(!p.find(x=>x.name==='ベース')){p.unshift({name:'ベース',data:BASE_PRESET_DATA,mappings:importMappings.map(m=>({...m})),cols:32,rows:32,savedAt:Date.now()});savePresets(p);}}
function parseTableText(text){const lines=text.trim().split('\n').map(l=>l.trim()).filter(l=>l.length>0);const rows=lines.map(l=>l.split(/[\t ,]+/).map(v=>{const n=parseInt(v,10);return isNaN(n)?0:n;}));const cols=rows.reduce((m,r)=>Math.max(m,r.length),0);return{rows,cols};}
function renderMappingList(){const list=$('mapping-list');list.innerHTML='';importMappings.forEach((m,i)=>{const row=document.createElement('div');row.className='mapping-row';if(m.num===0){row.innerHTML=`<span class="mapping-num">0</span><span class="mapping-eq">=</span><span class="mapping-zero-note">透明（固定）</span>`;}else{row.innerHTML=`<span class="mapping-num">${m.num}</span><span class="mapping-eq">=</span><input type="color" class="mapping-color-input" value="${m.color||'#fff'}" data-idx="${i}"><input type="text" class="mapping-label-input" value="${m.label}" data-idx="${i}" maxlength="10"><button class="mapping-del-btn" data-idx="${i}">✕</button>`;}list.appendChild(row);});list.querySelectorAll('.mapping-color-input').forEach(el=>el.addEventListener('input',e=>{importMappings[+e.target.dataset.idx].color=e.target.value;}));list.querySelectorAll('.mapping-label-input').forEach(el=>el.addEventListener('input',e=>{importMappings[+e.target.dataset.idx].label=e.target.value;}));list.querySelectorAll('.mapping-del-btn').forEach(el=>el.addEventListener('click',e=>{const i=+e.target.dataset.idx;if(importMappings[i].num===0)return;importMappings.splice(i,1);renderMappingList();}));}
function addMapping(){const used=new Set(importMappings.map(m=>m.num));let n=1;while(used.has(n))n++;importMappings.push({num:n,color:'#ff8800',label:`色${n}`});importMappings.sort((a,b)=>a.num-b.num);renderMappingList();}
function renderPresetList(){const list=$('preset-list'),presets=loadPresets();list.innerHTML='';if(!presets.length){list.innerHTML='<div class="itab-note" style="padding:8px 0">なし</div>';return;}presets.forEach((preset,i)=>{const item=document.createElement('div');item.className='preset-item';const date=new Date(preset.savedAt).toLocaleDateString('ja-JP');item.innerHTML=`<div style="display:flex;flex-direction:column;flex:1;gap:2px"><span class="preset-name">${esc(preset.name)}</span><span class="preset-meta">${preset.cols}×${preset.rows} ／ ${date}</span></div><button class="preset-load-btn" data-idx="${i}">LOAD</button>`;item.querySelector('.preset-load-btn').addEventListener('click',e=>{e.stopPropagation();loadPreset(i);});item.addEventListener('contextmenu',e=>{e.preventDefault();if(confirm(`「${preset.name}」を削除?`)){presets.splice(i,1);savePresets(presets);renderPresetList();}});list.appendChild(item);});}
function loadPreset(idx){const presets=loadPresets(),p=presets[idx];if(!p)return;$('import-textarea').value=p.data.map(r=>r.join('\t')).join('\n');importMappings=p.mappings.map(m=>({...m}));renderMappingList();switchImportTab('paste');updateImportPreviewInfo();}
function savePreset(){const name=$('preset-name-input').value.trim();if(!name){alert('名前を入力');return;}const text=$('import-textarea').value;if(!text.trim()){alert('データを貼り付けて');return;}const{rows,cols}=parseTableText(text),presets=loadPresets(),ei=presets.findIndex(p=>p.name===name);if(ei>=0){if(!confirm(`「${name}」を上書き?`))return;presets.splice(ei,1);}presets.unshift({name,data:rows,mappings:importMappings.map(m=>({...m})),cols,rows:rows.length,savedAt:Date.now()});savePresets(presets);switchImportTab('preset');renderPresetList();}
let pendingJsonData=null;
function handleJsonFile(file){if(!file||!file.name.endsWith('.json')){alert('JSONファイルを選択');return;}const reader=new FileReader();reader.onload=e=>{try{const obj=JSON.parse(e.target.result);if(obj._type!=='pixelforge-project'){alert('PixelForge形式ではありません');return;}pendingJsonData=obj;const nf=obj.frames?obj.frames.length:(obj.layers?1:0);$('json-preview-info').textContent=`✅ ${obj.width}×${obj.height} px ／ ${nf}フレーム`;}catch{alert('JSON読込失敗');}};reader.readAsText(file);}
function executeJsonImport(){if(!pendingJsonData){alert('JSONを読み込んで');return;}const obj=pendingJsonData,mode=$('json-layer-mode').value,w=obj.width,h=obj.height;if(obj.palette)state.palette=obj.palette;if(obj.mappings)importMappings=obj.mappings.map(m=>({...m}));renderPalette();const framesData=obj.frames||[{name:'F1',layers:obj.layers||[]}];Promise.all(framesData.map(fd=>Promise.all((fd.layers||[]).map(ld=>new Promise(res=>{const img=new Image();img.onload=()=>{const{canvas,ctx}=createLayerCanvas(w,h);ctx.drawImage(img,0,0);res({name:ld.name,visible:ld.visible??true,opacity:ld.opacity??1,canvas,ctx});};img.onerror=()=>res(null);img.src=ld.dataURL;}))).then(layers=>({name:fd.name||'F1',layers:layers.filter(Boolean)})))).then(fds=>{if(mode==='all'){state.frames=[];layerIdCounter=0;frameIdCounter=0;state.canvasW=w;state.canvasH=h;checkerCanvas.width=w;checkerCanvas.height=h;checkerCtx=checkerCanvas.getContext('2d');drawChecker();previewCanvas.width=w;previewCanvas.height=h;preCtx=previewCanvas.getContext('2d');preCtx.imageSmoothingEnabled=false;gridCanvas.width=w;gridCanvas.height=h;gridCtx=gridCanvas.getContext('2d');symAxisCanvas.width=w;symAxisCanvas.height=h;symAxisCtx=symAxisCanvas.getContext('2d');selectCanvas.width=w;selectCanvas.height=h;selCtx=selectCanvas.getContext('2d');$('canvas-size-label').textContent=`${w} × ${h}`;$('input-w').value=w;$('input-h').value=h;}fds.forEach(fd=>{const layers=fd.layers.map(l=>({id:++layerIdCounter,name:l.name,canvas:l.canvas,ctx:l.ctx,visible:l.visible,opacity:l.opacity}));state.frames.push({id:++frameIdCounter,name:fd.name,layers});});if(state.frames.length===0)state.frames.push(makeFrame('F1',w,h));state.activeFrameIdx=0;state.activeLayerIdx=0;rebuildLayerDOM();fitZoom();applyZoom();drawGrid();drawSymAxis();clearHistory();saveHistory();renderFrameList();renderLayerList();closeImportModal();pendingJsonData=null;clearSelection();});}
function executePasteImport(){const text=$('import-textarea').value;if(!text.trim()){alert('データなし');return;}const{rows,cols}=parseTableText(text);if(!rows.length||!cols){alert('有効なデータなし');return;}const mode=$('paste-layer-mode').value;if(state.canvasW!==cols||state.canvasH!==rows.length)resizeCanvas(cols,rows.length);const map={};importMappings.forEach(m=>{map[m.num]=m.color;});const targetLayer=mode==='new'?(()=>{addLayer();return activeLayer();})():activeLayer();if(!targetLayer)return;targetLayer.ctx.clearRect(0,0,state.canvasW,state.canvasH);rows.forEach((row,y)=>{for(let x=0;x<cols&&x<state.canvasW;x++){const c=map[row[x]??0];if(c){targetLayer.ctx.fillStyle=c;targetLayer.ctx.fillRect(x,y,1,1);}}});rebuildLayerDOM();renderLayerList();saveHistory();closeImportModal();}
function switchImportTab(tab){document.querySelectorAll('.itab').forEach(t=>t.classList.toggle('active',t.dataset.tab===tab));document.querySelectorAll('.itab-content').forEach(c=>c.classList.toggle('active',c.id===`itab-${tab}`));if(tab==='preset')renderPresetList();}
function updateImportPreviewInfo(){const text=$('import-textarea').value,info=$('import-preview-info');if(!text.trim()){info.textContent='';return;}const{rows,cols}=parseTableText(text),vals=new Set(rows.flat());info.textContent=`${cols}×${rows.length} px ／ 値: ${[...vals].sort((a,b)=>a-b).join(', ')}`;}
function openImportModal(){pendingJsonData=null;$('json-preview-info').textContent='';$('import-overlay').classList.remove('hidden');switchImportTab('json');renderMappingList();updateImportPreviewInfo();}
function closeImportModal(){$('import-overlay').classList.add('hidden');}
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function bindImportUI(){$('btn-import').addEventListener('click',openImportModal);$('import-cancel').addEventListener('click',closeImportModal);$('import-ok').addEventListener('click',()=>{const tab=document.querySelector('.itab.active')?.dataset.tab;if(tab==='json')executeJsonImport();else executePasteImport();});$('btn-save-preset').addEventListener('click',savePreset);$('btn-add-mapping').addEventListener('click',addMapping);document.querySelectorAll('.itab').forEach(t=>t.addEventListener('click',()=>switchImportTab(t.dataset.tab)));$('import-textarea').addEventListener('input',updateImportPreviewInfo);$('import-overlay').addEventListener('click',e=>{if(e.target===$('import-overlay'))closeImportModal();});$('json-file-input').addEventListener('change',e=>{if(e.target.files[0])handleJsonFile(e.target.files[0]);});const dz=$('json-drop-zone');dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('drag-over');});dz.addEventListener('dragleave',()=>dz.classList.remove('drag-over'));dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('drag-over');const f=e.dataTransfer.files[0];if(f)handleJsonFile(f);});}
function initMobileTabs(){const TAB_KEY_L='pf_left_tab',TAB_KEY_R='pf_right_tab';function switchTab(panel,tabId){const bar=$(panel==='left'?'left-tab-bar':'right-tab-bar');if(!bar)return;bar.querySelectorAll('.mob-tab').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tabId);});const aside=panel==='left'?$('left-panel'):$('right-panel');aside.querySelectorAll(':scope > .mob-tab-content').forEach(c=>{c.classList.toggle('active',c.id===tabId);});localStorage.setItem(panel==='left'?TAB_KEY_L:TAB_KEY_R,tabId);}document.querySelectorAll('.mob-tab').forEach(btn=>{btn.addEventListener('click',()=>{switchTab(btn.dataset.panel,btn.dataset.tab);});});const savedL=localStorage.getItem(TAB_KEY_L),savedR=localStorage.getItem(TAB_KEY_R);if(savedL)switchTab('left',savedL);if(savedR)switchTab('right',savedR);}
const COLLAPSE_KEY='pixelforge_collapsed';
function loadCollapsedState(){try{return new Set(JSON.parse(localStorage.getItem(COLLAPSE_KEY)||'[]'));}catch{return new Set();}}
function saveCollapsedState(set){localStorage.setItem(COLLAPSE_KEY,JSON.stringify([...set]));}
function initCollapsible(){const collapsed=loadCollapsedState();document.querySelectorAll('.section-label.collapsible').forEach(label=>{const targetId=label.dataset.target,body=document.getElementById(targetId);if(!body)return;if(collapsed.has(targetId)){body.classList.add('collapsed');label.classList.add('is-collapsed');}label.addEventListener('click',()=>{const isNowCollapsed=body.classList.toggle('collapsed');label.classList.toggle('is-collapsed',isNowCollapsed);const set=loadCollapsedState();if(isNowCollapsed)set.add(targetId);else set.delete(targetId);saveCollapsedState(set);});});}
const panState={isPanning:false,panX:0,panY:0,startPanX:0,startPanY:0,startTouchX:0,startTouchY:0,isPinching:false,pinchStartDist:0,pinchStartZoom:1,pinchMidX:0,pinchMidY:0};
function applyCanvasTransform(){container.style.transform=`translate(${panState.panX}px, ${panState.panY}px)`;}
function resetCanvasTransform(){panState.panX=0;panState.panY=0;applyCanvasTransform();}
function getTouchDist(t1,t2){return Math.hypot(t2.clientX-t1.clientX,t2.clientY-t1.clientY);}
function getTouchMid(t1,t2){return{x:(t1.clientX+t2.clientX)/2,y:(t1.clientY+t2.clientY)/2};}
function initCanvasPanPinch(){canvasArea.addEventListener('touchstart',e=>{if(e.touches.length===2){e.preventDefault();if(state.isDrawing){state.isDrawing=false;preCtx.clearRect(0,0,state.canvasW,state.canvasH);}panState.isPinching=true;panState.pinchStartDist=getTouchDist(e.touches[0],e.touches[1]);panState.pinchStartZoom=state.zoom;panState.isPanning=true;const mid=getTouchMid(e.touches[0],e.touches[1]);panState.startTouchX=mid.x;panState.startTouchY=mid.y;panState.startPanX=panState.panX;panState.startPanY=panState.panY;}},{passive:false});canvasArea.addEventListener('touchmove',e=>{if(e.touches.length===2){e.preventDefault();if(panState.isPinching){const newDist=getTouchDist(e.touches[0],e.touches[1]),ratio=newDist/panState.pinchStartDist;let newZoom=Math.round(panState.pinchStartZoom*ratio);newZoom=Math.max(1,Math.min(32,newZoom));if(newZoom!==state.zoom){state.zoom=newZoom;applyZoom();}}if(panState.isPanning){const mid=getTouchMid(e.touches[0],e.touches[1]);panState.panX=panState.startPanX+(mid.x-panState.startTouchX);panState.panY=panState.startPanY+(mid.y-panState.startTouchY);applyCanvasTransform();}}},{passive:false});canvasArea.addEventListener('touchend',e=>{if(e.touches.length<2){panState.isPinching=false;panState.isPanning=false;}},{passive:true});$('btn-zoom-fit').addEventListener('click',resetCanvasTransform,true);}
(function boot(){ensureDefaultPreset();initCanvas(32,32);setFgColor('#2d2d2d');$('color-bg-box').style.background=state.bgColor;renderPalette();drawSymPreview();drawSymAxis();updateHistoryBtns();updateToolOptionPanel('pen');bindUI();bindImportUI();initMobileTabs();initCollapsible();initCanvasPanPinch();})();
