import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync('portfolio-city/city.js', 'utf8');
const start = source.indexOf('function resolveWorldBounds');
const end = source.indexOf('function projectsForDistrict', start);
assert.ok(start >= 0 && end > start, 'negative-origin geometry helpers must exist in city.js');

const context = vm.createContext({ Number, Object });
vm.runInContext(source.slice(start, end), context);

function evaluate(expression) {
  return vm.runInContext(expression, context);
}

function approx(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${message}: expected ${expected}, got ${actual}`);
}

const legacyWorld = { chunkWidth: 1024, chunkHeight: 768, width: 3200, height: 2304 };
const legacyBounds = evaluate(`resolveWorldBounds(${JSON.stringify(legacyWorld)})`);
assert.equal(legacyBounds.minX, 0);
assert.equal(legacyBounds.minY, 0);
assert.equal(legacyBounds.maxX, 3200);
assert.equal(legacyBounds.maxY, 2304);
const observatoryRegion = { x: 768, y: 80, width: 1664, height: 650 };
const legacyRect = evaluate(`worldRectToPercent(${JSON.stringify(observatoryRegion)}, ${JSON.stringify(legacyWorld)})`);
approx(legacyRect.left, 768 / 3200 * 100, 'legacy left');
approx(legacyRect.top, 80 / 2304 * 100, 'legacy top');
approx(legacyRect.width, 1664 / 3200 * 100, 'legacy width');
approx(legacyRect.height, 650 / 2304 * 100, 'legacy height');

const futureWorld = {
  minX: -1024,
  minY: -768,
  chunkWidth: 1024,
  chunkHeight: 768,
  width: 5120,
  height: 3840
};
const futureBounds = evaluate(`resolveWorldBounds(${JSON.stringify(futureWorld)})`);
assert.equal(futureBounds.minX, -1024);
assert.equal(futureBounds.minY, -768);
assert.equal(futureBounds.maxX, 4096);
assert.equal(futureBounds.maxY, 3072);

const chunkIds = [
  [1,-1],[0,0],[1,0],[2,0],
  [-1,1],[0,1],[1,1],[2,1],[3,1],
  [0,2],[1,2],[2,2],[1,3]
];
for (const [column, row] of chunkIds) {
  const chunk = { column, row };
  const region = evaluate(`chunkRenderRegion(${JSON.stringify(chunk)}, ${JSON.stringify(futureWorld)})`);
  assert.equal(region.x, column * 1024, `chunk ${column}:${row} x`);
  assert.equal(region.y, row * 768, `chunk ${column}:${row} y`);
  assert.equal(region.width, 1024, `chunk ${column}:${row} width`);
  assert.equal(region.height, 768, `chunk ${column}:${row} height`);

  const percent = evaluate(`worldRectToPercent(${JSON.stringify(region)}, ${JSON.stringify(futureWorld)})`);
  approx(percent.left, (column + 1) * 20, `chunk ${column}:${row} left`);
  approx(percent.top, (row + 1) * 20, `chunk ${column}:${row} top`);
  approx(percent.width, 20, `chunk ${column}:${row} width%`);
  approx(percent.height, 20, `chunk ${column}:${row} height%`);
  assert.ok(percent.left >= 0 && percent.left + percent.width <= 100, `chunk ${column}:${row} horizontal bounds`);
  assert.ok(percent.top >= 0 && percent.top + percent.height <= 100, `chunk ${column}:${row} vertical bounds`);
}

const northWest = evaluate(`worldRectToPercent(chunkRenderRegion({column:-1,row:1}, ${JSON.stringify(futureWorld)}), ${JSON.stringify(futureWorld)})`);
assert.equal(northWest.left, 0);
const northApron = evaluate(`worldRectToPercent(chunkRenderRegion({column:1,row:-1}, ${JSON.stringify(futureWorld)}), ${JSON.stringify(futureWorld)})`);
assert.equal(northApron.top, 0);
const eastApron = evaluate(`worldRectToPercent(chunkRenderRegion({column:3,row:1}, ${JSON.stringify(futureWorld)}), ${JSON.stringify(futureWorld)})`);
assert.equal(eastApron.left + eastApron.width, 100);
const southApron = evaluate(`worldRectToPercent(chunkRenderRegion({column:1,row:3}, ${JSON.stringify(futureWorld)}), ${JSON.stringify(futureWorld)})`);
assert.equal(southApron.top + southApron.height, 100);
const holo = evaluate(`worldPointToPercent(1600, 360, ${JSON.stringify(futureWorld)})`);
approx(holo.x, 51.25, 'HoloScope future x%');
approx(holo.y, 29.375, 'HoloScope future y%');

const override = {
  column: 1,
  row: 0,
  renderRegion: { x: 768, y: 80, width: 1664, height: 650 }
};
const overrideRegion = evaluate(`chunkRenderRegion(${JSON.stringify(override)}, ${JSON.stringify(legacyWorld)})`);
assert.equal(JSON.stringify(overrideRegion), JSON.stringify(override.renderRegion), 'explicit renderRegion must remain authoritative');

console.log('Portfolio City negative-origin runtime compatibility passed: legacy percentages unchanged / 13 chunks bounded / minX-minY normalized');
