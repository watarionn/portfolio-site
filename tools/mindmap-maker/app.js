'use strict';
/* =========================================================
   MindMap App  –  SVG描画ベース 全面改訂版
   ========================================================= */

const MAX_HISTORY = 60;
const NODE_DEFAULT_W = 130;
const NODE_DEFAULT_H = 50;
const NS = 'http://www.w3.org/2000/svg';
const APP_VERSION = '1.0.0';
const ONBOARDING_KEY = 'mindmap-maker-onboarding-v1';

/* ─── 状態 ─── */
const S = {
  mode: 'add',           // add | edit | connect | multi
  connType: 'curve',     // curve | line
  selectedShape: 'rect',
  nodes:       [],       // {id,x,y,w,h,text,shape,style:{bg,fg,bc,bw,fs,overflow,halign}}
  conns:       [],       // {id,from,to,type}
  groups:      [],       // {id,name,nodeIds}
  selNodeId:   null,     // 編集/接続モードの単一選択
  multiSelIds: [],       // 複数選択モードの選択リスト
  connFrom:    null,     // 接続元ノードID
  selConnId:   null,     // 選択中の接続線ID
  dragNode: null,        // {id,startX,startY,ox,oy, multiStarts:[{id,ox,oy}]}
  pan:    { active:false, sx:0, sy:0, svx:0, svy:0 },
  gesture:{ active:false, dist:0, scale:1, mid:{x:0,y:0}, svx:0, svy:0 },
  rubber: { active:false, sx:0, sy:0 },  // ラバーバンド
  view:   { x:0, y:0, scale:1 },
  history:[],
  histIdx:-1,
  idSeq:  0,
  title: 'Untitled Mind Map',
  searchIds: [],
};

function uid(prefix='n') { return prefix + (++S.idSeq); }

/* ─── DOM ─── */
const $  = id => document.getElementById(id);
const svgWrap  = $('canvas-wrapper');
const mainSvg  = $('main-svg');
const viewport = $('viewport');
const groupLayer = $('group-layer');
const connLayer  = $('conn-layer');
const nodeLayer  = $('node-layer');
const connPreview= $('conn-preview');
const rubberBand = $('rubber-band');
const ctxMenu    = $('ctx-menu');
const connCtxMenu= $('conn-ctx-menu');
const multiBar   = $('multi-bar');
const toast      = $('toast');
const btnUndo    = $('btn-undo');
const btnRedo    = $('btn-redo');
const mapTitleBtn = $('map-title-btn');
const saveStatus = $('save-status');
const minimapSvg = $('minimap-svg');
const minimapContent = $('minimap-content');
const minimapViewport = $('minimap-viewport');

/* =========================================================
   初期化
   ========================================================= */
function init() {
  setView(0, 0, 1);
  addRootNode();
  bindAll();
  pushHistory();
  renderAll();
}

function addRootNode() {
  const cx = svgWrap.clientWidth  / 2;
  const cy = svgWrap.clientHeight / 2;
  const node = makeNode(cx - 65, cy - 25, '中心テーマ', 'rect');
  node.style.bg = '#7c6f4a';
  node.style.fg = '#fdf8ef';
  node.style.bc = '#a08c5a';
  node.style.bw = 0;
  node.style.fs = 16;
  S.nodes.push(node);
}

/* =========================================================
   ノード生成
   ========================================================= */
function makeNode(x, y, text='新しい要素', shape=null) {
  const sh = shape || S.selectedShape;
  const isCircle   = sh === 'circle';
  const isDiamond  = sh === 'diamond';
  const isTriangle = sh === 'triangle';
  const w = isCircle ? 90 : (isDiamond||isTriangle) ? 110 : NODE_DEFAULT_W;
  const h = isCircle ? 90 : (isDiamond||isTriangle) ? 80  : NODE_DEFAULT_H;
  return {
    id: uid('n'), x, y, w, h, text, shape: sh,
    style:{ bg:'#fffbf2', fg:'#3a3020', bc:'#9a8a62', bw:2, fs:14, overflow:'visible', halign:'center' }
  };
}

/* =========================================================
   描画
   ========================================================= */
function renderAll() {
  renderGroups();
  renderConns();
  renderNodes();
  updateMultiBar();
  updateUndoRedo();
  renderMinimap();
  updateMapTitleUI();
}

/* ─── グループ枠 ─── */
function renderGroups() {
  groupLayer.innerHTML = '';
  S.groups.forEach(g => {
    const members = S.nodes.filter(n => g.nodeIds.includes(n.id));
    if (members.length === 0) return;
    const pad = 16;
    const minX = Math.min(...members.map(n=>n.x)) - pad;
    const minY = Math.min(...members.map(n=>n.y)) - pad;
    const maxX = Math.max(...members.map(n=>n.x+n.w)) + pad;
    const maxY = Math.max(...members.map(n=>n.y+n.h)) + pad;
    const rect = svgEl('rect',{
      x:minX, y:minY, width:maxX-minX, height:maxY-minY,
      rx:12, class:'group-rect', 'data-gid':g.id
    });
    const lbl = svgEl('text',{
      x:minX+10, y:minY+14, class:'group-label'
    });
    lbl.textContent = g.name || 'グループ';
    groupLayer.appendChild(rect);
    groupLayer.appendChild(lbl);
  });
}

/* ─── 接続線 ─── */
function renderConns() {
  connLayer.innerHTML = '';
  S.conns.forEach(c => {
    const from = S.nodes.find(n=>n.id===c.from);
    const to   = S.nodes.find(n=>n.id===c.to);
    if (!from||!to) return;
    const fx = from.x + from.w/2, fy = from.y + from.h/2;
    const tx = to.x   + to.w/2,   ty = to.y   + to.h/2;
    const d  = buildPath(fx,fy,tx,ty,c.type||S.connType);
    const isSel = c.id === S.selConnId;

    // 見た目パス
    const path = svgEl('path',{
      d, class:'conn-path'+(isSel?' selected':''),
      'data-cid':c.id,
      'marker-end': isSel ? 'url(#arr-end-sel)' : 'url(#arr-end)'
    });
    // 太いヒットエリア
    const hit = svgEl('path',{
      d, class:'conn-hit', 'data-cid':c.id
    });
    hit.addEventListener('click', e=>{ e.stopPropagation(); onConnClick(c.id, e.clientX, e.clientY); });
    connLayer.appendChild(path);
    connLayer.appendChild(hit);
  });
}

function buildPath(fx,fy,tx,ty,type) {
  if (type==='line') return `M${fx},${fy} L${tx},${ty}`;
  const dx = tx-fx, dy = ty-fy;
  const cx1 = fx + dx*0.45, cy1 = fy + dy*0.05;
  const cx2 = tx - dx*0.45, cy2 = ty - dy*0.05;
  return `M${fx},${fy} C${cx1},${cy1} ${cx2},${cy2} ${tx},${ty}`;
}

/* ─── ノード ─── */
function renderNodes() {
  // 既存要素をMapで管理
  const existing = new Map();
  nodeLayer.querySelectorAll('.node-g').forEach(g => existing.set(g.dataset.id, g));

  const currentIds = new Set(S.nodes.map(n=>n.id));
  existing.forEach((g,id)=>{ if(!currentIds.has(id)) g.remove(); });

  S.nodes.forEach(node => {
    let g = existing.get(node.id);
    if (!g) {
      g = svgEl('g',{ class:'node-g', 'data-id':node.id });
      bindNodeSvgEvents(g, node.id);
      nodeLayer.appendChild(g);
    }
    updateNodeSvg(g, node);
  });
}

