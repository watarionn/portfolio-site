'use strict';

/* =============================================
   間取り図ジェネレーター — madori.js
   ============================================= */

/* ─── テンプレート定義 ─── */
let roomTypes = [
  {name:'リビング',  w:200,h:150,color:'#d4eaff'},
  {name:'キッチン',  w:150,h:100,color:'#d4ffd4'},
  {name:'寝室',      w:160,h:130,color:'#ffd4d4'},
  {name:'子供部屋',  w:140,h:120,color:'#ffd4f4'},
  {name:'バスルーム',w:100,h:90, color:'#e0d4ff'},
  {name:'トイレ',    w:70, h:80, color:'#fff0d4'},
  {name:'玄関',      w:100,h:80, color:'#f0f0d4'},
  {name:'廊下',      w:60, h:150,color:'#e8e8e8'},
];
let furnTypes = [
  {name:'ソファ',   w:100,h:45, h3:35, color:'#8B6914'},
  {name:'ベッド',   w:100,h:60, h3:40, color:'#6b4e8a'},
  {name:'テーブル', w:70, h:50, h3:38, color:'#8B4513'},
  {name:'デスク',   w:80, h:50, h3:40, color:'#4a7a5a'},
  {name:'椅子',     w:38, h:38, h3:45, color:'#c06030'},
  {name:'棚',       w:30, h:80, h3:90, color:'#708090'},
  {name:'浴槽',     w:70, h:120,h3:50, color:'#60a0c0'},
  {name:'洗面台',   w:50, h:40, h3:45, color:'#80b0c0'},
  {name:'便器',     w:38, h:55, h3:45, color:'#c8c8d0'},
  {name:'冷蔵庫',   w:45, h:55, h3:100,color:'#aaaacc'},
  {name:'TV台',     w:100,h:30, h3:25, color:'#556677'},
];

/* ─── 2D状態 ─── */
let rooms = [], furniture = [], walls = [];
let selected = null;
let dragging = false, resizing = false, resizeHandle = null;
let dragStart = {x:0,y:0}, objStart = {x:0,y:0,w:0,h:0};
let tool = 'select', wallStart = null, wallCur = {x:0,y:0};
let snapEnabled = true;

/* キャンバスのビュー変換（パン・ズーム） */
let viewX = 0, viewY = 0, viewScale = 1;
let panStart = null, panViewStart = null;

const GRID = 20;

/* ─── DOM参照 ─── */
const c2d  = document.getElementById('c2d');
const ctx  = c2d.getContext('2d');
const wrap = document.getElementById('canvas-wrap');

/* =============================================
   ユーティリティ
   ============================================= */
function snap(v) {
  return snapEnabled ? Math.round(v / GRID) * GRID : v;
}

/* スクリーン座標 → キャンバス座標 */
function toCanvas(sx, sy) {
  return {
    x: (sx - viewX) / viewScale,
    y: (sy - viewY) / viewScale,
  };
}

/* canvas要素上の相対座標を取得（PCマウス/タッチ共通） */
function getPos(e) {
  const r = c2d.getBoundingClientRect();
  if (e.touches) {
    return {
      x: e.touches[0].clientX - r.left,
      y: e.touches[0].clientY - r.top,
    };
  }
  return { x: e.offsetX, y: e.offsetY };
}

function hitObj(o, mx, my) {
  return mx >= o.x && mx <= o.x + o.w && my >= o.y && my <= o.y + o.h;
}

function hitWall(w, mx, my) {
  const dx = w.x2 - w.x1, dy = w.y2 - w.y1;
  const len = Math.hypot(dx, dy);
  if (len < 1) return false;
  const t = ((mx - w.x1) * dx + (my - w.y1) * dy) / (len * len);
  if (t < 0 || t > 1) return false;
  return Math.hypot(mx - (w.x1 + t * dx), my - (w.y1 + t * dy)) < 8;
}

/* リサイズハンドル */
function getHandles(o) {
  const {x, y, w, h} = o;
  return [
    {id:'nw',x,y}, {id:'ne',x:x+w,y}, {id:'se',x:x+w,y:y+h}, {id:'sw',x,y:y+h},
    {id:'n',x:x+w/2,y}, {id:'e',x:x+w,y:y+h/2},
    {id:'s',x:x+w/2,y:y+h}, {id:'w',x,y:y+h/2},
  ];
}

function hitHandle(o, mx, my) {
  if (!o || o.w == null) return null;
  const tol = Math.max(8, 12 / viewScale); // タッチしやすいように拡大
  for (const h of getHandles(o)) {
    if (Math.abs(mx - h.x) < tol && Math.abs(my - h.y) < tol) return h.id;
  }
  return null;
}

/* =============================================
   2D 描画
   ============================================= */
function resize2D() {
  c2d.width  = wrap.clientWidth;
  c2d.height = wrap.clientHeight;
  draw2d();
}

