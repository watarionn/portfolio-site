'use strict';

/* =============================================
   Stage 9 / Maze Draft Board
   ============================================= */
let rows = 10, cols = 19;
let grid = [];
let currentMode = 'place';
let currentTool = 'wall';
let isDragging = false;
let activeCell = { r: 0, c: 0 };
let undoStack = [];
let redoStack = [];
let actionSnapshotTaken = false;
const MAX_HISTORY = 80;

const inpRows = document.getElementById('inp-rows');
const inpCols = document.getElementById('inp-cols');
const btnGen = document.getElementById('btn-generate');
const toolPanel = document.getElementById('tool-panel');
const gridWrap = document.getElementById('grid-wrap');
const mazeBody = document.getElementById('maze-body');
const btnPlace = document.getElementById('btn-place');
const btnDelete = document.getElementById('btn-delete');
const toolBtns = document.querySelectorAll('.tool-btn[data-tool]');
const obstChar = document.getElementById('obstacle-char');
const collectChar = document.getElementById('collect-char');
const exportPanel = document.getElementById('export-panel');
const btnUndo = document.getElementById('btn-undo');
const btnRedo = document.getElementById('btn-redo');
const btnClear = document.getElementById('btn-clear');
const statusLive = document.getElementById('status-live');
const gridSizeStat = document.getElementById('grid-size-stat');
const wallCount = document.getElementById('wall-count');
const markCount = document.getElementById('mark-count');

function announce(message) {
  statusLive.textContent = message;
}

function cloneGrid(source = grid) {
  return source.map(row => row.map(cell => ({ type: cell.type, char: cell.char })));
}

function snapshotState() {
  return { rows, cols, grid: cloneGrid() };
}

function pushSnapshot() {
  if (!grid.length) return;
  undoStack.push(snapshotState());
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack = [];
  updateHistoryButtons();
}

function beginAction() {
  actionSnapshotTaken = false;
}

function ensureSnapshot() {
  if (actionSnapshotTaken) return;
  pushSnapshot();
  actionSnapshotTaken = true;
}

function updateHistoryButtons() {
  btnUndo.disabled = undoStack.length === 0;
  btnRedo.disabled = redoStack.length === 0;
}

function restoreSnapshot(snapshot) {
  rows = snapshot.rows;
  cols = snapshot.cols;
  grid = cloneGrid(snapshot.grid);
  inpRows.value = rows;
  inpCols.value = cols;
  activeCell = { r: 0, c: 0 };
  revealWorkbench();
  renderGrid();
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshotState());
  const previous = undoStack.pop();
  restoreSnapshot(previous);
  updateHistoryButtons();
  announce('1操作戻しました。');
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshotState());
  const next = redoStack.pop();
  restoreSnapshot(next);
  updateHistoryButtons();
  announce('操作をやり直しました。');
}

function revealWorkbench() {
  toolPanel.classList.remove('hidden');
  gridWrap.classList.remove('hidden');
  exportPanel.classList.remove('hidden');
}

function initGrid() {
  grid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const edge = r === 0 || r === rows - 1 || c === 0 || c === cols - 1;
      row.push(edge ? { type: 'wall', char: '■' } : { type: 'path', char: '' });
    }
    grid.push(row);
  }
}

function updateStats() {
  let walls = 0;
  let marks = 0;
  grid.flat().forEach(cell => {
    if (cell.type === 'wall') walls += 1;
    if (!['wall', 'path'].includes(cell.type)) marks += 1;
  });
  gridSizeStat.textContent = `${rows}×${cols}`;
  wallCount.textContent = String(walls);
  markCount.textContent = String(marks);
}

function generateNewGrid() {
  const nextRows = Math.max(3, Math.min(40, parseInt(inpRows.value, 10) || 10));
  const nextCols = Math.max(3, Math.min(60, parseInt(inpCols.value, 10) || 19));
  if (grid.length) pushSnapshot();
  rows = nextRows;
  cols = nextCols;
  inpRows.value = rows;
  inpCols.value = cols;
  activeCell = { r: 0, c: 0 };
  initGrid();
  revealWorkbench();
  renderGrid();
  announce(`${rows}×${cols} の新しい下書きを作りました。`);
}