function updateNodeSvg(g, node) {
  g.innerHTML = '';
  const s = node.style;
  const { x,y,w,h,shape,text } = node;
  const isSel   = node.id === S.selNodeId;
  const isMulti = S.multiSelIds.includes(node.id);
  const isSearch = S.searchIds.includes(node.id);

  g.setAttribute('class', 'node-g' + (isSel?' selected':'') + (isMulti?' multi-sel':'') + (isSearch?' search-match':''));
  g.setAttribute('data-id', node.id);

  /* ── 形状ごとのSVG要素 ── */
  let shapeEl;

  if (shape === 'rect') {
    shapeEl = svgEl('rect',{
      x, y, width:w, height:h, rx:6,
      fill:s.bg, stroke:s.bc, 'stroke-width':s.bw, class:'node-shape'
    });

  } else if (shape === 'circle') {
    const rx = w/2, ry = h/2;
    shapeEl = svgEl('ellipse',{
      cx: x+rx, cy: y+ry, rx, ry,
      fill:s.bg, stroke:s.bc, 'stroke-width':s.bw, class:'node-shape'
    });

  } else if (shape === 'diamond') {
    // 菱形：中心から4頂点
    const cx=x+w/2, cy=y+h/2;
    const pts = `${cx},${y} ${x+w},${cy} ${cx},${y+h} ${x},${cy}`;
    shapeEl = svgEl('polygon',{
      points:pts,
      fill:s.bg, stroke:s.bc, 'stroke-width':s.bw, class:'node-shape'
    });

  } else if (shape === 'cloud') {
    // 雲形：複数の円弧を組み合わせたpath
    shapeEl = svgEl('path',{
      d: buildCloudPath(x, y, w, h),
      fill:s.bg, stroke:s.bc, 'stroke-width':s.bw, class:'node-shape'
    });

  } else if (shape === 'triangle') {
    // 三角形：底辺中央が下、頂点が上
    const pts = `${x+w/2},${y} ${x+w},${y+h} ${x},${y+h}`;
    shapeEl = svgEl('polygon',{
      points:pts,
      fill:s.bg, stroke:s.bc, 'stroke-width':s.bw, class:'node-shape'
    });

  } else if (shape === 'line') {
    // 矢印/線：横向き矢印をノードとして配置
    const grp = svgEl('g',{ class:'node-shape' });
    const line_ = svgEl('line',{
      x1:x+6, y1:y+h/2, x2:x+w-14, y2:y+h/2,
      stroke:s.bc, 'stroke-width':s.bw||2, 'stroke-linecap':'round'
    });
    const arrowPts = `${x+w-14},${y+h/2-7} ${x+w-2},${y+h/2} ${x+w-14},${y+h/2+7}`;
    const arrow = svgEl('polygon',{ points:arrowPts, fill:s.bc });
    grp.appendChild(line_);
    grp.appendChild(arrow);
    g.appendChild(grp);
    // 矢印の場合はテキストのみ
    appendNodeText(g, node, x, y, w, h);
    return; // 早期リターン
  }

  g.appendChild(shapeEl);

  // 選択ハイライト枠
  if (isSel || isMulti) {
    const hl = shapeEl.cloneNode(false);
    hl.setAttribute('fill','none');
    hl.setAttribute('stroke', isSel ? '#c0874a' : '#7c6f4a');
    hl.setAttribute('stroke-width', (s.bw||0)+2.5);
    hl.setAttribute('stroke-dasharray','');
    hl.setAttribute('opacity','0.85');
    hl.setAttribute('class','');
    g.appendChild(hl);
  }

  appendNodeText(g, node, x, y, w, h);
}

/* 雲形パスを生成 */
function buildCloudPath(x, y, w, h) {
  // 安定した雲形。座標を0〜1の比率で定義し、どのサイズでも輪郭を保つ。
  const px = r => x + w*r;
  const py = r => y + h*r;
  return [
    `M ${px(.22)} ${py(.80)}`,
    `C ${px(.09)} ${py(.80)}, ${px(.04)} ${py(.65)}, ${px(.12)} ${py(.54)}`,
    `C ${px(.07)} ${py(.37)}, ${px(.21)} ${py(.23)}, ${px(.37)} ${py(.28)}`,
    `C ${px(.46)} ${py(.08)}, ${px(.72)} ${py(.09)}, ${px(.80)} ${py(.31)}`,
    `C ${px(.96)} ${py(.32)}, ${px(1.00)} ${py(.51)}, ${px(.91)} ${py(.62)}`,
    `C ${px(.95)} ${py(.77)}, ${px(.78)} ${py(.88)}, ${px(.65)} ${py(.80)}`,
    `C ${px(.55)} ${py(.94)}, ${px(.34)} ${py(.93)}, ${px(.27)} ${py(.81)}`,
    `C ${px(.25)} ${py(.81)}, ${px(.23)} ${py(.80)}, ${px(.22)} ${py(.80)}`,
    'Z'
  ].join(' ');
}

/* テキスト要素を追加 */
function appendNodeText(g, node, x, y, w, h) {
  const s = node.style;
  const { shape, text } = node;

  // 三角形のテキストは内部の重心に配置
  let ty;
  if (shape === 'triangle') ty = y + h * 0.68;
  else ty = y + h / 2;

  const fo = document.createElementNS(NS, 'foreignObject');
  const overflow = s.overflow === 'hidden' ? 'hidden' : 'visible';
  let fw, fh, fx;

  if (shape === 'triangle') {
    // 三角形内接する矩形に収める
    const innerW = w * 0.55;
    fx = x + (w - innerW) / 2;
    fw = innerW; fh = h * 0.4;
    fo.setAttribute('x', fx);
    fo.setAttribute('y', ty - fh/2);
  } else if (shape === 'diamond') {
    const innerW = w * 0.55;
    fx = x + (w - innerW)/2;
    fw = innerW; fh = h * 0.4;
    fo.setAttribute('x', fx);
    fo.setAttribute('y', y + h/2 - fh/2);
  } else {
    fo.setAttribute('x', x+4);
    fo.setAttribute('y', y);
    fw = w-8; fh = h;
  }

  fo.setAttribute('width',  fw);
  fo.setAttribute('height', fh);

  const div = document.createElement('div');
  div.style.cssText = `
    width:100%; height:100%;
    display:flex; align-items:center; justify-content:${s.halign==='left'?'flex-start':s.halign==='right'?'flex-end':'center'};
    font-size:${s.fs}px; color:${s.fg};
    font-family:-apple-system,'Hiragino Kaku Gothic ProN','Yu Gothic UI',sans-serif;
    font-weight:600; line-height:1.35; word-break:break-word;
    overflow:${overflow}; text-align:${s.halign};
    padding:2px 4px;
    pointer-events:none;
  `;
  div.textContent = text;
  fo.appendChild(div);
  g.appendChild(fo);
}

/* ─── ビュー適用 ─── */
function setView(x, y, scale) {
  S.view.x = x; S.view.y = y; S.view.scale = scale;
  viewport.setAttribute('transform', `translate(${x},${y}) scale(${scale})`);
  renderConns();
  renderMinimap();
  scheduleAutosave(900, false);
}

/* ─── SVG要素生成ヘルパー ─── */
function svgEl(tag, attrs={}) {
  const el = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k,v));
  return el;
}

/* =========================================================
   イベントバインド
   ========================================================= */
