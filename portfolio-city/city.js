'use strict';

const DATA_PATHS = {
  projects: 'data/projects.json',
  districts: 'data/districts.json',
  layout: 'data/map-layout.json',
  details: 'data/environment-details.json'
};

const VISITED_KEY = 'portfolio-city.visited.v1';
const EXPECTED_PROJECT_COUNT = 14;
const EXPECTED_DISTRICT_COUNT = 4;

const state = {
  projects: [],
  districts: [],
  layout: null,
  details: [],
  selectedProjectId: null,
  activePanel: 'map',
  mobilePrimary: 'map',
  visited: loadVisited()
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function loadVisited() {
  try {
    const raw = localStorage.getItem(VISITED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []);
  } catch (_) {
    return new Set();
  }
}

function saveVisited() {
  try {
    localStorage.setItem(VISITED_KEY, JSON.stringify(Array.from(state.visited).sort()));
  } catch (_) {
    // Browsing remains fully usable when storage is unavailable.
  }
}

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function byOrder(a, b) {
  return (a.order ?? 0) - (b.order ?? 0) || a.title?.localeCompare(b.title, 'ja') || 0;
}

function validateData(projectPayload, districtPayload, layoutPayload, detailPayload) {
  if (projectPayload?.schemaVersion !== 1 || !Array.isArray(projectPayload.projects)) {
    throw new Error('projects.json の形式が不正です。');
  }
  if (districtPayload?.schemaVersion !== 1 || !Array.isArray(districtPayload.districts)) {
    throw new Error('districts.json の形式が不正です。');
  }
  if (projectPayload.projects.length !== EXPECTED_PROJECT_COUNT) {
    throw new Error(`作品数が ${EXPECTED_PROJECT_COUNT} 件ではありません。`);
  }
  if (districtPayload.districts.length !== EXPECTED_DISTRICT_COUNT) {
    throw new Error(`地区数が ${EXPECTED_DISTRICT_COUNT} 件ではありません。`);
  }

  const districtIds = new Set();
  for (const district of districtPayload.districts) {
    if (!district.id || districtIds.has(district.id)) throw new Error('地区IDが重複または欠落しています。');
    districtIds.add(district.id);
  }

  const projectIds = new Set();
  for (const project of projectPayload.projects) {
    if (!project.id || projectIds.has(project.id)) throw new Error('作品IDが重複または欠落しています。');
    if (!districtIds.has(project.district)) throw new Error(`不明な地区: ${project.district}`);
    if (typeof project.route !== 'string' || !project.route.startsWith('/')) throw new Error(`不正な作品ルート: ${project.id}`);
    projectIds.add(project.id);
  }

  if (layoutPayload?.schemaVersion !== 1 || !layoutPayload.world || !Array.isArray(layoutPayload.chunks) || !Array.isArray(layoutPayload.projectPlacements)) {
    throw new Error('map-layout.json の形式が不正です。');
  }
  if (![layoutPayload.world.chunkWidth, layoutPayload.world.chunkHeight, layoutPayload.world.width, layoutPayload.world.height].every(Number.isFinite)
    || layoutPayload.world.chunkWidth <= 0 || layoutPayload.world.chunkHeight <= 0
    || layoutPayload.world.width <= 0 || layoutPayload.world.height <= 0) {
    throw new Error('map-layout.json のワールド寸法が不正です。');
  }
  if (layoutPayload.world.minX !== undefined && !Number.isFinite(layoutPayload.world.minX)) {
    throw new Error('map-layout.json の minX が不正です。');
  }
  if (layoutPayload.world.minY !== undefined && !Number.isFinite(layoutPayload.world.minY)) {
    throw new Error('map-layout.json の minY が不正です。');
  }
  const placementIds = new Set();
  for (const placement of layoutPayload.projectPlacements) {
    if (!projectIds.has(placement.projectId) || placementIds.has(placement.projectId)) throw new Error(`不正または重複した配置: ${placement.projectId}`);
    if (![placement.x, placement.y, placement.width].every(Number.isFinite)) throw new Error(`配置座標が不正です: ${placement.projectId}`);
    placementIds.add(placement.projectId);
  }
  if (placementIds.size !== projectIds.size) throw new Error('全作品に世界座標の配置が必要です。');
  if (detailPayload?.schemaVersion !== 1 || !Array.isArray(detailPayload.details)) {
    throw new Error('environment-details.json の形式が不正です。');
  }
  const detailIds = new Set();
  for (const detail of detailPayload.details) {
    if (!detail.id || detailIds.has(detail.id)) throw new Error('環境ディテールIDが重複または欠落しています。');
    if (!districtIds.has(detail.district)) throw new Error(`不明な環境ディテール地区: ${detail.district}`);
    if (![detail.x, detail.y, detail.width, detail.height].every(Number.isFinite)) throw new Error(`環境ディテール座標が不正です: ${detail.id}`);
    detailIds.add(detail.id);
  }
  state.visited = new Set(Array.from(state.visited).filter((id) => projectIds.has(id)));
  saveVisited();
}

function resolveWorldBounds(world) {
  const minX = Number.isFinite(world?.minX) ? world.minX : 0;
  const minY = Number.isFinite(world?.minY) ? world.minY : 0;
  const width = world?.width;
  const height = world?.height;
  return { minX, minY, width, height, maxX: minX + width, maxY: minY + height };
}

function worldPointToPercent(x, y, world) {
  const bounds = resolveWorldBounds(world);
  return {
    x: (x - bounds.minX) / bounds.width * 100,
    y: (y - bounds.minY) / bounds.height * 100
  };
}

function worldRectToPercent(region, world) {
  const point = worldPointToPercent(region.x, region.y, world);
  return {
    left: point.x,
    top: point.y,
    width: region.width / world.width * 100,
    height: region.height / world.height * 100
  };
}

function chunkRenderRegion(chunk, world) {
  return chunk.renderRegion ?? {
    x: chunk.column * world.chunkWidth,
    y: chunk.row * world.chunkHeight,
    width: world.chunkWidth,
    height: world.chunkHeight
  };
}

function projectsForDistrict(districtId) {
  return state.projects.filter((project) => project.district === districtId).sort(byOrder);
}

function districtForProject(project) {
  return state.districts.find((district) => district.id === project.district);
}

function buildBuildingForecourt(districtId) {
  const visual = make('span', `building-forecourt building-forecourt--${districtId}`);
  visual.setAttribute('aria-hidden', 'true');
  return visual;
}

function buildBuildingVisual() {
  const visual = make('span', 'building-visual');
  visual.setAttribute('aria-hidden', 'true');
  visual.append(
    make('span', 'building-visual__mass'),
    make('span', 'building-visual__roof'),
    make('span', 'building-visual__detail building-visual__detail--a'),
    make('span', 'building-visual__detail building-visual__detail--b')
  );
  return visual;
}

function buildCityArtLayers() {
  const far = make('div', 'city-art city-art--far');
  far.append(
    make('span', 'city-art__mountains'),
    make('span', 'city-art__cloud city-art__cloud--a'),
    make('span', 'city-art__cloud city-art__cloud--b')
  );

  const mid = make('div', 'city-art city-art--mid');
  mid.append(
    make('span', 'city-art__tree-cluster city-art__tree-cluster--a'),
    make('span', 'city-art__tree-cluster city-art__tree-cluster--b'),
    make('span', 'city-art__tree-cluster city-art__tree-cluster--c'),
    make('span', 'city-art__tree-cluster city-art__tree-cluster--d'),
    make('span', 'city-art__fountain'),
    make('span', 'city-art__market'),
    make('span', 'city-art__reeds city-art__reeds--a'),
    make('span', 'city-art__reeds city-art__reeds--b')
  );

  const near = make('div', 'city-art city-art--near');
  near.append(
    make('span', 'city-art__person city-art__person--a'),
    make('span', 'city-art__person city-art__person--b'),
    make('span', 'city-art__person city-art__person--c'),
    make('span', 'city-art__person city-art__person--d'),
    make('span', 'city-art__flowerbed city-art__flowerbed--a'),
    make('span', 'city-art__flowerbed city-art__flowerbed--b')
  );

  for (const layer of [far, mid, near]) layer.setAttribute('aria-hidden', 'true');
  return [far, mid, near];
}

function buildMapInfrastructure() {
  const infrastructure = make('div', 'city-map__infrastructure');
  infrastructure.setAttribute('aria-hidden', 'true');
  infrastructure.append(...buildCityArtLayers());
  infrastructure.append(
    make('span', 'city-map__guide'),
    make('span', 'city-map__guide-prompt', 'どこへ行こうかな？'),
    make('span', 'city-map__road city-map__road--spine'),
    make('span', 'city-map__road city-map__road--cross'),
    make('span', 'city-map__plaza'),
    make('span', 'city-map__bridge'),
    make('span', 'city-map__path city-map__path--west'),
    make('span', 'city-map__path city-map__path--east'),
    make('span', 'city-map__path city-map__path--south'),
    make('span', 'city-map__shoreline'),
    make('span', 'city-map__pier'),
    make('span', 'city-map__boat'),
    make('span', 'city-map__street-label city-map__street-label--north', 'OBSERVATORY ROAD'),
    make('span', 'city-map__street-label city-map__street-label--west', 'ARCHIVE STREET'),
    make('span', 'city-map__street-label city-map__street-label--east', 'WORKSHOP ALLEY'),
    make('span', 'city-map__street-label city-map__street-label--south', 'WATERSIDE WALK')
  );
  return infrastructure;
}

function buildDistrictScene(district) {
  const scene = make('div', 'district-scene');
  scene.dataset.scene = district.id;
  scene.setAttribute('aria-hidden', 'true');
  scene.append(
    make('span', 'district-scene__prop district-scene__prop--a'),
    make('span', 'district-scene__prop district-scene__prop--b'),
    make('span', 'district-scene__prop district-scene__prop--c'),
    make('span', 'district-scene__tree'),
    make('span', 'district-scene__lamp'),
    make('span', 'district-scene__bench'),
    make('span', 'district-scene__sign'),
    make('span', 'district-scene__detail')
  );
  return scene;
}

function buildDistrictLandmark(district) {
  const landmark = make('div', 'district-landmark');
  landmark.dataset.landmark = district.id;
  landmark.setAttribute('aria-label', `${district.name}のランドマーク: ${district.landmark}`);
  landmark.append(
    make('span', 'district-landmark__visual'),
    make('span', 'district-landmark__label', district.landmark)
  );
  return landmark;
}

function placementForProject(projectId) {
  return state.layout?.projectPlacements?.find((item) => item.projectId === projectId) ?? null;
}

function regionForDistrict(districtId) {
  return state.layout?.districtRegions?.find((item) => item.districtId === districtId) ?? null;
}

function illustratedChunkForDistrict(districtId) {
  return state.layout?.chunks?.find((item) => item.districtId === districtId && item.image) ?? null;
}

function buildWorldEdgeFrame() {
  const frame = make('div', 'world-edge-frame');
  frame.setAttribute('aria-hidden', 'true');
  for (const corner of ['nw', 'ne', 'sw', 'se']) {
    frame.append(make('span', `world-edge-frame__mist world-edge-frame__mist--${corner}`));
  }
  const feathers = [
    ['right', 38.5, 0, 3, 20], ['left', 58.5, 0, 3, 20],
    ['down', 20, 18.5, 20, 3], ['down', 60, 18.5, 20, 3],
    ['right', 18.5, 20, 3, 20], ['left', 78.5, 20, 3, 20],
    ['right', 18.5, 60, 3, 20], ['left', 78.5, 60, 3, 20],
    ['up', 20, 78.5, 20, 3], ['up', 60, 78.5, 20, 3],
    ['right', 38.5, 80, 3, 20], ['left', 58.5, 80, 3, 20]
  ];
  for (const [direction, left, top, width, height] of feathers) {
    const edge = make('span', `world-edge-frame__feather world-edge-frame__feather--${direction}`);
    edge.style?.setProperty('--edge-left', `${left}%`);
    edge.style?.setProperty('--edge-top', `${top}%`);
    edge.style?.setProperty('--edge-width', `${width}%`);
    edge.style?.setProperty('--edge-height', `${height}%`);
    frame.append(edge);
  }
  return frame;
}

function buildWorldDetails() {
  const layer = make('div', 'world-details');
  layer.setAttribute('aria-hidden', 'true');
  for (const detail of state.details) {
    const node = make('span', `world-detail world-detail--${detail.type} world-detail--${detail.district}`);
    node.dataset.detailId = detail.id;
    node.dataset.detailType = detail.type;
    const point = worldPointToPercent(detail.x, detail.y, state.layout.world);
    node.style?.setProperty('--detail-left', `${point.x}%`);
    node.style?.setProperty('--detail-top', `${point.y}%`);
    node.style?.setProperty('--detail-width', `${detail.width / state.layout.world.width * 100}%`);
    node.style?.setProperty('--detail-height', `${detail.height / state.layout.world.height * 100}%`);
    node.style?.setProperty('--detail-rotate', `${detail.rotate ?? 0}deg`);
    layer.append(node);
  }
  return layer;
}

function buildWorldChunks() {
  const layer = make('div', 'world-chunks');
  layer.setAttribute('aria-hidden', 'true');
  for (const chunk of state.layout?.chunks ?? []) {
    const node = make('div', 'world-chunk');
    node.dataset.chunkId = chunk.id;
    node.dataset.chunkColumn = String(chunk.column);
    node.dataset.chunkRow = String(chunk.row);
    node.dataset.chunkMode = chunk.image ? 'illustrated' : (chunk.fallback ?? 'legacy');
    if (chunk.image) {
      node.dataset.chunkImage = chunk.image;
      if (node.style) node.style.backgroundImage = `url("${chunk.image}")`;
      const region = chunkRenderRegion(chunk, state.layout.world);
      const percent = worldRectToPercent(region, state.layout.world);
      if (node.style) {
        node.style.setProperty('--chunk-left', `${percent.left}%`);
        node.style.setProperty('--chunk-top', `${percent.top}%`);
        node.style.setProperty('--chunk-width', `${percent.width}%`);
        node.style.setProperty('--chunk-height', `${percent.height}%`);
      }
    }
    layer.append(node);
  }
  return layer;
}

function renderMap() {
  const map = document.getElementById('cityMap');
  if (!map) return;
  map.replaceChildren();
  const worldBounds = resolveWorldBounds(state.layout.world);
  map.dataset.worldLayout = 'v1';
  map.dataset.worldMinX = String(worldBounds.minX);
  map.dataset.worldMinY = String(worldBounds.minY);
  map.dataset.worldWidth = String(worldBounds.width);
  map.dataset.worldHeight = String(worldBounds.height);
  map.dataset.worldMaxX = String(worldBounds.maxX);
  map.dataset.worldMaxY = String(worldBounds.maxY);
  const fullTerrain = (state.layout?.chunks?.length === 13) && state.layout.chunks.every((chunk) => Boolean(chunk.image));
  map.dataset.terrainMode = fullTerrain ? 'full' : 'legacy';
  const worldProjects = fullTerrain ? make('div', 'world-projects') : null;
  const worldDetails = fullTerrain ? buildWorldDetails() : null;
  const worldEdgeFrame = fullTerrain ? buildWorldEdgeFrame() : null;
  map.append(buildWorldChunks(), buildMapInfrastructure());
  if (worldEdgeFrame) map.append(worldEdgeFrame);
  if (worldDetails) map.append(worldDetails);
  if (worldProjects) map.append(worldProjects);

  for (const district of [...state.districts].sort(byOrder)) {
    const section = make('section', `district district--${district.mapArea}`);
    section.dataset.districtId = district.id;
    const illustratedChunk = illustratedChunkForDistrict(district.id);
    if (illustratedChunk) {
      section.dataset.visualMode = 'illustrated';
      if (section.style) section.style.setProperty('--district-art', `url("${illustratedChunk.image}")`);
    }
    const region = regionForDistrict(district.id);
    if (region) {
      section.dataset.worldX = String(region.x);
      section.dataset.worldY = String(region.y);
      section.dataset.worldWidth = String(region.width);
      section.dataset.worldHeight = String(region.height);
      const districtPercent = worldRectToPercent(region, state.layout.world);
      section.style?.setProperty('--district-left', `${districtPercent.left}%`);
      section.style?.setProperty('--district-top', `${districtPercent.top}%`);
      section.style?.setProperty('--district-width', `${districtPercent.width}%`);
      section.style?.setProperty('--district-height', `${districtPercent.height}%`);
    }
    section.setAttribute('aria-labelledby', `district-${district.id}`);

    const heading = make('div', 'district__heading');
    const title = make('h3', '', district.name);
    title.id = `district-${district.id}`;
    const headingMeta = make('div', 'district__heading-meta');
    const complete = make('span', 'district__complete', 'DISTRICT COMPLETE');
    complete.dataset.districtComplete = district.id;
    complete.hidden = true;
    headingMeta.append(complete, make('span', 'district__count', String(projectsForDistrict(district.id).length).padStart(2, '0')));
    heading.append(title, headingMeta);

    const progress = make('p', 'district__progress', `VISITED 0 / ${projectsForDistrict(district.id).length}`);
    progress.dataset.districtProgress = district.id;
    const meta = make('p', 'district__meta', `${district.english} / ${district.role}`);
    const buildings = make('div', 'district__buildings');

    for (const project of projectsForDistrict(district.id)) {
      const button = make('button', 'building-button');
      button.type = 'button';
      button.dataset.projectId = project.id;
      button.dataset.districtId = district.id;
      const placement = placementForProject(project.id);
      if (placement) {
        button.dataset.worldX = String(placement.x);
        button.dataset.worldY = String(placement.y);
        button.dataset.worldWidth = String(placement.width);
        button.dataset.worldAnchor = placement.anchor;
        button.dataset.worldZ = String(placement.z ?? Math.round(placement.y));
        if (region) {
          const localX = (placement.x - region.x) / region.width * 100;
          const localY = (placement.y - region.y) / region.height * 100;
          const localWidth = placement.width / region.width * 100;
          const visualHeightWorld = placement.visualHeight ?? placement.width * 1.2;
          const localHeight = visualHeightWorld / region.height * 100;
          const worldPoint = worldPointToPercent(placement.x, placement.y, state.layout.world);
          const worldWidth = placement.width / state.layout.world.width * 100;
          const worldHeight = visualHeightWorld / state.layout.world.height * 100;
          button.style?.setProperty('--project-world-left', `${worldPoint.x}%`);
          button.style?.setProperty('--project-world-top', `${worldPoint.y}%`);
          button.style?.setProperty('--project-world-width', `${worldWidth}%`);
          button.style?.setProperty('--project-world-half-width', `${worldWidth / 2}%`);
          button.style?.setProperty('--project-world-height', `${worldHeight}%`);
          button.style?.setProperty('--project-left', `${localX}%`);
          button.style?.setProperty('--project-top', `${localY}%`);
          button.style?.setProperty('--project-width', `${localWidth}%`);
          button.style?.setProperty('--project-half-width', `${localWidth / 2}%`);
          button.style?.setProperty('--project-height', `${localHeight}%`);
        }
        if (placement.asset) {
          button.dataset.visualMode = 'illustrated';
          if (button.style) button.style.setProperty('--building-art', `url("${placement.asset}")`);
        }
      }
      button.dataset.baseLabel = `${district.name}の${project.building}、${project.title}`;
      button.setAttribute('aria-label', `${button.dataset.baseLabel}、未訪問`);
      button.setAttribute('aria-pressed', 'false');
      button.append(
        buildBuildingForecourt(district.id),
        buildBuildingVisual(),
        make('span', 'building-button__name', project.building),
        make('span', 'building-button__title', project.title)
      );
      button.addEventListener('mouseenter', () => section.classList.add('is-hover-district'));
      button.addEventListener('mouseleave', () => section.classList.remove('is-hover-district'));
      button.addEventListener('focus', () => selectProject(project.id, false, true));
      button.addEventListener('click', () => selectProject(project.id, true, true));
      button.addEventListener('keydown', handleBuildingKeydown);
      if (worldProjects) worldProjects.append(button);
      else buildings.append(button);
    }

    section.append(buildDistrictScene(district), heading, buildDistrictLandmark(district), progress, meta, buildings);
    map.append(section);
  }
}

function handleBuildingKeydown(event) {
  if (event.key === 'Escape') { setInspectorOpen(false); return; }
  const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
  if (!keys.includes(event.key)) return;

  const buttons = Array.from(document.querySelectorAll('.building-button'));
  const current = buttons.indexOf(event.currentTarget);
  if (current < 0) return;

  event.preventDefault();
  let next = current;
  if (event.key === 'Home') next = 0;
  if (event.key === 'End') next = buttons.length - 1;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = Math.max(0, current - 1);
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = Math.min(buttons.length - 1, current + 1);
  buttons[next]?.focus();
}

function positionInspector(project) {
  if (!window.matchMedia('(min-width: 981px)').matches) return;
  const inspector = document.getElementById('projectInspector');
  const button = document.querySelector(`[data-project-id="${project.id}"]`);
  const layout = inspector?.parentElement;
  if (!inspector || !button || !layout) return;
  const layoutRect = layout.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();
  const inspectorRect = inspector.getBoundingClientRect();
  const margin = 18;
  const width = inspectorRect.width || 304;
  const height = inspectorRect.height || 360;
  const rightSpace = layoutRect.width - (buttonRect.right - layoutRect.left);
  const leftSpace = buttonRect.left - layoutRect.left;
  let x = rightSpace >= width + margin || rightSpace >= leftSpace
    ? buttonRect.right - layoutRect.left + margin
    : buttonRect.left - layoutRect.left - width - margin;
  x = Math.min(Math.max(margin, x), Math.max(margin, layoutRect.width - width - margin));
  let y = buttonRect.top - layoutRect.top + buttonRect.height / 2 - height / 2;
  y = Math.min(Math.max(margin, y), Math.max(margin, layoutRect.height - height - margin));
  inspector.style.setProperty('--inspector-x', `${Math.round(x)}px`);
  inspector.style.setProperty('--inspector-y', `${Math.round(y)}px`);
}

function setInspectorOpen(open, project) {
  const inspector = document.getElementById('projectInspector');
  if (!inspector) return;
  const desktop = window.matchMedia('(min-width: 981px)').matches;
  const mobile = window.matchMedia('(max-width: 680px)').matches;
  const dismissible = desktop || mobile;
  const effectiveOpen = dismissible ? open : true;
  inspector.classList.toggle('is-open', effectiveOpen);
  inspector.setAttribute('aria-hidden', dismissible && !open ? 'true' : 'false');
  if (dismissible && !open) inspector.setAttribute('inert', '');
  else inspector.removeAttribute('inert');
  if (desktop && open && project) requestAnimationFrame(() => positionInspector(project));
}

function selectProject(projectId, userInitiated, openInspector = false) {
  const project = state.projects.find((item) => item.id === projectId);
  if (!project) return;

  state.selectedProjectId = project.id;
  const map = document.getElementById('cityMap');
  if (map) map.dataset.activeDistrict = project.district;
  document.querySelectorAll('.district').forEach((district) => {
    district.classList.toggle('is-active-district', district.dataset.districtId === project.district);
  });
  document.querySelectorAll('.building-button').forEach((button) => {
    const selected = button.dataset.projectId === project.id;
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  updateInspector(project);
  setInspectorOpen(openInspector, project);

  if (userInitiated && window.matchMedia('(min-width: 681px) and (max-width: 980px)').matches) {
    document.getElementById('projectInspector')?.scrollIntoView({
      behavior: reducedMotion.matches ? 'auto' : 'smooth',
      block: 'nearest'
    });
  }
}

function updateInspector(project) {
  const inspector = document.getElementById('projectInspector');
  if (!inspector) return;
  const district = districtForProject(project);
  const visited = state.visited.has(project.id);
  inspector.dataset.projectId = project.id;

  inspector.querySelector('.project-inspector__eyebrow').textContent = `WORK ${String(state.projects.indexOf(project) + 1).padStart(2, '0')} / ${district?.english ?? ''}`;
  inspector.querySelector('h3').textContent = project.title;
  inspector.querySelector('.project-inspector__district').textContent = `${district?.name ?? ''} / ${project.building}`;
  inspector.querySelector('.project-inspector__summary').textContent = project.summary;

  const facts = inspector.querySelectorAll('.project-inspector__facts dd');
  if (facts[0]) facts[0].textContent = project.building;
  if (facts[1]) facts[1].textContent = project.type;
  if (facts[2]) facts[2].textContent = visited ? 'VISITED' : 'UNVISITED';

  const enter = inspector.querySelector('.project-inspector__enter');
  enter.hidden = false;
  enter.href = project.route;
  enter.onclick = () => markVisited(project.id);
}

function markVisited(projectId) {
  state.visited.add(projectId);
  saveVisited();
  refreshVisitedState();
}

function refreshVisitedState() {
  document.querySelectorAll('.building-button').forEach((button) => {
    const visited = state.visited.has(button.dataset.projectId);
    button.classList.toggle('is-visited', visited);
    button.setAttribute('aria-label', `${button.dataset.baseLabel}${visited ? '、訪問済み' : '、未訪問'}`);
  });
  document.querySelectorAll('.work-row').forEach((row) => {
    row.classList.toggle('is-visited', state.visited.has(row.dataset.projectId));
  });

  for (const district of state.districts) {
    const projects = projectsForDistrict(district.id);
    const visited = projects.filter((project) => state.visited.has(project.id)).length;
    const section = Array.from(document.querySelectorAll('.district')).find((item) => item.dataset.districtId === district.id);
    const complete = visited === projects.length && projects.length > 0;
    section?.classList.toggle('has-visited', visited > 0);
    section?.classList.toggle('is-complete-district', complete);
    if (section) section.dataset.visitState = complete ? 'complete' : visited > 0 ? 'started' : 'unvisited';
    const completion = Array.from(document.querySelectorAll('[data-district-complete]')).find((item) => item.dataset.districtComplete === district.id);
    if (completion) completion.hidden = !complete;
    const progress = Array.from(document.querySelectorAll('[data-district-progress]')).find((item) => item.dataset.districtProgress === district.id);
    if (progress) {
      progress.textContent = `VISITED ${visited} / ${projects.length}`;
      progress.setAttribute('aria-label', `${district.name}の訪問進捗 ${visited}/${projects.length}`);
    }
  }

  const count = document.getElementById('visitedCount');
  if (count) count.textContent = String(state.visited.size);
  const total = document.getElementById('visitedTotal');
  if (total) total.textContent = String(state.projects.length || EXPECTED_PROJECT_COUNT);

  if (state.selectedProjectId) {
    const selected = state.projects.find((project) => project.id === state.selectedProjectId);
    if (selected) updateInspector(selected);
  }
}

function renderWorksDirectory() {
  const directory = document.getElementById('worksDirectory');
  if (!directory) return;
  directory.replaceChildren();
  let sequence = 1;

  for (const district of [...state.districts].sort(byOrder)) {
    const group = make('section', 'works-group');
    const heading = make('div', 'works-group__heading');
    heading.append(
      make('h3', '', district.name),
      make('p', 'works-group__meta', `${district.english} / ${district.description}`)
    );

    const list = make('div', 'works-group__list');
    for (const project of projectsForDistrict(district.id)) {
      const row = make('a', 'work-row');
      row.href = project.route;
      row.dataset.projectId = project.id;
      row.addEventListener('click', () => markVisited(project.id));
      row.append(
        make('span', 'work-row__thumb'),
        make('span', 'work-row__num', String(sequence).padStart(2, '0')),
        make('strong', '', project.title),
        make('span', 'work-row__type', `${project.building} / ${project.type}`),
        make('b', '', '↗')
      );
      list.append(row);
      sequence += 1;
    }
    group.append(heading, list);
    directory.append(group);
  }
}

function activatePanel(name) {
  if (!['map', 'works', 'profile', 'contact'].includes(name)) return;
  state.activePanel = name;
  document.querySelectorAll('[data-view-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.viewPanel !== name;
  });
  document.querySelectorAll('[data-panel-target]').forEach((button) => {
    if (button.dataset.panelTarget === name) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  if (name === 'map' || name === 'works') setMobilePrimary(name, false);
}

function setMobilePrimary(name, activate = true) {
  if (!['map', 'works'].includes(name)) return;
  state.mobilePrimary = name;
  document.body.dataset.mobilePrimary = name;
  document.querySelectorAll('[data-mobile-target]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.mobileTarget === name));
  });
  if (activate) activatePanel(name);
}

function bindNavigation() {
  document.querySelector('.project-inspector__close')?.addEventListener('click', () => {
    document.querySelector(`[data-project-id="${state.selectedProjectId}"]`)?.focus({ preventScroll: true });
    setInspectorOpen(false);
  });
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setInspectorOpen(false);
    });
    window.addEventListener('resize', () => {
      const inspector = document.getElementById('projectInspector');
      const selected = state.projects.find((project) => project.id === state.selectedProjectId);
      if (inspector?.classList.contains('is-open') && selected) positionInspector(selected);
    });
  }
  document.querySelectorAll('[data-panel-target]').forEach((button) => {
    button.addEventListener('click', () => activatePanel(button.dataset.panelTarget));
  });
  document.querySelectorAll('[data-mobile-target]').forEach((button) => {
    button.addEventListener('click', () => setMobilePrimary(button.dataset.mobileTarget));
  });
}

