// Run: node works/komorebi-town-25d/tests/art_layer.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, '../public/art-layer.js'), 'utf8');
const html = readFileSync(join(here, '../public/index.html'), 'utf8');
assert.match(html, /<script src="\.\/art-layer\.js"><\/script>/);
assert.match(html, /id="time-button"/);
assert.match(html, /function findPath\(/); // Keep the tap-navigation contract.

const window = {};
runInNewContext(source, { window, Math, innerWidth: 800, innerHeight: 600 });
assert.equal(typeof window.KomorebiArt, 'function');
let operations = 0;
const ctx = new Proxy({
  createRadialGradient: () => ({ addColorStop: () => { operations++; } }),
  createLinearGradient: () => ({ addColorStop: () => { operations++; } }),
  measureText: () => ({ width: 40 }),
}, {
  get(object, key) {
    if (key in object) return object[key];
    return () => { operations++; };
  },
  set(object, key, value) { object[key] = value; return true; },
});
const art = window.KomorebiArt({ctx, iso: (x,z) => ({x: 300+x*5, y: 210+z*5}), getZoom: () => 1, reduceMotion: false});
const houses = ['図書館','工房','展示館','あそび場'].map((name,i)=>({name,x:3+i,z:3+i}));
for (const mode of ['昼','夕方','夜']) {
  assert.equal(art.label(), mode);
  art.advance(5000);
  for (const h of houses) art.drawHouse(h);
  art.drawTree({x:4,z:4,shade:2,size:1});
  art.drawGroundDetails();
  art.drawFountain(13,13);
  art.drawAtmosphere(800,600,houses);
  art.nextPhase();
}
assert.equal(art.label(), '昼');
assert.ok(operations > 150, 'all modes should draw actual geometry');
console.log('KOMOREBI_25D_ART_CONTRACT_PASS', { operations });