function draw2d() {
  const W = c2d.width, H = c2d.height;
  ctx.clearRect(0, 0, W, H);

  /* 背景 */
  ctx.fillStyle = '#f0e8cc';
  ctx.fillRect(0, 0, W, H);

  /* ビュー変換を適用 */
  ctx.save();
  ctx.translate(viewX, viewY);
  ctx.scale(viewScale, viewScale);

  /* グリッド */
  const gStep = GRID;
  const startX = Math.floor(-viewX / viewScale / gStep) * gStep;
  const startY = Math.floor(-viewY / viewScale / gStep) * gStep;
  const endX   = startX + (W / viewScale) + gStep * 2;
  const endY   = startY + (H / viewScale) + gStep * 2;

  ctx.strokeStyle = 'rgba(192,168,112,0.35)';
  ctx.lineWidth = 0.5 / viewScale;
  for (let x = startX; x < endX; x += gStep) {
    ctx.beginPath(); ctx.moveTo(x, startY); ctx.lineTo(x, endY); ctx.stroke();
  }
  for (let y = startY; y < endY; y += gStep) {
    ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(endX, y); ctx.stroke();
  }

  /* 部屋 */
  rooms.forEach(function(r) {
    ctx.fillStyle = r.color + 'bb';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = selected === r ? '#c0392b' : '#6b5538';
    ctx.lineWidth   = (selected === r ? 2.5 : 1.5) / viewScale;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    const fs = Math.max(10, 13 / viewScale);
    ctx.fillStyle = '#1a120a';
    ctx.font = 'bold ' + fs + 'px "Noto Serif JP","Yu Mincho",serif';
    ctx.textAlign = 'center';
    ctx.fillText(r.name, r.x + r.w/2, r.y + r.h/2 + fs * 0.3);
    ctx.fillStyle = '#a08060';
    ctx.font = (fs * 0.8) + 'px "Noto Serif JP","Yu Mincho",serif';
    ctx.fillText(Math.round(r.w) + '×' + Math.round(r.h), r.x + r.w/2, r.y + r.h/2 + fs * 1.2);
  });

  /* 家具 */
  furniture.forEach(function(f) {
    ctx.fillStyle = f.color + 'cc';
    ctx.fillRect(f.x, f.y, f.w, f.h);
    ctx.strokeStyle = selected === f ? '#c0392b' : '#a08060';
    ctx.lineWidth   = (selected === f ? 2 : 1) / viewScale;
    ctx.strokeRect(f.x, f.y, f.w, f.h);
    const fs = Math.max(9, 11 / viewScale);
    ctx.fillStyle = '#1a120a';
    ctx.font = fs + 'px "Noto Serif JP","Yu Mincho",serif';
    ctx.textAlign = 'center';
    ctx.fillText(f.name, f.x + f.w/2, f.y + f.h/2 + fs * 0.35);
  });

  /* 壁 */
  walls.forEach(function(w) {
    ctx.strokeStyle = selected === w ? '#c0392b' : '#3a2c18';
    ctx.lineWidth   = (selected === w ? 4 : 3) / viewScale;
    ctx.beginPath(); ctx.moveTo(w.x1, w.y1); ctx.lineTo(w.x2, w.y2); ctx.stroke();
  });

  /* 壁プレビュー */
  if (wallStart) {
    ctx.strokeStyle = '#1a4a7a';
    ctx.lineWidth = 2 / viewScale;
    ctx.setLineDash([5 / viewScale, 5 / viewScale]);
    ctx.beginPath(); ctx.moveTo(wallStart.x, wallStart.y); ctx.lineTo(wallCur.x, wallCur.y); ctx.stroke();
    ctx.setLineDash([]);
  }

  /* リサイズハンドル */
  if (selected && selected.w != null) {
    const hw = 10 / viewScale;
    getHandles(selected).forEach(function(h) {
      ctx.fillStyle   = '#1a4a7a';
      ctx.fillRect(h.x - hw/2, h.y - hw/2, hw, hw);
      ctx.strokeStyle = '#f0e8cc';
      ctx.lineWidth   = 1 / viewScale;
      ctx.strokeRect(h.x - hw/2, h.y - hw/2, hw, hw);
    });
  }

  ctx.restore();

  updateSelInfo();
}

function updateSelInfo() {
  const el = document.getElementById('sel-info');
  if (!selected) { el.textContent = 'なし'; return; }
  if (selected.type === 'wall') {
    el.textContent = '壁\n長さ: ' + Math.round(Math.hypot(selected.x2 - selected.x1, selected.y2 - selected.y1)) + 'px';
  } else {
    el.textContent = selected.name + '\n' + Math.round(selected.w) + ' × ' + Math.round(selected.h) + ' px';
  }
}

/* =============================================
   入力イベント（マウスとタッチを分離）
   ============================================= */

