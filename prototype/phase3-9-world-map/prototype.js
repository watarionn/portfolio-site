const viewport = document.querySelector(".viewport");
const world = document.querySelector("#world");
const worldPanel = document.querySelector("#world-panel");
const districtPanel = document.querySelector("#district-panel");
const districts = [...document.querySelectorAll(".district")];
const selectedOutput = document.querySelector("#debug-selected");
const stateOutput = document.querySelector("#debug-state");
const viewportOutput = document.querySelector("#debug-viewport");
const cameraOutput = document.querySelector("#debug-camera");
const savedOutput = document.querySelector("#debug-saved");
const tileOutput = document.querySelector("#debug-tiles");
const terrainStage = document.querySelector("#terrain-stage");
const snapshotButton = document.querySelector("#snapshot-camera");
const restoreButton = document.querySelector("#restore-camera");
const resetButton = document.querySelector("#reset-camera");
const districtName = document.querySelector("#district-name");
const districtRole = document.querySelector("#district-role");
const buildingGrid = document.querySelector("#building-grid");
const previousDistrictButton = document.querySelector("#previous-district");
const nextDistrictButton = document.querySelector("#next-district");
const returnWorldButton = document.querySelector("#return-world");
const buildingPreview = document.querySelector("#building-preview");
const previewTitle = document.querySelector("#preview-title");
const previewId = document.querySelector("#preview-id");
const previewRoute = document.querySelector("#preview-route");
const closePreviewButton = document.querySelector("#close-preview");
const openWorkButton = document.querySelector("#open-work");

const DISTRICT_SEQUENCE = ["archive", "observatory", "workshop", "waterside"];
const DISTRICT_DATA = {
  archive: { name: "Archive Street", role: "4 project buildings", projects: [
    ["yorei", "用例採集", "/YOREI/yorei.html"], ["actress-finder", "人物索引", "/OTHER/actress_finder.html"],
    ["cheatsheet", "技術早見表", "/CHEATSHEET/"], ["shisha", "SHISHA 店舗検索", "/SHISHA/"] ] },
  observatory: { name: "Observatory Hill", role: "3 project buildings", projects: [
    ["holoscope", "HoloScope", "/holoscope/"], ["sphere", "天球儀", "/SPHERE/sphere.html"],
    ["prime-dot-art", "素数点画", "/PRIME_DOT_ART/prime_dot_art.html"] ] },
  workshop: { name: "Workshop Alley", role: "4 project buildings", projects: [
    ["dqb2", "DQB2 部屋レシピ図鑑", "/DQB2/dqb2.html"], ["madori", "間取図メーカー", "/MADORI/madori.html"],
    ["maze-maker", "迷路作成補助器", "/MAZE_MAKER/maze_maker.html"], ["anagram", "アナグラム補助器", "/ANAGRAM/anagram.html"] ] },
  waterside: { name: "Waterside Play", role: "3 project buildings", projects: [
    ["aquarium", "水族館", "/AQUARIUM/aquarium.php"], ["holoca", "HOLOCA デッキラボ", "/HOLOCA/holoca.html"],
    ["word-generator", "ボードゲーム単語集", "/WORD_GENERATOR/word_generator.html"] ] }
};

const camera = { x: 0, y: 0, zoom: 1 };
let savedCamera = null;
let activeDistrict = null;
let activeProject = null;
let previewReturnTarget = null;
let drag = null;
const PAN_STEP = 36;
const EDGE_SLACK = 20;

