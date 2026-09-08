'use strict';

/* =============================================
   Secret room - presentation effects
   Gate behavior is isolated from this presentation file
   ============================================= */

/* ─── ヒント：隠し文字クリックで出現 ─── */
(function initHiddenReveal() {
  const els = document.querySelectorAll('.hidden-reveal');
  if (!els.length) return;

  els.forEach(function(el) {
    function reveal() {
      el.classList.add('revealed');
      el.setAttribute('aria-label', '隠し文字が表示されました');
      el.removeEventListener('click',   reveal);
      el.removeEventListener('keydown', onKey);
    }
    function onKey(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); reveal(); }
    }
    el.addEventListener('click',   reveal);
    el.addEventListener('keydown', onKey);
  });
})();

/* ─── 浮遊ワードのマウス逃げ演出 ─── */
(function initFloatEscape() {
  const words = document.querySelectorAll('.fw');
  if (!words.length) return;

  let lastTime = 0;
  document.addEventListener('mousemove', function(e) {
    const now = Date.now();
    if (now - lastTime < 80) return;
    lastTime = now;

    words.forEach(function(word) {
      const rect   = word.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const dist   = Math.hypot(e.clientX - cx, e.clientY - cy);
      const radius = 120;

      if (dist < radius) {
        const force = (radius - dist) / radius;
        const angle = Math.atan2(cy - e.clientY, cx - e.clientX);
        word.style.transform  = 'translate(' + (Math.cos(angle) * force * 30) + 'px, ' + (Math.sin(angle) * force * 30) + 'px)';
        word.style.transition = 'transform 0.3s ease-out';
      } else {
        word.style.transform  = '';
        word.style.transition = 'transform 1.5s ease-out';
      }
    });
  }, { passive: true });
})();