/* ── 共通処理 ── */
function onDown(sx, sy) {
  const cv = toCanvas(sx, sy);
  const mx = cv.x, my = cv.y;

  if (tool === 'wall') {
    wallStart = {x: snap(mx), y: snap(my)};
    wallCur   = {x: snap(mx), y: snap(my)};
    return;
  }
  if (tool === 'erase') {
    const w = walls.find(function(w) { return hitWall(w, mx, my); });
    if (w) { walls = walls.filter(function(x) { return x !== w; }); if (selected === w) selected = null; draw2d(); }
    return;
  }

  if (selected) {
    const h = hitHandle(selected, mx, my);
    if (h) {
      resizing = true; resizeHandle = h;
      dragStart = {x: mx, y: my};
      objStart  = {x: selected.x, y: selected.y, w: selected.w, h: selected.h};
      return;
    }
  }

  const all = [...rooms, ...furniture];
  let hit = null;
  for (let i = all.length - 1; i >= 0; i--) {
    if (hitObj(all[i], mx, my)) { hit = all[i]; break; }
  }
  if (!hit) { const w = walls.find(function(w) { return hitWall(w, mx, my); }); if (w) hit = w; }

  selected = hit;
  if (hit && hit.type !== 'wall') {
    dragging  = true;
    dragStart = {x: mx, y: my};
    objStart  = {x: hit.x, y: hit.y};
  }
  draw2d();
}

function onMove(sx, sy) {
  const cv = toCanvas(sx, sy);
  const mx = cv.x, my = cv.y;

  if (wallStart) { wallCur = {x: snap(mx), y: snap(my)}; draw2d(); return; }

  if (resizing && selected) {
    const dx = mx - dragStart.x, dy = my - dragStart.y;
    const h  = resizeHandle;
    let {x, y, w, h: ht} = objStart;
    if (h.includes('e')) w  = snap(Math.max(GRID, objStart.w + dx));
    if (h.includes('s')) ht = snap(Math.max(GRID, objStart.h + dy));
    if (h.includes('w')) { x = snap(objStart.x + dx); w = snap(Math.max(GRID, objStart.w - dx)); }
    if (h.includes('n')) { y = snap(objStart.y + dy); ht = snap(Math.max(GRID, objStart.h - dy)); }
    selected.x = x; selected.y = y; selected.w = w; selected.h = ht;
    draw2d(); return;
  }

  if (dragging && selected) {
    selected.x = snap(objStart.x + mx - dragStart.x);
    selected.y = snap(objStart.y + my - dragStart.y);
    draw2d(); return;
  }
}

function onUp(sx, sy) {
  const cv = toCanvas(sx, sy);
  if (wallStart) {
    const x2 = snap(cv.x), y2 = snap(cv.y);
    if (Math.abs(x2 - wallStart.x) > 5 || Math.abs(y2 - wallStart.y) > 5) {
      walls.push({type:'wall', x1: wallStart.x, y1: wallStart.y, x2, y2});
    }
    wallStart = null;
  }
  dragging = false; resizing = false; resizeHandle = null;
  draw2d();
}

/* canvas の getBoundingClientRect ベースのスクリーン→相対座標変換 */
function clientToCanvas(clientX, clientY) {
  const r = c2d.getBoundingClientRect();
  return {sx: clientX - r.left, sy: clientY - r.top};
}

/* ── PC: マウスイベント ── */
c2d.addEventListener('mousedown', function(e) {
  const {sx, sy} = clientToCanvas(e.clientX, e.clientY);
  onDown(sx, sy);
});
window.addEventListener('mousemove', function(e) {
  if (!dragging && !resizing && !wallStart) {
    /* カーソル変更 */
    const r = c2d.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
    const cv = toCanvas(e.clientX - r.left, e.clientY - r.top);
    if (selected && selected.w != null) {
      const h = hitHandle(selected, cv.x, cv.y);
      const cur = {nw:'nw-resize',ne:'ne-resize',se:'se-resize',sw:'sw-resize',n:'n-resize',e:'e-resize',s:'s-resize',w:'w-resize'};
      c2d.style.cursor = h ? (cur[h] || 'pointer') : (hitObj(selected, cv.x, cv.y) ? 'move' : 'default');
    } else {
      c2d.style.cursor = tool === 'wall' ? 'crosshair' : tool === 'erase' ? 'not-allowed' : 'default';
    }
    return;
  }
  const {sx, sy} = clientToCanvas(e.clientX, e.clientY);
  onMove(sx, sy);
});
window.addEventListener('mouseup', function(e) {
  if (!dragging && !resizing && !wallStart) return;
  const {sx, sy} = clientToCanvas(e.clientX, e.clientY);
  onUp(sx, sy);
});

/* ── スマホ: タッチイベント ── */
let touchMoved   = false;
let touch1Start  = null; // 1本目の指の開始座標
let pinchStartDist  = null;
let pinchStartScale = null;
let pinchStartViewX = null;
let pinchStartViewY = null;
let pinchMidStart   = null;

