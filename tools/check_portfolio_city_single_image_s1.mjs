import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROTOTYPE = path.join(ROOT, "prototype", "phase3-9-world-single-image-s1");
const CONFIG_PATH = path.join(PROTOTYPE, "world-single-scene.s1.json");
const HTML_PATH = path.join(PROTOTYPE, "index.html");
const CSS_PATH = path.join(PROTOTYPE, "prototype.css");
const JS_PATH = path.join(PROTOTYPE, "prototype.js");
const MASTER_PATH = path.join(ROOT, "portfolio-city", "assets", "world", "v1", "master", "portfolio-city-master-world-v1.jpg");

function fail(message) {
  throw new Error("Portfolio City S1 contract failed: " + message);
}

for (const file of [CONFIG_PATH, HTML_PATH, CSS_PATH, JS_PATH, MASTER_PATH]) {
  if (!fs.existsSync(file)) fail("missing file: " + path.relative(ROOT, file));
}

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
const html = fs.readFileSync(HTML_PATH, "utf8");
const css = fs.readFileSync(CSS_PATH, "utf8");
const js = fs.readFileSync(JS_PATH, "utf8");

if (config.schemaVersion !== 1) fail("schemaVersion must be 1");
if (config.source?.width !== 8192 || config.source?.height !== 6144) fail("source geometry must remain 8192x6144");
if (!String(config.source?.asset || "").includes("portfolio-city-master-world-v1.jpg")) fail("S1 must bind the existing Master World");

const expectedHomes = new Map([
  ["observatory", "H05"],
  ["archive", "G06"],
  ["workshop", "I06"],
  ["waterside", "H07"]
]);

if (!Array.isArray(config.districts) || config.districts.length !== 4) fail("exactly four current districts are required");
for (const district of config.districts) {
  if (expectedHomes.get(district.id) !== district.homeCell) fail("district home mismatch: " + district.id);
  if (!district.anchor || district.anchor.x < 0 || district.anchor.x > 8192 || district.anchor.y < 0 || district.anchor.y > 6144) fail("invalid anchor: " + district.id);
  if (!Array.isArray(district.hotspot) || district.hotspot.length < 4) fail("hotspot polygon too small: " + district.id);
}

for (const breakpoint of ["desktop", "tablet", "mobile"]) {
  if (!config.entryCameras?.[breakpoint]) fail("missing entry camera: " + breakpoint);
  if (!config.panBounds?.[breakpoint]) fail("missing pan bounds: " + breakpoint);
  if (!config.districtFocusWorldFraction?.[breakpoint]) fail("missing district focus framing: " + breakpoint);
}

const htmlTokens = ["world-viewport", "world-plane", "world-image", "world-atmosphere", "world-hotspots", "district-sheet", "return-world"];
for (const token of htmlTokens) if (!html.includes(token)) fail("HTML missing token: " + token);

const jsTokens = ["pointerdown", "pointermove", "ArrowLeft", "snapshotCamera", "restoreCamera"];
for (const token of jsTokens) if (!js.includes(token)) fail("JS missing behavior token: " + token);
if (!css.includes("prefers-reduced-motion")) fail("reduced-motion CSS missing");
if (html.includes("terrain-tile") || js.includes("terrain-tile")) fail("S1 must not reconstruct the 192-tile runtime");

console.log("Portfolio City World Single-Image Prototype S1 contract passed: 1 image / 4 hotspots / camera + pan + restore / isolated runtime");
