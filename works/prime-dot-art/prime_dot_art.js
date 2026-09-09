'use strict';

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const nrange = document.getElementById('nrange');
const srange = document.getElementById('srange');
const nval = document.getElementById('nval');
const sval = document.getElementById('sval');
const infoEl = document.getElementById('info');
const progEl = document.getElementById('prog');
const statsEl = document.getElementById('stats');
const settingsPanel = document.getElementById('settings');
const settingsToggle = document.getElementById('settingsToggle');
const presetButtons = Array.from(document.querySelectorAll('[data-preset]'));
const mobileQuery = window.matchMedia('(max-width: 860px)');

const LABELS = [
  '合成数', '奇数番目素数', '偶数番目素数',
  '素数番目素数', '4k+1素数', '4k+3素数',
  '桁合計素数', '素数の2乗', '双子素数',
];

const PRESETS = {
  branch: { turns: { 0: 'straight', 1: 'right', 2: 'back' }, enabled: [] },
  grid: { turns: { 0: 'straight', 1: 'right', 2: 'right' }, enabled: [] },
  mod4: { turns: { 0: 'straight', 1: 'right', 2: 'back', 4: 'right', 5: 'left' }, enabled: [4, 5] },
  twins: { turns: { 0: 'straight', 1: 'right', 2: 'back', 8: 'right' }, enabled: [8] },
};let animId = null;
let renderToken = 0;
let resizeTimer = null;

nrange.addEventListener('input', function () {
  nval.textContent = parseInt(this.value, 10).toLocaleString('ja-JP');
});
srange.addEventListener('input', function () {
  sval.textContent = this.value;
});

for (let i = 3; i <= 8; i++) {
  const cb = document.getElementById('on' + i);
  const row = document.getElementById('row' + i);
  cb.addEventListener('change', function () {
    row.classList.toggle('active', this.checked);
    clearPresetState();
  });
}
for (let i = 0; i <= 8; i++) {
  const select = document.getElementById('d' + i);
  if (select) select.addEventListener('change', clearPresetState);
}

function sieve(max) {
  const a = new Uint8Array(max + 1).fill(1);
  a[0] = a[1] = 0;
  for (let i = 2; i * i <= max; i++) {
    if (!a[i]) continue;
    for (let j = i * i; j <= max; j += i) a[j] = 0;
  }
  return a;
}function digitSum(n) {
  let sum = 0;
  while (n > 0) {
    sum += n % 10;
    n = Math.floor(n / 10);
  }
  return sum;
}

function applyTurn(dir, turn) {
  if (turn === 'right') return (dir + 1) % 4;
  if (turn === 'left') return (dir + 3) % 4;
  if (turn === 'back') return (dir + 2) % 4;
  return dir;
}

function classifyNumber(n, isPrime, primeOrdinal, opts) {
  let ruleIdx = 0;
  if (isPrime[n]) {
    ruleIdx = primeOrdinal % 2 === 1 ? 1 : 2;
    if (opts[0] && isPrime[primeOrdinal]) ruleIdx = 3;
    if (opts[1] && n % 4 === 1) ruleIdx = 4;
    if (opts[2] && n % 4 === 3) ruleIdx = 5;
    if (opts[3] && isPrime[digitSum(n)]) ruleIdx = 6;
  }
  if (opts[4]) {
    const root = Math.floor(Math.sqrt(n));
    if (root > 1 && root * root === n && isPrime[root]) ruleIdx = 7;
  }
  if (opts[5] && isPrime[n] && (isPrime[n + 2] || (n > 1 && isPrime[n - 2]))) ruleIdx = 8;
  return ruleIdx;
}function getConfig() {
  return {
    N: parseInt(nrange.value, 10),
    dotSize: parseInt(srange.value, 10),
    colors: Array.from({ length: 9 }, (_, i) => document.getElementById('c' + i)?.value || '#000000'),
    turns: Array.from({ length: 9 }, (_, i) => document.getElementById('d' + i)?.value || 'straight'),
    opts: Array.from({ length: 6 }, (_, i) => document.getElementById('on' + (i + 3))?.checked || false),
  };
}

