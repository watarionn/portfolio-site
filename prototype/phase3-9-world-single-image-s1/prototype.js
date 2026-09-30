(function () {
  "use strict";

  const CONFIG_URL = "./world-single-scene.s1.json";
  const viewport = document.getElementById("world-viewport");
  const plane = document.getElementById("world-plane");
  const image = document.getElementById("world-image");
  const hotspotSvg = document.getElementById("world-hotspots");
  const districtSheet = document.getElementById("district-sheet");
  const districtTitle = document.getElementById("district-sheet-title");
  const districtMeta = document.getElementById("district-sheet-meta");
  const returnButton = document.getElementById("return-world");
  const status = document.getElementById("world-status");
  const debugBreakpoint = document.getElementById("debug-breakpoint");
  const debugCamera = document.getElementById("debug-camera");
  const debugScale = document.getElementById("debug-scale");
  const debugSelected = document.getElementById("debug-selected");
  const debugImage = document.getElementById("debug-image");

  const state = {
    config: null,
    breakpoint: "desktop",
    centerX: 0.475,
    centerY: 0.465,
    viewFraction: { width: 0.42, height: 0.42 },
    scale: 1,
    selectedId: null,
    savedCamera: null,
    lastTrigger: null,
    drag: null,
    resizeTimer: null
  };

  function getBreakpoint() {
    if (window.innerWidth <= 600) return "mobile";
    if (window.innerWidth <= 1000) return "tablet";
    return "desktop";
  }

  function copyFraction(value) {
    return { width: value.width, height: value.height };
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function currentPanBounds() {
    return state.config.panBounds[state.breakpoint];
  }

  function computeScale() {
    const source = state.config.source;
    const viewportWidth = viewport.clientWidth;
    const viewportHeight = viewport.clientHeight;
    return Math.max(
      viewportWidth / (source.width * state.viewFraction.width),
      viewportHeight / (source.height * state.viewFraction.height)
    );
  }

  function clampCamera() {
    const source = state.config.source;
    const bounds = currentPanBounds();
    const halfVisibleX = viewport.clientWidth / (2 * source.width * state.scale);
    const halfVisibleY = viewport.clientHeight / (2 * source.height * state.scale);
    const minX = Math.max(bounds.minX, halfVisibleX);
    const maxX = Math.min(bounds.maxX, 1 - halfVisibleX);
    const minY = Math.max(bounds.minY, halfVisibleY);
    const maxY = Math.min(bounds.maxY, 1 - halfVisibleY);
    state.centerX = clamp(state.centerX, minX, maxX);
    state.centerY = clamp(state.centerY, minY, maxY);
  }

  function renderCamera() {
    if (!state.config) return;
    const source = state.config.source;
    state.scale = computeScale();
    clampCamera();
    const tx = viewport.clientWidth / 2 - state.centerX * source.width * state.scale;
    const ty = viewport.clientHeight / 2 - state.centerY * source.height * state.scale;
    plane.style.transform = "matrix(" + state.scale + ",0,0," + state.scale + "," + tx + "," + ty + ")";
    debugBreakpoint.textContent = state.breakpoint;
    debugCamera.textContent = "(" + state.centerX.toFixed(4) + ", " + state.centerY.toFixed(4) + ")";
    debugScale.textContent = state.scale.toFixed(4);
  }

  function animateCameraOnce() {
    plane.classList.add("is-animating");
    window.setTimeout(function () { plane.classList.remove("is-animating"); }, 420);
  }

  function entryCameraForBreakpoint() {
    return state.config.entryCameras[state.breakpoint];
  }

  function resetForBreakpoint(options) {
    const opts = options || {};
    state.breakpoint = getBreakpoint();
    if (state.selectedId) {
      state.viewFraction = copyFraction(state.config.districtFocusWorldFraction[state.breakpoint]);
    } else {
      const entry = entryCameraForBreakpoint();
      state.viewFraction = copyFraction(entry.viewportWorldFraction);
      if (!opts.preserveCenter) {
        state.centerX = entry.center.x;
        state.centerY = entry.center.y;
      }
    }
    renderCamera();
  }

  function snapshotCamera() {
    state.savedCamera = {
      breakpoint: state.breakpoint,
      centerX: state.centerX,
      centerY: state.centerY,
      viewFraction: copyFraction(state.viewFraction)
    };
  }

  function restoreCamera() {
    if (!state.savedCamera) return;
    state.centerX = state.savedCamera.centerX;
    state.centerY = state.savedCamera.centerY;
    state.viewFraction = state.savedCamera.breakpoint === state.breakpoint
      ? copyFraction(state.savedCamera.viewFraction)
      : copyFraction(entryCameraForBreakpoint().viewportWorldFraction);
    animateCameraOnce();
    renderCamera();
  }

  function districtById(id) {
    return state.config.districts.find(function (district) { return district.id === id; });
  }

  function clearHotspotActiveState() {
    hotspotSvg.querySelectorAll(".world-hotspot").forEach(function (node) {
      node.dataset.active = "false";
    });
  }

  function selectDistrict(id, trigger) {
    const district = districtById(id);
    if (!district || state.selectedId === id) return;
    if (!state.selectedId) snapshotCamera();
    state.selectedId = id;
    state.lastTrigger = trigger || null;
    state.centerX = district.anchor.x / state.config.source.width;
    state.centerY = district.anchor.y / state.config.source.height;
    state.viewFraction = copyFraction(state.config.districtFocusWorldFraction[state.breakpoint]);
    clearHotspotActiveState();
    if (trigger) trigger.dataset.active = "true";
    districtTitle.textContent = district.name;
    districtMeta.textContent = district.homeCell + " / anchor " + district.anchor.x + ", " + district.anchor.y;
    districtSheet.hidden = false;
    debugSelected.textContent = id;
    status.textContent = district.name + " を選択しました。";
    animateCameraOnce();
    renderCamera();
    districtTitle.focus({ preventScroll: true });
  }

  function returnToWorld() {
    if (!state.selectedId) return;
    const previousTrigger = state.lastTrigger;
    state.selectedId = null;
    clearHotspotActiveState();
    districtSheet.hidden = true;
    debugSelected.textContent = "none";
    restoreCamera();
    state.savedCamera = null;
    status.textContent = "世界地図へ戻りました。";
    state.lastTrigger = null;
    if (previousTrigger && previousTrigger.isConnected) previousTrigger.focus({ preventScroll: true });
  }

  function polygonPoints(points) {
    return points.map(function (point) { return point[0] + "," + point[1]; }).join(" ");
  }

  function buildHotspots() {
    const namespace = "http://www.w3.org/2000/svg";
    state.config.districts.forEach(function (district) {
      const group = document.createElementNS(namespace, "g");
      group.dataset.districtGroup = district.id;

      const polygon = document.createElementNS(namespace, "polygon");
      polygon.classList.add("world-hotspot");
      polygon.dataset.districtHotspot = district.id;
      polygon.dataset.active = "false";
      polygon.setAttribute("points", polygonPoints(district.hotspot));
      polygon.setAttribute("tabindex", "0");
      polygon.setAttribute("role", "button");
      polygon.setAttribute("aria-label", district.name + " を選択");
      polygon.addEventListener("click", function () { selectDistrict(district.id, polygon); });
      polygon.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        selectDistrict(district.id, polygon);
      });

      const label = document.createElementNS(namespace, "text");
      label.classList.add("world-hotspot-label");
      label.setAttribute("x", String(district.anchor.x));
      label.setAttribute("y", String(district.anchor.y - 245));
      label.setAttribute("aria-hidden", "true");
      label.textContent = district.name;

      group.append(polygon, label);
      hotspotSvg.append(group);
    });
  }

  function onPointerDown(event) {
    if (event.target.closest("[data-district-hotspot]")) return;
    state.drag = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      centerX: state.centerX,
      centerY: state.centerY
    };
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add("is-dragging");
  }

  function onPointerMove(event) {
    if (!state.drag || event.pointerId !== state.drag.pointerId) return;
    const source = state.config.source;
    const dx = event.clientX - state.drag.x;
    const dy = event.clientY - state.drag.y;
    state.centerX = state.drag.centerX - dx / (source.width * state.scale);
    state.centerY = state.drag.centerY - dy / (source.height * state.scale);
    renderCamera();
  }

  function finishPointer(event) {
    if (!state.drag || event.pointerId !== state.drag.pointerId) return;
    state.drag = null;
    viewport.classList.remove("is-dragging");
  }

  function onViewportKeydown(event) {
    if (event.target !== viewport || state.selectedId) return;
    const step = event.shiftKey ? 0.05 : 0.025;
    const movement = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step]
    }[event.key];
    if (!movement) return;
    event.preventDefault();
    state.centerX += movement[0];
    state.centerY += movement[1];
    renderCamera();
  }

  function bindEvents() {
    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", finishPointer);
    viewport.addEventListener("pointercancel", finishPointer);
    viewport.addEventListener("keydown", onViewportKeydown);
    returnButton.addEventListener("click", returnToWorld);
    window.addEventListener("resize", function () {
      window.clearTimeout(state.resizeTimer);
      state.resizeTimer = window.setTimeout(function () { resetForBreakpoint({ preserveCenter: true }); }, 80);
    });
  }

  async function load() {
    const response = await fetch(CONFIG_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("S1 config could not be loaded");
    state.config = await response.json();
    state.breakpoint = getBreakpoint();
    const entry = entryCameraForBreakpoint();
    state.centerX = entry.center.x;
    state.centerY = entry.center.y;
    state.viewFraction = copyFraction(entry.viewportWorldFraction);

    image.addEventListener("load", function () {
      debugImage.textContent = image.naturalWidth + "x" + image.naturalHeight;
    });
    image.addEventListener("error", function () { debugImage.textContent = "load error"; });
    image.src = state.config.source.asset;

    buildHotspots();
    bindEvents();
    renderCamera();
  }

  load().catch(function (error) {
    debugImage.textContent = "prototype error";
    status.textContent = error.message;
    console.error(error);
  });
})();
