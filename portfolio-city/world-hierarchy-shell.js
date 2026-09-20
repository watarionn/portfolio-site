'use strict';

(() => {
  const DATA_PATHS = {
    projects: 'data/projects.json',
    districts: 'data/districts.json',
    layout: 'data/map-layout.json',
    terrainManifest: 'assets/world/v1/terrain/manifest.json'
  };
  const DISTRICT_SEQUENCE = ['archive-street', 'observatory-hill', 'workshop-alley', 'waterside-play'];
  const H2_WORLD = {
    width: 100,
    height: 64,
    initialDesktopCrop: { x: 20, y: 9, width: 60, height: 49 },
    districtAnchors: {
      'archive-street': { x: 35, y: 33 },
      'observatory-hill': { x: 55, y: 20 },
      'workshop-alley': { x: 63, y: 34 },
      'waterside-play': { x: 49, y: 47 }
    },
    fronts: [
      { id: 'inland', x: 24, y: 27 },
      { id: 'coastal', x: 67, y: 49 },
      { id: 'offshore', x: 82, y: 39 }
    ]
  };
  const MASTER_WORLD = {
    columns: 16,
    rows: 12,
    districtAnchors: {
      'archive-street': 'G06',
      'observatory-hill': 'H05',
      'workshop-alley': 'I06',
      'waterside-play': 'H07'
    }
  };
  const shell = document.getElementById('worldHierarchyShell');

  const state = {
    enabled: true,
    level: 'world',
    activeDistrictId: null,
    activeProjectId: null,
    districtCardOpen: false,
    districtCardReturnFocusId: null,
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
    const world = document.querySelector('#worldHierarchyWorld .world-h2-map');
    if (world) world.style.transform = `translate3d(${next.x}px, ${next.y}px, 0) scale(${next.zoom})`;
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
    state.districtCardOpen = false;
    state.districtCardReturnFocusId = null;
    document.querySelector('.world-district-card')?.remove();
    state.returnFocusId = returnFocusId;
    return setLevel('district');
  }

  function returnToWorld() {
    if (!state.enabled) return false;
    state.activeProjectId = null;
    const restored = restoreWorldCamera();
    if (restored) setWorldCamera(state.worldCamera);
    return setLevel('world');
  }

  function bindWorldViewport(viewport, options = {}) {
    if (!state.enabled || !viewport) return () => {};
    const panStep = options.panStep ?? 36;
    const bounds = options.bounds ?? null;
    let drag = null;

    const onPointerDown = (event) => {
      if (event.target.closest('button, a, .world-district-card')) return;
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

  function masterCellPosition(cellId) {
    const col = cellId.charCodeAt(0) - 65;
    const row = Number(cellId.slice(1)) - 1;
    return { x: ((col + 0.5) / MASTER_WORLD.columns) * 100, y: ((row + 0.5) / MASTER_WORLD.rows) * 100 };
  }

  async function bindMasterTerrain(world, stage) {
    try {
      const response = await fetch(DATA_PATHS.terrainManifest, { cache: 'no-store' });
      if (!response.ok) throw new Error('Master World manifest unavailable');
      const manifest = await response.json();
      if (manifest?.grid?.columns !== 16 || manifest?.grid?.rows !== 12 || Object.keys(manifest.tiles || {}).length !== 192) {
        throw new Error('Master World manifest contract mismatch');
      }
      const fragment = document.createDocumentFragment();
      for (const [cellId, tile] of Object.entries(manifest.tiles)) {
        const image = document.createElement('img');
        image.className = 'world-master-tile';
        image.src = `assets/world/v1/terrain/${tile.file}`;
        image.alt = '';
        image.loading = 'lazy';
        image.decoding = 'async';
        image.style.setProperty('--tile-column', cellId.charCodeAt(0) - 65);
        image.style.setProperty('--tile-row', Number(cellId.slice(1)) - 1);
        fragment.append(image);
      }
      stage.replaceChildren(fragment);
      world.dataset.terrainBound = 'true';
      return true;
    } catch (error) {
      world.dataset.terrainBound = 'false';
      return false;
    }
  }

  function closeDistrictCard({ restoreFocus = true } = {}) {
    const returnFocusId = state.districtCardReturnFocusId;
    document.querySelector('.world-district-card')?.remove();
    document.querySelectorAll('.world-h2-district[aria-expanded="true"]').forEach((button) => {
      button.setAttribute('aria-expanded', 'false');
    });
    state.districtCardOpen = false;
    state.districtCardReturnFocusId = null;
    if (restoreFocus && returnFocusId) document.getElementById(returnFocusId)?.focus({ preventScroll: true });
    return true;
  }

  function positionDistrictCard(card, marker, viewport) {
    const viewportRect = viewport.getBoundingClientRect();
    const markerRect = marker.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const gap = 18;
    const inset = 12;
    const mobileBottomReserve = window.matchMedia('(max-width: 680px)').matches ? 76 : 0;
    const visibleLeft = Math.max(inset, -viewportRect.left + inset);
    const visibleRight = Math.min(viewportRect.width - inset, window.innerWidth - viewportRect.left - inset);
    const visibleTop = Math.max(inset, -viewportRect.top + inset);
    const visibleBottom = Math.min(
      viewportRect.height - inset,
      window.innerHeight - viewportRect.top - inset - mobileBottomReserve
    );
    const markerX = markerRect.left - viewportRect.left + markerRect.width / 2;
    const markerY = markerRect.top - viewportRect.top + markerRect.height / 2;
    let left = markerX + gap;
    if (left + cardRect.width > visibleRight) left = markerX - cardRect.width - gap;
    left = clamp(left, visibleLeft, Math.max(visibleLeft, visibleRight - cardRect.width));
    const top = clamp(
      markerY - cardRect.height / 2,
      visibleTop,
      Math.max(visibleTop, visibleBottom - cardRect.height)
    );
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
  }

  function openDistrictCard(district, marker, viewport) {
    if (!district || !marker || !viewport) return false;
    closeDistrictCard({ restoreFocus: false });
    state.activeDistrictId = district.id;
    state.districtCardOpen = true;
    state.districtCardReturnFocusId = marker.id;
    marker.setAttribute('aria-expanded', 'true');

    const card = document.createElement('aside');
    card.className = 'world-district-card';
    card.dataset.districtCard = district.id;
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'false');

    const eyebrow = document.createElement('p');
    eyebrow.className = 'world-district-card__eyebrow';
    eyebrow.textContent = district.english;

    const title = document.createElement('h3');
    title.id = `world-district-card-title-${district.id}`;
    title.textContent = district.name;
    card.setAttribute('aria-labelledby', title.id);

    const role = document.createElement('p');
    role.className = 'world-district-card__role';
    role.textContent = district.role;

    const description = document.createElement('p');
    description.className = 'world-district-card__description';
    description.textContent = district.description;

    const facts = document.createElement('div');
    facts.className = 'world-district-card__facts';
    const projectCount = state.projects.filter((project) => project.district === district.id).length;
    facts.textContent = `${projectCount} PROJECTS · ${district.landmark}`;

    const actions = document.createElement('div');
    actions.className = 'world-district-card__actions';

    const enter = document.createElement('button');
    enter.type = 'button';
    enter.className = 'world-district-card__enter';
    enter.dataset.districtCardAction = 'enter';
    enter.textContent = '地区を見る';

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'world-district-card__close';
    close.dataset.districtCardAction = 'close';
    close.textContent = '閉じる';

    actions.append(enter, close);
    card.append(eyebrow, title, role, description, facts, actions);
    viewport.append(card);
    positionDistrictCard(card, marker, viewport);

    enter.addEventListener('click', () => {
      if (enterDistrict(district.id, marker.id)) renderDistrictView(district.id);
    });
    close.addEventListener('click', () => closeDistrictCard());
    return true;
  }

  function renderWorldMap() {
    if (!state.enabled) return false;
    const panel = document.getElementById('worldHierarchyWorld');
    if (!panel) return false;

    const viewport = document.createElement('div');
    viewport.className = 'world-h2-viewport';
    viewport.tabIndex = 0;
    viewport.setAttribute('aria-label', 'Portfolio City 世界地図');

    const world = document.createElement('div');
    world.className = 'world-h2-map';
    world.dataset.geography = 'master-world-v1';

    const terrainStage = document.createElement('div');
    terrainStage.className = 'world-master-terrain';
    terrainStage.setAttribute('aria-hidden', 'true');
    world.append(terrainStage);
    bindMasterTerrain(world, terrainStage);

    for (const layer of ['mainland', 'southern-inlet', 'highland', 'offshore-islands', 'frontier-clouds']) {
      const element = document.createElement('div');
      element.className = `world-h2-layer world-h2-layer--${layer}`;
      element.setAttribute('aria-hidden', 'true');
      world.append(element);
    }

    for (const district of state.districts) {
      const cellId = MASTER_WORLD.districtAnchors[district.id];
      const anchor = cellId ? masterCellPosition(cellId) : null;
      if (!anchor) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'world-h2-district';
      button.dataset.worldDistrict = district.id;
      button.style.setProperty('--world-x', `${anchor.x}%`);
      button.style.setProperty('--world-y', `${anchor.y}%`);
      button.textContent = district.name;
      button.id = `world-district-${district.id}`;
      button.setAttribute('aria-haspopup', 'dialog');
      button.setAttribute('aria-expanded', 'false');
      button.addEventListener('click', () => openDistrictCard(district, button, viewport));
      world.append(button);
    }

    for (const front of H2_WORLD.fronts) {
      const marker = document.createElement('span');
      marker.className = 'world-h2-frontier';
      marker.dataset.frontier = front.id;
      marker.style.setProperty('--world-x', `${front.x}%`);
      marker.style.setProperty('--world-y', `${(front.y / H2_WORLD.height) * 100}%`);
      marker.setAttribute('aria-hidden', 'true');
      world.append(marker);
    }

    viewport.append(world);

    const frame = document.createElement('div');
    frame.className = 'world-map-frame';

    for (const corner of ['nw', 'ne', 'sw', 'se']) {
      const stud = document.createElement('span');
      stud.className = `world-map-frame__corner world-map-frame__corner--${corner}`;
      stud.setAttribute('aria-hidden', 'true');
      frame.append(stud);
    }

    const matte = document.createElement('div');
    matte.className = 'world-map-frame__matte';
    matte.append(viewport);
    frame.append(matte);

    panel.replaceChildren(frame);
    setWorldCamera(state.worldCamera);
    bindWorldViewport(viewport, { panStep: 36 });
    return true;
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

  function renderBuildingPreview(projectId) {
    if (!state.enabled) return false;
    const panel = document.getElementById('worldHierarchyPreview');
    const project = state.projects.find((item) => item.id === projectId);
    if (!panel || !project) return false;

    state.activeProjectId = project.id;
    const title = document.createElement('h2');
    title.id = 'worldHierarchyPreviewTitle';
    title.tabIndex = -1;
    title.textContent = project.title;

    const building = document.createElement('p');
    building.textContent = project.building;
    const summary = document.createElement('p');
    summary.textContent = project.summary;
    const type = document.createElement('p');
    type.textContent = project.type;

    const back = document.createElement('button');
    back.type = 'button';
    back.dataset.previewAction = 'back';
    back.textContent = '地区へ戻る';

    const open = document.createElement('a');
    open.dataset.previewAction = 'open';
    open.href = project.route;
    open.textContent = '作品へ入る ↗';

    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', title.id);
    panel.replaceChildren(title, building, summary, type, back, open);
    setLevel('preview');
    title.focus();
    return true;
  }

  function closeBuildingPreview() {
    if (!state.enabled || state.level !== 'preview') return false;
    const projectId = state.activeProjectId;
    state.activeProjectId = null;
    if (!setLevel('district')) return false;
    const target = document.querySelector(`#worldHierarchyDistrict [data-project-id="${CSS.escape(projectId ?? '')}"]`);
    target?.focus();
    return true;
  }

  function bindBuildingPreview() {
    if (!state.enabled) return false;
    const districtPanel = document.getElementById('worldHierarchyDistrict');
    const previewPanel = document.getElementById('worldHierarchyPreview');
    if (!districtPanel || !previewPanel) return false;

    districtPanel.addEventListener('click', (event) => {
      const projectButton = event.target.closest('[data-project-id]');
      if (projectButton) renderBuildingPreview(projectButton.dataset.projectId);
    });

    previewPanel.addEventListener('click', (event) => {
      if (event.target.closest('[data-preview-action="back"]')) closeBuildingPreview();
    });

    document.addEventListener('keydown', (event) => {
      if (!state.enabled || state.level !== 'preview') return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeBuildingPreview();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...previewPanel.querySelectorAll('button:not([disabled]), a[href]')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    return true;
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
    bindBuildingPreview();
    renderWorldMap();
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
    renderWorldMap,
    renderDistrictView,
    moveDistrict,
    renderBuildingPreview,
    closeBuildingPreview,
    bindWorldViewport,
    mount
  });

  mount();
})();
