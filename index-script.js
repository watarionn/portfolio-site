/**
 * 風花 理珠 個人辞典 — script.js
 * 国語辞典世界観ポートフォリオ
 */

'use strict';

/* ─── Works: 技術早見表 ─── */
(function addCheatSheetEntry() {
  const grid = document.querySelector('#works .entries-grid');
  if (!grid || grid.querySelector(a[href="/CHEATShEET/"]))
    return;

  const article = document.createElement('article');
  article.className = 'entry-card entry-card--featured';
  article.setAttribute('role', 'listitem');
  article.dataset.index = '11';
  article.innerHTML = `
    <a href="/CHEATSHEET/" class="entry-link" aria-label="技術早見表 — 検索できるチートシートを開く">
      <div class="entry-inner">
        <header class="entry-header">
          <span class="entry-num" aria-hidden="true">011</span>
          <div class="entry-yomi">
            <ruby><rb>技術早見表</rb><rt>ぎじゅつはやみひょう</rt></ruby>
          </div>
          <span class="entry-pos" aria-label="品詞: 名詞">名</span>
        </header>
        <div class="entry-body">
          <p class="entry-definition">Python・JavaScript㻥改規表現など、28セクション326項目を横断検索できる技術チートシート。</p>
          <div class="entry-tags" aria-label="使用技術">
            <span class="tag">HTML</span>
            <span class="tag">CSS</span>
            <span class="tag">JavaScript</span>
          </div>
        </div>
        <div class="entry-arrow" aria-hidden="true">→</div>
      </div>
    </a>`;

  const characterEntry = grid.querySelector('.entry-card[data-index="90"]');
  grid.insertBefore(article, characterEntry || null);
})();

/* ─── Noise Canvas ─── */
(function initNoise() {
  const canvas = document.getElementById('noiseCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    renderNoise();
  }

  function renderNoise() {
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      data[i]     = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  window.addEventListener('resize', resize);
  resize();
})();

/* ─── Scroll Reveal (IntersectionObserver) ─── */
(function initScrollReveal() {
  if (!('IntersectionObserver' in window)) {
    // フォールバック：全要素を即座に表示
    document.querySelectorAll('.entry-card').forEach(function(el) {
      el.classList.add('is-visible');
    });
    return;
  }

  // エントリーカードのフェードイン
  const cardObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        const el    = entry.target;
        const index = parseInt(el.dataset.index || '0', 10);
        // インデックスに応じたディレイ（グリッド内の位置）
        const delay = (index % 2) * 80;
        setTimeout(function() {
          el.classList.add('is-visible');
        }, delay);
        cardObserver.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.entry-card').forEach(function(el) {
    cardObserver.observe(el);
  });

  // スキルバーのアニメーション
  const skillObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-animated');
        skillObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.skill-item').forEach(function(el) {
    skillObserver.observe(el);
  });
})();

/* ─── Page Number Counter ─── */
(function initPageCounter() {
  const pageNumEl = document.getElementById('pageNum');
  if (!pageNumEl) return;

  const sections = Array.from(document.querySelectorAll('.dictionary-section, .book-header'));

  const obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        const idx = sections.indexOf(entry.target);
        if (idx >= 0) {
          pageNumEl.textContent = idx + 1;
        }
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(function(el) { obs.observe(el); });
})();

/* ─── Footer: 現在年 ─── */
(function setCurrentYear() {
  const el = document.getElementById('currentYear');
  if (el) el.textContent = new Date().getFullYear();
})();

/* ─── TOC: アクティブ状態 ─── */
(function initTocActive() {
  const tocLinks = Array.from(document.querySelectorAll('.toc-link'));
  const sections = tocLinks.map(function(link) {
    return document.querySelector(link.getAttribute('href'));
  }).filter(Boolean);

  if (!sections.length) return;

  const obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        const idx = sections.indexOf(entry.target);
        tocLinks.forEach(function(l) { l.removeAttribute('aria-current'); });
        if (idx >= 0 && tocLinks[idx]) {
          tocLinks[idx].setAttribute('aria-current', 'true');
        }
      }
    });
  }, { threshold: 0.3, rootMargin: '-10% 0px -60% 0px' });

  sections.forEach(function(el) { obs.observe(el); });
})();

/* ─── Entry Card: ページめくりエフェクト ─── */
(function initPageTurnEffect() {
  const overlay   = document.getElementById('pageTurnOverlay');
  const entryLinks = document.querySelectorAll('.entry-link');

  if (!overlay || !entryLinks.length) return;

  // マウスがホバー中でエンターキーを押したときも対応
  entryLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto')) return;

      // 外叨遇移のためデフォルトを一旦武剈め、エフェクト後に遇移
      e.preventDefault();

      overlay.classList.add('is-turning');
      overlay.addEventListener('animationend', function handler() {
        overlay.classList.remove('is-turning');
        overlay.removeEventListener('animationend', handler);
        window.location.href = href;
      });
    });
  });
})();

/* ─── Smooth Anchor Scroll for TOC ─── */
(function initSmoothScroll() {
  document.querySelectorAll('.toc-link').forEach(function(link) {
    link.addEventListener('click', function(e) {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();

/* ─── 栞: ホバー音 (Web Audio API) ─── */
(function initBookmarkSound() {
  const bookmarks = document.querySelectorAll('.bookmark');
  if (!bookmarks.length || !window.AudioContext) return;

  let audioCtx = null;

  function playTick() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.07, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.1);
  }

  bookmarks.forEach(function(bookmark) {
    bookmark.addEventListener('mouseenter', playTick, { passive: true });
  });
})();
