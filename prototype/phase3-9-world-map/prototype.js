const viewport = document.querySelector(".viewport");
const world = document.querySelector("#world");
const districts = [...document.querySelectorAll(".district")];
const selectedOutput = document.querySelector("#debug-selected");
const viewportOutput = document.querySelector("#debug-viewport");
const cameraOutput = document.querySelector("#debug-camera");
const savedOutput = document.querySelector("#debug-saved");
const snapshotButton = document.querySelector("#snapshot-camera");
const restoreButton = document.querySelector("#restore-camera");
const resetButton = document.querySelector("#reset-camera");

const camera = { x: 0, y: 0, zoom: 1 };
let savedCamera = null;
let drag = null;
const PAN_STEP = 36;
const EDGE_SLACK = 20;

function clamp(value, min, max) {
  if (min > max) return (min + max) / 2;
  return Math.min(max, Math.max(min, value));
}

function getPanBounds() {
  const baseLeft = world.offsetLeft;
  const baseTop = world.offsetTop;
  return {
    minX: viewport.clientWidth - baseLeft - world.offsetWidth - EDGE_SLACK,
    maxX: -baseLeft + EDGE_SLACK,
    minY: viewport.clientHeight - baseTop - world.offsetHeight - EDGE_SLACK,
    maxY: -baseTop + EDGE_SLACK
  };
}

function clampCamera() {
  const bounds = getPanBounds();
  camera.x = clamp(camera.x, bounds.minX, bounds.maxX);
  camera.y = clamp(camera.y, bounds.minY, bounds.maxY);
}

function getNormalizedCenter() {
  const viewRect = viewport.getBoundingClientRect();
  const worldRect = world.getBoundingClientRect();
  return {
    x: ((viewRect.left + viewRect.width / 2 - worldRect.left) / worldRect.width) * 100,
    y: ((viewRect.top + viewRect.height / 2 - worldRect.top) / worldRect.height) * 64
  };
}

function renderCamera() {
  clampCamera();
  world.style.setProperty("--camera-x", `${camera.x}px`);
  world.style.setProperty("--camera-y", `${camera.y}px`);
  const center = getNormalizedCenter();
  cameraOutput.textContent = `(${center.x.toFixed(1)}, ${center.y.toFixed(1)}) z${camera.zoom}`;
}

function snapshotCamera() {
  savedCamera = { ...camera };
  const center = getNormalizedCenter();
  savedOutput.textContent = `(${center.x.toFixed(1)}, ${center.y.toFixed(1)})`;
}

function restoreCamera() {
  if (!savedCamera) return;
  Object.assign(camera, savedCamera);
  renderCamera();
}

function resetCamera() {
  camera.x = 0;
  camera.y = 0;
  renderCamera();
}

function updateViewportDebug() {
  viewportOutput.textContent = `${window.innerWidth} x ${window.innerHeight}`;
  renderCamera();
}

function selectDistrict(button) {
  districts.forEach((district) => {
    district.setAttribute("aria-pressed", district === button ? "true" : "false");
  });
  selectedOutput.textContent = button.dataset.district;
  snapshotCamera();
}

viewport.addEventListener("pointerdown", (event) => {
  if (event.target.closest("button")) return;
  drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY,
    cameraX: camera.x, cameraY: camera.y };
  viewport.setPointerCapture(event.pointerId);
  viewport.classList.add("is-dragging");
});

viewport.addEventListener("pointermove", (event) => {
  if (!drag || drag.pointerId !== event.pointerId) return;
  camera.x = drag.cameraX + event.clientX - drag.x;
  camera.y = drag.cameraY + event.clientY - drag.y;
  renderCamera();
});

function endDrag(event) {
  if (!drag || drag.pointerId !== event.pointerId) return;
  drag = null;
  viewport.classList.remove("is-dragging");
}
viewport.addEventListener("pointerup", endDrag);
viewport.addEventListener("pointercancel", endDrag);

viewport.addEventListener("keydown", (event) => {
  if (event.target !== viewport) return;
  const delta = { ArrowLeft: [PAN_STEP, 0], ArrowRight: [-PAN_STEP, 0],
    ArrowUp: [0, PAN_STEP], ArrowDown: [0, -PAN_STEP] }[event.key];
  if (!delta) return;
  event.preventDefault();
  camera.x += delta[0];
  camera.y += delta[1];
  renderCamera();
});

districts.forEach((district) => {
  district.setAttribute("aria-pressed", "false");
  district.addEventListener("click", () => selectDistrict(district));
});
snapshotButton.addEventListener("click", snapshotCamera);
restoreButton.addEventListener("click", restoreCamera);
resetButton.addEventListener("click", resetCamera);

window.addEventListener("resize", updateViewportDebug);
updateViewportDebug();