btnGen.addEventListener('click', generateNewGrid);
document.querySelectorAll('.preset-btn').forEach(button => {
  button.addEventListener('click', () => {
    const [r, c] = button.dataset.size.split('x').map(Number);
    inpRows.value = r;
    inpCols.value = c;
    announce(`${r}×${c} を選択しました。「新しい下書きを作る」で反映します。`);
  });
});

function cellLabel(r, c, cell) {
  const names = { wall: '壁', path: '通路', start: 'スタート', goal: 'ゴール', obstacle: `障害物 ${cell.char}`, collect: `収集物 ${cell.char}` };
  return `${r + 1}行 ${c + 1}列、${names[cell.type] || cell.type}`;
}

function focusCell(r, c) {
  const nextR = Math.max(0, Math.min(rows - 1, r));
  const nextC = Math.max(0, Math.min(cols - 1, c));
  activeCell = { r: nextR, c: nextC };
  mazeBody.querySelectorAll('td').forEach(cell => { cell.tabIndex = -1; });
  const target = mazeBody.rows[nextR]?.cells[nextC];
  if (target) {
    target.tabIndex = 0;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}

function renderGrid() {
  mazeBody.replaceChildren();
  const fragment = document.createDocumentFragment();
  for (let r = 0; r < rows; r++) {
    const tr = document.createElement('tr');
    for (let c = 0; c < cols; c++) {
      const td = document.createElement('td');
      td.dataset.r = String(r);
      td.dataset.c = String(c);
      td.tabIndex = r === activeCell.r && c === activeCell.c ? 0 : -1;
      td.setAttribute('aria-label', cellLabel(r, c, grid[r][c]));
      applyCellStyle(td, grid[r][c]);
      bindCellEvents(td, r, c);
      tr.appendChild(td);
    }
    fragment.appendChild(tr);
  }
  mazeBody.appendChild(fragment);
  updateStats();
}

function bindCellEvents(td, r, c) {
  td.addEventListener('focus', () => { activeCell = { r, c }; });
  td.addEventListener('mousedown', event => {
    beginAction();
    isDragging = true;
    activeCell = { r, c };
    handleCell(r, c);
    event.preventDefault();
  });
  td.addEventListener('mouseenter', () => {
    if (isDragging) handleCell(r, c);
  });
  td.addEventListener('touchstart', event => {
    beginAction();
    activeCell = { r, c };
    handleCell(r, c);
    event.preventDefault();
  }, { passive: false });
  td.addEventListener('touchmove', event => {
    event.preventDefault();
    const touch = event.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target?.tagName === 'TD' && target.dataset.r !== undefined) {
      handleCell(Number(target.dataset.r), Number(target.dataset.c));
    }
  }, { passive: false });
  td.addEventListener('keydown', event => {
    const moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (moves[event.key]) {
      event.preventDefault();
      const [dr, dc] = moves[event.key];
      focusCell(r + dr, c + dc);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      beginAction();
      handleCell(r, c, true);
      return;
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      beginAction();
      deleteCell(r, c);
    }
  });
}

window.addEventListener('mouseup', () => {
  isDragging = false;
  actionSnapshotTaken = false;
});
window.addEventListener('touchend', () => { actionSnapshotTaken = false; }, { passive: true });

function applyCellStyle(td, cell) {
  td.className = '';
  td.textContent = '';
  switch (cell.type) {
    case 'wall': td.classList.add('wall'); td.textContent = '■'; break;
    case 'path': td.classList.add('path'); break;
    case 'start': td.classList.add('cell-start'); td.textContent = 'S'; break;
    case 'goal': td.classList.add('cell-goal'); td.textContent = 'G'; break;
    case 'obstacle': td.classList.add('obstacle'); td.textContent = cell.char; break;
    case 'collect': td.classList.add('collect'); td.textContent = cell.char; break;
  }
}

function updateCell(r, c) {
  const td = mazeBody.rows[r]?.cells[c];
  if (!td) return;
  applyCellStyle(td, grid[r][c]);
  td.setAttribute('aria-label', cellLabel(r, c, grid[r][c]));
  updateStats();
}