function bindAll() {
  /* モード */
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', ()=>setMode(btn.dataset.mode));
  });

  /* 接続種別 */
  document.querySelectorAll('.conn-btn').forEach(btn => {
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.conn-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      S.connType = btn.dataset.conn;
    });
  });

  /* 形状 */
  document.querySelectorAll('.shape-btn').forEach(btn => {
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.shape-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      S.selectedShape = btn.dataset.shape;
    });
  });

  /* ヘッダー / ファイル */
  $('btn-undo').addEventListener('click', undo);
  $('btn-redo').addEventListener('click', redo);
  $('btn-search').addEventListener('click', openSearchModal);
  $('btn-layout').addEventListener('click', autoLayout);
  $('btn-file-open').addEventListener('click', ()=>{ $('map-title-input').value=S.title; toggleModal('file-modal',true); });
  $('btn-fit').addEventListener('click', fitToContent);
  mapTitleBtn.addEventListener('click', ()=>{ $('map-title-input').value=S.title; toggleModal('file-modal',true); setTimeout(()=>$('map-title-input').select(), 40); });
  $('btn-export-open').addEventListener('click', ()=>toggleModal('export-modal',true));

  $('file-close').addEventListener('click', ()=>toggleModal('file-modal',false));
  $('file-new').addEventListener('click', ()=>{ toggleModal('file-modal',false); newMap(); });
  $('file-sample').addEventListener('click', ()=>{ toggleModal('file-modal',false); loadSampleMap(); });
  $('file-help').addEventListener('click', ()=>{ toggleModal('file-modal',false); openHelp(); });
  $('file-save-local').addEventListener('click', ()=>{ toggleModal('file-modal',false); saveLocal(); });
  $('file-load-local').addEventListener('click', ()=>{ toggleModal('file-modal',false); loadLocal(true); });
  $('file-import-json').addEventListener('click', ()=>{ toggleModal('file-modal',false); $('json-file-input').click(); });
  $('file-export-json').addEventListener('click', ()=>{ toggleModal('file-modal',false); exportJson(); });
  $('json-file-input').addEventListener('change', importJsonFile);
  $('map-title-input').addEventListener('change', e=>setMapTitle(e.target.value));
  $('map-title-input').addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); setMapTitle(e.currentTarget.value); toggleModal('file-modal',false); } });

  /* 検索 */
  $('search-close').addEventListener('click', closeSearchModal);
  $('search-input').addEventListener('input', updateSearchResults);
  $('search-results').addEventListener('click', e=>{
    const item=e.target.closest('[data-node-id]');
    if(item) focusNode(item.dataset.nodeId, true);
  });

  /* ミニマップ */
  minimapSvg.addEventListener('pointerdown', onMinimapPointer);
  $('minimap').addEventListener('keydown', onMinimapKeyDown);

  /* キャンバス */
  svgWrap.addEventListener('click',      onWrapClick);
  svgWrap.addEventListener('dblclick',   onWrapDblClick);
  svgWrap.addEventListener('mousedown',  onWrapMouseDown);
  svgWrap.addEventListener('mousemove',  onWrapMouseMove);
  svgWrap.addEventListener('mouseup',    onWrapMouseUp);
  svgWrap.addEventListener('wheel',      onWheel, {passive:false});
  svgWrap.addEventListener('touchstart', onTouchStart, {passive:false});
  svgWrap.addEventListener('touchmove',  onTouchMove,  {passive:false});
  svgWrap.addEventListener('touchend',   onTouchEnd,   {passive:false});
  svgWrap.addEventListener('contextmenu',e=>e.preventDefault());

  /* コンテキストメニュー（ノード） */
  $('ctx-edit-text').addEventListener('click', ()=>{ closeCtx(); openEditModal(); });
  $('ctx-style').addEventListener('click',     ()=>{ closeCtx(); openStyleModal(); });
  $('ctx-copy-node').addEventListener('click', ()=>{ closeCtx(); copyNode(); });
  $('ctx-group-sel').addEventListener('click', ()=>{ closeCtx(); groupFromCtx(); });
  $('ctx-del').addEventListener('click',       ()=>{ closeCtx(); deleteNode(S.selNodeId); });

  /* コンテキストメニュー（接続線） */
  $('conn-ctx-del').addEventListener('click', ()=>{ closeCtx(); deleteConn(S.selConnId); });

  /* スタイルモーダル */
  $('style-close').addEventListener('click',  ()=>toggleModal('style-modal',false));
  $('style-cancel').addEventListener('click', ()=>toggleModal('style-modal',false));
  $('style-apply').addEventListener('click',  applyStyle);
  $('opt-bw').addEventListener('input', e=>$('opt-bw-val').textContent=e.target.value);
  $('opt-fs').addEventListener('input', e=>$('opt-fs-val').textContent=e.target.value);
  document.querySelectorAll('.tog').forEach(btn => {
    btn.addEventListener('click', ()=>{
      btn.closest('.tog-group').querySelectorAll('.tog').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  /* テキスト編集モーダル */
  $('edit-close').addEventListener('click',  ()=>toggleModal('edit-modal',false));
  $('edit-cancel').addEventListener('click', ()=>toggleModal('edit-modal',false));
  $('edit-ok').addEventListener('click',     applyEdit);

  /* 出力モーダル */
  $('export-close').addEventListener('click', ()=>toggleModal('export-modal',false));
  $('exp-png').addEventListener('click',  ()=>{ toggleModal('export-modal',false); exportImage('png'); });
  $('exp-jpg').addEventListener('click',  ()=>{ toggleModal('export-modal',false); exportImage('jpg'); });
  $('exp-svg').addEventListener('click',  ()=>{ toggleModal('export-modal',false); exportSvg(); });
  $('exp-json').addEventListener('click', ()=>{ toggleModal('export-modal',false); exportJson(); });

  /* グループモーダル */
  $('group-close').addEventListener('click',  ()=>toggleModal('group-modal',false));
  $('group-cancel').addEventListener('click', ()=>toggleModal('group-modal',false));
  $('group-ok').addEventListener('click',     applyGroupCreate);

  /* 初回ガイド / ヘルプ */
  $('onboarding-blank').addEventListener('click', ()=>dismissOnboarding(false));
  $('onboarding-sample').addEventListener('click', ()=>dismissOnboarding(true));
  $('help-close').addEventListener('click', closeHelp);
  $('help-ok').addEventListener('click', closeHelp);
  $('help-sample').addEventListener('click', ()=>{ closeHelp(); loadSampleMap(); });

  /* 複数選択バー */
  $('multi-group').addEventListener('click', ()=>openGroupModal(S.multiSelIds.slice()));
  $('multi-del').addEventListener('click',   deleteMulti);

  /* モーダル外クリックで閉じる */
  ['style-modal','edit-modal','file-modal','search-modal','export-modal','group-modal','help-modal'].forEach(id=>{
    $(id).addEventListener('click', e=>{ if(e.target.id===id) toggleModal(id,false); });
  });

  /* ctx外クリックで閉じる */
  document.addEventListener('click', e=>{
    if(!ctxMenu.contains(e.target) && !connCtxMenu.contains(e.target)) closeCtx();
  });

  document.addEventListener('keydown', onKeyDown);
  window.addEventListener('resize', ()=>{ renderConns(); renderMinimap(); });
}

/* =========================================================
   モード切替
   ========================================================= */
function setMode(m) {
  S.mode = m;
  document.querySelectorAll('.mode-btn').forEach(b=>b.classList.toggle('active',b.dataset.mode===m));
  $('conn-type-bar').classList.toggle('hidden', m!=='connect');

  // 状態リセット
  S.selNodeId = null; S.selConnId = null;
  S.connFrom  = null; S.multiSelIds = [];
  S.rubber.active = false;
  rubberBand.setAttribute('display','none');
  connPreview.setAttribute('display','none');

  svgWrap.className = m==='add' ? 'mode-add' : m==='connect' ? 'mode-connect' : '';
  renderAll();
}

/* =========================================================
   キャンバス イベントハンドラ
   ========================================================= */
/* 座標変換：クライアント → SVG仮想空間 */
function clientToSvg(cx, cy) {
  const r = svgWrap.getBoundingClientRect();
  return {
    x: (cx - r.left - S.view.x) / S.view.scale,
    y: (cy - r.top  - S.view.y) / S.view.scale
  };
}

/* クリック */
function onWrapClick(e) {
  if (e.target === mainSvg || e.target === $('bg-rect')) {
    // 空白クリック
    if (S.mode === 'add') {
      addNodeAt(e.clientX, e.clientY);
    } else {
      S.selNodeId = null; S.selConnId = null;
      S.multiSelIds = [];
      renderAll();
    }
    closeCtx();
  }
}

/* ダブルクリック → テキスト編集 */
function onWrapDblClick(e) {
  const g = e.target.closest('.node-g');
  if (g) {
    S.selNodeId = g.dataset.id;
    openEditModal();
    e.stopPropagation();
  }
}

/* mousedown */
function onWrapMouseDown(e) {
  if (e.button !== 0) return;
  const g = e.target.closest('.node-g');
  const isBg = e.target === mainSvg || e.target === $('bg-rect');

  if (g && S.mode === 'connect') {
    // 接続モード：ノードをクリック
    return;
  }
  if (g && (S.mode==='edit'||S.mode==='add'||S.mode==='multi')) {
    startNodeDrag(g.dataset.id, e.clientX, e.clientY);
    e.preventDefault();
    return;
  }
  if (isBg) {
    if (S.mode === 'multi') {
      // ラバーバンド開始
      const p = clientToSvg(e.clientX, e.clientY);
      S.rubber = { active:true, sx:p.x, sy:p.y };
      e.preventDefault();
    } else {
      // パン開始
      S.pan = { active:true, sx:e.clientX, sy:e.clientY, svx:S.view.x, svy:S.view.y };
      e.preventDefault();
    }
  }
}

/* mousemove */
function onWrapMouseMove(e) {
  if (S.drag?.active) {
    dragNodeMove(e.clientX, e.clientY);
    e.preventDefault();
    return;
  }
  if (S.pan.active) {
    setView(S.pan.svx+(e.clientX-S.pan.sx), S.pan.svy+(e.clientY-S.pan.sy), S.view.scale);
    return;
  }
  if (S.rubber.active) {
    drawRubberBand(e.clientX, e.clientY);
  }
  // 接続モード：プレビュー線
  if (S.mode==='connect' && S.connFrom) {
    const from = S.nodes.find(n=>n.id===S.connFrom);
    if (from) {
      const p = clientToSvg(e.clientX, e.clientY);
      const fx = from.x+from.w/2, fy = from.y+from.h/2;
      connPreview.setAttribute('display','block');
      connPreview.setAttribute('x1',fx); connPreview.setAttribute('y1',fy);
      connPreview.setAttribute('x2',p.x); connPreview.setAttribute('y2',p.y);
    }
  }
}

/* mouseup */
function onWrapMouseUp(e) {
  if (S.drag?.active) {
    endNodeDrag();
    return;
  }
  if (S.pan.active) { S.pan.active = false; return; }
  if (S.rubber.active) {
    endRubberBand(e.clientX, e.clientY);
  }
}

/* ホイール */
function onWheel(e) {
  e.preventDefault();
  const r = svgWrap.getBoundingClientRect();
  const ox = e.clientX - r.left, oy = e.clientY - r.top;
  const factor = e.deltaY > 0 ? 0.88 : 1.14;
  const ns = Math.min(4, Math.max(0.15, S.view.scale * factor));
  setView(ox-(ox-S.view.x)*(ns/S.view.scale), oy-(oy-S.view.y)*(ns/S.view.scale), ns);
}

/* =========================================================
   ノードSVGイベント
   ========================================================= */
function bindNodeSvgEvents(g, id) {
  g.addEventListener('click', e=>{
    e.stopPropagation();
    onNodeClick(id, e);
  });
  g.addEventListener('dblclick', e=>{
    e.stopPropagation();
    S.selNodeId = id;
    openEditModal();
  });
  g.addEventListener('mousedown', e=>{
    if(e.button!==0) return;
    e.stopPropagation();
    if (S.mode==='connect') return;  // 接続モードはclickで処理
    startNodeDrag(id, e.clientX, e.clientY);
    e.preventDefault();
  });
  // タッチ
  let tapTimer=null, tapCount=0;
  g.addEventListener('touchstart', e=>{
    e.stopPropagation();
    if(e.touches.length===1){
      tapCount++;
      if(tapCount===1){
        tapTimer = setTimeout(()=>tapCount=0, 350);
        if(S.mode!=='connect') startNodeDrag(id, e.touches[0].clientX, e.touches[0].clientY);
      } else {
        clearTimeout(tapTimer); tapCount=0;
        S.selNodeId = id; openEditModal();
      }
    }
    e.preventDefault();
  },{passive:false});
  g.addEventListener('touchmove', e=>{
    e.stopPropagation();
    if(S.drag?.active && e.touches.length===1) dragNodeMove(e.touches[0].clientX, e.touches[0].clientY);
    e.preventDefault();
  },{passive:false});
  g.addEventListener('touchend', e=>{
    e.stopPropagation();
    if(S.drag?.active) endNodeDrag();
    else if(S.mode==='connect'&&tapCount===1) onNodeClick(id,{clientX:e.changedTouches[0].clientX,clientY:e.changedTouches[0].clientY});
    e.preventDefault();
  },{passive:false});
  // 右クリック（編集モード）
  g.addEventListener('contextmenu', e=>{
    e.preventDefault(); e.stopPropagation();
    if(S.mode==='edit'){ S.selNodeId=id; showCtxMenu(e.clientX,e.clientY,'node'); renderAll(); }
  });
}

function onNodeClick(id, e) {
  closeCtx();
  if (S.mode === 'add') {
    if (S.selNodeId && S.selNodeId!==id) {
      // 選択ノードから新規ノードへの接続を作成し、選択を移動
    }
    S.selNodeId = id;
    renderAll();
    return;
  }
  if (S.mode === 'edit') {
    S.selNodeId = id;
    if (e.type==='click') showCtxMenu(e.clientX||e.x||0, e.clientY||e.y||0,'node');
    renderAll();
    return;
  }
  if (S.mode === 'connect') {
    if (!S.connFrom) {
      S.connFrom = id;
      S.selNodeId = id;
      showToast('接続先のノードをタップ');
    } else if (S.connFrom !== id) {
      addConn(S.connFrom, id);
      S.connFrom = null;
      S.selNodeId = null;
      connPreview.setAttribute('display','none');
      pushHistory();
      renderAll();
      showToast('接続しました');
    }
    renderAll();
    return;
  }
  if (S.mode === 'multi') {
    const idx = S.multiSelIds.indexOf(id);
    if (idx === -1) S.multiSelIds.push(id);
    else S.multiSelIds.splice(idx,1);
    renderAll();
  }
}

/* =========================================================
   ノード追加
   ========================================================= */
function addNodeAt(clientX, clientY) {
  const p = clientToSvg(clientX, clientY);
  const node = makeNode(p.x - NODE_DEFAULT_W/2, p.y - NODE_DEFAULT_H/2);
  // 選択中ノードから自動接続
  if (S.selNodeId) addConn(S.selNodeId, node.id);
  S.nodes.push(node);
  S.selNodeId = node.id;
  pushHistory();
  renderAll();
  showToast('要素を追加しました');
}

function addConn(fromId, toId) {
  const dup = S.conns.find(c=>c.from===fromId&&c.to===toId);
  if (dup) return;
  S.conns.push({ id:uid('c'), from:fromId, to:toId, type:S.connType });
}

/* =========================================================
   ドラッグ（ノード）
   ========================================================= */
function startNodeDrag(id, cx, cy) {
  const node = S.nodes.find(n=>n.id===id);
  if (!node) return;

  const isMultiDrag = S.mode==='multi' && S.multiSelIds.includes(id);
  const multiStarts = isMultiDrag
    ? S.multiSelIds.map(mid=>{ const mn=S.nodes.find(n=>n.id===mid); return {id:mid,ox:mn.x,oy:mn.y}; })
    : [];

  S.drag = {
    active:true, id,
    startCx:cx, startCy:cy,
    ox:node.x, oy:node.y,
    isMulti: isMultiDrag,
    multiStarts
  };
  if (!S.multiSelIds.includes(id)) S.selNodeId = id;
}

function dragNodeMove(cx, cy) {
  if (!S.drag?.active) return;
  const dx = (cx - S.drag.startCx) / S.view.scale;
  const dy = (cy - S.drag.startCy) / S.view.scale;

  if (S.drag.isMulti) {
    S.drag.multiStarts.forEach(ms=>{
      const n = S.nodes.find(n=>n.id===ms.id);
      if (n) { n.x=ms.ox+dx; n.y=ms.oy+dy; }
    });
  } else {
    const n = S.nodes.find(n=>n.id===S.drag.id);
    if (n) { n.x=S.drag.ox+dx; n.y=S.drag.oy+dy; }
  }
  renderAll();
}

function endNodeDrag() {
  if (!S.drag?.active) return;
  S.drag.active = false;
  pushHistory();
}

/* =========================================================
   タッチ（ピンチ/パン）
   ========================================================= */
function onTouchStart(e) {
  if (e.touches.length === 2) {
    e.preventDefault();
    const d = tDist(e.touches), m = tMid(e.touches);
    S.gesture = { active:true, dist:d, scale:S.view.scale, mid:m, svx:S.view.x, svy:S.view.y };
    return;
  }
  if (e.touches.length === 1) {
    const t = e.touches[0];
    const g = e.target.closest('.node-g');
    if (!g) {
      if (S.mode==='multi') {
        const p = clientToSvg(t.clientX, t.clientY);
        S.rubber = { active:true, sx:p.x, sy:p.y };
      } else {
        S.pan = { active:true, sx:t.clientX, sy:t.clientY, svx:S.view.x, svy:S.view.y };
      }
      e.preventDefault();
    }
  }
}

function onTouchMove(e) {
  if (e.touches.length === 2 && S.gesture.active) {
    e.preventDefault();
    const d  = tDist(e.touches), m = tMid(e.touches);
    const g  = S.gesture;
    const ns = Math.min(4, Math.max(0.15, g.scale*(d/g.dist)));
    const r  = svgWrap.getBoundingClientRect();
    const ox = m.x - r.left, oy = m.y - r.top;
    const pdx= m.x - g.mid.x, pdy = m.y - g.mid.y;
    setView(ox-(ox-g.svx)*(ns/g.scale)+pdx, oy-(oy-g.svy)*(ns/g.scale)+pdy, ns);
    return;
  }
  if (e.touches.length === 1) {
    const t = e.touches[0];
    if (S.drag?.active) { dragNodeMove(t.clientX, t.clientY); e.preventDefault(); return; }
    if (S.pan.active)   { setView(S.pan.svx+(t.clientX-S.pan.sx), S.pan.svy+(t.clientY-S.pan.sy), S.view.scale); e.preventDefault(); return; }
    if (S.rubber.active){ drawRubberBand(t.clientX, t.clientY); e.preventDefault(); }
    if (S.mode==='connect' && S.connFrom) {
      const from = S.nodes.find(n=>n.id===S.connFrom);
      if (from) {
        const p = clientToSvg(t.clientX, t.clientY);
        connPreview.setAttribute('display','block');
        connPreview.setAttribute('x1',from.x+from.w/2); connPreview.setAttribute('y1',from.y+from.h/2);
        connPreview.setAttribute('x2',p.x); connPreview.setAttribute('y2',p.y);
      }
    }
  }
}

function onTouchEnd(e) {
  if (e.touches.length < 2) S.gesture.active = false;
  if (e.touches.length === 0) {
    S.pan.active = false;
    if (S.drag?.active) endNodeDrag();
    if (S.rubber.active) {
      const t = e.changedTouches[0];
      endRubberBand(t.clientX, t.clientY);
    }
  }
}

function tDist(ts) { return Math.hypot(ts[0].clientX-ts[1].clientX, ts[0].clientY-ts[1].clientY); }
function tMid(ts)  { return { x:(ts[0].clientX+ts[1].clientX)/2, y:(ts[0].clientY+ts[1].clientY)/2 }; }

/* =========================================================
   ラバーバンド（複数選択）
   ========================================================= */
function drawRubberBand(cx, cy) {
  const p = clientToSvg(cx, cy);
  const x = Math.min(S.rubber.sx, p.x);
  const y = Math.min(S.rubber.sy, p.y);
  const w = Math.abs(p.x - S.rubber.sx);
  const h = Math.abs(p.y - S.rubber.sy);
  rubberBand.setAttribute('display','block');
  rubberBand.setAttribute('x',x); rubberBand.setAttribute('y',y);
  rubberBand.setAttribute('width',w); rubberBand.setAttribute('height',h);
  // ビューポート変換を適用
  rubberBand.setAttribute('transform', `translate(${S.view.x},${S.view.y}) scale(${S.view.scale})`);
}

function endRubberBand(cx, cy) {
  const p = clientToSvg(cx, cy);
  const x1=Math.min(S.rubber.sx,p.x), y1=Math.min(S.rubber.sy,p.y);
  const x2=Math.max(S.rubber.sx,p.x), y2=Math.max(S.rubber.sy,p.y);
  S.multiSelIds = S.nodes
    .filter(n => n.x<x2 && n.x+n.w>x1 && n.y<y2 && n.y+n.h>y1)
    .map(n=>n.id);
  S.rubber.active = false;
  rubberBand.setAttribute('display','none');
  renderAll();
}

/* =========================================================
   接続線クリック
   ========================================================= */
function onConnClick(cid, cx, cy) {
  if (S.mode !== 'edit') return;
  S.selConnId = cid;
  S.selNodeId = null;
  showCtxMenu(cx, cy, 'conn');
  renderAll();
}

/* =========================================================
   コンテキストメニュー
   ========================================================= */
function showCtxMenu(cx, cy, type) {
  closeCtx();
  const menu = type==='conn' ? connCtxMenu : ctxMenu;
  const mw=180, mh=220;
  menu.style.left = Math.min(cx, window.innerWidth -mw-8)+'px';
  menu.style.top  = Math.min(cy, window.innerHeight-mh-8)+'px';
  menu.classList.remove('hidden');
}
function closeCtx() {
  ctxMenu.classList.add('hidden');
  connCtxMenu.classList.add('hidden');
}

/* =========================================================
   テキスト編集
   ========================================================= */
function openEditModal() {
  const node = S.nodes.find(n=>n.id===S.selNodeId);
  if (!node) return;
  $('edit-ta').value = node.text;
  toggleModal('edit-modal',true);
  setTimeout(()=>$('edit-ta').focus(),150);
}
function applyEdit() {
  const node = S.nodes.find(n=>n.id===S.selNodeId);
  if (!node) return;
  node.text = $('edit-ta').value.trim() || '(空)';
  toggleModal('edit-modal',false);
  pushHistory(); renderAll();
}

/* =========================================================
   スタイル
   ========================================================= */
function openStyleModal() {
  const node = S.nodes.find(n=>n.id===S.selNodeId);
  if (!node) return;
  const s = node.style;
  $('opt-bg').value = s.bg;
  $('opt-fg').value = s.fg;
  $('opt-border-c').value = s.bc;
  $('opt-bw').value = s.bw; $('opt-bw-val').textContent = s.bw;
  $('opt-fs').value = s.fs; $('opt-fs-val').textContent = s.fs;
  setTog('overflow', s.overflow);
  setTog('halign',   s.halign);
  toggleModal('style-modal',true);
}
function setTog(key, val) {
  document.querySelectorAll(`.tog-group[data-key="${key}"] .tog`).forEach(b=>{
    b.classList.toggle('active', b.dataset.val===val);
  });
}
function applyStyle() {
  const node = S.nodes.find(n=>n.id===S.selNodeId);
  if (!node) return;
  const s = node.style;
  s.bg = $('opt-bg').value;
  s.fg = $('opt-fg').value;
  s.bc = $('opt-border-c').value;
  s.bw = parseInt($('opt-bw').value);
  s.fs = parseInt($('opt-fs').value);
  s.overflow = document.querySelector('.tog-group[data-key="overflow"] .tog.active')?.dataset.val||'visible';
  s.halign   = document.querySelector('.tog-group[data-key="halign"] .tog.active')?.dataset.val||'center';
  toggleModal('style-modal',false);
  pushHistory(); renderAll();
  showToast('スタイルを適用しました');
}

/* =========================================================
   コピー
   ========================================================= */
function copyNode() {
  const src = S.nodes.find(n=>n.id===S.selNodeId);
  if (!src) return;
  const copy = JSON.parse(JSON.stringify(src));
  copy.id = uid('n'); copy.x+=30; copy.y+=30;
  S.nodes.push(copy); S.selNodeId = copy.id;
  pushHistory(); renderAll();
  showToast('コピーしました');
}

/* =========================================================
   削除
   ========================================================= */
function deleteNode(id) {
  if (!id) return;
  S.nodes  = S.nodes.filter(n=>n.id!==id);
  S.conns  = S.conns.filter(c=>c.from!==id&&c.to!==id);
  S.groups = S.groups.map(g=>({...g, nodeIds:g.nodeIds.filter(nid=>nid!==id)}));
  S.selNodeId = null;
  pushHistory(); renderAll();
  showToast('削除しました');
}
function deleteConn(id) {
  S.conns = S.conns.filter(c=>c.id!==id);
  S.selConnId = null;
  pushHistory(); renderAll();
  showToast('接続を削除しました');
}
function deleteMulti() {
  S.multiSelIds.forEach(id=>{
    S.nodes  = S.nodes.filter(n=>n.id!==id);
    S.conns  = S.conns.filter(c=>c.from!==id&&c.to!==id);
    S.groups = S.groups.map(g=>({...g,nodeIds:g.nodeIds.filter(nid=>nid!==id)}));
  });
  S.multiSelIds=[];
  pushHistory(); renderAll();
  showToast('削除しました');
}

/* =========================================================
   グループ化
   ========================================================= */
function groupFromCtx() {
  // 編集モードでノード右クリック → 選択ノード単体をグループに追加 or 新規
  openGroupModal([S.selNodeId]);
}
function openGroupModal(ids) {
  if (!ids || ids.length===0) return showToast('対象がありません');
  // データをモーダルに仮保存
  $('group-name-input').value = '';
  $('group-ok').dataset.ids = JSON.stringify(ids);
  toggleModal('group-modal',true);
  setTimeout(()=>$('group-name-input').focus(),150);
}
function applyGroupCreate() {
  const ids  = JSON.parse($('group-ok').dataset.ids||'[]');
  const name = $('group-name-input').value.trim() || 'グループ';
  if (ids.length === 0) return;
  S.groups.push({ id:uid('g'), name, nodeIds:ids });
  S.multiSelIds = [];
  toggleModal('group-modal',false);
  pushHistory(); renderAll();
  showToast(`グループ「${name}」を作成しました`);
}

/* =========================================================
   複数選択バー
   ========================================================= */
function updateMultiBar() {
  const cnt = S.multiSelIds.length;
  if (cnt > 0 && S.mode==='multi') {
    multiBar.classList.remove('hidden');
    $('multi-count').textContent = `${cnt}個選択中`;
  } else {
    multiBar.classList.add('hidden');
  }
}

/* =========================================================
   保存 / 読み込み / ファイル操作
   ========================================================= */
const STORAGE_KEY = 'mindmap-maker-v3';
const LEGACY_STORAGE_KEY = 'mm-v2';

function getDocumentData() {
  return {
    format: 'mindmap-maker',
    version: 5,
    title: S.title,
    nodes: S.nodes,
    conns: S.conns,
    groups: S.groups,
    view: S.view,
    viewport: { w: Math.max(1, svgWrap.clientWidth), h: Math.max(1, svgWrap.clientHeight) },
    idSeq: S.idSeq,
    savedAt: new Date().toISOString()
  };
}

function saveLocal(silent=false) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getDocumentData()));
    setSaveStatus('saved');
    if (!silent) showToast('ブラウザに保存しました ✓');
    return true;
  } catch (e) {
    console.error(e);
    setSaveStatus('error');
    if (!silent) showToast('保存に失敗しました');
    return false;
  }
}

