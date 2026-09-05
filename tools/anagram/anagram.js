'use strict';

/* =============================================
   アナグラム生成補助 — anagram.js
   ============================================= */

/* ─── 状態 ─── */
let tiles      = [];
let nextId     = 0;
let builtList  = [];

/* ─── ドラッグ状態 ─── */
let dragSrcId   = null;  // PC ドラッグ中のタイルID
let dragMoved   = false; // クリックとドラッグを区別するフラグ
let touchSrcId  = null;  // タッチドラッグ中のタイルID
let touchClone  = null;  // タッチ用クローン要素

/* ─── DOM参照 ─── */
const sourceInput    = document.getElementById('sourceInput');
const parseBtn       = document.getElementById('parseBtn');
const resetBtn       = document.getElementById('resetBtn');
const tileArea       = document.getElementById('tileArea');
const tileEmpty      = document.getElementById('tileEmpty');
const chunkBtn       = document.getElementById('chunkBtn');
const selCount       = document.getElementById('selCount');
const chunkList      = document.getElementById('chunkList');
const chunkEmpty     = document.getElementById('chunkEmpty');
const builtTiles     = document.getElementById('builtTiles');
const resultInput    = document.getElementById('resultInput');
const clearResultBtn = document.getElementById('clearResultBtn');
const statusCheck    = document.getElementById('statusCheck');
const remainStatus   = document.getElementById('remaining-status');

/* =============================================
   分割・リセット
   ============================================= */
parseBtn.addEventListener('click', parse);
sourceInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') parse();
});

function parse() {
  const raw = sourceInput.value;
  if (!raw.trim()) return;
  tiles     = [...raw].map(function(ch) {
    return { id: nextId++, chars: [ch], isChunk: false, state: 'unused' };
  });
  builtList         = [];
  resultInput.value = '';
  renderTiles();
  renderChunks();
  syncUsed();
  updateStatus();
}

resetBtn.addEventListener('click', function() {
  tiles = []; builtList = [];
  resultInput.value = ''; sourceInput.value = '';
  tileArea.innerHTML = '';
  tileArea.appendChild(tileEmpty);
  tileEmpty.style.display = '';
  chunkList.innerHTML = '';
  chunkList.appendChild(chunkEmpty);
  chunkEmpty.style.display = '';
  builtTiles.innerHTML = '';
  updateStatus();
});

/* =============================================
   タイル描画
   ============================================= */
function renderTiles() {
  tileArea.innerHTML = '';
  if (!tiles.length) {
    tileArea.appendChild(tileEmpty);
    tileEmpty.style.display = '';
    return;
  }
  tileEmpty.style.display = 'none';
  tiles.forEach(function(tile) {
    tileArea.appendChild(makeTileEl(tile));
  });
  updateChunkBtn();
}