function clamp(value, min, max) { if (min > max) return (min + max) / 2; return Math.min(max, Math.max(min, value)); }
function getPanBounds() {
  const baseLeft = world.offsetLeft; const baseTop = world.offsetTop;
  return { minX: viewport.clientWidth - baseLeft - world.offsetWidth - EDGE_SLACK, maxX: -baseLeft + EDGE_SLACK,
    minY: viewport.clientHeight - baseTop - world.offsetHeight - EDGE_SLACK, maxY: -baseTop + EDGE_SLACK };
}
function clampCamera() { const bounds = getPanBounds(); camera.x = clamp(camera.x, bounds.minX, bounds.maxX); camera.y = clamp(camera.y, bounds.minY, bounds.maxY); }
function getNormalizedCenter() {
  const viewRect = viewport.getBoundingClientRect(); const worldRect = world.getBoundingClientRect();
  return { x: ((viewRect.left + viewRect.width / 2 - worldRect.left) / worldRect.width) * 100,
    y: ((viewRect.top + viewRect.height / 2 - worldRect.top) / worldRect.height) * 64 };
}
function renderCamera() {
  clampCamera(); world.style.setProperty("--camera-x", `${camera.x}px`); world.style.setProperty("--camera-y", `${camera.y}px`);
  const center = getNormalizedCenter(); cameraOutput.textContent = `(${center.x.toFixed(1)}, ${center.y.toFixed(1)}) z${camera.zoom}`;
}
function snapshotCamera() { savedCamera = { ...camera }; const center = getNormalizedCenter(); savedOutput.textContent = `(${center.x.toFixed(1)}, ${center.y.toFixed(1)})`; }
function restoreCamera() { if (!savedCamera) return; Object.assign(camera, savedCamera); renderCamera(); }
function resetCamera() { camera.x = 0; camera.y = 0; renderCamera(); }
function updateViewportDebug() { viewportOutput.textContent = `${window.innerWidth} x ${window.innerHeight}`; if (!worldPanel.hidden) renderCamera(); }

function renderDistrictView(id) {
  const district = DISTRICT_DATA[id]; activeDistrict = id;
  districtName.textContent = district.name; districtRole.textContent = district.role;
  buildingGrid.replaceChildren(...district.projects.map(([projectId, title, route]) => {
    const card = document.createElement("button"); card.type = "button"; card.className = "building-placeholder"; card.dataset.projectId = projectId; card.dataset.route = route;
    const marker = document.createElement("div"); marker.className = "building-placeholder__shape"; marker.setAttribute("aria-hidden", "true");
    const heading = document.createElement("h3"); heading.textContent = title;
    const meta = document.createElement("p"); meta.textContent = `${projectId} · ${route}`;
    card.append(marker, heading, meta); card.addEventListener("click", () => openBuildingPreview(projectId, title, route, card)); return card;
  }));
  stateOutput.textContent = `P1 District View / ${district.name}`; selectedOutput.textContent = id;
}
function openBuildingPreview(projectId, title, route, trigger) {
  activeProject = { projectId, title, route }; previewReturnTarget = trigger;
  previewTitle.textContent = title; previewId.textContent = `project: ${projectId}`; previewRoute.textContent = `canonical route: ${route}`;
  buildingPreview.hidden = false; stateOutput.textContent = `P2 Building Preview / ${title}`; selectedOutput.textContent = projectId; previewTitle.focus();
}
function closeBuildingPreview() {
  if (buildingPreview.hidden) return;
  buildingPreview.hidden = true; stateOutput.textContent = `P1 District View / ${DISTRICT_DATA[activeDistrict].name}`; selectedOutput.textContent = activeDistrict;
  const target = previewReturnTarget; previewReturnTarget = null; activeProject = null; if (target?.isConnected) target.focus();
}
function enterDistrict(id) { snapshotCamera(); renderDistrictView(id); worldPanel.hidden = true; districtPanel.hidden = false; returnWorldButton.focus(); }
function moveDistrict(delta) {
  const index = DISTRICT_SEQUENCE.indexOf(activeDistrict); const next = (index + delta + DISTRICT_SEQUENCE.length) % DISTRICT_SEQUENCE.length;
  renderDistrictView(DISTRICT_SEQUENCE[next]); districtName.focus();
}
function returnToWorld() {
  districtPanel.hidden = true; worldPanel.hidden = false; stateOutput.textContent = "World View"; restoreCamera();
  const target = districts.find((district) => district.dataset.district === activeDistrict); if (target) target.focus();
}

