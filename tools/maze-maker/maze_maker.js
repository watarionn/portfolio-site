'use strict';

/* =============================================
   迷路メーカー — maze-maker.js
   ============================================= */

/* ─── 状態 ─── */
let rows = 10, cols = 19;
let grid = [];
let currentMode = 'place';
let currentTool = 'wall';
let isDragging  = false;

/* ─── DOM参照 ─── */
const inpRows     = document.getElementById('inp-rows');
const inpCols     = document.getElementById('inp-cols');
const btnGen      = document.getElementById('btn-generate');
const toolPanel   = document.getElementById('tool-panel');
const gridWrap    = document.getElementById('grid-wrap');
const mazeBody    = document.getElementById('maze-body');
const btnPlace    = document.getElementById('btn-place');
const btnDelete   = document.getElementById('btn-delete');
const toolBtns    = document.querySelectorAll('.tool-btn[data-tool]');
const obstChar    = document.getElementById('obstacle-char');
const collectChar = document.getElementById('collect-char');
const exportPanel = document.getElementById('export-panel');

/* =============================================
   グリッド生成
   ============================================= */
btnGen.addEventListener('click', function() {
  rows = Math.max(3, Math.min(40, parseInt(inpRows.value) || 10));
  cols = Math.max(3, Math.min(60, parseInt(inpCols.value) || 19));
  inpRows.value = rows;
  inpCols.value = cols;
  initGrid();
  renderGrid();
  toolPanel.classList.remove('hidden');
  gridWrap.classList.remove('hidden');
  exportPanel.classList.remove('hidden');
});

function initGrid() {
  grid = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      const isEdge = r === 0 || r === rows - 1 || c === 0 || c === cols - 1;
      grid[r][c] = isEdge
        ? {type: 'wall', char: '■'}
        : {type: 'path', char: ''};
    }
  }
}

/* =============================================
   グリッド描画
   ============================================= */
function renderGrid() {
  mazeBody.innerHTML = '';

  for (let r = 0; r < rows; r++) {
    const tr = document.createElement('tr');
    for (let c = 0; c < cols; c++) {
      const td = document.createElement('td');
      applyCellStyle(td, grid[r][c]);
      td.dataset.r = r;
      td.dataset.c = c;

      /* ── PC: マウスイベント ── */
      td.addEventListener('mousedown', function(e) {
        isDragging = true;
        handleCell(r, c);
        e.preventDefault();
      });
      td.addEventListener('mouseenter', function() {
        if (isDragging) handleCell(r, c);
      });

      /* ── スマホ: タッチイベント ── */
      td.addEventListener('touchstart', function(e) {
        e.preventDefault();
        handleCell(r, c);
      }, {passive: false});

      td.addEventListener('touchmove', function(e) {
        e.preventDefault();
        const t = e.touches[0];
        const el = document.elementFromPoint(t.clientX, t.clientY);
        if (el && el.tagName === 'TD' && el.dataset.r !== undefined) {
          handleCell(parseInt(el.dataset.r), parseInt(el.dataset.c));
        }
      }, {passive: false});

      tr.appendChild(td);
    }
    mazeBody.appendChild(tr);
  }
}

/* マウスアップはwindow全体で受け取る */
window.addEventListener('mouseup', function() { isDragging = false; });

function applyCellStyle(td, cell) {
  td.className = '';
  td.textContent = '';
  td.style.fontSize = '';

  switch (cell.type) {
    case 'wall':
      td.classList.add('wall');
      td.textContent = '■';
      break;
    case 'path':
      td.classList.add('path');
      break;
    case 'start':
      td.classList.add('cell-start');
      td.textContent = 'スタート';
      break;
    case 'goal':
      td.classList.add('cell-goal');
      td.textContent = 'ゴール';
      break;
    case 'obstacle':
      td.classList.add('obstacle');
      td.textContent = cell.char;
      break;
    case 'collect':
      td.classList.add('collect');
      td.textContent = cell.char;
      break;
  }
}

function updateCell(r, c) {
  const td = mazeBody.rows[r] && mazeBody.rows[r].cells[c];
  if (!td) return;
  applyCellStyle(td, grid[r][c]);
}

/* =============================================
   セル操作
   ============================================= */
