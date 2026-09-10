'use strict';

let N = 13;
let hollow = false;
let voxels = [];
let voxelSet = new Set();
let surfaceVoxels = [];
let currentLayer = 6;
let sliceAxis = 'top';
let currentView = '2d';
let cellSz = 18;

let rotX = 0.42;
let rotY = 0.62;
let zoom = 1;
let dragState = null;
let renderFrame = null;

const DEFAULT_VIEW = Object.freeze({ rotX: 0.42, rotY: 0.62, zoom: 1 });
const FACE_DEFS = Object.freeze([
  { neighbor: [1, 0, 0], normal: [1, 0, 0], shade: 0.82, corners: [[0.5,-0.5,-0.5],[0.5,0.5,-0.5],[0.5,0.5,0.5],[0.5,-0.5,0.5]] },
  { neighbor: [-1, 0, 0], normal: [-1, 0, 0], shade: 0.65, corners: [[-0.5,-0.5,0.5],[-0.5,0.5,0.5],[-0.5,0.5,-0.5],[-0.5,-0.5,-0.5]] },
  { neighbor: [0, 1, 0], normal: [0, 1, 0], shade: 1.0, corners: [[-0.5,0.5,-0.5],[-0.5,0.5,0.5],[0.5,0.5,0.5],[0.5,0.5,-0.5]] },
  { neighbor: [0, -1, 0], normal: [0, -1, 0], shade: 0.56, corners: [[-0.5,-0.5,0.5],[-0.5,-0.5,-0.5],[0.5,-0.5,-0.5],[0.5,-0.5,0.5]] },
  { neighbor: [0, 0, 1], normal: [0, 0, 1], shade: 0.9, corners: [[0.5,-0.5,0.5],[0.5,0.5,0.5],[-0.5,0.5,0.5],[-0.5,-0.5,0.5]] },
  { neighbor: [0, 0, -1], normal: [0, 0, -1], shade: 0.7, corners: [[-0.5,-0.5,-0.5],[-0.5,0.5,-0.5],[0.5,0.5,-0.5],[0.5,-0.5,-0.5]] },
]);

const byId = id => document.getElementById(id);
const canvas = byId('canvas-3d');
const viewTabs = [byId('tab-2d'), byId('tab-3d')];
const sizePresets = Array.from(document.querySelectorAll('[data-size]'));

function voxelKey(x, y, z) {
  return `${x},${y},${z}`;
}

function normalizeSize(value) {
  const parsed = Number.parseInt(value, 10);
  const clamped = Math.max(3, Math.min(51, Number.isFinite(parsed) ? parsed : 13));
  return clamped % 2 === 0 ? Math.min(51, clamped + 1) : clamped;
}

function calcSphere() {
  const center = (N - 1) / 2;
  const radius2 = center * center;
  const innerRadius = Math.max(0, center - 1);
  const inner2 = innerRadius * innerRadius;
  const nextVoxels = [];
  const nextSet = new Set();

  for (let y = 0; y < N; y++) {
    for (let z = 0; z < N; z++) {
      for (let x = 0; x < N; x++) {
        const dx = x - center;
        const dy = y - center;
        const dz = z - center;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 > radius2 + 0.5) continue;
        if (hollow && d2 <= inner2) continue;
        nextVoxels.push([x, y, z]);
        nextSet.add(voxelKey(x, y, z));
      }
    }
  }

  voxels = nextVoxels;
  voxelSet = nextSet;
  surfaceVoxels = voxels.filter(([x, y, z]) => FACE_DEFS.some(({ neighbor }) => {
    const [dx, dy, dz] = neighbor;
    return !voxelSet.has(voxelKey(x + dx, y + dy, z + dz));
  }));
}

function updateSizePresets() {
  sizePresets.forEach(button => {
    button.setAttribute('aria-pressed', String(Number(button.dataset.size) === N));
  });
}

function updateInfo() {
  byId('info-r').textContent = ((N - 1) / 2).toFixed(1);
  byId('info-total').textContent = voxels.length.toLocaleString('ja-JP');
  byId('info-layers').textContent = N.toLocaleString('ja-JP');
  byId('info-surface').textContent = surfaceVoxels.length.toLocaleString('ja-JP');
}

function rebuild() {
  N = normalizeSize(byId('size-input').value);
  byId('size-input').value = N;
  currentLayer = Math.floor(N / 2);
  byId('layer-range').max = String(N - 1);
  byId('layer-range').value = String(currentLayer);
  calcSphere();
  updateInfo();
  updateSizePresets();
  if (currentView === '2d') renderSlice();
  else {
    sizeCanvas();
    schedule3D();
  }
}

function stepSize(delta) {
  byId('size-input').value = normalizeSize((Number.parseInt(byId('size-input').value, 10) || 13) + delta);
  rebuild();
}

function setSizePreset(size) {
  byId('size-input').value = size;
  rebuild();
}

