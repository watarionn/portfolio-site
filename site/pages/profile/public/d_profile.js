'use strict';

/* ─── ノイズキャンバス ─── */
(function initNoise() {
  const canvas = document.getElementById('noiseCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const img  = ctx.createImageData(canvas.width, canvas.height);
    const data = img.data;
    for (let i = 0; i < data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      data[i] = data[i+1] = data[i+2] = v;
      data[i+3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();
})();

/* ─── スクロールアニメーション ─── */
(function initScrollReveal() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.entry').forEach(function(el) {
      el.classList.add('is-visible');
    });
    return;
  }
  const obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.entry').forEach(function(el) {
    obs.observe(el);
  });
})();