function makeTileEl(tile) {
  const el = document.createElement('div');
  el.className  = 'tile' + (tile.isChunk ? ' is-chunk' : '') + ' state-' + tile.state;
  el.dataset.id = tile.id;
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', tile.state === 'used' ? '-1' : '0');
  el.setAttribute('aria-label', tileLabel(tile));
  el.setAttribute('aria-pressed', tile.state === 'selected' ? 'true' : 'false');
  el.setAttribute('draggable', 'true');

  const label = document.createElement('span');
  label.textContent = tile.chars.join('');
  el.appendChild(label);

  if (tile.isChunk) {
    const del = document.createElement('button');
    del.className   = 'tile-del';
    del.textContent = '✕';
    del.setAttribute('aria-label', tile.chars.join('') + 'のチャンクを解除');
    del.addEventListener('click', function(e) {
      e.stopPropagation();
      breakChunk(tile.id);
    });
    el.appendChild(del);
  }

  /* ── PC クリック（タッチ操作後は発火させない） ── */
  el.addEventListener('click', function(e) {
    // タッチ操作由来の click は無視（touchend 側で処理済み）
    if (e.sourceCapabilities && !e.sourceCapabilities.firesTouchEvents) {
      if (dragMoved) return;
      handleTileClick(tile.id);
    } else if (!e.sourceCapabilities) {
      // sourceCapabilities 非対応ブラウザ：dragMoved で判断
      if (dragMoved) return;
      handleTileClick(tile.id);
    }
    // タッチ由来（firesTouchEvents === true）は何もしない
  });
  el.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTileClick(tile.id);
    }
  });

  /* ── PC ドラッグ ── */
  el.addEventListener('dragstart', function(e) {
    dragSrcId = tile.id;
    dragMoved = false;
    e.dataTransfer.effectAllowed = 'move';
    requestAnimationFrame(function() { el.classList.add('is-dragging'); });
  });

  el.addEventListener('drag', function() {
    dragMoved = true; // 少しでも動いたらクリック扱いしない
  });

  el.addEventListener('dragend', function() {
    el.classList.remove('is-dragging');
    clearDragOver();
    dragSrcId = null;
    // dragMoved は click イベント後にリセット
    setTimeout(function() { dragMoved = false; }, 0);
  });

  el.addEventListener('dragover', function(e) {
    if (dragSrcId === null || dragSrcId === tile.id) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    clearDragOver();
    el.classList.add('drag-over');
  });

  el.addEventListener('dragleave', function() {
    el.classList.remove('drag-over');
  });

  el.addEventListener('drop', function(e) {
    e.preventDefault();
    el.classList.remove('drag-over');
    if (dragSrcId === null || dragSrcId === tile.id) return;
    moveTileBefore(dragSrcId, tile.id);
  });

  /* ── タッチドラッグ ── */
  el.addEventListener('touchstart', function(e) {
    if (e.target.closest('.tile-del')) return;
    touchSrcId = tile.id;
    dragMoved  = false;

    // touchstart では座標だけ記録し、クローンはまだ作らない
    const touch = e.touches[0];
    el._touchStartX = touch.clientX;
    el._touchStartY = touch.clientY;
  }, { passive: false });

  el.addEventListener('touchmove', function(e) {
    if (touchSrcId !== tile.id) return;
    const touch = e.touches[0];
    const dx = touch.clientX - el._touchStartX;
    const dy = touch.clientY - el._touchStartY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 10px 以上動いた時点で初めてドラッグ開始
    if (!dragMoved && dist < 10) return;

    e.preventDefault();

    if (!dragMoved) {
      // ドラッグ開始：クローン生成
      dragMoved = true;
      const rect = el.getBoundingClientRect();
      touchClone = el.cloneNode(true);
      touchClone.style.cssText = [
        'position:fixed',
        'z-index:9999',
        'pointer-events:none',
        'opacity:0.85',
        'width:'  + rect.width  + 'px',
        'height:' + rect.height + 'px',
        'left:'   + (touch.clientX - rect.width  / 2) + 'px',
        'top:'    + (touch.clientY - rect.height / 2) + 'px',
        'transform:scale(1.1)',
        'box-shadow:0 6px 20px rgba(0,0,0,0.22)',
        'transition:none',
      ].join(';');
      document.body.appendChild(touchClone);
      el.classList.add('is-dragging');
    }

    // クローンを指に追従
    touchClone.style.left = (touch.clientX - touchClone.offsetWidth  / 2) + 'px';
    touchClone.style.top  = (touch.clientY - touchClone.offsetHeight / 2) + 'px';

    // 指の下のタイルをハイライト
    touchClone.style.display = 'none';
    const under = document.elementFromPoint(touch.clientX, touch.clientY);
    touchClone.style.display = '';
    clearDragOver();
    const targetEl = under && under.closest('.tile[data-id]');
    if (targetEl && parseInt(targetEl.dataset.id) !== touchSrcId) {
      targetEl.classList.add('drag-over');
    }
  }, { passive: false });

  el.addEventListener('touchend', function(e) {
    el.classList.remove('is-dragging');
    clearDragOver();

    if (!dragMoved) {
      // タップ：直接選択処理を呼ぶ
      // タッチ後の遅延 click イベントを抑制する
      e.preventDefault();
      handleTileClick(tile.id);
      touchSrcId = null;
      return;
    }

    // クローンを片付ける
    if (touchClone) {
      document.body.removeChild(touchClone);
      touchClone = null;
    }

    const touch    = e.changedTouches[0];
    const under    = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetEl = under && under.closest('.tile[data-id]');
    if (targetEl && parseInt(targetEl.dataset.id) !== touchSrcId) {
      moveTileBefore(touchSrcId, parseInt(targetEl.dataset.id));
    }
    touchSrcId = null;
    dragMoved  = false;
  });

  return el;
}

function clearDragOver() {
  tileArea.querySelectorAll('.tile.drag-over').forEach(function(t) {
    t.classList.remove('drag-over');
  });
}

