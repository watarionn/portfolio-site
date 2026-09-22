#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "master-world.v1.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

const errors = [];
const expected = [];
for (let r = 1; r <= 12; r++) {
  for (let c = 0; c < 16; c++) expected.push(String.fromCharCode(65 + c) + String(r).padStart(2, "0"));
}
const ids = Object.keys(data.cells || {});

if (data.grid?.columns !== 16 || data.grid?.rows !== 12) errors.push("grid must be 16x12");
if (ids.length !== 192) errors.push(`expected 192 cells, got ${ids.length}`);
for (const id of expected) if (!data.cells[id]) errors.push(`missing cell ${id}`);
for (const id of ids) if (!expected.includes(id)) errors.push(`unexpected cell ${id}`);

const published = ids.filter(id => data.cells[id].state === "PUBLISHED");
if (published.length !== 4) errors.push(`expected 4 published cells, got ${published.length}`);

const seenDistricts = new Set();
for (const id of ids) {
  const cell = data.cells[id];
  if (cell.state === "PUBLISHED") {
    if (!cell.districtId) errors.push(`${id}: published cell missing districtId`);
    if (seenDistricts.has(cell.districtId)) errors.push(`${id}: duplicate districtId ${cell.districtId}`);
    seenDistricts.add(cell.districtId);
    if (data.districts?.[cell.districtId]?.homeCell !== id) errors.push(`${id}: district homeCell mismatch`);
  } else if (cell.districtId || cell.districtName) {
    errors.push(`${id}: unpublished cell must not bind a district`);
  }
}

function projectCell(id, offset = {x:0,y:0}) {
  const match = /^([A-P])(0[1-9]|1[0-2])$/.exec(id);
  if (!match) throw new Error(`invalid cell id: ${id}`);
  const col = match[1].charCodeAt(0) - 65;
  const row = Number(match[2]) - 1;
  const ox = Math.max(-0.49, Math.min(0.49, Number(offset.x || 0)));
  const oy = Math.max(-0.49, Math.min(0.49, Number(offset.y || 0)));
  return {
    x: (col + 0.5 + ox) / 16,
    y: (row + 0.5 + oy) / 12
  };
}

const offsets = {
  observatory: {x:0.16,y:-0.12},
  archive: {x:-0.18,y:0.08},
  workshop: {x:0.18,y:-0.04},
  waterside: {x:0.14,y:0.14}
};

const projection = {};
for (const [districtId, d] of Object.entries(data.districts)) {
  projection[districtId] = {homeCell:d.homeCell, normalized:projectCell(d.homeCell, offsets[districtId])};
}

if (errors.length) {
  console.error("Master World validation FAILED");
  for (const e of errors) console.error("- " + e);
  process.exit(1);
}
console.log("Master World validation PASS");
console.log(`cells=${ids.length} published=${published.length}`);
console.log(JSON.stringify(projection, null, 2));