/* ─── 水槽アニメーション ─── */
(function initAquarium() {
  const canvas = document.getElementById('aquarium-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const WORDS = [
    'Ti Amo', 'HERO', 'Everything', '道', 'real world',
    'HEART of GOLD', 'EXIT', 'THE NEXT DOOR', 'Someday', 'ふたつの唇',
  ];

  /* カラーパレット（辞書世界観に合わせつつ水中らしさも） */
  const COLORS = [
    'rgba(26,18,10,0.75)',    // 墨色
    'rgba(26,74,122,0.7)',    // 瑠璃色
    'rgba(154,122,50,0.7)',   // 金色
    'rgba(74,16,48,0.7)',     // 深紅
    'rgba(58,44,24,0.65)',    // 墨中間
  ];

  var W, H;
  var words = [];
  var bubbles = [];
  var rafId = null;

  /* キャンバスの実ピクセルサイズをCSSサイズに合わせる */
  function resize() {
    const rect = canvas.getBoundingClientRect();
    W = canvas.width  = Math.round(rect.width)  * devicePixelRatio;
    H = canvas.height = Math.round(rect.height) * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    initWords();
    initBubbles();
  }

  function rnd(min, max) { return min + Math.random() * (max - min); }

  /* ── 文字列オブジェクト ── */
  function initWords() {
    var cssW = W / devicePixelRatio;
    var cssH = H / devicePixelRatio;
    words = WORDS.map(function(text, i) {
      var size = rnd(12, 20);
      return {
        text:  text,
        x:     rnd(20, cssW - 60),
        y:     rnd(30, cssH - 30),
        vx:    rnd(0.12, 0.35) * (Math.random() < 0.5 ? 1 : -1),
        vy:    rnd(0.08, 0.22) * (Math.random() < 0.5 ? 1 : -1),
        /* ゆらゆら用 */
        phase: rnd(0, Math.PI * 2),
        freq:  rnd(0.008, 0.018),
        amp:   rnd(6, 16),
        size:  size,
        color: COLORS[i % COLORS.length],
        alpha: rnd(0.6, 0.9),
      };
    });
  }

  /* ── 泡オブジェクト ── */
  function makeBubble(cssW, cssH) {
    return {
      x:     rnd(10, cssW - 10),
      y:     cssH + 5,
      r:     rnd(2, 6),
      vy:    rnd(0.4, 1.0),
      alpha: rnd(0.25, 0.55),
    };
  }

  function initBubbles() {
    var cssW = W / devicePixelRatio;
    var cssH = H / devicePixelRatio;
    bubbles = [];
    for (var i = 0; i < 18; i++) {
      var b = makeBubble(cssW, cssH);
      b.y = rnd(0, cssH); // 最初は散らばって配置
      bubbles.push(b);
    }
  }

  var tick = 0;

  function draw() {
    var cssW = W / devicePixelRatio;
    var cssH = H / devicePixelRatio;
    tick++;

    /* 背景：水色グラデーション */
    var grad = ctx.createLinearGradient(0, 0, 0, cssH);
    grad.addColorStop(0,   '#c8dff0');
    grad.addColorStop(0.6, '#b8d4e8');
    grad.addColorStop(1,   '#a0c4dc');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cssW, cssH);

    /* 光の揺らぎ（薄い白のスジ） */
    ctx.save();
    for (var i = 0; i < 5; i++) {
      var lx = cssW * (0.1 + i * 0.18) + Math.sin(tick * 0.012 + i) * 12;
      var lg = ctx.createLinearGradient(lx, 0, lx + 8, cssH);
      lg.addColorStop(0,   'rgba(255,255,255,0.08)');
      lg.addColorStop(0.5, 'rgba(255,255,255,0.04)');
      lg.addColorStop(1,   'rgba(255,255,255,0)');
      ctx.fillStyle = lg;
      ctx.fillRect(lx, 0, 8, cssH);
    }
    ctx.restore();

    /* 底の砂（古紙色） */
    ctx.fillStyle = 'rgba(216,203,152,0.45)';
    ctx.fillRect(0, cssH - 14, cssW, 14);
    /* 砂の粒 */
    ctx.fillStyle = 'rgba(192,168,112,0.35)';
    for (var j = 0; j < 20; j++) {
      var gx = (j / 20) * cssW + Math.sin(j * 2.3) * 8;
      var gr = rnd(1.5, 3.5);
      ctx.beginPath();
      ctx.arc(gx, cssH - 8 + Math.sin(j) * 3, gr, 0, Math.PI * 2);
      ctx.fill();
    }

    /* 文字列を描画 */
    words.forEach(function(w) {
      /* ゆらゆら運動 */
      w.x += w.vx;
      w.y += w.vy + Math.sin(tick * w.freq + w.phase) * 0.15;

      /* 壁で跳ね返る */
      if (w.x < 5)        { w.x = 5;        w.vx =  Math.abs(w.vx); }
      if (w.x > cssW - 80){ w.x = cssW - 80; w.vx = -Math.abs(w.vx); }
      if (w.y < 12)       { w.y = 12;       w.vy =  Math.abs(w.vy); }
      if (w.y > cssH - 18){ w.y = cssH - 18; w.vy = -Math.abs(w.vy); }

      ctx.save();
      ctx.font = 'bold ' + w.size + 'px "Shippori Mincho","Noto Serif JP","Yu Mincho",serif';
      ctx.globalAlpha = w.alpha;
      ctx.fillStyle = w.color;
      /* 水中の影（浮き感） */
      ctx.shadowColor = 'rgba(255,255,255,0.4)';
      ctx.shadowBlur  = 3;
      ctx.fillText(w.text, w.x, w.y);
      ctx.restore();
    });

    /* 泡を描画・更新 */
    var cssW2 = cssW, cssH2 = cssH;
    bubbles.forEach(function(b, idx) {
      b.y -= b.vy;
      /* 左右にわずかに揺れる */
      b.x += Math.sin(tick * 0.03 + idx) * 0.3;

      ctx.save();
      ctx.globalAlpha = b.alpha * Math.min(1, b.y / 30); // 上に行くほど薄く
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth   = 1;
      ctx.stroke();
      /* 泡のハイライト */
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fill();
      ctx.restore();

      /* 画面上端を超えたら底から再生成 */
      if (b.y < -b.r) {
        bubbles[idx] = makeBubble(cssW2, cssH2);
      }
    });

    /* 枠線（水槽の内壁感） */
    ctx.strokeStyle = 'rgba(26,18,10,0.12)';
    ctx.lineWidth   = 2;
    ctx.strokeRect(1, 1, cssW - 2, cssH - 2);

    rafId = requestAnimationFrame(draw);
  }

  /* IntersectionObserver で画面内に入ったときだけアニメーション */
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        if (!rafId) {
          resize();
          rafId = requestAnimationFrame(draw);
        }
      } else {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      }
    });
  }, { threshold: 0.1 });

  observer.observe(canvas);

  /* リサイズ対応 */
  var resizeTimer = null;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      ctx.setTransform(1, 0, 0, 1, 0, 0); // transformをリセット
      resize();
      rafId = requestAnimationFrame(draw);
    }, 200);
  });
})();