function setHollow(value) {
  hollow = Boolean(value);
  byId('btn-solid').classList.toggle('active', !hollow);
  byId('btn-hollow').classList.toggle('active', hollow);
  byId('btn-solid').setAttribute('aria-pressed', String(!hollow));
  byId('btn-hollow').setAttribute('aria-pressed', String(hollow));
  rebuild();
}

function setSliceAxis(axis) {
  if (!['top', 'side'].includes(axis)) return;
  sliceAxis = axis;
  byId('stab-top').classList.toggle('active', axis === 'top');
  byId('stab-side').classList.toggle('active', axis === 'side');
  byId('stab-top').setAttribute('aria-pressed', String(axis === 'top'));
  byId('stab-side').setAttribute('aria-pressed', String(axis === 'side'));
  currentLayer = Math.floor(N / 2);
  renderSlice();
}

function setLayer(layer) {
  currentLayer = Math.max(0, Math.min(N - 1, Number.parseInt(layer, 10) || 0));
  renderSlice();
}

function changeLayer(delta) {
  setLayer(currentLayer + delta);
}

function centerLayer() {
  setLayer(Math.floor(N / 2));
}

function renderSlice() {
  const fragment = document.createDocumentFragment();
  let count = 0;

  for (let row = 0; row < N; row++) {
    const rowEl = document.createElement('div');
    rowEl.className = 'grid-row';

    for (let col = 0; col < N; col++) {
      const x = col;
      const y = sliceAxis === 'top' ? currentLayer : row;
      const z = sliceAxis === 'top' ? row : currentLayer;
      const occupied = voxelSet.has(voxelKey(x, y, z));
      if (occupied) count++;

      const cell = document.createElement('div');
      cell.className = `cell ${occupied ? (hollow ? 'shell' : 'filled') : 'empty'}`;
      cell.style.width = `${cellSz}px`;
      cell.style.height = `${cellSz}px`;
      rowEl.appendChild(cell);
    }
    fragment.appendChild(rowEl);
  }

  const grid = byId('grid');
  grid.replaceChildren(fragment);
  grid.style.backgroundSize = `${cellSz}px ${cellSz}px`;

  const axisName = sliceAxis === 'top' ? '高さ' : '奥行';
  const viewName = sliceAxis === 'top' ? '水平断面' : '垂直断面';
  byId('layer-label').textContent = `${axisName} ${currentLayer + 1} / ${N}`;
  byId('block-count').textContent = `この断面: ${count.toLocaleString('ja-JP')} ブロック`;
  byId('layer-range').value = String(currentLayer);
  byId('btn-prev').disabled = currentLayer === 0;
  byId('btn-next').disabled = currentLayer === N - 1;
  grid.setAttribute('aria-label', `${viewName} ${currentLayer + 1}/${N}、${count}ブロック`);
}

function switchView(view, shouldFocus = false) {
  if (!['2d', '3d'].includes(view)) return;
  currentView = view;

  viewTabs.forEach(tab => {
    const active = tab.id === `tab-${view}`;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });

  byId('view-2d').hidden = view !== '2d';
  byId('view-3d').hidden = view !== '3d';

  if (view === '2d') renderSlice();
  else {
    sizeCanvas();
    schedule3D();
  }

  if (shouldFocus) byId(`tab-${view}`).focus();
}

function sizeCanvas() {
  const parentWidth = canvas.parentElement?.clientWidth || 760;
  const width = Math.max(300, Math.min(900, parentWidth));
  canvas.width = Math.round(width);
  canvas.height = Math.round(width * 0.66);
}

function transformPoint(x, y, z) {
  const center = (N - 1) / 2;
  const dx = x - center;
  const dy = y - center;
  const dz = z - center;
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const rx = cosY * dx + sinY * dz;
  const rz = -sinY * dx + cosY * dz;
  const ry = -sinX * rz + cosX * dy;
  const depth = cosX * rz + sinX * dy;
  return { x: rx, y: ry, depth };
}

function transformedNormalDepth([x, y, z]) {
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const rz = -sinY * x + cosY * z;
  return cosX * rz + sinX * y;
}

