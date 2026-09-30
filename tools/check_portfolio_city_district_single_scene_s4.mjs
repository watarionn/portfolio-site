import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const S4 = path.join(ROOT, "prototype", "phase3-9-district-single-scene-s4");

const files = {
  html: path.join(S4, "index.html"),
  css: path.join(S4, "prototype.css"),
  js: path.join(S4, "prototype.js"),
  manifest: path.join(S4, "waterside-s4-aquarium-scene.json"),
  scene: path.join(S4, "assets", "waterside-s4-aquarium-scene.webp"),
  projects: path.join(ROOT, "portfolio-city", "data", "projects.json"),
  builder: path.join(ROOT, "tools", "build_waterside_s4_single_scene.py")
};

function fail(message) {
  throw new Error("Portfolio City S4 contract failed: " + message);
}

for (const [name, file] of Object.entries(files)) {
  if (!fs.existsSync(file)) fail("missing " + name + ": " + path.relative(ROOT, file));
}

const html = fs.readFileSync(files.html, "utf8");
const css = fs.readFileSync(files.css, "utf8");
const js = fs.readFileSync(files.js, "utf8");
const builder = fs.readFileSync(files.builder, "utf8");
const manifest = JSON.parse(fs.readFileSync(files.manifest, "utf8"));
const projects = JSON.parse(fs.readFileSync(files.projects, "utf8")).projects;

if (manifest.schemaVersion !== 1) fail("manifest schemaVersion must be 1");
if (manifest.district?.id !== "waterside-play") fail("district must be waterside-play");
if (manifest.scene?.width !== 1672 || manifest.scene?.height !== 941) fail("scene must remain 1672x941");
if (manifest.scene?.format !== "webp" || manifest.scene?.lossless !== true) fail("scene must be lossless WebP");
if (manifest.sourceLock?.commit !== "fa398ce5db39cdcce242b0fa7bb9881c99d5f02a") fail("source commit changed");
if (manifest.sourceLock?.background?.sha256 !== "838797151c9c557af97ffb84e30940f1afee3e1603208a3ec9620d1bb2f95789") fail("background lock hash changed");
if (manifest.sourceLock?.aquarium?.sha256 !== "228fbc8366d6e5cbdd9ef02a2a948bd5cb24cc9b5bf658f951a68d0eadef9ea1") fail("Aquarium lock hash changed");

const placement = manifest.sourceLock?.placement;
if (
  placement?.anchor !== "bottom-center" ||
  placement?.xFraction !== 0.199606 ||
  placement?.yFraction !== 0.571039 ||
  placement?.widthFraction !== 0.25 ||
  placement?.rotationDegrees !== 0
) {
  fail("Production Locked Aquarium placement changed");
}

if (!Array.isArray(manifest.projects) || manifest.projects.length !== 1) fail("S4 must formalize exactly one locked project");
const entry = manifest.projects[0];
if (entry.id !== "aquarium") fail("S4 project must be Aquarium");
if (!Array.isArray(entry.hotspot) || entry.hotspot.length !== 4) fail("Aquarium hotspot must be a four-point polygon");

const canonical = projects.find((item) => item.id === "aquarium");
if (!canonical) fail("canonical Aquarium project missing");
if (canonical.district !== "waterside-play") fail("Aquarium district changed");
if (canonical.route !== "/AQUARIUM/aquarium.php") fail("Aquarium canonical route changed");

const unfinalized = projects.filter((item) => item.district === "waterside-play" && item.id !== "aquarium").map((item) => item.id).sort();
if (JSON.stringify(unfinalized) !== JSON.stringify(["holoca", "word-generator"])) fail("unexpected Waterside project set");

const webp = fs.readFileSync(files.scene);
if (webp.length !== manifest.scene.fileBytes) fail("scene file size differs from manifest");
if (webp.subarray(0, 4).toString("ascii") !== "RIFF" || webp.subarray(8, 12).toString("ascii") !== "WEBP") fail("scene file is not WebP");

const imageTags = [...html.matchAll(/<img\b/gi)].length;
if (imageTags !== 1) fail("S4 browser presentation must contain exactly one image element");
if (!html.includes('id="district-image"') || !html.includes('id="project-hotspots"')) fail("scene image or hotspot SVG missing");
if (/aquarium-s1-final\.png|background-approved\.png/.test(html + js + css)) fail("runtime must not reconstruct source image layers");
if (!js.includes("../../portfolio-city/data/projects.json")) fail("runtime must load canonical project metadata");
if (!js.includes("data-project-hotspot") || !js.includes("canonicalRoute")) fail("semantic hotspot or canonical route behavior missing");
if (!css.includes(".district-scene { width: 680px; }")) fail("mobile readable scene width contract missing");
if (!css.includes("overflow-x: auto")) fail("mobile internal scene scroll contract missing");

const bbox = entry.hotspotBBox;
const visible = placement.visibleAlphaBBox;
if (!Array.isArray(bbox) || !Array.isArray(visible)) fail("hotspot alignment evidence missing");
if (!(bbox[0] <= visible[0] && bbox[1] <= visible[1] && bbox[2] >= visible[2] && bbox[3] >= visible[3])) fail("hotspot does not cover Aquarium visible alpha bbox");
for (let i = 0; i < 4; i += 1) {
  if (Math.abs(bbox[i] - visible[i]) > 20) fail("hotspot padding drifted too far from visible Aquarium");
}

for (const token of [
  "SOURCE_COMMIT",
  "EXPECTED_BACKGROUND_SHA256",
  "EXPECTED_AQUARIUM_SHA256",
  "LOCKED_X = 0.199606",
  "LOCKED_Y = 0.571039",
  "LOCKED_WIDTH = 0.25"
]) {
  if (!builder.includes(token)) fail("builder missing source-lock token: " + token);
}

console.log("Portfolio City Waterside S4 contract passed: one lossless scene image / locked Aquarium pixels / one semantic hotspot / canonical project metadata + route");
