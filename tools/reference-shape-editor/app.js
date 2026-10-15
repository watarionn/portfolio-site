(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const SVGNS = 'http://www.w3.org/2000/svg';
  const APP_VERSION = '1.1.0';
  const MAX_PICTURE_BYTES = 24 * 1024 * 1024;
  const PALETTE_LIMIT = 12;
  const INITIAL_WIDTH = 960, INITIAL_HEIGHT = 640;
  const toolTips = {
    draw: 'クリックして頂点を追加 · 近くの既存頂点を再利用',
    select: 'クリックして図形を選択 · 右のパネルで編集',
    vertex: '白/青の頂点をドラッグ · 辺のダブルクリックで追加',
    move: '選んだ図形をドラッグ · 共有頂点も連動',
    pan: 'ドラッグで画面を移動 · ホイールで上下移動',
    eyedropper: '画像をクリックしてその画素の色を選択'
  };
  const state = {
    project: newProject(), mode: 'draw', draft: [], selected: null,
    selectedVertex: null, hoverVertex: null, cursor: null,
    snapEnabled: true, snapRadius: 12, underlayOpacity: .35,
    showUnderlay: true, showGrid: false,
    view: {x:0,y:0,w:INITIAL_WIDTH,h:INITIAL_HEIGHT},
    history: [], future: [], interaction: null, spaceDown: false,
    color: '#d47c5c', colorSource:'manual', lastName: '無題の手本',
  };
  let cachedBitmap = null; // browser Image object, only for source-bound color sampling
  let toastTimer = null;

  function newProject(w=INITIAL_WIDTH,h=INITIAL_HEIGHT) {
    return {
      version: APP_VERSION,
      width:w, height:h, imageName:null, imageData:null,
      vertices:{}, shapes:[], counter:0,
      palette:{characteristic:[],featured:[],representative:[],imported:false}
    };
  }
  const round = (n) => Math.round(n * 100) / 100;
  const clamp = (x,a,b) => Math.min(b,Math.max(a,x));
  const finite = (x) => Number.isFinite(x);
  const cleanColor = (s) => /^#[\da-fA-F]{6}$/.test(s||'') ? s.toLowerCase() : null;
  const hex = (r,g,b) => '#' + [r,g,b].map(c => clamp(Math.round(c),0,255).toString(16).padStart(2,'0')).join('');
  const rgbFromColor = (value) => {
    if (Array.isArray(value) && value.length>=3 && value.slice(0,3).every(finite)) return hex(...value.slice(0,3));
    if (typeof value === 'string') return cleanColor(value);
    if (value && typeof value === 'object') return rgbFromColor(value.rgb || value.hex || value.color);
    return null;
  };
  function toast(message,seconds=3) {const el=$('toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),seconds*1000)}
  function status(s) {$('statusText').textContent=s}
  function escapeXml(s){return String(s).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));}
  function svgNode(tag,attrs={}) {const e=document.createElementNS(SVGNS,tag);for(const [key,val] of Object.entries(attrs))e.setAttribute(key,String(val));return e;}
  function download(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);}
  function exportBase(){return (state.project.imageName||'reference').replace(/\.[^.]+$/,'').replace(/[^\w\u3000-\u9fff\u3040-\u30ff-]+/g,'_').slice(0,60)+'_trace'}
  function snapshot(){return JSON.stringify({vertices:state.project.vertices, shapes:state.project.shapes,counter:state.project.counter});}
  function saveHistory(){state.history.push(snapshot());if(state.history.length>100)state.history.shift();state.future=[];refreshUndo();}
  function applySnapshot(text){const obj=JSON.parse(text);state.project.vertices=obj.vertices;state.project.shapes=obj.shapes;state.project.counter=obj.counter;state.draft=[];state.selected=null;state.selectedVertex=null;render();}
  function undo(){if(!state.history.length)return;state.future.push(snapshot());applySnapshot(state.history.pop());refreshUndo();toast('元に戻しました')}
  function redo(){if(!state.future.length)return;state.history.push(snapshot());applySnapshot(state.future.pop());refreshUndo();toast('やり直しました')}
  function refreshUndo(){$('undo').disabled=!state.history.length;$('redo').disabled=!state.future.length}
  function nextId(prefix){state.project.counter++;return prefix+state.project.counter.toString(36)}
  function vertex(id){return state.project.vertices[id]}
  function usedIds(){return new Set(state.project.shapes.flatMap(s=>s.vertexIds).concat(state.draft.filter(v=>v.ref).map(v=>v.ref)))}
  function cleanupVertices(){const ids=usedIds();for(const id of Object.keys(state.project.vertices))if(!ids.has(id))delete state.project.vertices[id]}
  function shapePoints(shape){return shape.vertexIds.map(id=>vertex(id)).filter(Boolean)}
  function shapeValid(ids){
    if(ids.length<3 || new Set(ids).size<3)return false;
    const points=ids.map(vertex);if(points.some(v=>!v))return false;
    let area=0;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];area+=a.x*b.y-b.x*a.y;}return Math.abs(area)>=.25;
  }
  function shapeCoords(shape){return shape.vertexIds.map(id=>{const p=vertex(id);return `${round(p.x)},${round(p.y)}`}).join(' ')}
  function getScale(){const m=$('stage').getScreenCTM();return m?Math.hypot(m.a,m.b):1}
  function screenToSource(e){const m=$('stage').getScreenCTM();if(!m)return {x:0,y:0};const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse());return {x:p.x,y:p.y}}
  function snapNearest(p,except=null){if(!state.snapEnabled)return null;const max=state.snapRadius/Math.max(getScale(),.0001);let target=null,d=max;for(const [id,v] of Object.entries(state.project.vertices)){if(id===except)continue;const dd=Math.hypot(p.x-v.x,p.y-v.y);if(dd<=d){target=id;d=dd}}return target}
  function pointsDeduplicated(p){const ids=state.draft.filter(d=>d.ref).map(d=>d.ref);return !!ids.length && ids.at(-1)===p;}
  function limitPoint(p){return {x:round(clamp(p.x,0,state.project.width)),y:round(clamp(p.y,0,state.project.height))};}
  function changeTool(name){if(!toolTips[name])return;state.mode=name;$('viewport').dataset.tool=name;document.querySelectorAll('.tool[data-tool]').forEach(el=>el.classList.toggle('active',el.dataset.tool===name));$('toolHint').textContent=toolTips[name];render();}
  function addDraftPoint(p){
    if(state.mode!=='draw')return;
    const nearest=snapNearest(p);
    if(nearest && pointsDeduplicated(nearest))return;
    if(nearest){state.draft.push({ref:nearest})}else{const pt=limitPoint(p);state.draft.push({x:pt.x,y:pt.y})}
    render();
  }
  function draftPolygonPoints(){return state.draft.map(d=>d.ref?vertex(d.ref):d)}
  function finishPolygon(){
    if(state.draft.length<3){toast('3点以上の頂点を置いてください');return;}
    const pts=draftPolygonPoints(); if(pts.some(x=>!x))return;
    const distinct=new Set(pts.map(p=>`${round(p.x)}:${round(p.y)}`));if(distinct.size<3){toast('異なる位置の3点が必要です');return;}if(distinct.size!==pts.length){toast('同じ頂点は1つの図形内では再利用できません');return;}
    let area=0;pts.forEach((p,i)=>{const q=pts[(i+1)%pts.length];area+=p.x*q.y-p.y*q.x;});
    if(Math.abs(area)<.5){toast('面積のない図形は作れません');return;}
    if(polygonSelfIntersects(pts)){toast('辺が交差しています。頂点の順番を見直してください');return;}
    saveHistory();const vertexIds=[];for(const d of state.draft){if(d.ref){vertexIds.push(d.ref)}else{const id=nextId('v');state.project.vertices[id]={x:d.x,y:d.y};vertexIds.push(id)}}
    const s={id:nextId('s'),name:`図形 ${state.project.shapes.length+1}`,vertexIds,fill:state.color,visible:true};
    state.project.shapes.push(s);state.draft=[];state.selected=s.id;changeTool('select');render();toast(`「${s.name}」を作成しました`);
  }
  function orient(a,b,c){return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)}
  function segmentsCross(a,b,c,d){const eps=1e-8;const o1=orient(a,b,c),o2=orient(a,b,d),o3=orient(c,d,a),o4=orient(c,d,b);return ((o1>eps&&o2< -eps)||(o1< -eps&&o2>eps))&&((o3>eps&&o4< -eps)||(o3< -eps&&o4>eps));}
  function polygonSelfIntersects(points){for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){if(j===i+1 || i===0&&j===points.length-1)continue;if(segmentsCross(points[i],points[(i+1)%points.length],points[j],points[(j+1)%points.length]))return true;}return false;}
  function selectedShape(){return state.project.shapes.find(s=>s.id===state.selected)||null}
  function countUsage(id){return state.project.shapes.filter(s=>s.vertexIds.includes(id)).length}
  function mergeVertices(from,to){if(from===to)return true;for(const s of state.project.shapes){if(s.vertexIds.includes(from)&&s.vertexIds.includes(to)){toast('同じ図形に同じ頂点が重複するため統合できません');return false}}for(const s of state.project.shapes)s.vertexIds=s.vertexIds.map(id=>id===from?to:id);delete state.project.vertices[from];state.selectedVertex=to;return true;}
  function shiftPolygon(shape,dx,dy){const ids=new Set(shape.vertexIds);for(const id of ids){const p=vertex(id);p.x=round(clamp(p.x+dx,0,state.project.width));p.y=round(clamp(p.y+dy,0,state.project.height))}}
  function removeSelected(){if(state.mode==='vertex'&&state.selectedVertex){const s=selectedShape();if(!s || !s.vertexIds.includes(state.selectedVertex))return;if(s.vertexIds.length<=3){toast('3頂点以下にはできません');return}saveHistory();s.vertexIds=s.vertexIds.filter(id=>id!==state.selectedVertex);state.selectedVertex=null;cleanupVertices();render();return}if(!state.selected)return;saveHistory();state.project.shapes=state.project.shapes.filter(s=>s.id!==state.selected);state.selected=null;cleanupVertices();render();toast('図形を削除しました');}
  function updateShape(patch){const s=selectedShape();if(!s)return;saveHistory();Object.assign(s,patch);render();}
  function changeColor(color,source='manual'){color=cleanColor(color);if(!color)return;state.color=color;state.colorSource=source;const s=selectedShape();if(s){if(s.fill!==color){saveHistory();s.fill=color}}render();}
  function raiseShape(direction){const idx=state.project.shapes.findIndex(s=>s.id===state.selected);const next=idx+direction;if(idx<0||next<0||next>=state.project.shapes.length)return;saveHistory();const arr=state.project.shapes;[arr[idx],arr[next]]=[arr[next],arr[idx]];render();}

  function render(){
    const p=state.project, st=$('stage');
    // Camera units track the *viewport* ratio, not the source-image ratio.
    // The SVG remains full-size even when a 453x1400 image is loaded.
    const ratio=viewportRatio();state.view.h=state.view.w/ratio;
    st.setAttribute('viewBox',[state.view.x,state.view.y,state.view.w,state.view.h].join(' '));
    for(const id of ['canvasBase','canvasGrid','underlay']){$(id).setAttribute('width',p.width);$(id).setAttribute('height',p.height)}
    $('canvasGrid').setAttribute('opacity',state.showGrid?1:0);
    if(p.imageData){$('underlay').setAttribute('href',p.imageData)}else{$('underlay').removeAttribute('href')}
    $('underlay').setAttribute('opacity',state.showUnderlay?state.underlayOpacity:0);
    $('emptyState').classList.toggle('hidden',!!p.imageData||p.shapes.length>0);
    const pol=$('polygonLayer');pol.replaceChildren();
    for(const s of p.shapes){if(!s.visible)continue;const node=svgNode('polygon',{points:shapeCoords(s),fill:s.fill,'data-shape':s.id,'class':state.selected===s.id?'selected-shape':''});pol.append(node)}
    const draft=$('draftLayer');draft.replaceChildren();const pts=draftPolygonPoints();const sc=1/Math.max(getScale(),.001);
    if(pts.length){let d=pts.map(t=>`${round(t.x)},${round(t.y)}`).join(' ');
      if(state.cursor){const near=snapNearest(state.cursor),q=near?vertex(near):limitPoint(state.cursor);d+=` ${round(q.x)},${round(q.y)}`}
      draft.append(svgNode('polyline',{points:d,'class':'draft-line',fill:'none'}));pts.forEach(t=>draft.append(svgNode('circle',{cx:t.x,cy:t.y,r:4.3*sc,'class':'draft-point'})));
    }
    const layer=$('handleLayer');layer.replaceChildren();const selected=selectedShape();
    const toShow=new Set((selected&&['vertex','select','move'].includes(state.mode)?selected.vertexIds:[]));
    if(state.hoverVertex)toShow.add(state.hoverVertex);
    for(const id of toShow){const v=vertex(id);if(!v)continue;layer.append(svgNode('circle',{'data-vertex':id,cx:v.x,cy:v.y,r:(id===state.hoverVertex?7:5.5)*sc,'class':'handle'+(countUsage(id)>1?' shared':'')+(id===state.hoverVertex||id===state.selectedVertex?' hover':'')}));}
    $('draftCount').textContent=state.draft.length+' 点';$('finishPolygon').disabled=state.draft.length<3;
    $('canvasStats').textContent=`${p.shapes.length} 図形 · ${Object.keys(p.vertices).length} 頂点`;
    $('imageInfo').textContent=p.imageName?`${p.imageName} / ${p.width} × ${p.height}`:'画像を読み込んでください';
    $('projectTitle').textContent=state.lastName;
    $('zoomValue').textContent=Math.round(getScale()*100)+'%';
    const travel=Math.max(0,p.height-state.view.h), nav=$('canvasProgress');
    nav.hidden=travel<1; $('verticalNav').value=travel?Math.round(clamp(state.view.y/travel*100,0,100)):0;
    $('verticalNavValue').textContent=$('verticalNav').value+'%';
    $('opacityValue').textContent=Math.round(state.underlayOpacity*100)+'%';$('snapValue').textContent=state.snapRadius+' px';
    renderInspector();renderPalette();refreshUndo();
  }
  function renderInspector(){
    const s=selectedShape(),el=$('shapeInspector');el.replaceChildren();
    if(!s){el.className='no-selection';el.textContent='図形を選ぶと、名称・色・レイヤーを編集できます。';}
    else{
      el.className='';
      const field=document.createElement('input');field.className='shape-input';field.value=s.name;field.maxLength=80;field.ariaLabel='図形の名前';field.addEventListener('change',()=>{if(field.value.trim()!==s.name)updateShape({name:field.value.trim()||s.name})});
      const meta=document.createElement('p');meta.className='shape-meta';meta.textContent=`${s.vertexIds.length} 頂点 · 色 ${s.fill.toUpperCase()} · 共有 ${s.vertexIds.filter(id=>countUsage(id)>1).length} 点`;
      const row=document.createElement('div');row.className='shape-controls';
      [['▲ 手前へ',()=>raiseShape(1)],['▼ 奥へ',()=>raiseShape(-1)],['削除',()=>removeSelected()]].forEach(([label,fn])=>{const b=document.createElement('button');b.textContent=label;b.addEventListener('click',fn);row.append(b)});
      el.append(field,meta,row);
    }
    const layer=$('layers');layer.replaceChildren();$('layerCount').textContent=state.project.shapes.length+'件';
    if(!state.project.shapes.length){const p=document.createElement('p');p.className='muted';p.textContent='図形はまだありません。';layer.append(p)}
    [...state.project.shapes].reverse().forEach((s,index)=>{
      const row=document.createElement('div');row.className='layer'+(s.id===state.selected?' active':'');row.dataset.id=s.id;
      const sw=document.createElement('span');sw.className='layer-swatch';sw.style.setProperty('--swatch',s.fill);
      const label=document.createElement('div');label.className='layer-label';label.textContent=s.name;
      const sub=document.createElement('small');sub.className='layer-number';sub.textContent=`${state.project.shapes.length-index} · ${s.vertexIds.length} VERTICES`;
      label.append(sub);
      const controls=document.createElement('div');controls.className='layer-controls';const eye=document.createElement('button');eye.textContent=s.visible?'◉':'○';eye.title='表示を切り替え';eye.addEventListener('click',(e)=>{e.stopPropagation();updateVisibility(s.id)});controls.append(eye);
      row.addEventListener('click',()=>{state.selected=s.id;state.selectedVertex=null;changeTool('select');render()});row.append(sw,label,controls);layer.append(row);
    });
  }
  function updateVisibility(id){const s=state.project.shapes.find(x=>x.id===id);if(!s)return;saveHistory();s.visible=!s.visible;render()}
  function paletteColors(arr){return (arr||[]).map(rgbFromColor).filter(Boolean).filter((c,i,a)=>a.indexOf(c)===i).slice(0,PALETTE_LIMIT)}
  function renderPalette(){
    for(const [key,elem] of [['characteristic','characteristicColors'],['featured','featuredColors'],['representative','representativeColors']]){
      const box=$(elem);box.replaceChildren();for(const c of state.project.palette[key]){const b=document.createElement('button');b.className='swatch'+(state.color===c?' active':'');b.style.setProperty('--swatch',c);b.title=c+' を選ぶ';b.ariaLabel=c+' 塗り色';b.addEventListener('click',()=>changeColor(c,key));box.append(b)}
    }
    $('colorName').textContent=state.color.toUpperCase();$('colorPicker').value=state.color;
    $('charLabel').textContent=state.project.palette.imported?'読み込み済み':state.project.imageData?'ブラウザ推定':'画像待ち';
  }
  function updateCursor(e){const p=screenToSource(e);state.cursor=p;$('cursorInfo').textContent=`x: ${round(p.x)}　y: ${round(p.y)}`;state.hoverVertex=snapNearest(p);}
  function onPointerDown(e){if(e.button!==0 && e.button!==1)return;if(!state.project.imageData&&state.project.shapes.length===0)return;
    $('viewport').focus({preventScroll:true});const pt=screenToSource(e);const target=e.target;const handle=target.closest('[data-vertex]');const shapeNode=target.closest('[data-shape]');
    if(state.spaceDown||state.mode==='pan'||e.button===1){state.interaction={kind:'pan',view:{...state.view},origin:{x:e.clientX,y:e.clientY},scale:getScale()};$('viewport').dataset.panning='yes';}
    else if(state.mode==='draw'){if(pt.x<0||pt.y<0||pt.x>state.project.width||pt.y>state.project.height)return;addDraftPoint(pt);return;}
    else if(state.mode==='eyedropper'){if(pt.x<0||pt.y<0||pt.x>=state.project.width||pt.y>=state.project.height)return;pickImageColor(pt);return;}
    else if(state.mode==='vertex' && handle){const id=handle.getAttribute('data-vertex');if(id){state.selectedVertex=id;saveHistory();state.interaction={kind:'vertex',id,original:{...vertex(id)},changed:false};}}
    else if(shapeNode){const id=shapeNode.getAttribute('data-shape');state.selected=id;state.selectedVertex=null;if(state.mode==='move'){
      saveHistory();const s=selectedShape();state.interaction={kind:'move',origin:{...pt},start:Object.fromEntries(new Set(s.vertexIds).values().map(v=>[v,{...vertex(v)}])),changed:false};
    }render();}
    else{state.selected=null;state.selectedVertex=null;render();}
    if(state.interaction){try{$('stage').setPointerCapture(e.pointerId)}catch{}}
  }
  function onPointerMove(e){updateCursor(e);const a=state.interaction;
    if(a?.kind==='pan'){const scale=Math.max(a.scale,.0001);state.view.x=a.view.x-(e.clientX-a.origin.x)/scale;state.view.y=a.view.y-(e.clientY-a.origin.y)/scale;render();return}
    if(a?.kind==='vertex'){
      const pt=limitPoint(screenToSource(e));let proposed=pt;const other=snapNearest(pt,a.id);if(other)proposed={...vertex(other)};
      const v=vertex(a.id);if(!v)return;v.x=proposed.x;v.y=proposed.y;a.changed=true;render();return;
    }
    if(a?.kind==='move'){const now=screenToSource(e),dx=now.x-a.origin.x,dy=now.y-a.origin.y;
      for(const [id,p] of Object.entries(a.start)){const v=vertex(id);if(v){v.x=round(clamp(p.x+dx,0,state.project.width));v.y=round(clamp(p.y+dy,0,state.project.height))}}a.changed=true;render();return;
    }
    if(state.mode==='draw')render();else renderHandles();
  }
  function renderHandles(){ // draw handles only on hover without rebuilding color/layers inspector
    const layer=$('handleLayer'),selected=selectedShape();layer.replaceChildren();const sc=1/Math.max(getScale(),.001);
    const ids=new Set((selected&&['vertex','select','move'].includes(state.mode)?selected.vertexIds:[]));if(state.hoverVertex)ids.add(state.hoverVertex);
    for(const id of ids){const v=vertex(id);if(!v)continue;layer.append(svgNode('circle',{'data-vertex':id,cx:v.x,cy:v.y,r:(id===state.hoverVertex?7:5.5)*sc,'class':'handle'+(countUsage(id)>1?' shared':'')+(id===state.hoverVertex||id===state.selectedVertex?' hover':'')}))}
  }
  function onPointerUp(e){const a=state.interaction;state.interaction=null;delete $('viewport').dataset.panning;if(!a)return;
    if(a.kind==='vertex'&&a.changed){const pt=vertex(a.id);const near=snapNearest(pt,a.id);if(near&&Math.hypot(pt.x-vertex(near).x,pt.y-vertex(near).y)<.001){mergeVertices(a.id,near)}state.selectedVertex=near||a.id;}
    if((a.kind==='vertex'||a.kind==='move')&&!a.changed){state.history.pop();refreshUndo()}
    render();try{$('stage').releasePointerCapture(e.pointerId)}catch{}
  }
  function insertEdgeVertex(e){if(state.mode!=='vertex')return;const s=selectedShape();if(!s || !s.visible)return;const p=screenToSource(e),pts=shapePoints(s),ids=s.vertexIds;const max=14/Math.max(getScale(),.001);let best={index:-1,dist:max,projection:null};
    for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length],dx=b.x-a.x,dy=b.y-a.y;const len=dx*dx+dy*dy;if(len===0)continue;const t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/len,0,1);const q={x:a.x+t*dx,y:a.y+t*dy},d=Math.hypot(p.x-q.x,p.y-q.y);if(d<best.dist&&t>.05&&t<.95)best={index:i,dist:d,projection:q};}
    if(best.index<0)return;saveHistory();const id=nextId('v');state.project.vertices[id]=limitPoint(best.projection);ids.splice(best.index+1,0,id);state.selectedVertex=id;render();toast('辺に頂点を追加しました');
  }
  function viewportRatio(){
    const bounds=$('viewport').getBoundingClientRect();
    return Math.max(1,bounds.width)/Math.max(1,bounds.height);
  }
  function showSourceRect(width,centerX,centerY){
    const w=Math.max(.1,width),h=w/viewportRatio();
    state.view={x:centerX-w/2,y:centerY-h/2,w,h};render();
  }
  function fit(){
    const p=state.project, ratio=viewportRatio();
    const w=Math.max(p.width,p.height*ratio)*1.06;
    showSourceRect(w,p.width/2,p.height/2);
  }
  function fitWidth(){
    const p=state.project,w=p.width*1.06,h=w/viewportRatio();
    showSourceRect(w,p.width/2,h*.485); // show from the top with a little breathing room
  }
  function autoFit(){
    const p=state.project;
    if(p.height/p.width>1.25/viewportRatio())fitWidth();else fit();
  }
  function zoomAt(amount,cx,cy){
    const rect=$('stage').getBoundingClientRect();
    const fx=clamp((cx-rect.left)/Math.max(1,rect.width),0,1),fy=clamp((cy-rect.top)/Math.max(1,rect.height),0,1);
    const original={...state.view};
    const w=clamp(original.w/amount,state.project.width/30,Math.max(state.project.width,state.project.height*viewportRatio())*6);
    const h=w/viewportRatio();
    state.view={x:original.x+original.w*fx-w*fx,y:original.y+original.h*fy-h*fy,w,h};render();
  }
  function onWheel(e){
    e.preventDefault();
    const factor=e.deltaMode===1?16:e.deltaMode===2?$('viewport').clientHeight:1;
    if(e.ctrlKey||e.metaKey||e.altKey){zoomAt(Math.exp(-e.deltaY*factor*.003),e.clientX,e.clientY);return;}
    const scale=Math.max(getScale(),.001);
    const dx=(e.shiftKey?e.deltaY:e.deltaX)*factor/scale;
    const dy=(e.shiftKey?e.deltaX:e.deltaY)*factor/scale;
    state.view.x+=dx;state.view.y+=dy;render();
  }
  function pickImageColor(pt){if(!cachedBitmap){toast('先に下敷き画像を読み込んでください');return}const c=document.createElement('canvas');c.width=1;c.height=1;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(cachedBitmap,Math.floor(pt.x),Math.floor(pt.y),1,1,0,0,1,1);const rgb=ctx.getImageData(0,0,1,1).data;if(rgb[3]===0){toast('透明な画素です');return}changeColor(hex(...rgb),'sampled');toast('元画像から色を採りました')}

  function rgbLab(rgb){const linear=rgb.map(v=>{const t=v/255;return t<=.04045?t/12.92:Math.pow((t+.055)/1.055,2.4)});let x=(linear[0]*.4124564+linear[1]*.3575761+linear[2]*.1804375)/.95047,y=linear[0]*.2126729+linear[1]*.7151522+linear[2]*.072175,z=(linear[0]*.0193339+linear[1]*.119192+linear[2]*.9503041)/1.08883;const d=6/29,f=t=>t>d*d*d?Math.cbrt(t):t/(3*d*d)+4/29;return [116*f(y)-16,500*(f(x)-f(y)),200*(f(y)-f(z))]}
  const labDist=(a,b)=>Math.hypot(...a.map((n,i)=>n-b[i]));
  function extractPalette(img){
    const canvas=document.createElement('canvas');const m=Math.min(1,256/Math.max(img.width,img.height));canvas.width=Math.max(1,Math.round(img.width*m));canvas.height=Math.max(1,Math.round(img.height*m));const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,canvas.width,canvas.height);const w=canvas.width,h=canvas.height,px=ctx.getImageData(0,0,w,h).data;
    const bins=new Map(),border=new Map();let total=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const k=(y*w+x)*4;if(px[k+3]<=20)continue;total++;const r=px[k],g=px[k+1],b=px[k+2],key=((r>>3)<<10)|((g>>3)<<5)|(b>>3);let p=bins.get(key);if(!p){p={n:0,r:0,g:0,b:0,x:0,y:0,x2:0,y2:0};bins.set(key,p)}p.n++;p.r+=r;p.g+=g;p.b+=b;p.x+=x;p.y+=y;p.x2+=x*x;p.y2+=y*y;
      if(x<w*.04||x>w*.96||y<h*.04||y>h*.96){const kk=((r>>4)<<8)|((g>>4)<<4)|(b>>4);let q=border.get(kk);if(!q){q={n:0,r:0,g:0,b:0};border.set(kk,q)}q.n++;q.r+=r;q.g+=g;q.b+=b}
    }
    let entries=[...bins.values()].map(a=>{const rgb=[a.r/a.n,a.g/a.n,a.b/a.n],mx=a.x/a.n,my=a.y/a.n,spread=(Math.min(1,Math.sqrt(Math.max(0,a.x2/a.n-mx*mx))/(w*.22))+Math.min(1,Math.sqrt(Math.max(0,a.y2/a.n-my*my))/(h*.22)))/2;return {...a,rgb,lab:rgbLab(rgb),spread,area:a.n/Math.max(total,1)}}).sort((a,b)=>b.n-a.n);
    const clustered=[];for(const e of entries.slice(0,512)){const c=clustered.find(c=>labDist(c.lab,e.lab)<17);if(c){const n=c.n+e.n;c.rgb=c.rgb.map((v,i)=>(v*c.n+e.rgb[i]*e.n)/n);c.n=n;c.lab=rgbLab(c.rgb);c.area=c.n/Math.max(total,1)}else clustered.push({...e})}
    clustered.sort((a,b)=>b.n-a.n);const rep=clustered.slice(0,8).map(x=>hex(...x.rgb));
    const featured=clustered.slice(0,7);for(const e of clustered.slice(7)){const d=Math.min(...featured.map(c=>labDist(c.lab,e.lab)));const chroma=Math.hypot(e.lab[1],e.lab[2]);if(d>25&&chroma>24&&e.area>.002){featured.push(e);break}};
    const backgrounds=[...border.values()].sort((a,b)=>b.n-a.n).slice(0,3).map(a=>rgbLab([a.r/a.n,a.g/a.n,a.b/a.n]));
    let candidates=entries.slice(0,96).filter(a=>!backgrounds.length||Math.min(...backgrounds.map(b=>labDist(a.lab,b)))>=17||a.spread<.22);
    if(candidates.length<5)candidates=entries.slice(0,96);
    candidates=candidates.map(a=>{const chroma=Math.hypot(a.lab[1],a.lab[2]),neutral=chroma<15,l=a.lab[0];return {...a,score:Math.pow(Math.max(a.area,.000001),.56)*(neutral?.78: .70+.55*Math.min(1,chroma/52))*(neutral?(l>76?1.1:.85):.9)*( .9+.22*a.spread)}}).sort((a,b)=>b.score-a.score);
    const char=[];for(let ix=0;char.length<8&&ix<Math.min(96,candidates.length);ix++){let winner=null,win=-1;for(const e of candidates){if(char.includes(e)||char.some(a=>labDist(a.lab,e.lab)<13))continue;const distance=char.length?Math.min(...char.map(a=>labDist(a.lab,e.lab))):50;const diversity=.12+.88*Math.min(1,Math.max(0,(distance-9)/32));const chroma=Math.hypot(e.lab[1],e.lab[2]);const score=e.score*diversity*(char.length===0?1:.45+1.45*Math.min(1,chroma/60));if(score>win){win=score;winner=e}}if(!winner)break;char.push(winner)}
    return {characteristic:paletteColors(char.map(x=>hex(...x.rgb))),featured:paletteColors(featured.map(x=>hex(...x.rgb))),representative:paletteColors(rep),imported:false};
  }
  async function loadImage(file){
    if(!file||!/^image\/(png|jpeg|webp|gif)$/.test(file.type)){toast('PNG / JPEG / WebP / GIF の画像を選んでください');return;}
    if(file.size>MAX_PICTURE_BYTES){toast('画像は24MB以下にしてください');return;}
    try{
      const data=await readFileAsDataUrl(file),image=await decodeImage(data);if(image.naturalWidth>12000||image.naturalHeight>12000)throw Error('画像が大きすぎます (上限12000px)');
      cachedBitmap=image;state.project=newProject(image.naturalWidth,image.naturalHeight);state.project.imageName=file.name;state.project.imageData=data;
      state.lastName=file.name.replace(/\.[^.]+$/,'');state.project.palette=extractPalette(image);state.draft=[];state.history=[];state.future=[];state.selected=null;state.selectedVertex=null;state.cursor=null;autoFit();status('画像を読み込みました · 色パレットを抽出しました');toast('画像を読み込みました。クリックして頂点を置けます');
    }catch(e){toast(`読み込みに失敗: ${e.message}`,5)}
  }
  function readFileAsDataUrl(f){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('ファイルを読み込めません'));r.readAsDataURL(f)})}
  function decodeImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('画像をデコードできません'));img.src=src})}
  function importPalette(json){
    const src=json.metadata?.colors||json.colors||json.palette||json;
    let data={};if(Array.isArray(src))data={characteristic:src,featured:src,representative:src};
    else data={characteristic:src.characteristic||src.characteristicColors||src.featured||src.colors||[],featured:src.featured||src.featuredColors||[],representative:src.representative||src.dominant||src.representativeColors||src.colors||[]};
    let n=0;for(const key of ['characteristic','featured','representative']){const colors=paletteColors(data[key]);if(colors.length){state.project.palette[key]=colors;n+=colors.length}}if(!n)throw Error('対応する色配列がありません（RGB配列、hex、colors、metadata.colors）');state.project.palette.imported=true;render();toast(`${n}色の外部パレット候補を読み込みました`);
  }
  async function loadPaletteFile(file){if(!file)return;try{const s=await file.text();importPalette(JSON.parse(s))}catch(e){toast('色パレット読込エラー: '+e.message,5)}}
  function saveProject(){const p=state.project;const doc={schema:'reference-shape-editor/v1',savedAt:new Date().toISOString(),appVersion:APP_VERSION,canvas:{width:p.width,height:p.height},image:{name:p.imageName,dataURL:p.imageData},backgroundOpacity:state.underlayOpacity,vertices:p.vertices,shapes:p.shapes,palette:p.palette,nextCounter:p.counter};download(new Blob([JSON.stringify(doc,null,2)],{type:'application/json'}),exportBase()+'.json');status('編集可能なJSONを保存しました')}
  function validateImport(x){
    if(x?.schema!=='reference-shape-editor/v1')throw Error('非対応のプロジェクト形式です');const w=x.canvas?.width,h=x.canvas?.height;
    if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w>12000||h>12000)throw Error('キャンバスサイズが不正です');
    if(x.image?.dataURL && (!/^data:image\/(png|jpeg|webp|gif);base64,/i.test(x.image.dataURL)||x.image.dataURL.length>MAX_PICTURE_BYTES*1.5))throw Error('画像データの形式または容量が不正です');
    if(!x.vertices||Array.isArray(x.vertices)||typeof x.vertices!=='object'||!Array.isArray(x.shapes)||x.shapes.length>20000||Object.keys(x.vertices).length>100000)throw Error('図形データが不正です');
    const vertices=Object.create(null);for(const [id,v] of Object.entries(x.vertices)){if(!/^[A-Za-z0-9_-]{1,50}$/.test(id)||!finite(v?.x)||!finite(v?.y)||Math.abs(v.x)>100000||Math.abs(v.y)>100000)throw Error('頂点が不正です');vertices[id]={x:round(v.x),y:round(v.y)}}
    const ids=new Set(),shapes=x.shapes.map(s=>{if(typeof s.id!=='string'||ids.has(s.id)||!Array.isArray(s.vertexIds)||s.vertexIds.length<3||s.vertexIds.length>20000||!s.vertexIds.every(id=>Object.hasOwn(vertices,id))||new Set(s.vertexIds).size<3)throw Error('図形の頂点参照が不正です');const fill=cleanColor(s.fill);if(!fill)throw Error('図形の色が不正です');ids.add(s.id);return {id:s.id,name:String(s.name||'図形').slice(0,80),vertexIds:s.vertexIds.slice(),fill,visible:s.visible!==false}});
    const palette={characteristic:paletteColors(x.palette?.characteristic),featured:paletteColors(x.palette?.featured),representative:paletteColors(x.palette?.representative),imported:!!x.palette?.imported};
    return {project:{version:APP_VERSION,width:w,height:h,imageName:String(x.image?.name||'imported.png').slice(0,250),imageData:x.image?.dataURL||null,vertices,shapes,counter:Number.isInteger(x.nextCounter)&&x.nextCounter>=0?x.nextCounter:1000000,palette},opacity:clamp(Number(x.backgroundOpacity)||.35,0,1)};
  }
  async function loadProject(file){if(!file)return;try{const text=await file.text();const data=validateImport(JSON.parse(text));let img=null;if(data.project.imageData){img=await decodeImage(data.project.imageData);if(img.naturalWidth!==data.project.width||img.naturalHeight!==data.project.height)throw Error('元画像とキャンバス寸法が一致しません')}
      state.project=data.project;cachedBitmap=img;state.lastName=data.project.imageName.replace(/\.[^.]+$/,'');state.underlayOpacity=data.opacity;$('opacity').value=Math.round(data.opacity*100);state.selected=null;state.selectedVertex=null;state.draft=[];state.history=[];state.future=[];changeTool('draw');autoFit();toast('編集状態を復元しました');status('JSONプロジェクトを開きました');
    }catch(e){toast('プロジェクト読込エラー: '+e.message,6)}}
  function outputSvg(){const p=state.project;const shapes=p.shapes.filter(s=>s.visible).map(s=>`  <polygon points="${escapeXml(shapeCoords(s))}" fill="${s.fill}" data-shape-name="${escapeXml(s.name)}"/>`).join('\n');return `<svg xmlns="http://www.w3.org/2000/svg" width="${p.width}" height="${p.height}" viewBox="0 0 ${p.width} ${p.height}">\n${shapes}\n</svg>\n`}
  function exportSvg(){download(new Blob([outputSvg()],{type:'image/svg+xml;charset=utf-8'}),exportBase()+'.svg');toast('SVGを書き出しました（下敷き画像を含みません）')}
  async function exportPng(){const p=state.project;if(p.width*p.height>48_000_000){toast('PNG出力が大きすぎます (48MP以下にしてください)');return}
    const svg=outputSvg(),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));try{const img=await decodeImage(url),canvas=document.createElement('canvas');canvas.width=p.width;canvas.height=p.height;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);canvas.toBlob(blob=>{if(blob){download(blob,exportBase()+'.png');toast('PNGを書き出しました（背景は透明）')}else toast('PNG保存に失敗しました')},'image/png')}catch(e){toast('PNG書き出しエラー: '+e.message)}finally{URL.revokeObjectURL(url)}}

  function setBindings(){
    document.querySelectorAll('.tool[data-tool]').forEach(b=>b.addEventListener('click',()=>changeTool(b.dataset.tool)));
    $('sourceInput').addEventListener('change',e=>{loadImage(e.target.files[0]);e.target.value=''});
    $('projectInput').addEventListener('change',e=>{loadProject(e.target.files[0]);e.target.value=''});
    $('paletteInput').addEventListener('change',e=>{loadPaletteFile(e.target.files[0]);e.target.value=''});
    $('finishPolygon').addEventListener('click',finishPolygon);$('cancelDraft').addEventListener('click',()=>{state.draft=[];render()});$('removeDraftPoint').addEventListener('click',()=>{state.draft.pop();render()});
    $('undo').addEventListener('click',undo);$('redo').addEventListener('click',redo);
    $('fit').addEventListener('click',fit);
    $('fitWidth').addEventListener('click',fitWidth);
    $('zoomIn').addEventListener('click',()=>zoomCenter(1.35));
    $('zoomOut').addEventListener('click',()=>zoomCenter(1/1.35));
    $('verticalNav').addEventListener('input',e=>{const travel=Math.max(0,state.project.height-state.view.h);state.view.y=travel*(Number(e.target.value)/100);render()});$('opacity').addEventListener('input',e=>{state.underlayOpacity=e.target.value/100;render()});$('showUnderlay').addEventListener('change',e=>{state.showUnderlay=e.target.checked;render()});$('showGrid').addEventListener('change',e=>{state.showGrid=e.target.checked;render()});
    $('snapEnabled').addEventListener('change',e=>{state.snapEnabled=e.target.checked;render()});$('snapRadius').addEventListener('input',e=>{state.snapRadius=+e.target.value;render()});$('colorPicker').addEventListener('change',e=>changeColor(e.target.value));
    $('exportSvg').addEventListener('click',exportSvg);$('exportPng').addEventListener('click',exportPng);$('saveProject').addEventListener('click',saveProject);
    $('stage').addEventListener('pointerdown',onPointerDown);$('stage').addEventListener('pointermove',onPointerMove);$('stage').addEventListener('pointerup',onPointerUp);$('stage').addEventListener('pointercancel',onPointerUp);$('stage').addEventListener('dblclick',insertEdgeVertex);
    $('viewport').addEventListener('wheel',onWheel,{passive:false});
    $('viewport').addEventListener('dragover',e=>e.preventDefault());$('viewport').addEventListener('drop',e=>{e.preventDefault();const file=e.dataTransfer.files[0];if(file?.type.startsWith('image/'))loadImage(file);else if(file?.name.endsWith('.json'))loadProject(file)});
    $('stage').addEventListener('contextmenu',e=>{if(state.mode==='draw'){e.preventDefault();state.draft.pop();render()}});
    $('openHelp').addEventListener('click',()=>$('helpDialog').showModal());$('closeHelp').addEventListener('click',()=>$('helpDialog').close());
    $('toggleInspector').addEventListener('click',()=>$('inspector').classList.toggle('collapsed'));$('panelButton').addEventListener('click',()=>$('inspector').classList.toggle('collapsed'));
    document.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement||e.target.isContentEditable)return;
      if(e.code==='Space'){state.spaceDown=true;e.preventDefault()}
      if((e.ctrlKey||e.metaKey)&&e.code==='KeyZ'){e.preventDefault();if(e.shiftKey)redo();else undo();return}
      if((e.ctrlKey||e.metaKey)&&e.code==='KeyY'){e.preventDefault();redo();return}
      if(e.key==='Escape'){state.draft=[];state.selectedVertex=null;render();return}
      if(e.key==='Backspace'&&state.mode==='draw'){e.preventDefault();state.draft.pop();render();return}
      if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();removeSelected();return}
      if(e.key==='Enter'&&state.mode==='draw'){e.preventDefault();finishPolygon();return}
      const map={KeyP:'draw',KeyV:'select',KeyE:'vertex',KeyM:'move',KeyH:'pan',KeyI:'eyedropper'};if(map[e.code]&&!e.ctrlKey&&!e.metaKey){changeTool(map[e.code]);return}
      if((e.key==='+'||e.key==='=')&&!e.ctrlKey){e.preventDefault();zoomCenter(1.2)}if(e.key==='-'&&!e.ctrlKey){e.preventDefault();zoomCenter(1/1.2)}
    });
    document.addEventListener('keyup',e=>{if(e.code==='Space')state.spaceDown=false});window.addEventListener('blur',()=>state.spaceDown=false);window.addEventListener('resize',()=>{const v=state.view,cx=v.x+v.w/2,cy=v.y+v.h/2;showSourceRect(v.w,cx,cy)});
  }
  function zoomCenter(amount){const rect=$('stage').getBoundingClientRect();zoomAt(amount,rect.left+rect.width/2,rect.top+rect.height/2)}

  setBindings();if(window.matchMedia('(max-width:760px)').matches)$('inspector').classList.add('collapsed');state.view={x:0,y:0,w:INITIAL_WIDTH,h:INITIAL_HEIGHT};changeTool('draw');refreshUndo();
  window.ReferenceShapeEditor=Object.freeze({
    getState:()=>JSON.parse(JSON.stringify({project:state.project,selected:state.selected,mode:state.mode,draft:state.draft,view:state.view})),
    importPalette,
    validateImport,
    outputSvg,
    polygonSelfIntersects,
    getVersion:()=>APP_VERSION,
    fitWidth, fitAll:fit
  });
})();
