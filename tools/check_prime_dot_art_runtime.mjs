import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

class MockClassList {
  constructor() {
    this.values = new Set();
  }

  toggle(name, force) {
    const enabled = force === undefined ? !this.values.has(name) : Boolean(force);
    if (enabled) this.values.add(name);
    else this.values.delete(name);
    return enabled;
  }

  contains(name) {
    return this.values.has(name);
  }
}

class MockElement {
  constructor(tagName = 'div', id = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.attributes = new Map();
    this.attributeHistory = [];
    this.listeners = new Map();
    this.children = [];
    this.classList = new MockClassList();
    this.style = {};
    this.dataset = {};
    this.hidden = false;
    this.disabled = false;
    this.checked = false;
    this.value = '';
    this.textContent = '';
    this.parentElement = null;
    this.clientWidth = 0;
    this.isFragment = false;
  }

  setAttribute(name, value) {
    const text = String(value);
    this.attributes.set(name, text);
    this.attributeHistory.push([name, text]);
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(handler);
  }

  dispatchEvent(event) {
    const current = typeof event === 'string' ? { type: event } : event;
    current.target = this;
    for (const handler of this.listeners.get(current.type) || []) {
      handler.call(this, current);
    }
    return true;
  }

  click() {
    if (this.disabled) return;
    this.dispatchEvent({ type: 'click', preventDefault() {} });
  }

  append(...nodes) {
    for (const node of nodes) {
      if (node?.isFragment) this.children.push(...node.children);
      else this.children.push(node);
    }
  }

  replaceChildren(...nodes) {
    this.children = [];
    this.append(...nodes);
  }

  querySelector(selector) {
    if (selector === 'span') {
      return this.children.find(child => child?.tagName === 'SPAN') || null;
    }
    return null;
  }

  remove() {
    this.removed = true;
  }
}

class MockCanvas extends MockElement {
  constructor(id) {
    super('canvas', id);
    this.width = 0;
    this.height = 0;
    this.context = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      fillRect() {},
      beginPath() {},
      moveTo() {},
      lineTo() {},
      stroke() {},
    };
  }

  getContext(kind) {
    return kind === '2d' ? this.context : null;
  }

  toBlob(callback) {
    callback({ type: 'image/png' });
  }
}

const elements = new Map();
function register(id, element = new MockElement('div', id)) {
  elements.set(id, element);
  return element;
}

const canvas = register('c', new MockCanvas('c'));
const canvasFrame = new MockElement('div');
canvasFrame.clientWidth = 600;
canvas.parentElement = canvasFrame;
const canvasWrap = new MockElement('div');
const textLink = new MockElement('a');
const body = new MockElement('body');

register('nrange').value = '5000';
register('srange').value = '3';
register('nval').textContent = '5,000';
register('sval').textContent = '3';
register('info');
register('prog');
register('stats');
register('settings');
register('runBtn', new MockElement('button', 'runBtn'));
register('resetBtn', new MockElement('button', 'resetBtn'));
register('fitBtn', new MockElement('button', 'fitBtn'));
register('savePngBtn', new MockElement('button', 'savePngBtn'));

const settingsToggle = register('settingsToggle', new MockElement('button', 'settingsToggle'));
settingsToggle.setAttribute('aria-expanded', 'false');
const arrow = new MockElement('span');
arrow.textContent = '↓';
settingsToggle.append({ textContent: '描画ルールを開く ' }, arrow);

const defaultTurns = ['straight', 'right', 'back', 'right', 'right', 'left', 'straight', 'back', 'straight'];
for (let i = 0; i <= 8; i++) {
  register('d' + i).value = defaultTurns[i];
  register('c' + i).value = '#000000';
}
for (let i = 3; i <= 8; i++) {
  register('on' + i).checked = false;
  register('row' + i);
}

const presetNames = ['branch', 'grid', 'mod4', 'twins'];
const presetButtons = presetNames.map((name, index) => {
  const button = new MockElement('button');
  button.dataset.preset = name;
  button.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
  return button;
});

const documentMock = {
  body,
  getElementById(id) {
    return elements.get(id) || null;
  },
  querySelector(selector) {
    if (selector === '.canvas-wrap') return canvasWrap;
    if (selector === '.text-link') return textLink;
    return null;
  },
  querySelectorAll(selector) {
    return selector === '[data-preset]' ? presetButtons : [];
  },
  createElement(tagName) {
    return new MockElement(tagName);
  },
  createDocumentFragment() {
    const fragment = new MockElement('#fragment');
    fragment.isFragment = true;
    return fragment;
  },
  createTextNode(text) {
    return { nodeType: 3, textContent: text };
  },
};

const mediaListeners = [];
const mediaQuery = {
  matches: false,
  addEventListener(type, handler) {
    if (type === 'change') mediaListeners.push(handler);
  },
  fire() {
    for (const handler of mediaListeners) handler({ matches: this.matches });
  },
};

