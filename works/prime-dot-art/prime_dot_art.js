'use strict';

/* ─── 要素参照 ─── */
const canvas  = document.getElementById('c');
const ctx     = canvas.getContext('2d');
const nrange  = document.getElementById('nrange');
const srange  = document.getElementById('srange');
const nval    = document.getElementById('nval');
const sval    = document.getElementById('sval');
const infoEl  = document.getElementById('info');
const progEl  = document.getElementById('prog');

/* ─── スライダー表示更新 ─── */
nrange.addEventListener('input', function () {
  nval.textContent = parseInt(this.value).toLocaleString('ja-JP');
});
srange.addEventListener('input', function () {
  sval.textContent = this.value;
});

/* ─── オプション行のアクティブトグル ─── */
for (let i = 3; i <= 8; i++) {
  const cb  = document.getElementById('on' + i);
  const row = document.getElementById('row' + i);
  cb.addEventListener('change', function () {
    row.classList.toggle('active', this.checked);
  });
}

/* ─── 素数篩（Sieve of Eratosthenes） ─── */
function sieve(max) {
  const a = new Uint8Array(max + 1).fill(1);
  a[0] = a[1] = 0;
  for (let i = 2; i * i <= max; i++) {
    if (a[i]) {
      for (let j = i * i; j <= max; j += i) a[j] = 0;
    }
  }
  return a;
}

/* ─── 桁の合計 ─── */
function digitSum(n) {
  let s = 0;
  while (n > 0) { s += n % 10; n = Math.floor(n / 10); }
  return s;
}

/* ─── 方向を回転 ─── */
function applyTurn(dir, turn) {
  if (turn === 'right')  return (dir + 1) % 4;
  if (turn === 'left')   return (dir + 3) % 4;
  if (turn === 'back')   return (dir + 2) % 4;
  return dir; // straight
}

/* ─── アニメーションID ─── */
let animId = null;

/* ─── 描画 ─── */
function draw() {
  // 実行中のアニメーションを停止
  if (animId !== null) {
    cancelAnimationFrame(animId);
    animId = null;
  }

  const N       = parseInt(nrange.value);
  const dotSize = parseInt(srange.value);

  // 色・方向の読み込み
  const colors = Array.from({ length: 9 }, (_, i) => {
    const el = document.getElementById('c' + i);
    return el ? el.value : '#000000';
  });
  const turns = Array.from({ length: 9 }, (_, i) => {
    const el = document.getElementById('d' + i);
    return el ? el.value : 'straight';
  });
  const opts = Array.from({ length: 6 }, (_, i) => {
    const el = document.getElementById('on' + (i + 3));
    return el ? el.checked : false;
  });

  // 素数計算
  const isPrime    = sieve(N + 2);
  const primes     = [];
  for (let i = 2; i <= N; i++) {
    if (isPrime[i]) primes.push(i);
  }
  const primeIndex = new Map();
  primes.forEach((p, i) => primeIndex.set(p, i + 1));

  // 素数の2乗セット
  const primeSqSet = new Set();
  for (const p of primes) {
    if (p * p <= N) primeSqSet.add(p * p);
  }

  // キャンバスサイズ
  const W = canvas.parentElement.clientWidth || 600;
  canvas.width  = W;
  canvas.height = Math.floor(W * 0.8);

  // 背景：古紙色
  ctx.fillStyle = '#f0e8cc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 薄い方眼（設計図風）
  ctx.strokeStyle = 'rgba(192,168,112,0.2)';
  ctx.lineWidth   = 0.5;
  const GRID = 40;
  for (let gx = 0; gx < canvas.width; gx += GRID) {
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, canvas.height); ctx.stroke();
  }
  for (let gy = 0; gy < canvas.height; gy += GRID) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(canvas.width, gy); ctx.stroke();
  }

  // 初期位置・方向
  let x   = Math.floor(canvas.width  / 2);
  let y   = Math.floor(canvas.height / 2);
  let dir = 0;
  const dx = [0,  1, 0, -1];
  const dy = [-1, 0, 1,  0];

  const counts = new Array(9).fill(0);

  const CHUNK = 5000;
  let n = 0;

  progEl.style.display = 'block';
  infoEl.textContent   = '';

  function step() {
    const end = Math.min(n + CHUNK, N + 1);

    for (; n < end; n++) {
      let ruleIdx;

      if (!isPrime[n]) {
        // 合成数（0 以下も含む）
        ruleIdx = 0;
      } else {
        const idx = primeIndex.get(n);
        // 基本：奇数番目 / 偶数番目
        ruleIdx = (idx % 2 === 1) ? 1 : 2;

        // オプション（優先度：低→高の順で上書き）
        if (opts[0] && isPrime[idx])                                    ruleIdx = 3; // 素数番目
        if (opts[1] && n % 4 === 1)                                     ruleIdx = 4; // 4k+1
        if (opts[2] && n % 4 === 3)                                     ruleIdx = 5; // 4k+3
        if (opts[3] && isPrime[digitSum(n)])                            ruleIdx = 6; // 桁合計
        if (opts[4] && primeSqSet.has(n))                               ruleIdx = 7; // 素数の2乗
        if (opts[5] && (isPrime[n + 2] || (n > 1 && isPrime[n - 2])))  ruleIdx = 8; // 双子素数
      }

      dir = applyTurn(dir, turns[ruleIdx]);
      counts[ruleIdx]++;

      // 範囲内のみ描画
      if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
        ctx.fillStyle = colors[ruleIdx];
        ctx.fillRect(x - dotSize / 2, y - dotSize / 2, dotSize, dotSize);
      }

      x += dx[dir] * dotSize;
      y += dy[dir] * dotSize;
    }

    const pct = Math.round(n / (N + 1) * 100);
    progEl.textContent = `描画中… ${pct}%`;

    if (n <= N) {
      animId = requestAnimationFrame(step);
    } else {
      animId = null;
      progEl.style.display = 'none';

      // 統計情報の表示
      const labels = [
        '合成数', '奇数番目素数', '偶数番目素数',
        '素数番目素数', '4k+1素数', '4k+3素数',
        '桁合計素数', '素数の2乗', '双子素数',
      ];
      infoEl.innerHTML = counts
        .map((c, i) => c > 0 ? `<span>${labels[i]}：${c.toLocaleString('ja-JP')}</span>` : '')
        .filter(Boolean)
        .join('　|　');
    }
  }

  animId = requestAnimationFrame(step);
}

/* ─── リセット ─── */
function reset() {
  if (animId !== null) {
    cancelAnimationFrame(animId);
    animId = null;
  }
  // 背景色でクリア
  ctx.fillStyle = '#f0e8cc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  infoEl.textContent   = '';
  progEl.style.display = 'none';
}

/* ─── イベント ─── */
document.getElementById('runBtn').addEventListener('click', draw);
document.getElementById('resetBtn').addEventListener('click', reset);

/* ─── リサイズ対応 ─── */
let resizeTimer = null;
window.addEventListener('resize', function () {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function () {
    if (animId === null) {
      // 描画中でなければキャンバスだけリサイズ＆再描画
      draw();
    }
  }, 250);
});

/* ─── 初回描画 ─── */
draw();
