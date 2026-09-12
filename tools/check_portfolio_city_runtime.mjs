import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const projectsPayload = JSON.parse(readFileSync('portfolio-city/data/projects.json', 'utf8'));
const districtsPayload = JSON.parse(readFileSync('portfolio-city/data/districts.json', 'utf8'));
const citySource = readFileSync('portfolio-city/city.js', 'utf8');

class MockClassList {
  constructor(owner) {
    this.owner = owner;
    this.values = new Set();
  }
  add(...names) { names.forEach((name) => this.values.add(name)); }
  remove(...names) { names.forEach((name) => this.values.delete(name)); }
  toggle(name, force) {
    const enabled = force === undefined ? !this.values.has(name) : Boolean(force);
    if (enabled) this.values.add(name); else this.values.delete(name);
    return enabled;
  }
  contains(name) { return this.values.has(name); }
}

class MockElement {
  constructor(tagName = 'div', id = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.children = [];
    this.parentElement = null;
    this.attributes = new Map();
    this.listeners = new Map();
    this.classList = new MockClassList(this);
    this.dataset = {};
    this.hidden = false;
    this.href = '';
    this.onclick = null;
    this.textContent = '';
    this.type = '';
    this.focused = false;
    this.scrolled = false;
  }
  get className() { return Array.from(this.classList.values).join(' '); }
  set className(value) {
    this.classList.values = new Set(String(value).split(/\s+/).filter(Boolean));
  }
  setAttribute(name, value) {
    const text = String(value);
    this.attributes.set(name, text);
    if (name === 'id') this.id = text;
    if (name.startsWith('data-')) {
      const key = name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      this.dataset[key] = text;
    }
  }
  getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
  removeAttribute(name) { this.attributes.delete(name); }
  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(handler);
  }
  dispatchEvent(event) {
    const current = event;
    current.currentTarget = this;
    current.target = this;
    for (const handler of this.listeners.get(current.type) || []) handler.call(this, current);
    return true;
  }
  click() {
    this.dispatchEvent({ type: 'click', preventDefault() {} });
    if (typeof this.onclick === 'function') this.onclick();
  }
  focus() {
    allElements.forEach((element) => { element.focused = false; });
    this.focused = true;
    this.dispatchEvent({ type: 'focus', preventDefault() {} });
  }
  append(...nodes) {
    for (const node of nodes) {
      if (!(node instanceof MockElement)) continue;
      node.parentElement = this;
      this.children.push(node);
      allElements.add(node);
      if (node.id) elementsById.set(node.id, node);
    }
  }
  replaceChildren(...nodes) {
    this.children = [];
    this.append(...nodes);
  }
  querySelector(selector) { return queryFrom(this, selector, true)[0] || null; }
  querySelectorAll(selector) { return queryFrom(this, selector, false); }
  scrollIntoView() { this.scrolled = true; }
}

const allElements = new Set();
const elementsById = new Map();
const roots = [];

function register(element, parent = null) {
  allElements.add(element);
  if (element.id) elementsById.set(element.id, element);
  if (parent) parent.append(element); else roots.push(element);
  return element;
}

function matches(element, selector) {
  if (selector.startsWith('.')) return element.classList.contains(selector.slice(1));
  if (selector.startsWith('#')) return element.id === selector.slice(1);
  const dataMatch = selector.match(/^\[data-([a-z-]+)\]$/);
  if (dataMatch) {
    const key = dataMatch[1].replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    return Object.hasOwn(element.dataset, key);
  }
  return element.tagName === selector.toUpperCase();
}

function descendants(node) {
  const found = [];
  for (const child of node.children) {
    found.push(child, ...descendants(child));
  }
  return found;
}

function queryFrom(node, selector, firstOnly) {
  const found = [];
  for (const candidate of descendants(node)) {
    if (matches(candidate, selector)) {
      found.push(candidate);
      if (firstOnly) break;
    }
  }
  return found;
}

const body = register(new MockElement('body', 'body'));
body.dataset.mobilePrimary = 'map';
const cityMap = register(new MockElement('div', 'cityMap'), body);
const worksDirectory = register(new MockElement('div', 'worksDirectory'), body);
const projectCount = register(new MockElement('span', 'projectCount'), body);
const districtCount = register(new MockElement('span', 'districtCount'), body);
const visitedCount = register(new MockElement('span', 'visitedCount'), body);
const visitedTotal = register(new MockElement('span', 'visitedTotal'), body);

const inspector = register(new MockElement('aside', 'projectInspector'), body);
register(Object.assign(new MockElement('p'), { className: 'project-inspector__eyebrow' }), inspector);
register(new MockElement('h3'), inspector);
register(Object.assign(new MockElement('p'), { className: 'project-inspector__district' }), inspector);
register(Object.assign(new MockElement('p'), { className: 'project-inspector__summary' }), inspector);
const facts = register(Object.assign(new MockElement('dl'), { className: 'project-inspector__facts' }), inspector);
for (let index = 0; index < 3; index += 1) {
  const row = register(new MockElement('div'), facts);
  register(new MockElement('dt'), row);
  register(new MockElement('dd'), row);
}
const enter = register(Object.assign(new MockElement('a'), { className: 'project-inspector__enter', hidden: true }), inspector);