function render3D() {
  renderFrame = null;
  const ctx = canvas.getContext('2d');
  if (!ctx || !canvas.width || !canvas.height) return;

  const W = canvas.width;
  const H = canvas.height;
  const scale = Math.min(W, H) * 0.7 / Math.max(N, 4) * zoom;
  const cx = W / 2;
  const cy = H / 2;
  const faces = [];

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#1a120a';
  ctx.fillRect(0, 0, W, H);

  for (const [x, y, z] of surfaceVoxels) {
    for (const face of FACE_DEFS) {
      const [nx, ny, nz] = face.neighbor;
      if (voxelSet.has(voxelKey(x + nx, y + ny, z + nz))) continue;
      if (transformedNormalDepth(face.normal) <= 0.015) continue;

      const points = face.corners.map(([dx, dy, dz]) => {
        const p = transformPoint(x + dx, y + dy, z + dz);
        return { x: cx + p.x * scale, y: cy - p.y * scale, depth: p.depth };
      });
      const depth = points.reduce((sum, point) => sum + point.depth, 0) / points.length;
      faces.push({ points, depth, shade: face.shade });
    }
  }

  faces.sort((a, b) => a.depth - b.depth);

  for (const face of faces) {
    const depthFactor = Math.max(0, Math.min(1, (face.depth + N * 0.55) / (N * 1.1)));
    const light = Math.max(0.42, Math.min(1, face.shade * (0.76 + depthFactor * 0.24)));
    const base = hollow ? [76, 151, 202] : [75, 132, 49];
    const rgb = base.map(value => Math.round(value * light));

    ctx.beginPath();
    ctx.moveTo(face.points[0].x, face.points[0].y);
    for (let i = 1; i < face.points.length; i++) ctx.lineTo(face.points[i].x, face.points[i].y);
    ctx.closePath();
    ctx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    ctx.strokeStyle = hollow ? 'rgba(190, 218, 235, 0.42)' : 'rgba(240, 232, 204, 0.18)';
    ctx.lineWidth = Math.max(0.45, Math.min(1.1, scale * 0.06));
    ctx.fill();
    ctx.stroke();
  }

  canvas.setAttribute('aria-label', `球体3Dプレビュー。${N}マス、${hollow ? '空洞' : '中実'}、${voxels.length}ブロック。ドラッグで回転、スクロールまたはプラス・マイナスキーでズーム、矢印キーで回転できます`);
}

function schedule3D() {
  if (currentView !== '3d' || renderFrame !== null) return;
  renderFrame = requestAnimationFrame(render3D);
}

function resetView() {
  rotX = DEFAULT_VIEW.rotX;
  rotY = DEFAULT_VIEW.rotY;
  zoom = DEFAULT_VIEW.zoom;
  schedule3D();
}

function changeZoom(delta) {
  zoom = Math.max(0.35, Math.min(2.8, zoom + delta));
  schedule3D();
}

byId('size-minus').addEventListener('click', () => stepSize(-2));
byId('size-plus').addEventListener('click', () => stepSize(2));
byId('apply-size').addEventListener('click', rebuild);
byId('size-input').addEventListener('keydown', event => {
  if (event.key === 'Enter') rebuild();
});
byId('size-input').addEventListener('change', rebuild);
sizePresets.forEach(button => button.addEventListener('click', () => setSizePreset(Number(button.dataset.size))));

byId('btn-solid').addEventListener('click', () => setHollow(false));
byId('btn-hollow').addEventListener('click', () => setHollow(true));
byId('stab-top').addEventListener('click', () => setSliceAxis('top'));
byId('stab-side').addEventListener('click', () => setSliceAxis('side'));
byId('btn-prev').addEventListener('click', () => changeLayer(-1));
byId('btn-next').addEventListener('click', () => changeLayer(1));
byId('center-layer').addEventListener('click', centerLayer);
byId('layer-range').addEventListener('input', event => setLayer(event.currentTarget.value));

byId('cell-size').addEventListener('input', event => {
  cellSz = Number.parseInt(event.currentTarget.value, 10);
  byId('cell-size-val').textContent = `${cellSz}px`;
  if (currentView === '2d') renderSlice();
});

viewTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => switchView(tab.id.slice(4)));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + viewTabs.length) % viewTabs.length;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % viewTabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = viewTabs.length - 1;
    switchView(viewTabs[nextIndex].id.slice(4), true);
  });
});

canvas.addEventListener('pointerdown', event => {
  dragState = { x: event.clientX, y: event.clientY, rotX, rotY };
  canvas.setPointerCapture?.(event.pointerId);
});
canvas.addEventListener('pointermove', event => {
  if (!dragState) return;
  rotY = dragState.rotY + (event.clientX - dragState.x) * 0.012;
  rotX = dragState.rotX + (event.clientY - dragState.y) * 0.012;
  schedule3D();
});
canvas.addEventListener('pointerup', event => {
  dragState = null;
  canvas.releasePointerCapture?.(event.pointerId);
});
canvas.addEventListener('pointercancel', () => { dragState = null; });
canvas.addEventListener('wheel', event => {
  event.preventDefault();
  zoom = Math.max(0.35, Math.min(2.8, zoom - event.deltaY * 0.001));
  schedule3D();
}, { passive: false });
canvas.addEventListener('keydown', event => {
  const step = 0.12;
  if (event.key === 'ArrowLeft') rotY -= step;
  else if (event.key === 'ArrowRight') rotY += step;
  else if (event.key === 'ArrowUp') rotX -= step;
  else if (event.key === 'ArrowDown') rotX += step;
  else if (event.key === '+' || event.key === '=') changeZoom(0.12);
  else if (event.key === '-' || event.key === '_') changeZoom(-0.12);
  else if (event.key === '0') resetView();
  else return;
  event.preventDefault();
  schedule3D();
});
byId('reset-view').addEventListener('click', resetView);

let resizeFrame = null;
window.addEventListener('resize', () => {
  if (currentView !== '3d' || resizeFrame !== null) return;
  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = null;
    sizeCanvas();
    render3D();
  });
});

rebuild();