function resizeCanvas() {
  const width = Math.max(280, Math.floor(canvas.parentElement.clientWidth || 600));
  canvas.width = width;
  canvas.height = Math.floor(width * 0.8);
}

function paintBackground() {
  ctx.fillStyle = '#f0e8cc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(192,168,112,0.2)';
  ctx.lineWidth = 0.5;
  const grid = 40;
  for (let x = 0; x < canvas.width; x += grid) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += grid) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
}function computeBounds(config, isPrime, token, done) {
  const dx = [0, 1, 0, -1];
  const dy = [-1, 0, 1, 0];
  const counts = new Array(9).fill(0);
  let x = 0, y = 0, dir = 0, n = 0, primeOrdinal = 0, primeCount = 0;
  let minX = 0, maxX = 0, minY = 0, maxY = 0;
  const chunkSize = 10000;

  function chunk() {
    if (token !== renderToken) return;
    const end = Math.min(n + chunkSize, config.N);
    for (; n < end; n++) {
      if (isPrime[n]) { primeOrdinal++; primeCount++; }
      const ruleIdx = classifyNumber(n, isPrime, primeOrdinal, config.opts);
      dir = applyTurn(dir, config.turns[ruleIdx]);
      counts[ruleIdx]++;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      x += dx[dir]; y += dy[dir];
    }
    progEl.textContent = `軌跡計算中… ${Math.round(n / config.N * 100)}%`;
    if (n < config.N) {
      animId = requestAnimationFrame(chunk);
    } else {
      done({ minX, maxX, minY, maxY, counts, primeCount });
    }
  }
  animId = requestAnimationFrame(chunk);
}function paintWalk(config, isPrime, bounds, token) {
  const dx = [0, 1, 0, -1];
  const dy = [-1, 0, 1, 0];
  const margin = Math.max(18, Math.min(canvas.width, canvas.height) * 0.07);
  const spanX = Math.max(1, bounds.maxX - bounds.minX);
  const spanY = Math.max(1, bounds.maxY - bounds.minY);
  const scale = Math.max(0.05, Math.min(
    (canvas.width - margin * 2) / spanX,
    (canvas.height - margin * 2) / spanY,
    8
  ));
  const originX = (canvas.width - spanX * scale) / 2 - bounds.minX * scale;
  const originY = (canvas.height - spanY * scale) / 2 - bounds.minY * scale;
  const markSize = Math.max(1, Math.min(config.dotSize, Math.max(1, scale * 1.15)));
  let x = 0, y = 0, dir = 0, n = 0, primeOrdinal = 0;
  const chunkSize = 10000;

  paintBackground();
  function chunk() {
    if (token !== renderToken) return;
    const end = Math.min(n + chunkSize, config.N);
    for (; n < end; n++) {
      if (isPrime[n]) primeOrdinal++;
      const ruleIdx = classifyNumber(n, isPrime, primeOrdinal, config.opts);
      dir = applyTurn(dir, config.turns[ruleIdx]);
      ctx.fillStyle = config.colors[ruleIdx];
      ctx.fillRect(originX + x * scale - markSize / 2, originY + y * scale - markSize / 2, markSize, markSize);
      x += dx[dir]; y += dy[dir];
    }
    progEl.textContent = `描画中… ${Math.round(n / config.N * 100)}%`;
    if (n < config.N) animId = requestAnimationFrame(chunk);
    else finishRender(config, bounds, scale);
  }
  animId = requestAnimationFrame(chunk);
}function finishRender(config, bounds, scale) {
  animId = null;
  progEl.style.display = 'none';
  const spanX = bounds.maxX - bounds.minX + 1;
  const spanY = bounds.maxY - bounds.minY + 1;
  const activeRules = 3 + config.opts.filter(Boolean).length;
  statsEl.innerHTML = [
    ['STEPS', config.N.toLocaleString('ja-JP')],
    ['PRIME', bounds.primeCount.toLocaleString('ja-JP')],
    ['SPAN', `${spanX} × ${spanY}`],
    ['RULES', activeRules.toString()],
  ].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join('');

  infoEl.innerHTML = bounds.counts
    .map((count, i) => count > 0 ? `<span>${LABELS[i]}：${count.toLocaleString('ja-JP')}</span>` : '')
    .filter(Boolean)
    .join('');
  canvas.dataset.fitScale = scale.toFixed(3);
}