viewport.addEventListener("pointerdown", (event) => {
  if (event.target.closest("button")) return;
  drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, cameraX: camera.x, cameraY: camera.y };
  viewport.setPointerCapture(event.pointerId); viewport.classList.add("is-dragging");
});
viewport.addEventListener("pointermove", (event) => { if (!drag || drag.pointerId !== event.pointerId) return; camera.x = drag.cameraX + event.clientX - drag.x; camera.y = drag.cameraY + event.clientY - drag.y; renderCamera(); });
function endDrag(event) { if (!drag || drag.pointerId !== event.pointerId) return; drag = null; viewport.classList.remove("is-dragging"); }
viewport.addEventListener("pointerup", endDrag); viewport.addEventListener("pointercancel", endDrag);
viewport.addEventListener("keydown", (event) => {
  if (event.target !== viewport) return;
  const delta = { ArrowLeft: [PAN_STEP, 0], ArrowRight: [-PAN_STEP, 0], ArrowUp: [0, PAN_STEP], ArrowDown: [0, -PAN_STEP] }[event.key];
  if (!delta) return; event.preventDefault(); camera.x += delta[0]; camera.y += delta[1]; renderCamera();
});
districts.forEach((district) => { district.setAttribute("aria-pressed", "false"); district.addEventListener("click", () => enterDistrict(district.dataset.district)); });
buildingPreview.addEventListener("click", (event) => { if (event.target.matches("[data-preview-close]")) closeBuildingPreview(); });
closePreviewButton.addEventListener("click", closeBuildingPreview);
openWorkButton.addEventListener("click", () => {
  if (!activeProject) return;
  stateOutput.textContent = `P2 Building Preview / Open Work contract: ${activeProject.route}`;
});
document.addEventListener("keydown", (event) => {
  if (buildingPreview.hidden) return;
  if (event.key === "Escape") { event.preventDefault(); closeBuildingPreview(); return; }
  if (event.key !== "Tab") return;
  const focusable = [...buildingPreview.querySelectorAll("button:not([disabled])")];
  if (!focusable.length) return;
  const first = focusable[0]; const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
previousDistrictButton.addEventListener("click", () => moveDistrict(-1)); nextDistrictButton.addEventListener("click", () => moveDistrict(1)); returnWorldButton.addEventListener("click", returnToWorld);
snapshotButton.addEventListener("click", snapshotCamera); restoreButton.addEventListener("click", restoreCamera); resetButton.addEventListener("click", resetCamera);
window.addEventListener("resize", updateViewportDebug); updateViewportDebug();


/* CP-D5E terrain tile stage: dormant until a real exported manifest exists. */
const TERRAIN_MANIFEST_URL = "./world-tiles/manifest.json";
function tilePosition(cellId) {
  const col = cellId.charCodeAt(0) - 65;
  const row = Number(cellId.slice(1)) - 1;
  return { left: col * 6.25, top: row * (100 / 12) };
}
async function bindTerrainManifest() {
  try {
    const response = await fetch(TERRAIN_MANIFEST_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("manifest unavailable");
    const manifest = await response.json();
    if (manifest?.grid?.columns !== 16 || manifest?.grid?.rows !== 12 || Object.keys(manifest.tiles || {}).length !== 192) {
      throw new Error("manifest contract mismatch");
    }
    const fragment = document.createDocumentFragment();
    Object.entries(manifest.tiles).forEach(([cellId, tile]) => {
      const image = document.createElement("img");
      const pos = tilePosition(cellId);
      image.className = "terrain-tile";
      image.src = `./world-tiles/${tile.file}`;
      image.alt = "";
      image.loading = "lazy";
      image.decoding = "async";
      image.style.left = `${pos.left}%`;
      image.style.top = `${pos.top}%`;
      fragment.append(image);
    });
    terrainStage.replaceChildren(fragment);
    tileOutput.textContent = "192-tile manifest bound";
  } catch (error) {
    tileOutput.textContent = "fallback / manifest not bound";
  }
}
bindTerrainManifest();