const windowListeners = new Map();
const windowMock = {
  matchMedia() {
    return mediaQuery;
  },
  addEventListener(type, handler) {
    if (!windowListeners.has(type)) windowListeners.set(type, []);
    windowListeners.get(type).push(handler);
  },
  fire(type) {
    for (const handler of windowListeners.get(type) || []) handler({ type });
  },
  setTimeout(callback) {
    callback();
    return 1;
  },
};

let rafSequence = 0;
const rafQueue = [];
const cancelledRafs = new Set();
function requestAnimationFrameMock(callback) {
  const id = ++rafSequence;
  rafQueue.push([id, callback]);
  return id;
}
function cancelAnimationFrameMock(id) {
  cancelledRafs.add(id);
}
function flushRaf() {
  let guard = 0;
  while (rafQueue.length) {
    if (++guard > 1000) throw new Error('requestAnimationFrame queue did not settle');
    const [id, callback] = rafQueue.shift();
    if (!cancelledRafs.has(id)) callback();
  }
}

let objectUrlCreates = 0;
let objectUrlRevokes = 0;
let lastCreatedUrl = null;
let lastRevokedUrl = null;
const urlMock = {
  createObjectURL() {
    objectUrlCreates++;
    lastCreatedUrl = `blob:prime-dot-art/${objectUrlCreates}`;
    return lastCreatedUrl;
  },
  revokeObjectURL(url) {
    objectUrlRevokes++;
    lastRevokedUrl = url;
  },
};

globalThis.document = documentMock;
globalThis.window = windowMock;
globalThis.URL = urlMock;
globalThis.requestAnimationFrame = requestAnimationFrameMock;
globalThis.cancelAnimationFrame = cancelAnimationFrameMock;
globalThis.setTimeout = callback => {
  callback();
  return 1;
};
globalThis.clearTimeout = () => {};

const source = readFileSync('works/prime-dot-art/prime_dot_art.js', 'utf8');
vm.runInThisContext(source, { filename: 'prime_dot_art.js' });
flushRaf();

function stats() {
  return Object.fromEntries(
    elements.get('stats').children.map(item => [item.children[0].textContent, item.children[1].textContent])
  );
}

assert.deepEqual(stats(), {
  STEPS: '5,000',
  PRIME: '669',
  SPAN: '203 × 135',
  RULES: '3',
});
assert.equal(canvasWrap.getAttribute('aria-busy'), 'false');
assert.ok(canvasWrap.attributeHistory.some(([name, value]) => name === 'aria-busy' && value === 'true'));
assert.equal(elements.get('savePngBtn').disabled, false);
assert.equal(elements.get('fitBtn').disabled, false);
assert.equal(presetButtons[0].getAttribute('aria-pressed'), 'true');

presetButtons[1].click();
flushRaf();
assert.equal(stats().SPAN, '129 × 327');
assert.equal(presetButtons[1].getAttribute('aria-pressed'), 'true');
assert.equal(elements.get('d1').value, 'right');
assert.equal(elements.get('d2').value, 'right');

mediaQuery.matches = true;
mediaQuery.fire();
assert.equal(elements.get('settings').hidden, true);
assert.equal(settingsToggle.getAttribute('aria-expanded'), 'false');
settingsToggle.click();
assert.equal(elements.get('settings').hidden, false);
assert.equal(settingsToggle.getAttribute('aria-expanded'), 'true');
settingsToggle.click();
assert.equal(elements.get('settings').hidden, true);
assert.equal(settingsToggle.getAttribute('aria-expanded'), 'false');

elements.get('savePngBtn').click();
assert.equal(objectUrlCreates, 1);
assert.equal(objectUrlRevokes, 1);
assert.equal(lastRevokedUrl, lastCreatedUrl);
assert.equal(elements.get('savePngBtn').disabled, false);

elements.get('resetBtn').click();
assert.equal(elements.get('stats').children.length, 0);
assert.equal(elements.get('info').children.length, 0);
assert.equal(elements.get('savePngBtn').disabled, true);
assert.equal(canvas.dataset.fitScale, undefined);
windowMock.fire('resize');
flushRaf();
assert.equal(elements.get('stats').children.length, 0, 'resize after clear must not regenerate the artwork');

presetButtons[0].click();
flushRaf();
elements.get('nrange').value = '100';
elements.get('nrange').dispatchEvent({ type: 'input' });
elements.get('on7').checked = true;
elements.get('on7').dispatchEvent({ type: 'change' });
elements.get('runBtn').click();
flushRaf();
assert.equal(stats().STEPS, '100');
assert.equal(stats().PRIME, '25');
assert.ok(elements.get('info').children.some(item => item.textContent === '素数の2乗：4'));
assert.ok(presetButtons.every(button => button.getAttribute('aria-pressed') === 'false'));

console.log('Prime Dot Art runtime contract passed');