function draw() {
  if (animId !== null) cancelAnimationFrame(animId);
  const token = ++renderToken;
  const config = getConfig();
  resizeCanvas();
  paintBackground();
  progEl.style.display = 'block';
  progEl.textContent = '素数表を準備中…';
  statsEl.innerHTML = '';
  infoEl.innerHTML = '';
  const isPrime = sieve(config.N + 2);
  computeBounds(config, isPrime, token, bounds => {
    if (token !== renderToken) return;
    paintWalk(config, isPrime, bounds, token);
  });
}function reset() {
  renderToken++;
  if (animId !== null) cancelAnimationFrame(animId);
  animId = null;
  paintBackground();
  progEl.style.display = 'none';
  statsEl.innerHTML = '';
  infoEl.innerHTML = '';
}

function clearPresetState() {
  presetButtons.forEach(button => button.setAttribute('aria-pressed', 'false'));
}

function applyPreset(name) {
  const preset = PRESETS[name];
  if (!preset) return;
  Object.entries(preset.turns).forEach(([index, value]) => {
    const select = document.getElementById('d' + index);
    if (select) select.value = value;
  });
  for (let i = 3; i <= 8; i++) {
    const checked = preset.enabled.includes(i);
    const input = document.getElementById('on' + i);
    input.checked = checked;
    document.getElementById('row' + i).classList.toggle('active', checked);
  }
  presetButtons.forEach(button => button.setAttribute('aria-pressed', button.dataset.preset === name ? 'true' : 'false'));
  draw();
}

function savePng() {
  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prime-dot-art-${Date.now()}.png`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }, 'image/png');
}function setSettingsExpanded(expanded) {
  settingsToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  settingsToggle.querySelector('span').textContent = expanded ? '↑' : '↓';
  settingsToggle.firstChild.textContent = expanded ? '描画ルールを閉じる ' : '描画ルールを開く ';
  if (mobileQuery.matches) settingsPanel.hidden = !expanded;
  else settingsPanel.hidden = false;
}

function syncSettingsDisclosure() {
  if (mobileQuery.matches) {
    const expanded = settingsToggle.getAttribute('aria-expanded') === 'true';
    settingsPanel.hidden = !expanded;
  } else {
    settingsPanel.hidden = false;
  }
}

presetButtons.forEach(button => {
  button.addEventListener('click', () => applyPreset(button.dataset.preset));
});
document.getElementById('runBtn').addEventListener('click', draw);
document.getElementById('resetBtn').addEventListener('click', reset);
document.getElementById('fitBtn').addEventListener('click', draw);
document.getElementById('savePngBtn').addEventListener('click', savePng);
settingsToggle.addEventListener('click', () => {
  setSettingsExpanded(settingsToggle.getAttribute('aria-expanded') !== 'true');
});
document.querySelector('.text-link').addEventListener('click', () => {
  if (mobileQuery.matches) setSettingsExpanded(true);
});
mobileQuery.addEventListener('change', syncSettingsDisclosure);

window.addEventListener('resize', function () {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function () {
    if (animId === null) draw();
  }, 250);
});

syncSettingsDisclosure();
presetButtons[0]?.setAttribute('aria-pressed', 'true');
draw();