/* ─── タイルを dstId の直前に移動 ─── */
function moveTileBefore(srcId, dstId) {
  const si = tiles.findIndex(function(t) { return t.id === srcId; });
  const di = tiles.findIndex(function(t) { return t.id === dstId; });
  if (si === -1 || di === -1) return;
  const moved = tiles.splice(si, 1)[0];
  // splice 後にインデックスがずれるので再取得
  const newDi = tiles.findIndex(function(t) { return t.id === dstId; });
  tiles.splice(newDi, 0, moved);
  renderTiles();
  syncUsed();
  updateStatus();
}

function tileLabel(tile) {
  const s = tile.chars.join('');
  if (tile.state === 'used')     return s + '（使用済）';
  if (tile.state === 'selected') return s + '（選択中）';
  return s;
}

/* =============================================
   タイルクリック
   ============================================= */
function handleTileClick(id) {
  const tile = tiles.find(function(t) { return t.id === id; });
  if (!tile || tile.state === 'used') return;
  tile.state = tile.state === 'selected' ? 'unused' : 'selected';
  updateChunkBtn();
  renderTiles();
  syncBuilt();
}

function updateChunkBtn() {
  const sel = tiles.filter(function(t) { return t.state === 'selected'; });
  chunkBtn.disabled    = sel.length < 2;
  selCount.textContent = sel.length > 0 ? sel.length + '文字選択中' : '';
}

/* =============================================
   チャンク
   ============================================= */
chunkBtn.addEventListener('click', function() {
  const selected = tiles.filter(function(t) { return t.state === 'selected'; });
  if (selected.length < 2) return;
  const indices   = selected.map(function(t) { return tiles.indexOf(t); }).sort(function(a,b){return a-b;});
  const chunkChars= indices.reduce(function(acc, i) { return acc.concat(tiles[i].chars); }, []);
  const firstIdx  = indices[0];
  const newTile   = { id: nextId++, chars: chunkChars, isChunk: true, state: 'unused' };
  const newTiles  = tiles.filter(function(t) { return t.state !== 'selected'; });
  newTiles.splice(firstIdx, 0, newTile);
  tiles = newTiles;
  renderTiles(); renderChunks(); syncUsed(); updateStatus();
});

function breakChunk(id) {
  const idx = tiles.findIndex(function(t) { return t.id === id; });
  if (idx === -1) return;
  const expanded = tiles[idx].chars.map(function(ch) {
    return { id: nextId++, chars: [ch], isChunk: false, state: 'unused' };
  });
  tiles.splice(idx, 1, ...expanded);
  builtList = builtList.filter(function(b) { return b.tileId !== id; });
  renderTiles(); renderChunks(); renderBuilt(); syncUsed(); updateStatus();
}

function renderChunks() {
  chunkList.innerHTML = '';
  const chunks = tiles.filter(function(t) { return t.isChunk; });
  if (!chunks.length) {
    chunkList.appendChild(chunkEmpty);
    chunkEmpty.style.display = '';
    return;
  }
  chunkEmpty.style.display = 'none';
  chunks.forEach(function(tile) {
    const badge = document.createElement('span');
    badge.className  = 'chunk-badge';
    badge.textContent = tile.chars.join('');
    const del = document.createElement('button');
    del.className   = 'chunk-badge-del';
    del.textContent = '✕';
    del.setAttribute('aria-label', tile.chars.join('') + 'のチャンクを解除');
    del.addEventListener('click', function() { breakChunk(tile.id); });
    badge.appendChild(del);
    chunkList.appendChild(badge);
  });
}

/* =============================================
   ビルドリスト
   ============================================= */
function syncBuilt() {
  const selectedIds = tiles
    .filter(function(t) { return t.state === 'selected'; })
    .map(function(t) { return t.id; });
  selectedIds.forEach(function(id) {
    if (!builtList.find(function(b) { return b.tileId === id; })) {
      const tile = tiles.find(function(t) { return t.id === id; });
      if (tile) builtList.push({ tileId: id, label: tile.chars.join('') });
    }
  });
  builtList = builtList.filter(function(b) { return selectedIds.indexOf(b.tileId) !== -1; });
  renderBuilt(); syncUsed(); updateStatus();
}

function renderBuilt() {
  builtTiles.innerHTML = '';
  builtList.forEach(function(b, i) {
    const el  = document.createElement('span');
    el.className  = 'built-tile';
    el.textContent = b.label;
    const del = document.createElement('button');
    del.className   = 'built-tile-del';
    del.textContent = '✕';
    del.setAttribute('aria-label', b.label + 'を削除');
    del.addEventListener('click', function() {
      const tile = tiles.find(function(t) { return t.id === b.tileId; });
      if (tile) tile.state = 'unused';
      builtList.splice(i, 1);
      renderBuilt(); renderTiles(); syncUsed(); updateStatus();
    });
    el.appendChild(del);
    builtTiles.appendChild(el);
  });
}

