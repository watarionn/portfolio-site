'use strict';

(() => {
  const FEATURE_FLAG = false;
  const shell = document.getElementById('worldHierarchyShell');

  const state = {
    enabled: FEATURE_FLAG,
    level: 'world',
    activeDistrictId: null,
    activeProjectId: null,
    worldCamera: { x: 0, y: 0, zoom: 1 },
    savedWorldCamera: null,
    returnFocusId: null
  };

  function setLevel(level) {
    if (!state.enabled || !['world', 'district', 'preview'].includes(level)) return false;
    state.level = level;
    for (const panel of shell?.querySelectorAll('[data-world-level]') ?? []) {
      panel.hidden = panel.dataset.worldLevel !== level;
    }
    return true;
  }

  function copyCamera(camera) {
    return { x: camera.x, y: camera.y, zoom: camera.zoom };
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function setWorldCamera(nextCamera, bounds) {
    if (!state.enabled) return false;
    const next = { ...state.worldCamera, ...nextCamera };
    if (bounds) {
      next.x = clamp(next.x, bounds.minX, bounds.maxX);
      next.y = clamp(next.y, bounds.minY, bounds.maxY);
    }
    state.worldCamera = next;
    return true;
  }

  function panWorldBy(dx, dy, bounds) {
    return setWorldCamera({
      x: state.worldCamera.x + dx,
      y: state.worldCamera.y + dy
    }, bounds);
  }

  function snapshotWorldCamera() {
    if (!state.enabled) return false;
    state.savedWorldCamera = copyCamera(state.worldCamera);
    return true;
  }

  function restoreWorldCamera() {
    if (!state.enabled || !state.savedWorldCamera) return false;
    state.worldCamera = copyCamera(state.savedWorldCamera);
    return true;
  }

  function enterDistrict(districtId, returnFocusId = null) {
    if (!state.enabled || !districtId) return false;
    snapshotWorldCamera();
    state.activeDistrictId = districtId;
    state.activeProjectId = null;
    state.returnFocusId = returnFocusId;
    return setLevel('district');
  }

  function returnToWorld() {
    if (!state.enabled) return false;
    state.activeProjectId = null;
    restoreWorldCamera();
    return setLevel('world');
  }

  function bindWorldViewport(viewport, options = {}) {
    if (!state.enabled || !viewport) return () => {};
    const panStep = options.panStep ?? 36;
    const bounds = options.bounds ?? null;
    let drag = null;

    const onPointerDown = (event) => {
      if (event.target.closest('button, a')) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, camera: copyCamera(state.worldCamera) };
      viewport.setPointerCapture?.(event.pointerId);
    };
    const onPointerMove = (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      setWorldCamera({
        x: drag.camera.x + event.clientX - drag.x,
        y: drag.camera.y + event.clientY - drag.y
      }, bounds);
    };
    const endDrag = (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      viewport.releasePointerCapture?.(event.pointerId);
      drag = null;
    };
    const onKeyDown = (event) => {
      if (event.target !== viewport) return;
      const delta = {
        ArrowLeft: [panStep, 0],
        ArrowRight: [-panStep, 0],
        ArrowUp: [0, panStep],
        ArrowDown: [0, -panStep]
      }[event.key];
      if (!delta) return;
      event.preventDefault();
      panWorldBy(delta[0], delta[1], bounds);
    };

    viewport.addEventListener('pointerdown', onPointerDown);
    viewport.addEventListener('pointermove', onPointerMove);
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('keydown', onKeyDown);

    return () => {
      viewport.removeEventListener('pointerdown', onPointerDown);
      viewport.removeEventListener('pointermove', onPointerMove);
      viewport.removeEventListener('pointerup', endDrag);
      viewport.removeEventListener('pointercancel', endDrag);
      viewport.removeEventListener('keydown', onKeyDown);
    };
  }

  function mount() {
    if (!shell || !state.enabled) return false;
    shell.hidden = false;
    shell.setAttribute('aria-hidden', 'false');
    return setLevel(state.level);
  }

  window.PortfolioCityWorldHierarchy = Object.freeze({
    isEnabled: () => state.enabled,
    getState: () => ({
      ...state,
      worldCamera: copyCamera(state.worldCamera),
      savedWorldCamera: state.savedWorldCamera ? copyCamera(state.savedWorldCamera) : null
    }),
    setLevel,
    setWorldCamera,
    panWorldBy,
    snapshotWorldCamera,
    restoreWorldCamera,
    enterDistrict,
    returnToWorld,
    bindWorldViewport,
    mount
  });

  mount();
})();
