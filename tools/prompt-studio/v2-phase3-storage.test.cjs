// Durable Phase 4 storage-failure regression tests. Run: node tools/prompt-studio/v2-phase3-storage.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const T = require('./template-model.js');
const L = require('./legacy-adapter.js');
const S = require('./v2-state.js');
const source = fs.readFileSync(path.join(__dirname, 'v2-phase3.js'), 'utf8');
function mount(initial, failWrites = true) {
  const elements = new Map();
  const make = id => ({
    id, value: '', textContent: '', children: [], listeners: {},
    append(...items) { this.children.push(...items); },
    replaceChildren() { this.children = []; },
    addEventListener(type, handler) { this.listeners[type] = handler; }
  });
  const get = id => {
    if (!elements.has(id)) elements.set(id, make(id));
    return elements.get(id);
  };
  let raw = JSON.stringify(S.pack(initial, null, 'flux-natural', '', T, L));
  let fail = failWrites;
  const context = {
    window: { PromptStudioTemplate: T, PromptStudioLegacy: L, PromptStudioV2State: S },
    document: { getElementById: get, createElement: () => make('new') },
    localStorage: {
      getItem: () => raw,
      setItem: (_key, value) => {
        if (fail) throw Error('QuotaExceeded');
        raw = value;
      }
    },
    navigator: { clipboard: { writeText: async () => {} } },
    confirm: () => true,
    prompt: () => null
  };
  vm.runInNewContext(source, context, { filename: 'v2-phase3.js' });
  return { get, stored: () => raw, recover: () => { fail = false; } };
}
{
  const app = mount(T.fromText('original'));
  app.get('source').value = 'draft';
  app.get('source').listeners.input();
  assert.equal(app.get('source').value, 'draft');
  assert.equal(app.get('preview').textContent, 'original');
  assert.match(app.get('status').textContent, /未保存/);
  app.get('save').onclick();
  assert.match(app.get('status').textContent, /未確定/);
  app.recover();
  app.get('sync').onclick();
  assert.equal(app.get('preview').textContent, 'draft');
  assert.equal(S.unpack(JSON.parse(app.stored()), T, L).template.segments[0].value, 'draft');
}
{
  let template = T.addVariable(T.fromText('cat runs'), 'animal', 'animal', ['cat', 'dog']);
  template = T.replaceRange(template, 0, 3, 'animal');
  const app = mount(template);
  const select = app.get('parts').children[0].children[0].children[0];
  select.value = '1';
  select.onchange();
  assert.equal(String(select.value), '0');
  assert.equal(app.get('preview').textContent, 'cat runs');
  app.get('profile').value = 'sdxl-tags';
  app.get('profile').onchange();
  assert.equal(app.get('profile').value, 'flux-natural');
  app.get('source').value = 'replacement';
  app.get('sync').onclick();
  assert.equal(app.get('preview').textContent, 'cat runs');
  assert.match(app.get('status').textContent, /QuotaExceeded/);
}

{
  const app = mount(T.fromText('positive'));
  app.get('negative').value = 'blurry';
  app.get('negative').oninput();
  assert.match(app.get('status').textContent, /未保存/);
  app.get('profile').value = 'sdxl-tags';
  app.get('profile').onchange();
  assert.equal(app.get('profile').value, 'flux-natural');
  app.get('export').onclick();
  assert.match(app.get('status').textContent, /未保存/);
  app.get('save').onclick();
  assert.notEqual(app.get('status').textContent, '保存したよ');
  app.recover();
  app.get('save').onclick();
  assert.equal(app.get('status').textContent, '保存したよ');
  assert.equal(S.unpack(JSON.parse(app.stored()), T, L).negative, 'blurry');
}
console.log('Phase 4 storage rollback tests PASS');
