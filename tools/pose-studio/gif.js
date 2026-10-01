'use strict';
(function (root) {
  function lzw(px) {
    const out = [];
    let cur = 0, nb = 0, size = 9, next = 258;
    const dict = new Map();
    const emit = (c) => {
      cur |= c << nb;
      nb += size;
      while (nb >= 8) { out.push(cur & 255); cur >>>= 8; nb -= 8; }
    };
    const bump = () => { if (next >= (1 << size) && size < 12) size++; };
    emit(256);
    let p = px[0];
    for (let i = 1; i < px.length; i++) {
      const k = px[i], key = p * 256 + k, v = dict.get(key);
      if (v !== undefined) { p = v; continue; }
      emit(p);
      bump();
      if (next < 4096) dict.set(key, next++);
      else { emit(256); dict.clear(); next = 258; size = 9; }
      p = k;
    }
    emit(p);
    bump();
    emit(257);
    if (nb > 0) out.push(cur & 255);
    return out;
  }

  function makeGif(frames, w, h, delay) {
    const o = [];
    const u16 = (v) => o.push(v & 255, (v >> 8) & 255);
    for (const ch of 'GIF89a') o.push(ch.charCodeAt(0));
    u16(w); u16(h);
    o.push(0xF7, 0, 0);
    for (let i = 0; i < 256; i++) {
      if (i < 216) o.push(Math.floor(i / 36) * 51, (Math.floor(i / 6) % 6) * 51, (i % 6) * 51);
      else o.push(0, 0, 0);
    }
    o.push(0x21, 0xFF, 11);
    for (const ch of 'NETSCAPE2.0') o.push(ch.charCodeAt(0));
    o.push(3, 1, 0, 0, 0);
    for (const f of frames) {
      o.push(0x21, 0xF9, 4, 0x09);
      u16(delay);
      o.push(255, 0);
      o.push(0x2C);
      u16(0); u16(0); u16(w); u16(h);
      o.push(0);
      const idx = new Uint8Array(w * h);
      for (let i = 0, j = 0; i < idx.length; i++, j += 4) {
        idx[i] = f[j + 3] < 128
          ? 255
          : Math.round(f[j] / 51) * 36 + Math.round(f[j + 1] / 51) * 6 + Math.round(f[j + 2] / 51);
      }
      o.push(8);
      const data = lzw(idx);
      for (let i = 0; i < data.length; i += 255) {
        const n = Math.min(255, data.length - i);
        o.push(n);
        for (let k = 0; k < n; k++) o.push(data[i + k]);
      }
      o.push(0);
    }
    o.push(0x3B);
    return new Uint8Array(o);
  }

  root.makeGif = makeGif;
})(typeof window !== 'undefined' ? window : globalThis);