function handleCell(r, c) {
  if (currentMode === 'delete') {
    const isEdge = r === 0 || r === rows - 1 || c === 0 || c === cols - 1;
    if (isEdge) return;
    grid[r][c] = {type: 'path', char: ''};
    updateCell(r, c);
    return;
  }

  switch (currentTool) {
    case 'wall':
      grid[r][c] = {type: 'wall', char: '■'};
      break;
    case 'start':
      clearType('start');
      grid[r][c] = {type: 'start', char: ''};
      renderGrid(); return;
    case 'goal':
      clearType('goal');
      grid[r][c] = {type: 'goal', char: ''};
      renderGrid(); return;
    case 'obstacle':
      grid[r][c] = {type: 'obstacle', char: obstChar.value || '?'};
      break;
    case 'collect':
      grid[r][c] = {type: 'collect', char: collectChar.value || '?'};
      break;
  }
  updateCell(r, c);
}

function clearType(type) {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].type === type) {
        grid[r][c] = {type: 'path', char: ''};
      }
    }
  }
}

/* =============================================
   モード切替
   ============================================= */
btnPlace.addEventListener('click', function() {
  currentMode = 'place';
  btnPlace.classList.add('active');
  btnDelete.classList.remove('active');
  const tl = document.getElementById('tool-list');
  tl.style.opacity = '1';
  tl.style.pointerEvents = '';
  document.body.classList.remove('delete-mode');
  document.body.classList.add('place-mode');
});

btnDelete.addEventListener('click', function() {
  currentMode = 'delete';
  btnDelete.classList.add('active');
  btnPlace.classList.remove('active');
  const tl = document.getElementById('tool-list');
  tl.style.opacity = '0.4';
  tl.style.pointerEvents = 'none';
  document.body.classList.remove('place-mode');
  document.body.classList.add('delete-mode');
});

/* ─── ツール選択 ─── */
toolBtns.forEach(function(btn) {
  btn.addEventListener('click', function() {
    toolBtns.forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    currentTool = btn.dataset.tool;
  });
});

/* =============================================
   エクスポート
   ============================================= */
const COLOR = {
  wall:    '#1a120a',
  paper:   '#f0e8cc',
  cobalt:  '#1a4a7a',
  gold:    '#9a7a32',
  red:     '#c0392b',
  secret:  '#4a1030',
  ink_mid: '#3a2c18',
};

function drawToCanvas() {
  const CELL = 36;
  const canvas = document.createElement('canvas');
  canvas.width  = cols * CELL;
  canvas.height = rows * CELL;
  const ctx = canvas.getContext('2d');

  ctx.font = 'bold ' + (CELL * 0.55) + "px 'Yu Mincho','Noto Serif JP',serif";
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      const x = c * CELL, y = r * CELL;
      const cx = x + CELL / 2, cy = y + CELL / 2;

      let bg = COLOR.paper;
      if (cell.type === 'wall')  bg = COLOR.wall;
      if (cell.type === 'start') bg = COLOR.cobalt;
      if (cell.type === 'goal')  bg = COLOR.gold;
      ctx.fillStyle = bg;
      ctx.fillRect(x, y, CELL, CELL);

      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth   = 0.5;
      ctx.strokeRect(x, y, CELL, CELL);

      let fg = null, label = '';
      if (cell.type === 'wall')     { fg = '#e4d8b0'; label = '■'; }
      if (cell.type === 'start')    { fg = COLOR.paper; label = 'ス'; ctx.font = 'bold ' + (CELL*0.45) + "px 'Yu Mincho',serif"; }
      if (cell.type === 'goal')     { fg = COLOR.paper; label = 'ゴ'; ctx.font = 'bold ' + (CELL*0.45) + "px 'Yu Mincho',serif"; }
      if (cell.type === 'obstacle') { fg = COLOR.red;    label = cell.char; }
      if (cell.type === 'collect')  { fg = COLOR.secret; label = cell.char; }

      if (fg && label) {
        ctx.fillStyle = fg;
        ctx.fillText(label, cx, cy);
        ctx.font = 'bold ' + (CELL * 0.55) + "px 'Yu Mincho','Noto Serif JP',serif";
      }
    }
  }

  ctx.strokeStyle = COLOR.wall;
  ctx.lineWidth   = 3;
  ctx.strokeRect(1.5, 1.5, canvas.width - 3, canvas.height - 3);

  return canvas;
}

document.getElementById('btn-png').addEventListener('click', function() {
  const canvas = drawToCanvas();
  const a = document.createElement('a');
  a.href     = canvas.toDataURL('image/png');
  a.download = 'maze.png';
  a.click();
});

document.getElementById('btn-jpg').addEventListener('click', function() {
  const canvas = drawToCanvas();
  const c2 = document.createElement('canvas');
  c2.width = canvas.width; c2.height = canvas.height;
  const ctx2 = c2.getContext('2d');
  ctx2.fillStyle = '#ffffff';
  ctx2.fillRect(0, 0, c2.width, c2.height);
  ctx2.drawImage(canvas, 0, 0);
  const a = document.createElement('a');
  a.href     = c2.toDataURL('image/jpeg', 0.92);
  a.download = 'maze.jpg';
  a.click();
});

