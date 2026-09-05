'use strict';

let N = 13, hollow = false, voxels = [];
let currentLayer = 0, sliceAxis = 'top', currentView = '2d';
let cellSz = 18;

/* ===== 球体計算 ===== */
function calcSphere() {
  const n = N, c = (n - 1) / 2, R = c, R2 = R * R;
  const inner2 = (R - 1.0) * (R - 1.0);
  voxels = [];
  let total = 0;
  for (let y = 0; y < n; y++)
    for (let z = 0; z < n; z++)
      for (let x = 0; x < n; x++) {
        const dx = x - c, dy = y - c, dz = z - c;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 <= R2 + 0.5) {
          if (hollow && d2 <= inner2) continue;
          voxels.push([x, y, z]);
          total++;
        }
      }
  return total;
}

/* ===== リビルド ===== */
function rebuild() {
  let v = parseInt(document.getElementById('size-input').value) || 13;
  N = Math.max(3, Math.min(51, v % 2 === 0 ? v + 1 : v));
  document.getElementById('size-input').value = N;
  const total = calcSphere();
  document.getElementById('info-r').textContent = ((N - 1) / 2).toFixed(1);
  document.getElementById('info-total').textContent = total.toLocaleString();
  document.getElementById('info-layers').textContent = N;
  currentLayer = Math.floor(N / 2);
  if (currentView === '2d') renderSlice();
  else render3D();
}

/* ===== ステッパー ===== */
function stepSize(d) {
  const inp = document.getElementById('size-input');
  let v = (parseInt(inp.value) || 13) + d;
  v = Math.max(3, Math.min(51, v));
  inp.value = v;
  rebuild();
}

/* ===== 空洞切替 ===== */
function setHollow(h) {
  hollow = h;
  document.getElementById('btn-solid').classList.toggle('active', !h);
  document.getElementById('btn-hollow').classList.toggle('active', h);
  rebuild();
}

/* ===== 断面軸切替 ===== */
function setSliceAxis(a) {
  sliceAxis = a;
  document.getElementById('stab-top').classList.toggle('active', a === 'top');
  document.getElementById('stab-side').classList.toggle('active', a === 'side');
  currentLayer = Math.floor(N / 2);
  renderSlice();
}

/* ===== 段切替 ===== */
function changeLayer(d) {
  currentLayer = Math.max(0, Math.min(N - 1, currentLayer + d));
  renderSlice();
}

/* ===== 2D断面描画 ===== */
function renderSlice() {
  const set = new Set(voxels.map(([x, y, z]) => `${x},${y},${z}`));
  const grid2d = [];
  let cnt = 0;
  const li = currentLayer;

  if (sliceAxis === 'top') {
    for (let z = 0; z < N; z++) {
      const row = [];
      for (let x = 0; x < N; x++) {
        const has = set.has(`${x},${li},${z}`);
        row.push(has ? 1 : 0);
        if (has) cnt++;
      }
      grid2d.push(row);
    }
    document.getElementById('layer-label').textContent = `${li + 1} 段目 / ${N} 段`;
    document.getElementById('block-count').textContent = `この段: ${cnt} ブロック`;
  } else {
    for (let y = 0; y < N; y++) {
      const row = [];
      for (let x = 0; x < N; x++) {
        const has = set.has(`${x},${y},${N - 1 - li}`);
        row.push(has ? 1 : 0);
        if (has) cnt++;
      }
      grid2d.push(row);
    }
    document.getElementById('layer-label').textContent = `Z = ${li + 1} / ${N}`;
    document.getElementById('block-count').textContent = `この列: ${cnt} ブロック`;
  }

  document.getElementById('btn-prev').disabled = li === 0;
  document.getElementById('btn-next').disabled = li === N - 1;

  const gridEl = document.getElementById('grid');
  gridEl.innerHTML = '';
  const s = cellSz;
  gridEl.style.backgroundSize = s + 'px ' + s + 'px';

  for (let r = 0; r < grid2d.length; r++) {
    const rowEl = document.createElement('div');
    rowEl.className = 'grid-row';
    for (let c = 0; c < grid2d[r].length; c++) {
      const el = document.createElement('div');
      el.className = 'cell ' + (grid2d[r][c] === 1 ? (hollow ? 'shell' : 'filled') : 'empty');
      el.style.width = s + 'px';
      el.style.height = s + 'px';
      rowEl.appendChild(el);
    }
    gridEl.appendChild(rowEl);
  }
}

