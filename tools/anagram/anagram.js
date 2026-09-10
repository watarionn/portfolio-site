'use strict';

let tiles = [];
let nextId = 0;
let builtList = [];
let chunkSelected = new Set();
let tileMode = 'compose';
let dragSrcId = null;
let dragMoved = false;
let touchSrcId = null;
let touchClone = null;

const segmenter = typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter('ja', { granularity: 'grapheme' })
  : null;

const sourceInput = document.getElementById('sourceInput');
const parseBtn = document.getElementById('parseBtn');
const resetBtn = document.getElementById('resetBtn');
const sourceCount = document.getElementById('sourceCount');
const uniqueCount = document.getElementById('uniqueCount');
const chunkCount = document.getElementById('chunkCount');
const remainingCount = document.getElementById('remainingCount');
const composeModeBtn = document.getElementById('composeModeBtn');
const chunkModeBtn = document.getElementById('chunkModeBtn');
const tileArea = document.getElementById('tileArea');
const tileEmpty = document.getElementById('tileEmpty');
const chunkBtn = document.getElementById('chunkBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const selCount = document.getElementById('selCount');
const chunkList = document.getElementById('chunkList');
const chunkEmpty = document.getElementById('chunkEmpty');
const builtTiles = document.getElementById('builtTiles');
const resultInput = document.getElementById('resultInput');
const clearResultBtn = document.getElementById('clearResultBtn');
const copyResultBtn = document.getElementById('copyResultBtn');
const compositionText = document.getElementById('compositionText');
const statusCheck = document.getElementById('statusCheck');
const remainStatus = document.getElementById('remaining-status');

function segmentText(value) {
  if (!value) return [];
  if (!segmenter) return Array.from(value);
  return Array.from(segmenter.segment(value), part => part.segment);
}

function getTile(id) {
  return tiles.find(tile => tile.id === id) || null;
}

function getBuiltIds() {
  return new Set(builtList.map(item => item.tileId));
}

function getBuiltText() {
  return builtList.map(item => item.label).join('');
}

function getCompositionText() {
  return getBuiltText() + resultInput.value;
}
function findSequence(arr, sub) {
  if (!sub.length) return -1;
  for (let i = 0; i <= arr.length - sub.length; i += 1) {
    let ok = true;
    for (let j = 0; j < sub.length; j += 1) {
      if (arr[i + j] !== sub[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return i;
  }
  return -1;
}

function matchTyped(typedChars, candidates) {
  const usedIds = new Set();
  const remaining = typedChars.slice();
  const sorted = candidates.slice().sort((a, b) => b.chars.length - a.chars.length);

  sorted.forEach(tile => {
    const pos = findSequence(remaining, tile.chars);
    if (pos === -1) return;
    remaining.splice(pos, tile.chars.length);
    usedIds.add(tile.id);
  });

  return { usedIds, excess: remaining };
}

function evaluateUsage() {
  const builtIds = getBuiltIds();
  const typed = segmentText(resultInput.value);
  const candidates = tiles.filter(tile => !builtIds.has(tile.id));
  const matched = matchTyped(typed, candidates);

  chunkSelected.forEach(id => {
    if (matched.usedIds.has(id) || builtIds.has(id)) chunkSelected.delete(id);
  });
  tiles.forEach(tile => {
    if (builtIds.has(tile.id)) tile.state = 'built';
    else if (matched.usedIds.has(tile.id)) tile.state = 'used';
    else if (chunkSelected.has(tile.id)) tile.state = 'selected';
    else tile.state = 'unused';
  });

  return { builtIds, typed, usedIds: matched.usedIds, excess: matched.excess };
}

function tileLabel(tile) {
  const text = tile.chars.join('');
  if (tile.state === 'built') return text + '（構成中。押すと戻す）';
  if (tile.state === 'used') return text + '（手入力で使用済み）';
  if (tile.state === 'selected') return text + '（チャンク候補）';
  return text + (tileMode === 'chunk' ? '（チャンク候補へ追加）' : '（結果へ追加）');
}

function updateModeButtons() {
  const composing = tileMode === 'compose';
  composeModeBtn.classList.toggle('active', composing);
  chunkModeBtn.classList.toggle('active', !composing);
  composeModeBtn.setAttribute('aria-pressed', String(composing));
  chunkModeBtn.setAttribute('aria-pressed', String(!composing));
}

function setTileMode(mode) {
  tileMode = mode;
  if (mode === 'compose') chunkSelected.clear();
  updateModeButtons();
  reconcile();
}

function updateChunkControls() {
  chunkBtn.disabled = chunkSelected.size < 2;
  shuffleBtn.disabled = tiles.length < 2;
  selCount.textContent = chunkSelected.size ? chunkSelected.size + 'タイル選択中' : '';
}
function renderTiles() {
  tileArea.replaceChildren();
  if (!tiles.length) {
    tileArea.appendChild(tileEmpty);
    tileEmpty.style.display = '';
    updateChunkControls();
    return;
  }
  tileEmpty.style.display = 'none';
  tiles.forEach(tile => tileArea.appendChild(makeTileElement(tile)));
  updateChunkControls();
}

function makeTileElement(tile) {
  const el = document.createElement('div');
  el.className = 'tile' + (tile.isChunk ? ' is-chunk' : '') + ' state-' + tile.state;
  el.dataset.id = String(tile.id);
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', tile.state === 'used' ? '-1' : '0');
  el.setAttribute('aria-label', tileLabel(tile));
  el.setAttribute('aria-pressed', String(tile.state === 'selected' || tile.state === 'built'));
  el.setAttribute('draggable', 'true');

  const label = document.createElement('span');
  label.textContent = tile.chars.join('');
  el.appendChild(label);

  if (tile.isChunk) {
    const del = document.createElement('button');
    del.className = 'tile-del';
    del.type = 'button';
    del.textContent = '×';
    del.setAttribute('aria-label', tile.chars.join('') + 'のチャンクを解除');
    del.addEventListener('click', event => {
      event.stopPropagation();
      breakChunk(tile.id);
    });
    el.appendChild(del);
  }
  el.addEventListener('click', event => {
    if (event.sourceCapabilities?.firesTouchEvents) return;
    if (dragMoved) return;
    handleTileAction(tile.id);
  });
  el.addEventListener('keydown', event => {
    if (event.altKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
      moveTileBy(tile.id, event.key === 'ArrowLeft' ? -1 : 1);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleTileAction(tile.id);
    }
  });

  el.addEventListener('dragstart', event => {
    dragSrcId = tile.id;
    dragMoved = false;
    event.dataTransfer.effectAllowed = 'move';
    requestAnimationFrame(() => el.classList.add('is-dragging'));
  });
  el.addEventListener('drag', () => { dragMoved = true; });
  el.addEventListener('dragend', () => {
    el.classList.remove('is-dragging');
    clearDragOver();
    dragSrcId = null;
    setTimeout(() => { dragMoved = false; }, 0);
  });
  el.addEventListener('dragover', event => {
    if (dragSrcId === null || dragSrcId === tile.id) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    clearDragOver();
    el.classList.add('drag-over');
  });
  el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
  el.addEventListener('drop', event => {
    event.preventDefault();
    el.classList.remove('drag-over');
    if (dragSrcId === null || dragSrcId === tile.id) return;
    moveTileBefore(dragSrcId, tile.id);
  });

  el.addEventListener('touchstart', event => {
    if (event.target.closest('.tile-del')) return;
    const touch = event.touches[0];
    touchSrcId = tile.id;
    dragMoved = false;
    el._touchStartX = touch.clientX;
    el._touchStartY = touch.clientY;
  }, { passive: false });

  el.addEventListener('touchmove', event => {
    if (touchSrcId !== tile.id) return;
    const touch = event.touches[0];
    const dx = touch.clientX - el._touchStartX;
    const dy = touch.clientY - el._touchStartY;
    if (!dragMoved && Math.hypot(dx, dy) < 10) return;
    event.preventDefault();

    if (!dragMoved) {
      dragMoved = true;
      const rect = el.getBoundingClientRect();
      touchClone = el.cloneNode(true);
      Object.assign(touchClone.style, {
        position: 'fixed', zIndex: '9999', pointerEvents: 'none', opacity: '.85',
        width: rect.width + 'px', height: rect.height + 'px', transition: 'none'
      });
      document.body.appendChild(touchClone);
      el.classList.add('is-dragging');
    }
    touchClone.style.left = touch.clientX - touchClone.offsetWidth / 2 + 'px';
    touchClone.style.top = touch.clientY - touchClone.offsetHeight / 2 + 'px';
    touchClone.style.display = 'none';
    const under = document.elementFromPoint(touch.clientX, touch.clientY);
    touchClone.style.display = '';
    clearDragOver();
    const target = under?.closest('.tile[data-id]');
    if (target && Number(target.dataset.id) !== touchSrcId) target.classList.add('drag-over');
  }, { passive: false });

  el.addEventListener('touchend', event => {
    el.classList.remove('is-dragging');
    clearDragOver();
    if (!dragMoved) {
      event.preventDefault();
      handleTileAction(tile.id);
      touchSrcId = null;
      return;
    }
    if (touchClone) {
      touchClone.remove();
      touchClone = null;
    }
    const touch = event.changedTouches[0];
    const under = document.elementFromPoint(touch.clientX, touch.clientY);
    const target = under?.closest('.tile[data-id]');
    if (target && Number(target.dataset.id) !== touchSrcId) {
      moveTileBefore(touchSrcId, Number(target.dataset.id));
    }
    touchSrcId = null;
    dragMoved = false;
  });

  return el;
}

function clearDragOver() {
  tileArea.querySelectorAll('.tile.drag-over').forEach(tile => tile.classList.remove('drag-over'));
}
function moveTileBefore(srcId, dstId) {
  const sourceIndex = tiles.findIndex(tile => tile.id === srcId);
  if (sourceIndex === -1) return;
  const moved = tiles.splice(sourceIndex, 1)[0];
  const targetIndex = tiles.findIndex(tile => tile.id === dstId);
  if (targetIndex === -1) {
    tiles.push(moved);
  } else {
    tiles.splice(targetIndex, 0, moved);
  }
  reconcile();
  requestAnimationFrame(() => tileArea.querySelector('[data-id="' + srcId + '"]')?.focus());
}

function moveTileBy(id, delta) {
  const index = tiles.findIndex(tile => tile.id === id);
  const next = index + delta;
  if (index === -1 || next < 0 || next >= tiles.length) return;
  const moved = tiles.splice(index, 1)[0];
  tiles.splice(next, 0, moved);
  reconcile();
  requestAnimationFrame(() => tileArea.querySelector('[data-id="' + id + '"]')?.focus());
}

function handleTileAction(id) {
  const tile = getTile(id);
  if (!tile || tile.state === 'used') return;

  if (tileMode === 'chunk') {
    if (tile.state === 'built') return;
    if (chunkSelected.has(id)) chunkSelected.delete(id);
    else chunkSelected.add(id);
    reconcile();
    return;
  }

  chunkSelected.delete(id);
  const builtIndex = builtList.findIndex(item => item.tileId === id);
  if (builtIndex >= 0) builtList.splice(builtIndex, 1);
  else builtList.push({ tileId: id, label: tile.chars.join('') });
  reconcile();
}
function createChunk() {
  const selectedTiles = tiles.filter(tile => chunkSelected.has(tile.id));
  if (selectedTiles.length < 2) return;
  const firstIndex = Math.min(...selectedTiles.map(tile => tiles.indexOf(tile)));
  const chars = selectedTiles.flatMap(tile => tile.chars);
  const selectedIds = new Set(selectedTiles.map(tile => tile.id));
  tiles = tiles.filter(tile => !selectedIds.has(tile.id));
  tiles.splice(firstIndex, 0, { id: nextId++, chars, isChunk: true, state: 'unused' });
  chunkSelected.clear();
  reconcile();
}

function breakChunk(id) {
  const index = tiles.findIndex(tile => tile.id === id);
  if (index === -1 || !tiles[index].isChunk) return;
  builtList = builtList.filter(item => item.tileId !== id);
  chunkSelected.delete(id);
  const expanded = tiles[index].chars.map(char => ({
    id: nextId++, chars: [char], isChunk: false, state: 'unused'
  }));
  tiles.splice(index, 1, ...expanded);
  reconcile();
}

function shuffleTiles() {
  for (let i = tiles.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  reconcile();
}

function renderChunks() {
  chunkList.replaceChildren();
  const chunks = tiles.filter(tile => tile.isChunk);
  if (!chunks.length) {
    chunkList.appendChild(chunkEmpty);
    chunkEmpty.style.display = '';
    return;
  }
  chunkEmpty.style.display = 'none';
  chunks.forEach(tile => {
    const badge = document.createElement('span');
    badge.className = 'chunk-badge';
    badge.textContent = tile.chars.join('');
    const del = document.createElement('button');
    del.className = 'chunk-badge-del';
    del.type = 'button';
    del.textContent = '×';
    del.setAttribute('aria-label', tile.chars.join('') + 'のチャンクを解除');
    del.addEventListener('click', () => breakChunk(tile.id));
    badge.appendChild(del);
    chunkList.appendChild(badge);
  });
}

function renderBuilt() {
  builtTiles.replaceChildren();
  builtList.forEach((item, index) => {
    const tile = getTile(item.tileId);
    if (!tile) return;
    const el = document.createElement('span');
    el.className = 'built-tile';
    el.append(document.createTextNode(item.label));
    const del = document.createElement('button');
    del.className = 'built-tile-del';
    del.type = 'button';
    del.textContent = '×';
    del.setAttribute('aria-label', item.label + 'を構成から外す');
    del.addEventListener('click', () => {
      builtList.splice(index, 1);
      reconcile();
    });
    el.appendChild(del);
    builtTiles.appendChild(el);
  });
}
function updateMetrics(evaluation) {
  const allChars = tiles.flatMap(tile => tile.chars);
  const remainingTiles = tiles.filter(tile => tile.state === 'unused' || tile.state === 'selected');
  const remain = remainingTiles.reduce((sum, tile) => sum + tile.chars.length, 0);
  sourceCount.textContent = String(allChars.length);
  uniqueCount.textContent = String(new Set(allChars).size);
  chunkCount.textContent = String(tiles.filter(tile => tile.isChunk).length);
  remainingCount.textContent = String(remain);

  const composed = getCompositionText();
  compositionText.textContent = composed || '—';
  copyResultBtn.disabled = !composed;

  if (!tiles.length) {
    remainStatus.textContent = '';
    statusCheck.textContent = '';
    statusCheck.className = 'status-check';
    return;
  }

  if (evaluation.excess.length) {
    remainStatus.textContent = '「' + evaluation.excess.join('') + '」は残りタイルにありません';
    statusCheck.textContent = 'INPUT ERROR';
    statusCheck.className = 'status-check error';
    return;
  }

  if (remain === 0) {
    remainStatus.textContent = '全文字を一度ずつ使用しています';
    statusCheck.textContent = 'COMPLETE ✓';
    statusCheck.className = 'status-check ok';
    return;
  }

  const unusedText = remainingTiles.map(tile => tile.chars.join('')).join('・');
  remainStatus.textContent = '未使用: ' + unusedText + '（' + remain + '文字）';
  statusCheck.textContent = 'IN PROGRESS';
  statusCheck.className = 'status-check pending';
}
function reconcile() {
  const evaluation = evaluateUsage();
  renderTiles();
  renderChunks();
  renderBuilt();
  updateMetrics(evaluation);
  updateModeButtons();
}

function parseSource() {
  const raw = sourceInput.value;
  if (!raw.trim()) return;
  nextId = 0;
  builtList = [];
  chunkSelected.clear();
  resultInput.value = '';
  tiles = segmentText(raw).map(char => ({
    id: nextId++, chars: [char], isChunk: false, state: 'unused'
  }));
  tileMode = 'compose';
  reconcile();
}

function resetAll() {
  tiles = [];
  nextId = 0;
  builtList = [];
  chunkSelected.clear();
  tileMode = 'compose';
  sourceInput.value = '';
  resultInput.value = '';
  reconcile();
  sourceInput.focus();
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const helper = document.createElement('textarea');
  helper.value = value;
  helper.setAttribute('readonly', '');
  helper.style.position = 'fixed';
  helper.style.opacity = '0';
  document.body.appendChild(helper);
  helper.select();
  document.execCommand('copy');
  helper.remove();
}
parseBtn.addEventListener('click', parseSource);
resetBtn.addEventListener('click', resetAll);
sourceInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') parseSource();
});
composeModeBtn.addEventListener('click', () => setTileMode('compose'));
chunkModeBtn.addEventListener('click', () => setTileMode('chunk'));
chunkBtn.addEventListener('click', createChunk);
shuffleBtn.addEventListener('click', shuffleTiles);
resultInput.addEventListener('input', reconcile);
clearResultBtn.addEventListener('click', () => {
  builtList = [];
  chunkSelected.clear();
  resultInput.value = '';
  reconcile();
  resultInput.focus();
});
copyResultBtn.addEventListener('click', async () => {
  const text = getCompositionText();
  if (!text) return;
  try {
    await copyText(text);
    const original = copyResultBtn.textContent;
    copyResultBtn.textContent = 'コピー済み';
    setTimeout(() => { copyResultBtn.textContent = original; }, 1200);
  } catch {
    copyResultBtn.textContent = 'コピー失敗';
    setTimeout(() => { copyResultBtn.textContent = '結果をコピー'; }, 1200);
  }
});

updateModeButtons();
reconcile();