c2d.addEventListener('touchstart', function(e) {
  e.preventDefault();
  touchMoved = false;

  if (e.touches.length === 2) {
    /* ピンチ開始 */
    const t1 = e.touches[0], t2 = e.touches[1];
    pinchStartDist  = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    pinchStartScale = viewScale;
    pinchStartViewX = viewX;
    pinchStartViewY = viewY;
    pinchMidStart   = {x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2};
    dragging = false; resizing = false; wallStart = null;
    return;
  }

  /* 1本指 */
  const t = e.touches[0];
  touch1Start = {clientX: t.clientX, clientY: t.clientY};
  const {sx, sy} = clientToCanvas(t.clientX, t.clientY);
  onDown(sx, sy);
}, {passive: false});

c2d.addEventListener('touchmove', function(e) {
  e.preventDefault();
  touchMoved = true;

  if (e.touches.length === 2 && pinchStartDist !== null) {
    /* ピンチ：ズーム + パン */
    const t1 = e.touches[0], t2 = e.touches[1];
    const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    const mid  = {x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2};
    const newScale  = Math.max(0.3, Math.min(4, pinchStartScale * dist / pinchStartDist));
    const scaleDelta= newScale / pinchStartScale;
    viewScale = newScale;
    viewX = pinchMidStart.x - (pinchMidStart.x - pinchStartViewX) * scaleDelta + (mid.x - pinchMidStart.x);
    viewY = pinchMidStart.y - (pinchMidStart.y - pinchStartViewY) * scaleDelta + (mid.y - pinchMidStart.y);
    draw2d();
    return;
  }

  if (e.touches.length === 1) {
    const t = e.touches[0];
    const {sx, sy} = clientToCanvas(t.clientX, t.clientY);
    onMove(sx, sy);
  }
}, {passive: false});

c2d.addEventListener('touchend', function(e) {
  e.preventDefault();
  pinchStartDist = null;

  if (e.changedTouches.length > 0) {
    const t = e.changedTouches[0];
    const {sx, sy} = clientToCanvas(t.clientX, t.clientY);
    onUp(sx, sy);
  }

  touch1Start = null;
  touchMoved  = false;
}, {passive: false});

c2d.addEventListener('touchcancel', function() {
  dragging = false; resizing = false; wallStart = null; pinchStartDist = null;
  draw2d();
});

/* マウスホイールでズーム */
c2d.addEventListener('wheel', function(e) {
  e.preventDefault();
  const r     = c2d.getBoundingClientRect();
  const sx    = e.clientX - r.left;
  const sy    = e.clientY - r.top;
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  const newScale = Math.max(0.3, Math.min(4, viewScale * delta));
  viewX = sx - (sx - viewX) * (newScale / viewScale);
  viewY = sy - (sy - viewY) * (newScale / viewScale);
  viewScale = newScale;
  draw2d();
}, {passive: false});

/* =============================================
   ツール選択
   ============================================= */
function setTool(t) {
  tool = t;
  selected = null;
  document.querySelectorAll('.tool-btn').forEach(function(b) { b.classList.remove('active'); });
  document.getElementById('btn-' + t).classList.add('active');
  draw2d();
}

document.getElementById('btn-select').addEventListener('click', function() { setTool('select'); });
document.getElementById('btn-wall').addEventListener('click',   function() { setTool('wall'); });
document.getElementById('btn-erase').addEventListener('click',  function() { setTool('erase'); });

/* =============================================
   オブジェクト追加・削除
   ============================================= */
function addRoom(name, w, h, color) {
  const cx = toCanvas(c2d.width/2, c2d.height/2);
  rooms.push({type:'room', name, x: snap(cx.x - w/2), y: snap(cx.y - h/2), w, h, color});
  selected = rooms[rooms.length - 1];
  draw2d();
}
function addFurn(name, w, h, color, h3) {
  const cx = toCanvas(c2d.width/2, c2d.height/2);
  furniture.push({type:'furniture', name, x: snap(cx.x - w/2), y: snap(cx.y - h/2), w, h, color, h3: h3 || 40});
  selected = furniture[furniture.length - 1];
  draw2d();
}

document.getElementById('delete-btn').addEventListener('click', function() {
  rooms     = rooms.filter(function(r) { return r !== selected; });
  furniture = furniture.filter(function(f) { return f !== selected; });
  walls     = walls.filter(function(w) { return w !== selected; });
  selected  = null;
  draw2d();
});

document.getElementById('snap-check').addEventListener('change', function() {
  snapEnabled = this.checked;
});

/* =============================================
   サイドバー描画
   ============================================= */