const panels = {};
for (const name of ['map', 'works', 'profile', 'contact']) {
  const panel = register(new MockElement('section'), body);
  panel.dataset.viewPanel = name;
  panel.hidden = name !== 'map';
  panels[name] = panel;

  const nav = register(new MockElement('button'), body);
  nav.dataset.panelTarget = name;
  if (name === 'map') nav.setAttribute('aria-current', 'page');
}
for (const name of ['map', 'works']) {
  const mobile = register(new MockElement('button'), body);
  mobile.dataset.mobileTarget = name;
  mobile.setAttribute('aria-pressed', name === 'map' ? 'true' : 'false');
}

const documentMock = {
  body,
  getElementById(id) { return elementsById.get(id) || null; },
  createElement(tagName) { return new MockElement(tagName); },
  querySelector(selector) {
    for (const root of roots) {
      if (matches(root, selector)) return root;
      const found = queryFrom(root, selector, true)[0];
      if (found) return found;
    }
    return null;
  },
  querySelectorAll(selector) {
    const found = [];
    for (const root of roots) {
      if (matches(root, selector)) found.push(root);
      found.push(...queryFrom(root, selector, false));
    }
    return found;
  },
};

const storage = new Map();
const localStorageMock = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
};

const matchMediaMock = (query) => ({
  matches: query.includes('prefers-reduced-motion') ? false : false,
});

const fetchMock = async (path) => {
  if (path === 'data/projects.json') return { ok: true, json: async () => projectsPayload };
  if (path === 'data/districts.json') return { ok: true, json: async () => districtsPayload };
  return { ok: false, json: async () => ({}) };
};

const consoleErrors = [];
const context = vm.createContext({
  document: documentMock,
  window: { matchMedia: matchMediaMock },
  matchMedia: matchMediaMock,
  localStorage: localStorageMock,
  fetch: fetchMock,
  console: {
    log: console.log,
    warn: console.warn,
    error: (...args) => consoleErrors.push(args.map(String).join(' ')),
  },
  Set,
  Map,
  Array,
  Object,
  String,
  Boolean,
  Error,
  Promise,
});

vm.runInContext(citySource, context, { filename: 'portfolio-city/city.js' });
await new Promise((resolve) => setTimeout(resolve, 0));
await new Promise((resolve) => setTimeout(resolve, 0));

assert.equal(consoleErrors.length, 0, `city.js logged errors: ${consoleErrors.join(' | ')}`);
assert.equal(projectCount.textContent, '14');
assert.equal(districtCount.textContent, '4');
assert.equal(visitedCount.textContent, '0');
assert.equal(visitedTotal.textContent, '14');

const districts = documentMock.querySelectorAll('.district');
const buildings = documentMock.querySelectorAll('.building-button');
const workRows = documentMock.querySelectorAll('.work-row');
assert.equal(districts.length, 4, 'map must render four districts');
assert.equal(buildings.length, 14, 'map must render fourteen buildings');
assert.equal(documentMock.querySelectorAll('.building-visual').length, 14, 'every building must render a handcrafted visual');
assert.equal(documentMock.querySelectorAll('.district-landmark').length, 4, 'every district must render one landmark');
assert.equal(documentMock.querySelectorAll('.city-map__infrastructure').length, 1, 'map must render one infrastructure layer');
assert.equal(workRows.length, 14, 'works directory must render fourteen rows');

assert.equal(inspector.querySelector('h3').textContent, 'HoloScope');
assert.equal(enter.href, '/holoscope/');
assert.equal(enter.hidden, false);
assert.equal(buildings[0].classList.contains('is-selected'), true);

buildings[1].focus();
assert.equal(inspector.querySelector('h3').textContent, '天球儀');
assert.equal(enter.href, '/SPHERE/sphere.html');

buildings[1].dispatchEvent({
  type: 'keydown',
  key: 'ArrowRight',
  preventDefault() {},
});
assert.equal(buildings[2].focused, true, 'ArrowRight should focus the next building');
assert.equal(inspector.querySelector('h3').textContent, '素数点画');

enter.click();
assert.deepEqual(JSON.parse(storage.get('portfolio-city.visited.v1')), ['prime-dot-art']);
assert.equal(visitedCount.textContent, '1');
assert.equal(buildings[2].classList.contains('is-visited'), true);
assert.equal(workRows.find((row) => row.dataset.projectId === 'prime-dot-art').classList.contains('is-visited'), true);

const worksNav = documentMock.querySelectorAll('[data-panel-target]').find((button) => button.dataset.panelTarget === 'works');
worksNav.click();
assert.equal(panels.map.hidden, true);
assert.equal(panels.works.hidden, false);
assert.equal(worksNav.getAttribute('aria-current'), 'page');
assert.equal(body.dataset.mobilePrimary, 'works');

const profileNav = documentMock.querySelectorAll('[data-panel-target]').find((button) => button.dataset.panelTarget === 'profile');
profileNav.click();
assert.equal(panels.works.hidden, true);
assert.equal(panels.profile.hidden, false);

const mobileMap = documentMock.querySelectorAll('[data-mobile-target]').find((button) => button.dataset.mobileTarget === 'map');
mobileMap.click();
assert.equal(panels.map.hidden, false);
assert.equal(panels.profile.hidden, true);
assert.equal(body.dataset.mobilePrimary, 'map');
assert.equal(mobileMap.getAttribute('aria-pressed'), 'true');

for (const project of projectsPayload.projects) {
  const row = workRows.find((candidate) => candidate.dataset.projectId === project.id);
  assert.ok(row, `missing work row for ${project.id}`);
  assert.equal(row.href, project.route, `route mismatch for ${project.id}`);
}

console.log('Portfolio City runtime contract passed: 4 districts / 14 buildings / navigation / keyboard / visited state');