function renderError(error) {
  const target = document.getElementById('cityMap');
  if (!target) return;
  const message = make('p', 'city-data-error', `Portfolio City のデータを読み込めませんでした: ${error.message}`);
  target.replaceChildren(message);
}

async function loadCity() {
  try {
    const [projectResponse, districtResponse, layoutResponse, detailResponse] = await Promise.all([
      fetch(DATA_PATHS.projects, { cache: 'no-store' }),
      fetch(DATA_PATHS.districts, { cache: 'no-store' }),
      fetch(DATA_PATHS.layout, { cache: 'no-store' }),
      fetch(DATA_PATHS.details, { cache: 'no-store' })
    ]);
    if (!projectResponse.ok || !districtResponse.ok || !layoutResponse.ok || !detailResponse.ok) throw new Error('JSONファイルの取得に失敗しました。');

    const [projectPayload, districtPayload, layoutPayload, detailPayload] = await Promise.all([
      projectResponse.json(),
      districtResponse.json(),
      layoutResponse.json(),
      detailResponse.json()
    ]);
    validateData(projectPayload, districtPayload, layoutPayload, detailPayload);

    state.projects = projectPayload.projects.slice().sort((a, b) => {
      const da = districtPayload.districts.find((district) => district.id === a.district)?.order ?? 0;
      const db = districtPayload.districts.find((district) => district.id === b.district)?.order ?? 0;
      return da - db || byOrder(a, b);
    });
    state.districts = districtPayload.districts.slice().sort(byOrder);
    state.layout = layoutPayload;
    state.details = detailPayload.details;

    const projectCount = document.getElementById('projectCount');
    if (projectCount) projectCount.textContent = String(state.projects.length);
    const districtCount = document.getElementById('districtCount');
    if (districtCount) districtCount.textContent = String(state.districts.length);

    renderMap();
    window.requestAnimationFrame?.(() => window.requestAnimationFrame?.(positionMapViewport));
    renderWorksDirectory();
    refreshVisitedState();
    if (state.projects[0]) selectProject(state.projects[0].id, false);
  } catch (error) {
    console.error(error);
    renderError(error instanceof Error ? error : new Error('不明なエラー'));
  }
}