/* =============================================
   マッチング
   ============================================= */
resultInput.addEventListener('input', function() {
  syncUsed();
  updateStatus();
});

function syncUsed() {
  const typed    = [...resultInput.value];
  const builtIds = new Set(builtList.map(function(b) { return b.tileId; }));
  const usedIdx  = matchTyped(typed, tiles);

  tiles.forEach(function(tile, i) {
    if      (builtIds.has(tile.id))         tile.state = 'selected';
    else if (usedIdx.has(i))                tile.state = 'used';
    else if (tile.state !== 'selected')     tile.state = 'unused';
  });

  tiles.forEach(function(tile) {
    const el = tileArea.querySelector('[data-id="' + tile.id + '"]');
    if (!el) return;
    el.className = 'tile' + (tile.isChunk ? ' is-chunk' : '') + ' state-' + tile.state;
    el.setAttribute('tabindex', tile.state === 'used' ? '-1' : '0');
    el.setAttribute('aria-label', tileLabel(tile));
    el.setAttribute('aria-pressed', tile.state === 'selected' ? 'true' : 'false');
  });
}

/* 最長一致優先の貪欲マッチング。余剰文字を remaining に残して返す */
function matchTyped(typedChars, tilesArr) {
  const usedTileIdx = new Set();
  const remaining   = typedChars.slice();
  const sorted = tilesArr
    .map(function(t, i) { return { tile: t, idx: i }; })
    .sort(function(a, b) { return b.tile.chars.length - a.tile.chars.length; });

  sorted.forEach(function(item) {
    if (usedTileIdx.has(item.idx)) return;
    const word = item.tile.chars.join('');
    const pos  = findSubsequence(remaining, [...word]);
    if (pos !== -1) {
      remaining.splice(pos, word.length);
      usedTileIdx.add(item.idx);
    }
  });

  // remaining に残った文字が余剰文字（タイルに存在しない）
  usedTileIdx._excess = remaining;
  return usedTileIdx;
}

function findSubsequence(arr, sub) {
  if (sub.length === 0) return -1;
  for (let i = 0; i <= arr.length - sub.length; i++) {
    let ok = true;
    for (let j = 0; j < sub.length; j++) {
      if (arr[i + j] !== sub[j]) { ok = false; break; }
    }
    if (ok) return i;
  }
  return -1;
}

/* =============================================
   ステータスバー
   ============================================= */
function updateStatus() {
  if (!tiles.length) {
    remainStatus.textContent = '';
    statusCheck.textContent  = '';
    statusCheck.className    = 'status-check';
    return;
  }

  const typed   = [...resultInput.value];
  const matched = matchTyped(typed, tiles);
  const excess  = matched._excess || []; // タイルにない余剰文字

  // ① エラー：タイルに存在しない文字が入力されている
  if (excess.length > 0) {
    const excessStr = excess.join('');
    remainStatus.textContent = '「' + excessStr + '」は元の文字列にありません';
    statusCheck.textContent  = '入力エラー ✕';
    statusCheck.className    = 'status-check error';
    return;
  }

  const unusedTiles = tiles.filter(function(t) { return t.state === 'unused'; });
  const totalChars  = tiles.reduce(function(s, t) { return s + t.chars.length; }, 0);
  const usedChars   = tiles
    .filter(function(t) { return t.state === 'used' || t.state === 'selected'; })
    .reduce(function(s, t) { return s + t.chars.length; }, 0);
  const remaining   = totalChars - usedChars;

  // ② 完成
  if (remaining === 0) {
    remainStatus.textContent = '全文字使用済み ✔';
    statusCheck.textContent  = '完成！';
    statusCheck.className    = 'status-check ok';
    return;
  }

  // ③ 未完成
  const unusedStr = unusedTiles.map(function(t) { return t.chars.join(''); }).join('・');
  remainStatus.textContent = '未使用: ' + unusedStr + '（' + remaining + '文字）';
  statusCheck.textContent  = '未完成';
  statusCheck.className    = 'status-check pending';
}

/* ─── クリアボタン ─── */
clearResultBtn.addEventListener('click', function() {
  resultInput.value = '';
  builtList = [];
  renderBuilt();
  tiles.forEach(function(t) { if (t.state === 'selected') t.state = 'unused'; });
  renderTiles();
  syncUsed();
  updateStatus();
});