function loadLocal(showMissing=false) {
  const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) {
    if (showMissing) showToast('保存データがありません');
    return false;
  }
  try {
    const data = JSON.parse(raw);
    applyDocumentData(data);
    resetHistory();
    pushHistory();
    renderAll();
    const savedW = Number(data.viewport?.w) || 0;
    const currentW = Math.max(1, svgWrap.clientWidth);
    if (savedW && (currentW / savedW < 0.72 || currentW / savedW > 1.45)) {
      requestAnimationFrame(()=>fitToContent(true));
    }
    setSaveStatus('saved');
    if (showMissing) showToast('保存データを読み込みました');
    return true;
  } catch(e) {
    console.warn(e);
    showToast('保存データを読み込めませんでした');
    return false;
  }
}

function inferIdSeq(data) {
  const ids = [
    ...(data.nodes || []).map(x=>x.id),
    ...(data.conns || []).map(x=>x.id),
    ...(data.groups || []).map(x=>x.id)
  ];
  return ids.reduce((m,id)=>{
    const n = Number(String(id || '').match(/(\d+)$/)?.[1] || 0);
    return Math.max(m, n);
  }, 0);
}

function normalizeNode(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id || uid('n'));
  const shape = ['rect','circle','cloud','diamond','triangle','line'].includes(raw.shape) ? raw.shape : 'rect';
  const w = Number.isFinite(Number(raw.w)) ? Number(raw.w) : NODE_DEFAULT_W;
  const h = Number.isFinite(Number(raw.h)) ? Number(raw.h) : NODE_DEFAULT_H;
  const baseStyle = { bg:'#fffbf2', fg:'#3a3020', bc:'#9a8a62', bw:2, fs:14, overflow:'visible', halign:'center' };
  return {
    id,
    x: Number(raw.x) || 0,
    y: Number(raw.y) || 0,
    w: Math.max(20, w),
    h: Math.max(20, h),
    text: String(raw.text ?? ''),
    shape,
    style: { ...baseStyle, ...(raw.style || {}) }
  };
}

