'use strict';

/* ─── ノイズキャンバス ─── */
(function initNoise() {
  const canvas = document.getElementById('noiseCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    render();
  }

  function render() {
    const img  = ctx.createImageData(canvas.width, canvas.height);
    const data = img.data;
    for (let i = 0; i < data.length; i += 4) {
      const v  = (Math.random() * 255) | 0;
      data[i]  = data[i+1] = data[i+2] = v;
      data[i+3]= 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  window.addEventListener('resize', resize);
  resize();
})();