function sameCell(a, b) {
  return a.type === b.type && a.char === b.char;
}

function deleteCell(r, c) {
  const edge = r === 0 || r === rows - 1 || c === 0 || c === cols - 1;
  if (edge || grid[r][c].type === 'path') return;
  ensureSnapshot();
  grid[r][c] = { type: 'path', char: '' };
  updateCell(r, c);
}

function handleCell(r, c, restoreFocus = false) {
  if (currentMode === 'delete') {
    deleteCell(r, c);
    return;
  }

  let next = null;
  if (currentTool === 'wall') next = { type: 'wall', char: '■' };
  if (currentTool === 'obstacle') next = { type: 'obstacle', char: obstChar.value || '?' };
  if (currentTool === 'collect') next = { type: 'collect', char: collectChar.value || '?' };

  if (next) {
    if (sameCell(grid[r][c], next)) return;
    ensureSnapshot();
    grid[r][c] = next;
    updateCell(r, c);
    return;
  }

  if (currentTool === 'start' || currentTool === 'goal') {
    if (grid[r][c].type === currentTool) return;
    ensureSnapshot();
    clearType(currentTool);
    grid[r][c] = { type: currentTool, char: '' };
    activeCell = { r, c };
    renderGrid();
    if (restoreFocus) requestAnimationFrame(() => focusCell(r, c));
  }
}

function clearType(type) {
  grid.forEach(row => row.forEach(cell => {
    if (cell.type === type) Object.assign(cell, { type: 'path', char: '' });
  }));
}

function setMode(mode) {
  currentMode = mode;
  const deleting = mode === 'delete';
  btnPlace.classList.toggle('active', !deleting);
  btnDelete.classList.toggle('active', deleting);
  btnPlace.setAttribute('aria-pressed', String(!deleting));
  btnDelete.setAttribute('aria-pressed', String(deleting));
  document.body.classList.toggle('place-mode', !deleting);
  document.body.classList.toggle('delete-mode', deleting);
  announce(deleting ? '削除モードに切り替えました。' : '設置モードに切り替えました。');
}

btnPlace.addEventListener('click', () => setMode('place'));
btnDelete.addEventListener('click', () => setMode('delete'));

toolBtns.forEach(button => {
  button.addEventListener('click', () => {
    toolBtns.forEach(item => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    currentTool = button.dataset.tool;
    if (currentMode === 'delete') setMode('place');
    announce(`${button.textContent.trim()}ツールを選択しました。`);
  });
});

btnUndo.addEventListener('click', undo);
btnRedo.addEventListener('click', redo);
btnClear.addEventListener('click', () => {
  if (!grid.length) return;
  pushSnapshot();
  initGrid();
  activeCell = { r: 0, c: 0 };
  renderGrid();
  announce('盤面を初期状態へ戻しました。Undoで復元できます。');
});

document.addEventListener('keydown', event => {
  const target = event.target;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    if (event.shiftKey) redo(); else undo();
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
    event.preventDefault();
    redo();
  }
});

function escapeHtmlText(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

/* =============================================
   エクスポート
   ============================================= */
const COLOR = {
  wall:    '#17212b',
  paper:   '#fffdf8',
  cobalt:  '#2d7291',
  gold:    '#d8b957',
  red:     '#d96b38',
  secret:  '#52745c',
  ink_mid: '#17212b',
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
      if (cell.type === 'wall')     { fg = '#f4f0e7'; label = '■'; }
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
      tds += '<td class="' + info.cls + '">' + escapeHtmlText(txt) + '</td>';
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
    announce('HTMLコードをクリップボードへコピーしました。');
  }).catch(function() {
    const ta = document.createElement('textarea');
    ta.value = div;
    ta.style.cssText = 'position:fixed;top:1rem;left:1rem;right:1rem;height:12rem;z-index:9999;font-size:0.7rem;';
    document.body.appendChild(ta);
    ta.select();
    alert('クリップボードAPIが使えません。上のテキストを手動でコピーしてください。');
  });
});



/* 初期表示から編集できる状態にする */
initGrid();
revealWorkbench();
renderGrid();
updateHistoryButtons();
announce('10×19 の下書きを用意しました。');

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