document.getElementById('btn-html').addEventListener('click', function() {
  const typeInfo = {
    wall:     {cls: 'mz-wall',  txt: '■'},
    path:     {cls: 'mz-path',  txt: ''},
    start:    {cls: 'mz-start', txt: 'スタート'},
    goal:     {cls: 'mz-goal',  txt: 'ゴール'},
    obstacle: {cls: 'mz-obs',   txt: null},
    collect:  {cls: 'mz-col',   txt: null},
  };

  let rows_html = '';
  for (let r = 0; r < rows; r++) {
    let tds = '';
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      const info = typeInfo[cell.type];
      const txt  = info.txt !== null ? info.txt : (cell.char || '');
      tds += '<td class="' + info.cls + '">' + txt + '</td>';
    }
    rows_html += '<tr>' + tds + '</tr>\n';
  }

  const div = '<!-- 迷路 maze-maker export -->\n' +
    '<style>\n' +
    '.mz-wrap { display:inline-block; border:2px solid #1a120a; box-shadow:3px 3px 0 #3a2c18; }\n' +
    '.mz-wrap table { border-collapse:collapse; display:block; }\n' +
    '.mz-wrap td { width:36px; height:36px; text-align:center; vertical-align:middle;\n' +
    '  font-size:0.8rem; font-weight:700; line-height:1;\n' +
    "  border:1px solid rgba(0,0,0,0.08);\n" +
    "  font-family:'Shippori Mincho','Noto Serif JP','Yu Mincho',serif; }\n" +
    '.mz-wall  { background:#1a120a; color:#e4d8b0; font-size:0.7rem; }\n' +
    '.mz-path  { background:#f0e8cc; }\n' +
    '.mz-start { background:#1a4a7a; color:#f0e8cc; font-size:0.55rem; }\n' +
    '.mz-goal  { background:#9a7a32; color:#f0e8cc; font-size:0.6rem; }\n' +
    '.mz-obs   { background:#f0e8cc; color:#c0392b; }\n' +
    '.mz-col   { background:#f0e8cc; color:#4a1030; }\n' +
    '</style>\n' +
    '<div class="mz-wrap">\n<table>\n' + rows_html + '</table>\n</div>';

  const btn = document.getElementById('btn-html');

  navigator.clipboard.writeText(div).then(function() {
    btn.textContent = '✅ コピーしました';
    setTimeout(function() {
      btn.innerHTML = '📄 HTML（&lt;div&gt;のみ）';
    }, 2000);
  }).catch(function() {
    const ta = document.createElement('textarea');
    ta.value = div;
    ta.style.cssText = 'position:fixed;top:1rem;left:1rem;right:1rem;height:12rem;z-index:9999;font-size:0.7rem;';
    document.body.appendChild(ta);
    ta.select();
    alert('クリップボードAPIが使えません。上のテキストを手動でコピーしてください。');
  });
});

/* =============================================
   スクロールコントロール（スマホ用）
   ============================================= */
(function initScrollControls() {
  const gridScroll = document.getElementById('grid-scroll');
  if (!gridScroll) return;

  const STEP = 60; // 1回のスクロール量(px)
  let timer = null;

  function startScroll(dx, dy) {
    stopScroll();
    function step() {
      gridScroll.scrollLeft += dx;
      gridScroll.scrollTop  += dy;
      timer = requestAnimationFrame(step);
    }
    timer = requestAnimationFrame(step);
  }

  function stopScroll() {
    if (timer !== null) { cancelAnimationFrame(timer); timer = null; }
  }

  var btnMap = [
    { id: 'scroll-left',  dx: -STEP, dy: 0     },
    { id: 'scroll-right', dx:  STEP, dy: 0     },
    { id: 'scroll-up',    dx: 0,     dy: -STEP },
    { id: 'scroll-down',  dx: 0,     dy:  STEP },
  ];

  btnMap.forEach(function(b) {
    var el = document.getElementById(b.id);
    if (!el) return;

    /* PC: マウス長押し */
    el.addEventListener('mousedown', function() { startScroll(b.dx, b.dy); });
    window.addEventListener('mouseup', stopScroll);

    /* スマホ: タッチ長押し */
    el.addEventListener('touchstart', function(e) {
      e.preventDefault();
      startScroll(b.dx, b.dy);
    }, { passive: false });
    el.addEventListener('touchend',    stopScroll);
    el.addEventListener('touchcancel', stopScroll);
  });
})();