function positionMapViewport() {
  const viewport = document.getElementById('cityMapViewport');
  const map = document.getElementById('cityMap');
  if (!viewport || !map) return;
  const fullTerrain = map.dataset.terrainMode === 'full';
  if (!fullTerrain && !window.matchMedia('(min-width: 981px)').matches) return;
  const bounds = resolveWorldBounds(state.layout?.world || {});
  const presets = state.layout?.cameraPresets || {};
  const preset = window.matchMedia('(max-width: 680px)').matches ? presets.mobile
    : window.matchMedia('(max-width: 980px)').matches ? presets.tablet : presets.desktop;
  const startX = Number(preset?.startX ?? (bounds.minX + bounds.width / 2));
  const ratioX = Math.min(1, Math.max(0, (startX - bounds.minX) / bounds.width));
  viewport.scrollLeft = Math.max(0, Math.min(viewport.scrollWidth - viewport.clientWidth, ratioX * viewport.scrollWidth - viewport.clientWidth / 2));
  viewport.scrollTop = 0;
}

function bindDesktopMapPan() {
  const viewport = document.getElementById('cityMapViewport');
  if (!viewport) return;
  const desktop = window.matchMedia('(min-width: 981px)');
  let drag = null;
  let moved = false;
  viewport.addEventListener('pointerdown', (event) => {
    if (!desktop.matches || event.button !== 0 || event.target.closest('button, a, .project-inspector')) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
    moved = false;
    viewport.setPointerCapture?.(event.pointerId);
    viewport.classList.add('is-panning');
  });

  viewport.addEventListener('pointermove', (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
    viewport.scrollLeft = drag.left - dx;
    viewport.scrollTop = drag.top - dy;
  });
  const finish = (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    viewport.releasePointerCapture?.(event.pointerId);
    drag = null;
    viewport.classList.remove('is-panning');
  };
  viewport.addEventListener('pointerup', finish);
  viewport.addEventListener('pointercancel', finish);
  viewport.addEventListener('click', (event) => {
    if (!moved) return;
    event.preventDefault();
    event.stopPropagation();
    moved = false;
  }, true);
  window.requestAnimationFrame?.(positionMapViewport);
  window.addEventListener('resize', positionMapViewport);
}

bindNavigation();
bindDesktopMapPan();
loadCity();