function renderSidebar() {
  const rl = document.getElementById('room-list');
  rl.innerHTML = '';
  roomTypes.forEach(function(t, i) {
    const row = document.createElement('div'); row.className = 'item-row';
    const btn = document.createElement('button'); btn.className = 'add';
    btn.textContent = '＋ ' + t.name;
    btn.style.borderLeft = '3px solid ' + t.color;
    btn.addEventListener('click', function() { addRoom(t.name, t.w, t.h, t.color); });
    const del = document.createElement('button'); del.className = 'del-item';
    del.textContent = '×'; del.title = 'この種類を削除';
    del.addEventListener('click', function() { roomTypes.splice(i, 1); renderSidebar(); });
    row.appendChild(btn); row.appendChild(del); rl.appendChild(row);
  });

  const fl = document.getElementById('furn-list');
  fl.innerHTML = '';
  furnTypes.forEach(function(t, i) {
    const row = document.createElement('div'); row.className = 'item-row';
    const btn = document.createElement('button'); btn.className = 'add';
    btn.textContent = '＋ ' + t.name;
    btn.style.borderLeft = '3px solid ' + t.color;
    btn.addEventListener('click', function() { addFurn(t.name, t.w, t.h, t.color, t.h3); });
    const del = document.createElement('button'); del.className = 'del-item';
    del.textContent = '×'; del.title = 'この種類を削除';
    del.addEventListener('click', function() { furnTypes.splice(i, 1); renderSidebar(); });
    row.appendChild(btn); row.appendChild(del); fl.appendChild(row);
  });
}

/* 追加フォームのトグル */
function initFormToggle(toggleId, formId) {
  document.getElementById(toggleId).addEventListener('click', function() {
    const form = document.getElementById(formId);
    form.hidden = !form.hidden;
  });
}
initFormToggle('toggle-room-form', 'room-form');
initFormToggle('toggle-furn-form', 'furn-form');

document.getElementById('add-room-btn').addEventListener('click', function() {
  const name = document.getElementById('r-name').value.trim();
  if (!name) { alert('名前を入力してください'); return; }
  roomTypes.push({
    name,
    w: parseInt(document.getElementById('r-w').value) || 120,
    h: parseInt(document.getElementById('r-h').value) || 100,
    color: document.getElementById('r-color').value,
  });
  document.getElementById('r-name').value = '';
  document.getElementById('room-form').hidden = true;
  renderSidebar();
});

document.getElementById('add-furn-btn').addEventListener('click', function() {
  const name = document.getElementById('f-name').value.trim();
  if (!name) { alert('名前を入力してください'); return; }
  furnTypes.push({
    name,
    w: parseInt(document.getElementById('f-w').value) || 80,
    h: parseInt(document.getElementById('f-h').value) || 60,
    h3: parseInt(document.getElementById('f-3h').value) || 40,
    color: document.getElementById('f-color').value,
  });
  document.getElementById('f-name').value = '';
  document.getElementById('furn-form').hidden = true;
  renderSidebar();
});

/* =============================================
   スマホ ドロワー
   ============================================= */
const sidebar       = document.getElementById('sidebar');
const drawerHandle  = document.getElementById('drawer-handle');
const panelToggleBtn= document.getElementById('panel-toggle-btn');

function isSmartphone() { return window.innerWidth <= 768; }

function openDrawer() {
  sidebar.classList.add('is-open');
  panelToggleBtn.classList.add('panel-open');
  panelToggleBtn.textContent = '× 閉じる';
}
function closeDrawer() {
  sidebar.classList.remove('is-open');
  panelToggleBtn.classList.remove('panel-open');
  panelToggleBtn.textContent = '＋ 追加';
}
function toggleDrawer() {
  sidebar.classList.contains('is-open') ? closeDrawer() : openDrawer();
}

drawerHandle.addEventListener('click', toggleDrawer);
panelToggleBtn.addEventListener('click', toggleDrawer);

/* ドロワー外タップで閉じる */
document.addEventListener('pointerdown', function(e) {
  if (!isSmartphone()) return;
  if (sidebar.classList.contains('is-open') &&
      !sidebar.contains(e.target) &&
      e.target !== panelToggleBtn) {
    closeDrawer();
  }
});

/* =============================================
   タブ切替
   ============================================= */
function switchTab(t) {
  const v2 = document.getElementById('view2d');
  const v3 = document.getElementById('view3d');
  const t2 = document.getElementById('tab2d');
  const t3 = document.getElementById('tab3d');

  if (t === '2d') {
    v2.hidden = false; v3.hidden = true;
    t2.classList.add('active'); t3.classList.remove('active');
    t2.setAttribute('aria-selected', 'true'); t3.setAttribute('aria-selected', 'false');
    resize2D();
  } else {
    v2.hidden = true; v3.hidden = false;
    t3.classList.add('active'); t2.classList.remove('active');
    t3.setAttribute('aria-selected', 'true'); t2.setAttribute('aria-selected', 'false');
    init3D(); rebuild(); render3d();
  }
}

document.getElementById('tab2d').addEventListener('click', function() { switchTab('2d'); });
document.getElementById('tab3d').addEventListener('click', function() { switchTab('3d'); });
document.getElementById('go3d-btn').addEventListener('click', function() { switchTab('3d'); });
document.getElementById('back2d-btn').addEventListener('click', function() { switchTab('2d'); });

/* =============================================
   保存・読み込み
   ============================================= */
