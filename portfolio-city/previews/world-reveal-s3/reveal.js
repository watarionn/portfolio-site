(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const SCENE_URL = "./world-single-scene.s1.json";
  const REVEAL_URL = "./world-reveal.v1.json";
  const GEOMETRY_URL = "./reveal-geometry.s3.json";

  const viewport = document.getElementById("world-viewport");
  const plane = document.getElementById("world-plane");
  const image = document.getElementById("world-image");
  const revealSvg = document.getElementById("world-reveal");
  const hotspotSvg = document.getElementById("world-hotspots");
  const sheet = document.getElementById("district-sheet");
  const sheetTitle = document.getElementById("district-sheet-title");
  const sheetMeta = document.getElementById("district-sheet-meta");
  const returnButton = document.getElementById("return-world");
  const status = document.getElementById("world-status");
  const profileTitle = document.getElementById("profile-title");
  const debugBreakpoint = document.getElementById("debug-breakpoint");
  const debugCamera = document.getElementById("debug-camera");
  const debugScale = document.getElementById("debug-scale");
  const debugProfile = document.getElementById("debug-profile");
  const debugPublished = document.getElementById("debug-published");
  const debugHotspots = document.getElementById("debug-hotspots");
  const debugImage = document.getElementById("debug-image");

  const state = {
    scene: null,
    reveal: null,
    geometry: null,
    breakpoint: "desktop",
    centerX: 0.475,
    centerY: 0.465,
    viewFraction: { width: 0.42, height: 0.42 },
    scale: 1,
    selectedId: null,
    savedCamera: null,
    lastTrigger: null,
    profile: "current",
    drag: null,
    resizeTimer: null,
    clearPathNode: null,
    frontierPathNode: null
  };

  function svg(tag, attrs) {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  }

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

  function entryCamera() {
    return state.scene.entryCameras[state.breakpoint];
  }

  function focusFraction() {
    return state.scene.districtFocusWorldFraction[state.breakpoint];
  }

  function panBounds() {
    return state.scene.panBounds[state.breakpoint];
  }

  function computeScale() {
    const source = state.scene.source;
    return Math.max(
      viewport.clientWidth / (source.width * state.viewFraction.width),
      viewport.clientHeight / (source.height * state.viewFraction.height)
    );
  }

  function clampCamera() {
    const source = state.scene.source;
    const bounds = panBounds();
    const halfX = viewport.clientWidth / (2 * source.width * state.scale);
    const halfY = viewport.clientHeight / (2 * source.height * state.scale);
    state.centerX = clamp(state.centerX, Math.max(bounds.minX, halfX), Math.min(bounds.maxX, 1 - halfX));
    state.centerY = clamp(state.centerY, Math.max(bounds.minY, halfY), Math.min(bounds.maxY, 1 - halfY));
  }

  function renderCamera() {
    if (!state.scene) return;
    const source = state.scene.source;
    state.scale = computeScale();
    clampCamera();
    const tx = viewport.clientWidth / 2 - state.centerX * source.width * state.scale;
    const ty = viewport.clientHeight / 2 - state.centerY * source.height * state.scale;
    plane.style.transform = "matrix(" + state.scale + ",0,0," + state.scale + "," + tx + "," + ty + ")";
    debugBreakpoint.textContent = state.breakpoint;
    debugCamera.textContent = "(" + state.centerX.toFixed(4) + ", " + state.centerY.toFixed(4) + ")";
    debugScale.textContent = state.scale.toFixed(4);
  }

  function animateCamera() {
    plane.classList.add("is-animating");
    window.setTimeout(() => plane.classList.remove("is-animating"), 420);
  }

  function resetForBreakpoint() {
    state.breakpoint = getBreakpoint();
    if (state.selectedId) {
      state.viewFraction = copyFraction(focusFraction());
    } else {
      state.viewFraction = copyFraction(entryCamera().viewportWorldFraction);
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
      : copyFraction(entryCamera().viewportWorldFraction);
    animateCamera();
    renderCamera();
  }

  function districtById(id) {
    return state.scene.districts.find((district) => district.id === id);
  }

  function clearActiveHotspots() {
    hotspotSvg.querySelectorAll(".world-hotspot").forEach((node) => {
      node.dataset.active = "false";
    });
  }

  function selectDistrict(id, trigger) {
    const district = districtById(id);
    if (!district || state.selectedId === id) return;
    if (!state.selectedId) snapshotCamera();
    state.selectedId = id;
    state.lastTrigger = trigger || null;
    state.centerX = district.anchor.x / state.scene.source.width;
    state.centerY = district.anchor.y / state.scene.source.height;
    state.viewFraction = copyFraction(focusFraction());
    clearActiveHotspots();
    if (trigger) trigger.dataset.active = "true";
    sheetTitle.textContent = district.name;
    sheetMeta.textContent = district.homeCell + " / published hotspot";
    sheet.hidden = false;
    status.textContent = district.name + " を選択しました。";
    animateCamera();
    renderCamera();
    sheetTitle.focus({ preventScroll: true });
  }

  function returnToWorld() {
    if (!state.selectedId) return;
    const trigger = state.lastTrigger;
    state.selectedId = null;
    clearActiveHotspots();
    sheet.hidden = true;
    restoreCamera();
    state.savedCamera = null;
    state.lastTrigger = null;
    status.textContent = "世界地図へ戻りました。";
    if (trigger && trigger.isConnected) trigger.focus({ preventScroll: true });
  }

  function polygonPoints(points) {
    return points.map((point) => point[0] + "," + point[1]).join(" ");
  }

  function buildHotspots() {
    const published = new Set(state.reveal.w0.publishedCells);
    state.scene.districts.forEach((district) => {
      if (!published.has(district.homeCell)) {
        throw new Error("S3 hotspot is not PUBLISHED in canonical reveal data: " + district.homeCell);
      }
      const group = svg("g", { "data-district-group": district.id });
      const polygon = svg("polygon", {
        class: "world-hotspot",
        points: polygonPoints(district.hotspot),
        tabindex: "0",
        role: "button",
        "aria-label": district.name + " を選択",
        "data-district-hotspot": district.id,
        "data-active": "false"
      });
      polygon.addEventListener("click", () => selectDistrict(district.id, polygon));
      polygon.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        selectDistrict(district.id, polygon);
      });

      const offset = district.labelOffset || { x: 0, y: -245 };
      const label = svg("text", {
        class: "world-hotspot-label",
        x: district.anchor.x + offset.x,
        y: district.anchor.y + offset.y,
        "aria-hidden": "true"
      });
      label.textContent = district.name;
      group.append(polygon, label);
      hotspotSvg.append(group);
    });
    debugHotspots.textContent = String(hotspotSvg.querySelectorAll("[data-district-hotspot]").length);
  }

  function buildReveal() {
    const defs = svg("defs");
    const maskBlur = svg("filter", { id: "s3-mask-soften", x: "-20%", y: "-20%", width: "140%", height: "140%" });
    maskBlur.append(svg("feGaussianBlur", { stdDeviation: "95" }));
    const frontierBlur = svg("filter", { id: "s3-frontier-soften", x: "-20%", y: "-20%", width: "140%", height: "140%" });
    frontierBlur.append(svg("feGaussianBlur", { stdDeviation: "52" }));
    const cloudBlur = svg("filter", { id: "s3-cloud-soften", x: "-20%", y: "-20%", width: "140%", height: "140%" });
    cloudBlur.append(svg("feGaussianBlur", { stdDeviation: "72" }));

    const mask = svg("mask", {
      id: "s3-veil-mask",
      maskUnits: "userSpaceOnUse",
      x: "0",
      y: "0",
      width: "8192",
      height: "6144"
    });
    mask.append(svg("rect", { x: "0", y: "0", width: "8192", height: "6144", fill: "white" }));
    state.clearPathNode = svg("path", { id: "s3-clear-path", fill: "black", filter: "url(#s3-mask-soften)" });
    mask.append(state.clearPathNode);
    defs.append(maskBlur, frontierBlur, cloudBlur, mask);
    revealSvg.append(defs);

    revealSvg.append(svg("rect", {
      class: "reveal-veil",
      x: "0",
      y: "0",
      width: "8192",
      height: "6144",
      mask: "url(#s3-veil-mask)",
      "data-reveal-role": "unpublished-veil"
    }));

    state.frontierPathNode = svg("path", {
      class: "reveal-frontier",
      "data-reveal-role": "near-frontier"
    });
    revealSvg.append(state.frontierPathNode);

    const banks = svg("g", { "data-reveal-role": "unresolved-banks" });
    state.geometry.unresolvedBanks.forEach((bank) => {
      banks.append(svg("path", {
        class: "reveal-bank",
        d: bank.d,
        opacity: bank.opacity,
        "data-cloud-bank": bank.id,
        "data-crosses-cell-boundaries": String(bank.crossesCellBoundaries),
        "data-bbox": bank.bbox.join(",")
      }));
    });
    revealSvg.append(banks);

    const drift = svg("g", { "data-reveal-role": "decorative-drift" });
    [
      [2450, 2250, 560, 260],
      [5200, 2920, 680, 300],
      [2780, 3920, 720, 260],
      [4750, 4150, 640, 230]
    ].forEach((cloud) => {
      drift.append(svg("ellipse", {
        class: "reveal-drift",
        cx: cloud[0],
        cy: cloud[1],
        rx: cloud[2],
        ry: cloud[3]
      }));
    });
    revealSvg.append(drift);
    applyRevealProfile(state.profile, false);
  }

  function applyRevealProfile(profileKey, announce) {
    const profile = state.geometry.profiles[profileKey];
    if (!profile) return;
    state.profile = profileKey;
    state.clearPathNode.setAttribute("d", profile.clearPath);
    state.frontierPathNode.setAttribute("d", profile.frontierPath);
    revealSvg.dataset.revealProfile = profile.id;
    revealSvg.dataset.previewCell = profile.previewCell || "";
    debugProfile.textContent = profile.id;
    profileTitle.textContent = profile.label;
    document.querySelectorAll("[data-reveal-profile]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.revealProfile === profileKey));
    });
    if (announce) {
      status.textContent = profile.previewCell
        ? profile.previewCell + " 周辺のatmosphere revealをプレビューしました。publication dataとhotspotは変更していません。"
        : "現在の公開状態W0へ戻しました。";
    }
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
    const source = state.scene.source;
    state.centerX = state.drag.centerX - (event.clientX - state.drag.x) / (source.width * state.scale);
    state.centerY = state.drag.centerY - (event.clientY - state.drag.y) / (source.height * state.scale);
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
    const move = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step]
    }[event.key];
    if (!move) return;
    event.preventDefault();
    state.centerX += move[0];
    state.centerY += move[1];
    renderCamera();
  }

  function bindEvents() {
    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", finishPointer);
    viewport.addEventListener("pointercancel", finishPointer);
    viewport.addEventListener("keydown", onViewportKeydown);
    returnButton.addEventListener("click", returnToWorld);
    document.querySelectorAll("[data-reveal-profile]").forEach((button) => {
      button.addEventListener("click", () => applyRevealProfile(button.dataset.revealProfile, true));
    });
    window.addEventListener("resize", () => {
      window.clearTimeout(state.resizeTimer);
      state.resizeTimer = window.setTimeout(resetForBreakpoint, 80);
    });
  }

  async function loadJson(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load " + url);
    return response.json();
  }

  async function load() {
    [state.scene, state.reveal, state.geometry] = await Promise.all([
      loadJson(SCENE_URL),
      loadJson(REVEAL_URL),
      loadJson(GEOMETRY_URL)
    ]);

    state.breakpoint = getBreakpoint();
    const entry = entryCamera();
    state.centerX = entry.center.x;
    state.centerY = entry.center.y;
    state.viewFraction = copyFraction(entry.viewportWorldFraction);

    debugPublished.textContent = String(state.reveal.w0.publishedCells.length);
    image.addEventListener("load", () => {
      debugImage.textContent = image.naturalWidth + "x" + image.naturalHeight;
    });
    image.addEventListener("error", () => {
      debugImage.textContent = "load error";
    });
    image.src = state.scene.source.asset;

    buildReveal();
    buildHotspots();
    bindEvents();
    renderCamera();
  }

  load().catch((error) => {
    debugImage.textContent = "prototype error";
    status.textContent = error.message;
    console.error(error);
  });
})();