/* ===== ビュー切替 ===== */
function switchView(v) {
  currentView = v;
  document.getElementById('tab-2d').classList.toggle('active', v === '2d');
  document.getElementById('tab-3d').classList.toggle('active', v === '3d');
  document.getElementById('view-2d').style.display = v === '2d' ? 'block' : 'none';
  document.getElementById('view-3d').style.display = v === '3d' ? 'block' : 'none';
  if (v === '3d') {
    sizeCanvas();
    render3D();
  }
}

/* ===== セルサイズ ===== */
document.getElementById('cell-size').addEventListener('input', function () {
  cellSz = parseInt(this.value);
  document.getElementById('cell-size-val').textContent = cellSz + 'px';
  if (currentView === '2d') renderSlice();
});

/* ===== 3D回転 ===== */
let rotX = 0.42, rotY = 0.62, zoom = 1;
let dragState = null, pinchDist = null;

const canvas = document.getElementById('canvas-3d');

function sizeCanvas() {
  const maxW = Math.min(600, canvas.parentElement.clientWidth || 600);
  canvas.width = maxW;
  canvas.height = Math.round(maxW * 0.75);
}

canvas.addEventListener('mousedown', e => {
  dragState = { mx: e.clientX, my: e.clientY, rx: rotX, ry: rotY };
});
window.addEventListener('mousemove', e => {
  if (!dragState) return;
  rotY = dragState.ry + (e.clientX - dragState.mx) * 0.012;
  rotX = dragState.rx + (e.clientY - dragState.my) * 0.012;
  render3D();
});
window.addEventListener('mouseup', () => { dragState = null; });

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  zoom = Math.max(0.3, Math.min(2.8, zoom - e.deltaY * 0.001));
  render3D();
}, { passive: false });

canvas.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    dragState = { mx: e.touches[0].clientX, my: e.touches[0].clientY, rx: rotX, ry: rotY };
  } else if (e.touches.length === 2) {
    pinchDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  }
}, { passive: true });

canvas.addEventListener('touchmove', e => {
  if (e.touches.length === 1 && dragState) {
    rotY = dragState.ry + (e.touches[0].clientX - dragState.mx) * 0.012;
    rotX = dragState.rx + (e.touches[0].clientY - dragState.my) * 0.012;
    render3D();
  } else if (e.touches.length === 2 && pinchDist !== null) {
    const d = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    zoom = Math.max(0.3, Math.min(2.8, zoom * (d / pinchDist)));
    pinchDist = d;
    render3D();
  }
}, { passive: true });

canvas.addEventListener('touchend', () => { dragState = null; pinchDist = null; });

/* ===== 3D描画 ===== */
function render3D() {
  const cv = document.getElementById('canvas-3d');
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  ctx.clearRect(0, 0, W, H);

  const n = N, center = (n - 1) / 2;
  const sc = Math.min(W, H) * 0.55 / n * zoom;
  const cx = W / 2, cy = H / 2;
  const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

  function proj(x, y, z) {
    const dx = x - center, dy = y - center, dz = z - center;
    const rx = cosY * dx + sinY * dz;
    const rz2 = -sinY * dx + cosY * dz;
    const ry2 = -sinX * rz2 + cosX * dy;
    const depth = cosX * rz2 + sinX * dy;
    return { px: cx + rx * sc, py: cy - ry2 * sc, depth };
  }

  const blocks = voxels.map(([x, y, z]) => {
    const p = proj(x, y, z);
    return { px: p.px, py: p.py, depth: p.depth };
  });
  blocks.sort((a, b) => a.depth - b.depth);

  const s = sc * 0.94;
  blocks.forEach(b => {
    const t = Math.max(0, Math.min(1, (b.depth + n) / (n * 1.5)));
    if (hollow) {
      const r = Math.floor(80 + t * 80);
      const g = Math.floor(160 + t * 60);
      const bl = Math.floor(210 + t * 40);
      ctx.fillStyle = `rgba(${r},${g},${bl},0.55)`;
      ctx.strokeStyle = `rgba(${r + 20},${g + 20},255,0.6)`;
    } else {
      const r = Math.floor(40 + t * 50);
      const g = Math.floor(100 + t * 100);
      const bl = Math.floor(30 + t * 30);
      ctx.fillStyle = `rgb(${r},${g},${bl})`;
      ctx.strokeStyle = `rgba(0,0,0,0.25)`;
    }
    ctx.lineWidth = 0.5;
    ctx.fillRect(b.px - s / 2, b.py - s / 2, s, s);
    ctx.strokeRect(b.px - s / 2, b.py - s / 2, s, s);
  });
}

/* ===== 初期化 ===== */
sizeCanvas();
rebuild();
window.addEventListener('resize', () => {
  if (currentView === '3d') { sizeCanvas(); render3D(); }
});