function applyDocumentData(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.nodes)) {
    throw new Error('MindMap MakerのJSON形式ではありません');
  }

  const nodes = data.nodes.map(normalizeNode).filter(Boolean);
  const nodeIds = new Set(nodes.map(n=>n.id));
  const conns = Array.isArray(data.conns) ? data.conns
    .filter(c=>c && nodeIds.has(String(c.from)) && nodeIds.has(String(c.to)))
    .map(c=>({
      id: String(c.id || uid('c')),
      from: String(c.from),
      to: String(c.to),
      type: c.type === 'line' ? 'line' : 'curve'
    })) : [];
  const groups = Array.isArray(data.groups) ? data.groups.map(g=>({
    id: String(g?.id || uid('g')),
    name: String(g?.name || 'グループ'),
    nodeIds: Array.isArray(g?.nodeIds) ? g.nodeIds.map(String).filter(id=>nodeIds.has(id)) : []
  })).filter(g=>g.nodeIds.length > 0) : [];

  S.nodes = nodes;
  S.conns = conns;
  S.groups = groups;
  S.title = String(data.title || 'Untitled Mind Map').trim().slice(0,80) || 'Untitled Mind Map';
  S.idSeq = Math.max(Number(data.idSeq) || 0, inferIdSeq({nodes,conns,groups}), S.idSeq);
  S.selNodeId = null;
  S.selConnId = null;
  S.multiSelIds = [];
  S.connFrom = null;
  if (data.view && Number.isFinite(Number(data.view.scale))) {
    setView(Number(data.view.x)||0, Number(data.view.y)||0, Math.min(4, Math.max(0.15, Number(data.view.scale)||1)));
  } else {
    setView(0,0,1);
  }
}