document.getElementById('save-png-btn').addEventListener('click', function() {
  const tmp = selected; selected = null; draw2d();
  const a = document.createElement('a'); a.download = 'madori.png'; a.href = c2d.toDataURL(); a.click();
  selected = tmp; draw2d();
});

document.getElementById('save-json-btn').addEventListener('click', function() {
  const a = document.createElement('a'); a.download = 'madori.json';
  a.href = URL.createObjectURL(new Blob(
    [JSON.stringify({rooms, furniture, walls, roomTypes, furnTypes}, null, 2)],
    {type: 'application/json'}
  ));
  a.click();
});

document.getElementById('load-json-btn').addEventListener('click', function() {
  document.getElementById('file-input').click();
});

document.getElementById('file-input').addEventListener('change', function(e) {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = function(ev) {
    try {
      const d = JSON.parse(ev.target.result);
      rooms = d.rooms || []; furniture = d.furniture || []; walls = d.walls || [];
      if (d.roomTypes) roomTypes = d.roomTypes;
      if (d.furnTypes) furnTypes = d.furnTypes;
      selected = null; renderSidebar(); draw2d();
    } catch(err) { alert('読み込み失敗'); }
  };
  r.readAsText(f); e.target.value = '';
});

/* =============================================
   3D
   ============================================= */
let renderer3, scene3, camera3, sceneGroup3;
let camTheta = 0.5, camPhi = 40, camDist = 400;
let camTarget, wallH3 = 120, ambientVal = 0.55, ambLight3;
let inited3 = false;

function init3D() {
  if (inited3) return; inited3 = true;
  camTarget = new THREE.Vector3();
  const c3 = document.getElementById('c3d');
  renderer3 = new THREE.WebGLRenderer({canvas: c3, antialias: true, preserveDrawingBuffer: true});
  renderer3.setPixelRatio(devicePixelRatio);
  renderer3.shadowMap.enabled = true;
  scene3 = new THREE.Scene();
  scene3.background = new THREE.Color(0x1a1510);
  scene3.fog = new THREE.Fog(0x1a1510, 800, 1800);
  camera3 = new THREE.PerspectiveCamera(50, 1, 1, 3000);
  ambLight3 = new THREE.AmbientLight(0xfff5e0, ambientVal); scene3.add(ambLight3);
  const dl = new THREE.DirectionalLight(0xfff5e0, 0.9);
  dl.position.set(300, 400, 200); dl.castShadow = true;
  dl.shadow.mapSize.set(2048, 2048); scene3.add(dl);
  scene3.add(new THREE.DirectionalLight(0xffe8c0, 0.3).position.set(-200, 200, -200) && new THREE.DirectionalLight(0xffe8c0, 0.3));
  sceneGroup3 = new THREE.Group(); scene3.add(sceneGroup3);
  resize3D();
  init3DControls(c3);
}

function init3DControls(c3) {
  /* PC: マウス */
  let md = false, rd = false, lx = 0, ly = 0;
  c3.addEventListener('mousedown', function(e) {
    if (e.button === 0) md = true;
    if (e.button === 2) rd = true;
    lx = e.clientX; ly = e.clientY;
  });
  c3.addEventListener('contextmenu', function(e) { e.preventDefault(); });
  window.addEventListener('mouseup', function() { md = false; rd = false; });
  window.addEventListener('mousemove', function(e) {
    if (!md && !rd) return;
    const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
    if (md) { camTheta -= dx * 0.008; camPhi = Math.max(5, Math.min(89, camPhi + dy * 0.3)); }
    if (rd) {
      const rv = new THREE.Vector3().crossVectors(camera3.getWorldDirection(new THREE.Vector3()), new THREE.Vector3(0,1,0)).normalize();
      camTarget.addScaledVector(rv, -dx * 0.5); camTarget.y += dy * 0.5;
    }
    updateCam3(); render3d();
  });
  c3.addEventListener('wheel', function(e) {
    camDist = Math.max(50, Math.min(1200, camDist + e.deltaY * 0.5));
    document.getElementById('camD').value = Math.round(camDist);
    document.getElementById('camD-v').textContent = Math.round(camDist);
    updateCam3(); render3d();
  }, {passive: true});

  /* タッチ（1本指: 回転、2本指: ズーム+パン） */
  let t1 = null, t2 = null, tPinchDist = null;
  c3.addEventListener('touchstart', function(e) {
    e.preventDefault();
    if (e.touches.length === 1) { t1 = {x: e.touches[0].clientX, y: e.touches[0].clientY}; }
    if (e.touches.length === 2) {
      t1 = {x: e.touches[0].clientX, y: e.touches[0].clientY};
      t2 = {x: e.touches[1].clientX, y: e.touches[1].clientY};
      tPinchDist = Math.hypot(t2.x - t1.x, t2.y - t1.y);
    }
  }, {passive: false});
  c3.addEventListener('touchmove', function(e) {
    e.preventDefault();
    if (e.touches.length === 1 && t1) {
      const dx = e.touches[0].clientX - t1.x, dy = e.touches[0].clientY - t1.y;
      t1 = {x: e.touches[0].clientX, y: e.touches[0].clientY};
      camTheta -= dx * 0.008; camPhi = Math.max(5, Math.min(89, camPhi + dy * 0.3));
      updateCam3(); render3d();
    }
    if (e.touches.length === 2 && t1 && t2 && tPinchDist) {
      const nx = e.touches[0].clientX, ny = e.touches[0].clientY;
      const nx2= e.touches[1].clientX, ny2= e.touches[1].clientY;
      const newDist = Math.hypot(nx2 - nx, ny2 - ny);
      camDist = Math.max(50, Math.min(1200, camDist * (tPinchDist / newDist)));
      tPinchDist = newDist;
      t1 = {x: nx, y: ny}; t2 = {x: nx2, y: ny2};
      document.getElementById('camD').value = Math.round(camDist);
      document.getElementById('camD-v').textContent = Math.round(camDist);
      updateCam3(); render3d();
    }
  }, {passive: false});
  c3.addEventListener('touchend', function() { t1 = null; t2 = null; tPinchDist = null; });
}

