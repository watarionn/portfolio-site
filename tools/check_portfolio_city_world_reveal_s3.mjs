import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const S3 = path.join(ROOT, "prototype", "phase3-9-world-reveal-s3");
const files = {
  html: path.join(S3, "index.html"),
  css: path.join(S3, "reveal.css"),
  js: path.join(S3, "reveal.js"),
  geometry: path.join(S3, "reveal-geometry.s3.json"),
  reveal: path.join(ROOT, "prototype", "phase3-9-world-data", "world-reveal.v1.json"),
  scene: path.join(ROOT, "prototype", "phase3-9-world-single-image-s1", "world-single-scene.s1.json")
};

function fail(message) {
  throw new Error("Portfolio City S3 reveal contract failed: " + message);
}

for (const [name, file] of Object.entries(files)) {
  if (!fs.existsSync(file)) fail("missing " + name + ": " + path.relative(ROOT, file));
}

const html = fs.readFileSync(files.html, "utf8");
const css = fs.readFileSync(files.css, "utf8");
const js = fs.readFileSync(files.js, "utf8");
const geometry = JSON.parse(fs.readFileSync(files.geometry, "utf8"));
const reveal = JSON.parse(fs.readFileSync(files.reveal, "utf8"));
const scene = JSON.parse(fs.readFileSync(files.scene, "utf8"));

if (geometry.schemaVersion !== 1) fail("geometry schemaVersion must be 1");
if (geometry.coordinateSystem?.width !== 8192 || geometry.coordinateSystem?.height !== 6144) {
  fail("geometry must use the 8192x6144 authoring coordinate system");
}

const expectedPublished = ["H05", "G06", "I06", "H07"].sort();
const actualPublished = [...(reveal.w0?.publishedCells || [])].sort();
if (JSON.stringify(actualPublished) !== JSON.stringify(expectedPublished)) {
  fail("canonical published cells changed");
}

const districtHomes = scene.districts.map((district) => district.homeCell).sort();
if (JSON.stringify(districtHomes) !== JSON.stringify(expectedPublished)) {
  fail("S1 district homes no longer match canonical published cells");
}

for (const state of ["published", "near_frontier", "unpublished", "unresolved"]) {
  if (!reveal.states?.[state]) fail("canonical reveal state missing: " + state);
  if (!geometry.stateStyle?.[state]) fail("S3 state style missing: " + state);
}

if (geometry.rules?.rendersLogicalCells !== false) fail("S3 must not render logical cells");
if (geometry.rules?.cloudGeometryCrossesCellBoundaries !== true) fail("clouds must cross cell boundaries");
if (geometry.rules?.previewChangesAtmosphereOnly !== true) fail("preview must be atmosphere-only");
if (geometry.rules?.previewAddsHotspot !== false) fail("preview must not add a hotspot");

const current = geometry.profiles?.current;
const preview = geometry.profiles?.previewJ05;
if (!current || !preview) fail("current and previewJ05 profiles are required");
if (preview.previewCell !== "J05") fail("preview cell must be J05");
if (current.clearPath === preview.clearPath) fail("preview must change the organic clear mask");

const frontierCells = Object.values(reveal.w0?.fronts || {}).flat();
if (!frontierCells.includes(preview.previewCell)) fail("preview J05 must originate from canonical near-frontier data");

for (const bank of geometry.unresolvedBanks || []) {
  if (bank.crossesCellBoundaries !== true) fail("cloud bank must declare cross-cell geometry: " + bank.id);
  if (!Array.isArray(bank.bbox) || bank.bbox.length !== 4) fail("cloud bank bbox missing: " + bank.id);
  const width = bank.bbox[2] - bank.bbox[0];
  const height = bank.bbox[3] - bank.bbox[1];
  if (width <= 512 && height <= 512) fail("cloud bank is cell-sized: " + bank.id);
}

if ((geometry.unresolvedBanks || []).length < 4) fail("S3 needs broad unresolved cloud banks");
if (!html.includes('id="world-reveal"') || !html.includes('aria-hidden="true"')) fail("atmosphere SVG must be aria-hidden");
if (!html.includes('data-reveal-profile="previewJ05"')) fail("J05 preview control missing");
if (!css.includes("pointer-events: none")) fail("atmosphere must not intercept interaction");
if (!js.includes("world-reveal.v1.json")) fail("S3 must bind canonical reveal data");
if (!js.includes("previewCell") || !js.includes("applyRevealProfile")) fail("reveal profile behavior missing");
if (html.includes("terrain-tile") || js.includes("terrain-tile")) fail("S3 must not reconstruct tile presentation");
if (/data-cell=|class=["'][^"']*cell/.test(html)) fail("S3 must not render logical cell UI");

console.log("Portfolio City World Reveal Prototype S3 contract passed: canonical publication data / organic cross-cell atmosphere / atmosphere-only J05 preview / 4 published hotspots");