function newMap(force=false) {
  if (!force && S.nodes.length > 1 && !window.confirm('現在のマップを閉じて新規作成しますか？\n未保存の変更は失われます。')) return;
  S.nodes=[]; S.conns=[]; S.groups=[];
  S.selNodeId=null; S.selConnId=null; S.multiSelIds=[]; S.connFrom=null;
  S.idSeq=0;
  S.title='Untitled Mind Map';
  S.searchIds=[];
  setView(0,0,1);
  addRootNode();
  resetHistory();
  pushHistory();
  renderAll();
  showToast('新しいマップを作成しました');
}

function importJsonFile(e) {
  const input = e.currentTarget;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try {
      const data = JSON.parse(String(reader.result || ''));
      if (!data.title) data.title = file.name.replace(/\.json$/i,'');
      applyDocumentData(data);
      resetHistory();
      pushHistory();
      renderAll();
      fitToContent();
      showToast(`${file.name} を読み込みました`);
    } catch (err) {
      console.error(err);
      showToast('JSONを読み込めませんでした');
    }
  };
  reader.onerror = ()=>showToast('ファイルを読み込めませんでした');
  reader.readAsText(file, 'UTF-8');
}

function getContentBounds(padding=36) {
  if (S.nodes.length === 0) return { x:0, y:0, width:800, height:600 };
  let minX = Math.min(...S.nodes.map(n=>n.x));
  let minY = Math.min(...S.nodes.map(n=>n.y));
  let maxX = Math.max(...S.nodes.map(n=>n.x+n.w));
  let maxY = Math.max(...S.nodes.map(n=>n.y+n.h));
  minX -= padding; minY -= padding; maxX += padding; maxY += padding;
  return { x:minX, y:minY, width:Math.max(1,maxX-minX), height:Math.max(1,maxY-minY) };
}

function fitToContent(silent=false) {
  if (S.nodes.length === 0) return;
  const b = getContentBounds(44);
  const w = Math.max(1, svgWrap.clientWidth);
  const h = Math.max(1, svgWrap.clientHeight);
  const scale = Math.min(2.5, Math.max(0.15, Math.min(w/b.width, h/b.height)));
  const x = (w - b.width*scale)/2 - b.x*scale;
  const y = (h - b.height*scale)/2 - b.y*scale;
  setView(x,y,scale);
  renderAll();
  if (!silent) showToast('マップ全体を表示しました');
}

/* =========================================================
   出力
   ========================================================= */
function exportJson() {
  const blob = new Blob([JSON.stringify(getDocumentData(), null, 2)], {type:'application/json'});
  downloadBlob(blob, `${safeFilename(S.title)}.json`);
  showToast('JSONを保存しました');
}

function makeExportSvg() {
  const bounds = getContentBounds(40);
  const clone = mainSvg.cloneNode(true);
  clone.setAttribute('xmlns', NS);
  clone.setAttribute('xmlns:xhtml', 'http://www.w3.org/1999/xhtml');
  clone.setAttribute('width', String(Math.ceil(bounds.width)));
  clone.setAttribute('height', String(Math.ceil(bounds.height)));
  clone.setAttribute('viewBox', `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`);

  const vp = clone.querySelector('#viewport');
  if (vp) vp.removeAttribute('transform');
  clone.querySelector('#rubber-band')?.remove();
  clone.querySelector('#conn-preview')?.remove();

  const bg = clone.querySelector('#bg-rect');
  if (bg) {
    bg.setAttribute('x', bounds.x);
    bg.setAttribute('y', bounds.y);
    bg.setAttribute('width', bounds.width);
    bg.setAttribute('height', bounds.height);
    bg.setAttribute('fill', '#f5f0e8');
  }

  const style = document.createElementNS(NS,'style');
  style.textContent = `
    .conn-path{fill:none;stroke:#9a8a62;stroke-width:2;stroke-linecap:round}
    .conn-hit{display:none}
    .group-rect{fill:rgba(124,111,74,.07);stroke:rgba(124,111,74,.45);stroke-width:1.5;stroke-dasharray:6,4}
    .group-label{font-size:11px;fill:rgba(124,111,74,.75);font-family:-apple-system,'Hiragino Kaku Gothic ProN','Yu Gothic UI',sans-serif;font-weight:700}
  `;
  clone.querySelector('defs')?.appendChild(style);
  clone.querySelectorAll('.selected,.multi-sel,.search-match').forEach(el=>el.classList.remove('selected','multi-sel','search-match'));
  return { svg:clone, bounds };
}

function exportSvg() {
  const {svg} = makeExportSvg();
  const text = new XMLSerializer().serializeToString(svg);
  downloadBlob(new Blob([text],{type:'image/svg+xml;charset=utf-8'}),`${safeFilename(S.title)}.svg`);
  showToast('SVGを保存しました');
}