function resize3D() {
  if (!renderer3) return;
  const v = document.getElementById('view3d');
  renderer3.setSize(v.clientWidth, v.clientHeight);
  camera3.aspect = v.clientWidth / v.clientHeight;
  camera3.updateProjectionMatrix();
  render3d();
}

function hexTo3(hex) { return new THREE.Color(parseInt(hex.replace('#',''), 16)); }

function addLabel(text, x, y, z, sw, sh, col) {
  const lc = document.createElement('canvas'); lc.width = 256; lc.height = 64;
  const lx2 = lc.getContext('2d'); lx2.clearRect(0,0,256,64);
  lx2.fillStyle = col; lx2.font = 'bold 26px "Noto Serif JP","Yu Mincho",serif';
  lx2.textAlign = 'center'; lx2.fillText(text, 128, 42);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(lc), transparent: true}));
  sp.scale.set(sw, sh, 1); sp.position.set(x, y, z); sceneGroup3.add(sp);
}

function rebuild() {
  if (!sceneGroup3) return;
  while (sceneGroup3.children.length) sceneGroup3.remove(sceneGroup3.children[0]);
  const showFloor = document.getElementById('showFloor').checked;
  const showCeil  = document.getElementById('showCeil').checked;
  let cx = 0, cz = 0, cnt = 0;
  rooms.forEach(function(r) { cx += r.x + r.w/2; cz += r.y + r.h/2; cnt++; });
  if (cnt) { cx /= cnt; cz /= cnt; }

  rooms.forEach(function(r) {
    const rx = r.x + r.w/2 - cx, rz = r.y + r.h/2 - cz;
    const col = hexTo3(r.color);
    if (showFloor) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(r.w-2,2,r.h-2), new THREE.MeshLambertMaterial({color:col}));
      m.position.set(rx,0,rz); m.receiveShadow = true; sceneGroup3.add(m);
    }
    if (showCeil) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(r.w-2,2,r.h-2), new THREE.MeshLambertMaterial({color:0xf0e8cc,transparent:true,opacity:0.35}));
      m.position.set(rx,wallH3,rz); sceneGroup3.add(m);
    }
    const wm  = new THREE.MeshLambertMaterial({color:0xf0e8cc});
    const wmd = new THREE.MeshLambertMaterial({color:0xe8ddb8});
    [
      [r.w,wallH3,3, rx,           wallH3/2, rz-r.h/2+1, wm ],
      [r.w,wallH3,3, rx,           wallH3/2, rz+r.h/2-1, wm ],
      [3,  wallH3,r.h, rx-r.w/2+1, wallH3/2, rz,          wmd],
      [3,  wallH3,r.h, rx+r.w/2-1, wallH3/2, rz,          wmd],
    ].forEach(function(args) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(args[0],args[1],args[2]), args[6]);
      mesh.position.set(args[3],args[4],args[5]); mesh.castShadow = true; mesh.receiveShadow = true;
      sceneGroup3.add(mesh);
    });
    addLabel(r.name, rx, wallH3+15, rz, 80, 20, '#1a120a');
  });

  furniture.forEach(function(f) {
    const fx = f.x + f.w/2 - cx, fz = f.y + f.h/2 - cz, fh = f.h3 || 40;
    const m = new THREE.Mesh(new THREE.BoxGeometry(f.w,fh,f.h), new THREE.MeshLambertMaterial({color:hexTo3(f.color)}));
    m.position.set(fx, fh/2+2, fz); m.castShadow = true; m.receiveShadow = true; sceneGroup3.add(m);
    addLabel(f.name, fx, fh+14, fz, 55, 15, '#f0e8cc');
  });

  walls.forEach(function(w) {
    const x1=w.x1-cx, z1=w.y1-cz, x2=w.x2-cx, z2=w.y2-cz;
    const mx=(x1+x2)/2, mz=(z1+z2)/2, len=Math.hypot(x2-x1,z2-z1), ang=Math.atan2(z2-z1,x2-x1);
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(len,wallH3,4),new THREE.MeshLambertMaterial({color:0xd8cb98}));
    mesh.position.set(mx,wallH3/2,mz); mesh.rotation.y=-ang; mesh.castShadow=true; sceneGroup3.add(mesh);
  });

  const g = new THREE.Mesh(new THREE.PlaneGeometry(2000,2000), new THREE.MeshLambertMaterial({color:0x2a2010}));
  g.rotation.x = -Math.PI/2; g.position.y = -1; g.receiveShadow = true; sceneGroup3.add(g);
  render3d();
}

