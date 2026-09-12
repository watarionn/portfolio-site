'use strict';

const DATA_PATHS = {
  projects: 'data/projects.json',
  districts: 'data/districts.json'
};

const VISITED_KEY = 'portfolio-city.visited.v1';
const EXPECTED_PROJECT_COUNT = 14;
const EXPECTED_DISTRICT_COUNT = 4;

const state = {
  projects: [],
  districts: [],
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

function validateData(projectPayload, districtPayload) {
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

  state.visited = new Set(Array.from(state.visited).filter((id) => projectIds.has(id)));
  saveVisited();
}

function projectsForDistrict(districtId) {
  return state.projects.filter((project) => project.district === districtId).sort(byOrder);
}

function districtForProject(project) {
  return state.districts.find((district) => district.id === project.district);
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

function renderMap() {
  const map = document.getElementById('cityMap');
  if (!map) return;
  map.replaceChildren();

  for (const district of [...state.districts].sort(byOrder)) {
    const section = make('section', `district district--${district.mapArea}`);
    section.dataset.districtId = district.id;
    section.setAttribute('aria-labelledby', `district-${district.id}`);

    const heading = make('div', 'district__heading');
    const title = make('h3', '', district.name);
    title.id = `district-${district.id}`;
    heading.append(title, make('span', 'district__count', String(projectsForDistrict(district.id).length).padStart(2, '0')));

    const meta = make('p', 'district__meta', `${district.english} / ${district.role} / LANDMARK: ${district.landmark}`);
    const buildings = make('div', 'district__buildings');

    for (const project of projectsForDistrict(district.id)) {
      const button = make('button', 'building-button');
      button.type = 'button';
      button.dataset.projectId = project.id;
      button.setAttribute('aria-label', `${district.name}の${project.building}、${project.title}を選択`);
      button.append(
        buildBuildingVisual(),
        make('span', 'building-button__name', project.building),
        make('span', 'building-button__title', project.title)
      );
      button.addEventListener('mouseenter', () => selectProject(project.id, false));
      button.addEventListener('focus', () => selectProject(project.id, false));
      button.addEventListener('click', () => selectProject(project.id, true));
      button.addEventListener('keydown', handleBuildingKeydown);
      buildings.append(button);
    }

    section.append(heading, meta, buildings);
    map.append(section);
  }
}

function handleBuildingKeydown(event) {
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

function selectProject(projectId, userInitiated) {
  const project = state.projects.find((item) => item.id === projectId);
  if (!project) return;

  state.selectedProjectId = project.id;
  document.querySelectorAll('.building-button').forEach((button) => {
    button.classList.toggle('is-selected', button.dataset.projectId === project.id);
  });
  updateInspector(project);

  if (userInitiated && window.matchMedia('(max-width: 680px)').matches) {
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
    button.classList.toggle('is-visited', state.visited.has(button.dataset.projectId));
  });
  document.querySelectorAll('.work-row').forEach((row) => {
    row.classList.toggle('is-visited', state.visited.has(row.dataset.projectId));
  });

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
    const [projectResponse, districtResponse] = await Promise.all([
      fetch(DATA_PATHS.projects, { cache: 'no-store' }),
      fetch(DATA_PATHS.districts, { cache: 'no-store' })
    ]);
    if (!projectResponse.ok || !districtResponse.ok) throw new Error('JSONファイルの取得に失敗しました。');

    const [projectPayload, districtPayload] = await Promise.all([
      projectResponse.json(),
      districtResponse.json()
    ]);
    validateData(projectPayload, districtPayload);

    state.projects = projectPayload.projects.slice().sort((a, b) => {
      const da = districtPayload.districts.find((district) => district.id === a.district)?.order ?? 0;
      const db = districtPayload.districts.find((district) => district.id === b.district)?.order ?? 0;
      return da - db || byOrder(a, b);
    });
    state.districts = districtPayload.districts.slice().sort(byOrder);

    document.getElementById('projectCount').textContent = String(state.projects.length);
    document.getElementById('districtCount').textContent = String(state.districts.length);

    renderMap();
    renderWorksDirectory();
    refreshVisitedState();
    if (state.projects[0]) selectProject(state.projects[0].id, false);
  } catch (error) {
    console.error(error);
    renderError(error instanceof Error ? error : new Error('不明なエラー'));
  }
}

bindNavigation();
loadCity();
