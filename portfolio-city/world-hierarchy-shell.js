'use strict';

(() => {
  const FEATURE_FLAG = false;
  const DATA_PATHS = {
    projects: 'data/projects.json',
    districts: 'data/districts.json',
    layout: 'data/map-layout.json'
  };
  const DISTRICT_SEQUENCE = ['archive-street', 'observatory-hill', 'workshop-alley', 'waterside-play'];
  const shell = document.getElementById('worldHierarchyShell');

  const state = {
    enabled: FEATURE_FLAG,
    level: 'world',
    activeDistrictId: null,
    activeProjectId: null,
    worldCamera: { x: 0, y: 0, zoom: 1 },
    savedWorldCamera: null,
    returnFocusId: null,
    districts: [],
    projects: [],
    placements: []
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

  function byOrder(a, b) {
    return (a.order ?? 0) - (b.order ?? 0) || (a.title ?? a.name ?? '').localeCompare(b.title ?? b.name ?? '', 'ja');
  }

  function projectAsset(projectId) {
    return state.placements.find((placement) => placement.projectId === projectId)?.asset ?? null;
  }

  function renderDistrictView(districtId = state.activeDistrictId) {
    if (!state.enabled) return false;
    const panel = document.getElementById('worldHierarchyDistrict');
    const district = state.districts.find((item) => item.id === districtId);
    if (!panel || !district) return false;

    const projects = state.projects.filter((project) => project.district === district.id).sort(byOrder);
    const heading = document.createElement('h2');
    heading.textContent = district.name;
    const meta = document.createElement('p');
    meta.textContent = district.role;
    const grid = document.createElement('div');
    grid.dataset.districtProjects = district.id;

    for (const project of projects) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.projectId = project.id;
      button.dataset.canonicalRoute = project.route;
      button.dataset.assetMode = projectAsset(project.id) ? 'illustrated' : 'fallback';
      button.setAttribute('aria-label', `${project.title}、${project.building}`);

      const asset = projectAsset(project.id);
      if (asset) {
        const image = document.createElement('img');
        image.src = asset;
        image.alt = '';
        image.setAttribute('aria-hidden', 'true');
        button.append(image);
      } else {
        const fallback = document.createElement('span');
        fallback.dataset.buildingFallback = project.id;
        fallback.setAttribute('aria-hidden', 'true');
        button.append(fallback);
      }

      const title = document.createElement('span');
      title.textContent = project.title;
      button.append(title);
      grid.append(button);
    }

    const controls = document.createElement('div');
    controls.dataset.districtNavigation = '';
    for (const [action, label] of [['previous', '前の地区'], ['world', '世界地図へ戻る'], ['next', '次の地区']]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.districtAction = action;
      button.textContent = label;
      controls.append(button);
    }

    panel.replaceChildren(heading, meta, grid, controls);
    return true;
  }

  function moveDistrict(delta) {
    if (!state.enabled || !state.activeDistrictId) return false;
    const index = DISTRICT_SEQUENCE.indexOf(state.activeDistrictId);
    if (index < 0) return false;
    state.activeDistrictId = DISTRICT_SEQUENCE[(index + delta + DISTRICT_SEQUENCE.length) % DISTRICT_SEQUENCE.length];
    return renderDistrictView();
  }

  function bindDistrictView() {
    if (!state.enabled) return false;
    const panel = document.getElementById('worldHierarchyDistrict');
    if (!panel) return false;
    panel.addEventListener('click', (event) => {
      const action = event.target.closest('[data-district-action]')?.dataset.districtAction;
      if (action === 'previous') moveDistrict(-1);
      if (action === 'next') moveDistrict(1);
      if (action === 'world') returnToWorld();
    });
    return true;
  }

  async function loadCanonicalDistrictData() {
    if (!state.enabled) return false;
    const [projectResponse, districtResponse, layoutResponse] = await Promise.all([
      fetch(DATA_PATHS.projects, { cache: 'no-store' }),
      fetch(DATA_PATHS.districts, { cache: 'no-store' }),
      fetch(DATA_PATHS.layout, { cache: 'no-store' })
    ]);
    if (!projectResponse.ok || !districtResponse.ok || !layoutResponse.ok) return false;
    const [projectPayload, districtPayload, layoutPayload] = await Promise.all([
      projectResponse.json(), districtResponse.json(), layoutResponse.json()
    ]);
    state.projects = [...projectPayload.projects].sort(byOrder);
    state.districts = [...districtPayload.districts].sort(byOrder);
    state.placements = [...layoutPayload.projectPlacements];
    return state.projects.length === 14 && state.districts.length === 4;
  }

  async function mount() {
    if (!shell || !state.enabled) return false;
    shell.hidden = false;
    shell.setAttribute('aria-hidden', 'false');
    const loaded = await loadCanonicalDistrictData();
    if (!loaded) return false;
    bindDistrictView();
    if (state.activeDistrictId) renderDistrictView();
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
    enterDistrict: (districtId, returnFocusId = null) => {
      const entered = enterDistrict(districtId, returnFocusId);
      if (entered) renderDistrictView(districtId);
      return entered;
    },
    returnToWorld,
    renderDistrictView,
    moveDistrict,
    bindWorldViewport,
    mount
  });

  mount();
})();