function updateCam3() {
  const phi = camPhi * Math.PI / 180;
  camera3.position.set(
    camTarget.x + camDist * Math.cos(phi) * Math.sin(camTheta),
    camTarget.y + camDist * Math.sin(phi),
    camTarget.z + camDist * Math.cos(phi) * Math.cos(camTheta)
  );
  camera3.lookAt(camTarget);
}
function render3d() { if (renderer3) { updateCam3(); renderer3.render(scene3, camera3); } }

/* 3D コントロール */
document.getElementById('wallH').addEventListener('input', function() {
  wallH3 = parseInt(this.value); document.getElementById('wallH-v').textContent = this.value; rebuild();
});
document.getElementById('camD').addEventListener('input', function() {
  camDist = parseInt(this.value); document.getElementById('camD-v').textContent = this.value; render3d();
});
document.getElementById('camEl').addEventListener('input', function() {
  camPhi = parseInt(this.value); document.getElementById('camEl-v').textContent = this.value + '°'; render3d();
});
document.getElementById('ambient').addEventListener('input', function() {
  ambientVal = this.value / 100;
  if (ambLight3) ambLight3.intensity = ambientVal;
  document.getElementById('ambient-v').textContent = this.value; render3d();
});
document.getElementById('showFloor').addEventListener('change', rebuild);
document.getElementById('showCeil').addEventListener('change', rebuild);

document.getElementById('save3d-btn').addEventListener('click', function() {
  render3d();
  const a = document.createElement('a'); a.download = 'madori_3d.png';
  a.href = document.getElementById('c3d').toDataURL(); a.click();
});
document.getElementById('toggle-view-btn').addEventListener('click', function() {
  camPhi = camPhi > 45 ? 40 : 89;
  document.getElementById('camEl').value = camPhi;
  document.getElementById('camEl-v').textContent = camPhi + '°'; render3d();
});
document.getElementById('reset-cam-btn').addEventListener('click', function() {
  camTheta = 0.5; camPhi = 40; camDist = 400; if(camTarget) camTarget.set(0,0,0);
  document.getElementById('camD').value  = 400; document.getElementById('camD-v').textContent  = 400;
  document.getElementById('camEl').value = 40;  document.getElementById('camEl-v').textContent = '40°';
  render3d();
});

/* =============================================
   初期化
   ============================================= */
rooms = [
  {type:'room',name:'リビング',   x:80,  y:60,  w:200,h:160,color:'#d4eaff'},
  {type:'room',name:'キッチン',   x:280, y:60,  w:140,h:100,color:'#d4ffd4'},
  {type:'room',name:'寝室',       x:80,  y:220, w:160,h:140,color:'#ffd4d4'},
  {type:'room',name:'バスルーム', x:280, y:160, w:100,h:100,color:'#e0d4ff'},
  {type:'room',name:'トイレ',     x:380, y:160, w:60, h:100,color:'#fff0d4'},
  {type:'room',name:'玄関',       x:240, y:220, w:100,h:80, color:'#f0f0d4'},
];
furniture = [
  {type:'furniture',name:'ソファ',   x:120,y:140,w:100,h:45, color:'#8B6914',h3:35},
  {type:'furniture',name:'テーブル', x:150,y:90, w:60, h:50, color:'#8B4513',h3:38},
  {type:'furniture',name:'ベッド',   x:100,y:260,w:120,h:80, color:'#6b4e8a',h3:40},
  {type:'furniture',name:'TV台',     x:80, y:62, w:100,h:28, color:'#556677',h3:25},
];

/* info2d の更新 */
function updateInfo() {
  const el = document.getElementById('info2d');
  if (window.innerWidth <= 768) {
    el.textContent = 'タップ: 選択　｜　ドラッグ: 移動　｜　ピンチ: ズーム';
  } else {
    el.textContent = 'クリック: 選択　｜　ドラッグ: 移動　｜　ホイール: ズーム';
  }
}

window.addEventListener('resize', function() {
  resize2D(); resize3D(); updateInfo();
});

renderSidebar();
updateInfo();

/* スマホではレイアウト確定後にリサイズ（即時だと canvas-wrap サイズが 0 になる） */
requestAnimationFrame(function() {
  requestAnimationFrame(function() {
    resize2D();
  });
});