function exportImage(fmt) {
  showToast('画像を生成中...');
  const {svg,bounds} = makeExportSvg();
  const svgStr = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([svgStr],{type:'image/svg+xml;charset=utf-8'});
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.onload = ()=>{
    const maxSide = 4096;
    const outputScale = Math.min(2, maxSide/Math.max(bounds.width,bounds.height));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(bounds.width * outputScale));
    c.height = Math.max(1, Math.round(bounds.height * outputScale));
    const ctx = c.getContext('2d');
    if (fmt === 'jpg') {
      ctx.fillStyle = '#f5f0e8';
      ctx.fillRect(0,0,c.width,c.height);
    }
    ctx.drawImage(img,0,0,c.width,c.height);
    const mime = fmt==='jpg' ? 'image/jpeg' : 'image/png';
    c.toBlob(blob=>{
      if (blob) downloadBlob(blob, `${safeFilename(S.title)}.${fmt}`);
      URL.revokeObjectURL(url);
      showToast(`${fmt.toUpperCase()}を保存しました`);
    }, mime, 0.93);
  };
  img.onerror = ()=>{
    URL.revokeObjectURL(url);
    showToast('画像の生成に失敗しました');
  };
  img.src = url;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 0);
}

/* =========================================================
   作品化機能: タイトル / 自動保存 / 検索 / ミニマップ / 自動整列
   ========================================================= */
let autosaveTimer = null;

function setMapTitle(value) {
  const next = String(value || '').trim().slice(0,80) || 'Untitled Mind Map';
  if (next === S.title) { updateMapTitleUI(); return; }
  S.title = next;
  updateMapTitleUI();
  setSaveStatus('dirty');
  scheduleAutosave();
  showToast('マップ名を変更しました');
}

function updateMapTitleUI() {
  if (mapTitleBtn) {
    mapTitleBtn.textContent = S.title;
    mapTitleBtn.title = `${S.title}（クリックして変更）`;
  }
  const input = $('map-title-input');
  if (input && document.activeElement !== input) input.value = S.title;
  document.title = `${S.title} | MindMap Maker`;
}

function setSaveStatus(state) {
  if (!saveStatus) return;
  saveStatus.dataset.state = state;
  if (state === 'dirty') saveStatus.textContent = '未保存';
  else if (state === 'saving') saveStatus.textContent = '保存中…';
  else if (state === 'error') saveStatus.textContent = '保存失敗';
  else {
    const t = new Date();
    saveStatus.textContent = `保存済み ${t.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
  }
}

function scheduleAutosave(delay=550, markSaving=true) {
  if (!document.body) return;
  clearTimeout(autosaveTimer);
  if (markSaving && saveStatus?.dataset.state !== 'dirty') setSaveStatus('dirty');
  autosaveTimer = setTimeout(()=>{
    setSaveStatus('saving');
    saveLocal(true);
  }, delay);
}

function safeFilename(name) {
  const s = String(name || 'mindmap').replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').trim();
  return (s || 'mindmap').slice(0,80);
}

function openSearchModal() {
  toggleModal('search-modal',true);
  const input = $('search-input');
  input.value='';
  S.searchIds=[];
  renderAll();
  updateSearchResults();
  setTimeout(()=>input.focus(),40);
}

function closeSearchModal() {
  toggleModal('search-modal',false);
  S.searchIds=[];
  renderAll();
}

function updateSearchResults() {
  const q = $('search-input').value.trim().toLocaleLowerCase();
  const results = q ? S.nodes.filter(n=>n.text.toLocaleLowerCase().includes(q)) : [];
  S.searchIds = results.map(n=>n.id);
  const summary=$('search-summary');
  const box=$('search-results');
  summary.textContent = q ? `${results.length}件見つかりました` : `全${S.nodes.length}ノードから検索`;
  box.innerHTML='';
  results.slice(0,100).forEach(n=>{
    const b=document.createElement('button');
    b.type='button'; b.className='search-result'; b.dataset.nodeId=n.id;
    const main=document.createElement('span'); main.className='search-result-text'; main.textContent=n.text || '（空のノード）';
    const meta=document.createElement('span'); meta.className='search-result-meta'; meta.textContent=n.shape;
    b.append(main,meta); box.appendChild(b);
  });
  if (q && results.length===0) {
    const empty=document.createElement('div'); empty.className='search-empty'; empty.textContent='一致するノードはありません'; box.appendChild(empty);
  }
  renderNodes();
  renderMinimap();
}

function focusNode(id, keepSearch=false) {
  const node=S.nodes.find(n=>n.id===id);
  if(!node) return;
  const w=Math.max(1,svgWrap.clientWidth), h=Math.max(1,svgWrap.clientHeight);
  const scale=Math.max(0.45,Math.min(2,S.view.scale || 1));
  const cx=node.x+node.w/2, cy=node.y+node.h/2;
  setView(w/2-cx*scale,h/2-cy*scale,scale);
  S.selNodeId=id; S.selConnId=null;
  if(!keepSearch) S.searchIds=[];
  renderAll();
}

function renderMinimap() {
  if (!minimapContent || !minimapViewport || !svgWrap || S.nodes.length===0) return;
  const b=getContentBounds(28);
  const mw=180, mh=110;
  const scale=Math.min((mw-12)/b.width,(mh-12)/b.height);
  const ox=(mw-b.width*scale)/2-b.x*scale;
  const oy=(mh-b.height*scale)/2-b.y*scale;
  minimapContent.innerHTML='';
  S.nodes.forEach(n=>{
    const r=svgEl('rect',{
      x:n.x*scale+ox, y:n.y*scale+oy,
      width:Math.max(2,n.w*scale), height:Math.max(2,n.h*scale),
      rx:1.5, class:'minimap-node'+(S.searchIds.includes(n.id)?' match':'')
    });
    minimapContent.appendChild(r);
  });
  const wrapW=Math.max(1,svgWrap.clientWidth), wrapH=Math.max(1,svgWrap.clientHeight);
  const vx=(-S.view.x/S.view.scale)*scale+ox;
  const vy=(-S.view.y/S.view.scale)*scale+oy;
  const vw=(wrapW/S.view.scale)*scale;
  const vh=(wrapH/S.view.scale)*scale;
  minimapViewport.setAttribute('x',vx); minimapViewport.setAttribute('y',vy);
  minimapViewport.setAttribute('width',Math.max(4,vw)); minimapViewport.setAttribute('height',Math.max(4,vh));
  minimapSvg.dataset.bounds=JSON.stringify({x:b.x,y:b.y,width:b.width,height:b.height,scale,ox,oy});
}

function onMinimapPointer(e) {
  if (!minimapSvg.dataset.bounds) return;
  const d=JSON.parse(minimapSvg.dataset.bounds);
  const r=minimapSvg.getBoundingClientRect();
  const mx=(e.clientX-r.left)*(180/r.width), my=(e.clientY-r.top)*(110/r.height);
  const wx=(mx-d.ox)/d.scale, wy=(my-d.oy)/d.scale;
  const w=Math.max(1,svgWrap.clientWidth), h=Math.max(1,svgWrap.clientHeight);
  setView(w/2-wx*S.view.scale,h/2-wy*S.view.scale,S.view.scale);
  renderAll();
}

function autoLayout() {
  if (S.nodes.length < 2) { showToast('整列するノードがありません'); return; }
  const incoming=new Map(S.nodes.map(n=>[n.id,0]));
  const outgoing=new Map(S.nodes.map(n=>[n.id,[]]));
  S.conns.forEach(c=>{
    if(incoming.has(c.to)&&outgoing.has(c.from)){
      incoming.set(c.to,incoming.get(c.to)+1);
      outgoing.get(c.from).push(c.to);
    }
  });
  const roots=S.nodes.filter(n=>incoming.get(n.id)===0);
  const start=roots.length?roots:[S.nodes[0]];
  const level=new Map();
  const queue=start.map(n=>[n.id,0]);
  while(queue.length){
    const [id,l]=queue.shift();
    if(level.has(id) && level.get(id)<=l) continue;
    level.set(id,l);
    (outgoing.get(id)||[]).forEach(to=>queue.push([to,l+1]));
  }
  let maxLevel=Math.max(0,...level.values());
  S.nodes.forEach(n=>{ if(!level.has(n.id)) level.set(n.id,++maxLevel); });
  const layers=new Map();
  S.nodes.forEach(n=>{
    const l=level.get(n.id)||0;
    if(!layers.has(l)) layers.set(l,[]);
    layers.get(l).push(n);
  });
  const xGap=220, yGap=110;
  [...layers.entries()].sort((a,b)=>a[0]-b[0]).forEach(([l,nodes])=>{
    const total=(nodes.length-1)*yGap;
    nodes.forEach((n,i)=>{ n.x=l*xGap; n.y=i*yGap-total/2; });
  });
  pushHistory(); renderAll(); fitToContent();
  showToast('接続関係に沿って自動整列しました');
}

/* =========================================================
   サンプル / 初回ガイド / ヘルプ
   ========================================================= */
function loadSampleMap() {
  S.nodes=[]; S.conns=[]; S.groups=[];
  S.selNodeId=null; S.selConnId=null; S.multiSelIds=[]; S.connFrom=null; S.searchIds=[];
  S.idSeq=0;
  S.title='プロダクト公開プラン';

  const root=makeNode(0,0,'MindMap Maker\nv1.0公開','rect');
  root.w=170; root.h=68;
  root.style={...root.style,bg:'#6b5f3f',fg:'#fffaf0',bc:'#6b5f3f',bw:0,fs:17};

  const concept=makeNode(260,-180,'コンセプト','cloud');
  concept.w=150; concept.h=82; concept.style={...concept.style,bg:'#fff4df',bc:'#925924'};
  const ux=makeNode(260,-55,'UX / 操作性','rect');
  ux.style={...ux.style,bg:'#f4ead7'};
  const release=makeNode(260,80,'リリース準備','diamond');
  release.w=130; release.h=94; release.style={...release.style,bg:'#f0e6d4'};
  const portfolio=makeNode(260,215,'ポートフォリオ','circle');
  portfolio.w=112; portfolio.h=112; portfolio.style={...portfolio.style,bg:'#efe4d0'};

  const local=makeNode(520,-215,'ローカル保存','rect'); local.style={...local.style,bg:'#fffbf2'};
  const svg=makeNode(520,-145,'SVGベース','rect'); svg.style={...svg.style,bg:'#fffbf2'};
  const search=makeNode(520,-65,'検索 / ミニマップ','rect'); search.w=150;
  const layout=makeNode(520,5,'自動整列','rect');
  const guide=makeNode(520,95,'初回ガイド','triangle'); guide.w=125; guide.h=90;
  const qa=makeNode(520,190,'PC / Mobile QA','rect'); qa.w=150;
  const publish=makeNode(520,265,'作品ページ公開','rect'); publish.w=150;

  S.nodes=[root,concept,ux,release,portfolio,local,svg,search,layout,guide,qa,publish];
  const connect=(from,to,type='curve')=>S.conns.push({id:uid('c'),from:from.id,to:to.id,type});
  [concept,ux,release,portfolio].forEach(n=>connect(root,n));
  connect(concept,local); connect(concept,svg);
  connect(ux,search); connect(ux,layout);
  connect(release,guide); connect(release,qa);
  connect(portfolio,publish,'line');
  S.groups=[
    {id:uid('g'),name:'コア価値',nodeIds:[concept.id,local.id,svg.id]},
    {id:uid('g'),name:'公開品質',nodeIds:[release.id,guide.id,qa.id]}
  ];

  setView(0,0,1);
  resetHistory();
  pushHistory();
  renderAll();
  requestAnimationFrame(()=>{ fitToContent(true); saveLocal(true); showToast('サンプルマップを読み込みました'); });
}

function openOnboarding() {
  toggleModal('onboarding-modal',true);
  setTimeout(()=>$('onboarding-sample')?.focus(),60);
}

function dismissOnboarding(withSample=false) {
  try { localStorage.setItem(ONBOARDING_KEY, 'seen'); } catch (_) {}
  toggleModal('onboarding-modal',false);
  if (withSample) loadSampleMap();
  else showToast('空白をクリックしてノードを追加できます');
}

function openHelp() {
  toggleModal('help-modal',true);
  setTimeout(()=>$('help-ok')?.focus(),40);
}
function closeHelp() { toggleModal('help-modal',false); }

function onMinimapKeyDown(e) {
  const step=e.shiftKey?90:35;
  let dx=0,dy=0;
  if(e.key==='ArrowLeft') dx=step;
  else if(e.key==='ArrowRight') dx=-step;
  else if(e.key==='ArrowUp') dy=step;
  else if(e.key==='ArrowDown') dy=-step;
  else return;
  e.preventDefault();
  setView(S.view.x+dx,S.view.y+dy,S.view.scale);
  renderAll();
}

/* =========================================================
   キーボードショートカット
   ========================================================= */
function onKeyDown(e) {
  const tag = document.activeElement?.tagName?.toLowerCase();
  const editing = tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable;
  const mod = e.ctrlKey || e.metaKey;

  if (e.key === 'Escape') {
    closeCtx();
    const searchWasOpen = !$('search-modal').classList.contains('hidden');
    ['style-modal','edit-modal','file-modal','search-modal','export-modal','group-modal','help-modal'].forEach(id=>toggleModal(id,false));
    if (searchWasOpen) { S.searchIds=[]; renderAll(); }
    return;
  }
  if (editing) return;

  if (mod && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    if (e.shiftKey) redo(); else undo();
    return;
  }
  if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
  if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); saveLocal(); return; }
  if (mod && e.key.toLowerCase() === 'o') { e.preventDefault(); $('json-file-input').click(); return; }
  if (mod && e.key.toLowerCase() === 'f') { e.preventDefault(); openSearchModal(); return; }
  if (mod && e.key.toLowerCase() === 'd' && S.selNodeId) { e.preventDefault(); copyNode(); return; }
  if (e.key === '?' || (e.key === '/' && e.shiftKey)) { e.preventDefault(); openHelp(); return; }
  if (e.key.toLowerCase() === 'f') { e.preventDefault(); fitToContent(); return; }
  if (e.key.toLowerCase() === 'l') { e.preventDefault(); autoLayout(); return; }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (S.selConnId) { e.preventDefault(); deleteConn(S.selConnId); }
    else if (S.mode === 'multi' && S.multiSelIds.length) { e.preventDefault(); deleteMulti(); }
    else if (S.selNodeId) { e.preventDefault(); deleteNode(S.selNodeId); }
  }
}

/* =========================================================
   履歴
   ========================================================= */
function resetHistory() {
  S.history = [];
  S.histIdx = -1;
  updateUndoRedo();
}

function pushHistory() {
  const snap = JSON.stringify({nodes:S.nodes, conns:S.conns, groups:S.groups});
  if (S.histIdx < S.history.length-1) S.history = S.history.slice(0, S.histIdx+1);
  S.history.push(snap);
  if (S.history.length > MAX_HISTORY) S.history.shift();
  S.histIdx = S.history.length-1;
  updateUndoRedo();
  setSaveStatus('dirty');
  scheduleAutosave();
}
function undo() {
  if (S.histIdx<=0) return;
  S.histIdx--;
  restoreSnap();
}
function redo() {
  if (S.histIdx>=S.history.length-1) return;
  S.histIdx++;
  restoreSnap();
}
function restoreSnap() {
  const d = JSON.parse(S.history[S.histIdx]);
  S.nodes=d.nodes; S.conns=d.conns; S.groups=d.groups||[];
  S.selNodeId=null; S.selConnId=null; S.multiSelIds=[];
  updateUndoRedo(); renderAll();
  setSaveStatus('dirty');
  scheduleAutosave();
}
function updateUndoRedo() {
  btnUndo.disabled = S.histIdx<=0;
  btnRedo.disabled = S.histIdx>=S.history.length-1;
}

/* =========================================================
   モーダル / トースト
   ========================================================= */
const modalReturnFocus = new Map();
function toggleModal(id, show) {
  const modal=$(id);
  if(!modal) return;
  if(show){
    modalReturnFocus.set(id, document.activeElement);
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
  } else {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden','true');
    const prev=modalReturnFocus.get(id);
    if(prev && prev.isConnected && typeof prev.focus==='function') requestAnimationFrame(()=>prev.focus());
  }
}

let toastT=null;
function showToast(msg) {
  toast.textContent=msg; toast.classList.remove('hidden');
  clearTimeout(toastT);
  toastT = setTimeout(()=>toast.classList.add('hidden'), 2200);
}

/* =========================================================
   起動
   ========================================================= */
window.addEventListener('load', ()=>{
  init();
  // 以前保存したマップがあれば復元。なければ初期マップを自動保存。
  const restored = loadLocal(false);
  if (!restored) { setSaveStatus('dirty'); scheduleAutosave(250); }
  updateMapTitleUI();
  renderMinimap();
  try {
    if (!localStorage.getItem(ONBOARDING_KEY)) setTimeout(openOnboarding, 160);
  } catch (_) { setTimeout(openOnboarding, 160); }
});
