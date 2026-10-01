(() => {
  'use strict';

  const E = window.PromptStudioEngine;
  const Store = window.PromptStudioStore;
  const $ = (id) => document.getElementById(id);
  const SESSION_KEY = 'prompt-studio-v1-slot-session';

  const DEFAULT_SLOTS = [
    { target:'subject', category:'subject', mode:'random' },
    { target:'outfit', category:'outfit', mode:'random' },
    { target:'action', category:'action', mode:'sequential' },
    { target:'pose', category:'pose', mode:'random' },
    { target:'environment', category:'environment', mode:'random' },
    { target:'lighting', category:'lighting', mode:'random' },
    { target:'camera', category:'camera', mode:'random' },
    { target:'style', category:'style', mode:'random' }
  ];

  let dragId = null;
  let slots = loadSession();

  function makeId() {
    return `slot.${Date.now().toString(36)}.${Math.random().toString(36).slice(2,7)}`;
  }

  function normalizeSlot(slot = {}) {
    return {
      id: E.clean(slot.id) || makeId(),
      enabled: slot.enabled !== false,
      target: E.FIELD_IDS.includes(slot.target) ? slot.target : 'subject',
      category: E.clean(slot.category) || 'subject',
      mode: ['manual','random','sequential'].includes(slot.mode) ? slot.mode : 'random',
      value: E.clean(slot.value),
      cursor: Number.isInteger(slot.cursor) && slot.cursor >= 0 ? slot.cursor : 0,
      last: E.clean(slot.last)
    };
  }

  function loadSession() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if (Array.isArray(parsed) && parsed.length) return parsed.map(normalizeSlot);
    } catch {}
    return DEFAULT_SLOTS.map((slot) => normalizeSlot(slot));
  }

  function persistSession() {
    localStorage.setItem(SESSION_KEY, JSON.stringify(slots));
  }

  function conceptCategories() {
    return Object.keys(Store.getDb().concepts || {}).sort((a,b) => a.localeCompare(b));
  }

  function moveSlot(id, delta) {
    const index = slots.findIndex((slot) => slot.id === id);
    const next = index + delta;
    if (index < 0 || next < 0 || next >= slots.length) return;
    [slots[index], slots[next]] = [slots[next], slots[index]];
    persistSession();
    renderSlots();
  }

  function setSlot(id, patch) {
    const index = slots.findIndex((slot) => slot.id === id);
    if (index < 0) return;
    slots[index] = normalizeSlot({ ...slots[index], ...patch, id });
    persistSession();
    renderSlots();
  }

  function removeSlot(id) {
    slots = slots.filter((slot) => slot.id !== id);
    persistSession();
    renderSlots();
  }

  function addSlot() {
    const db = Store.getDb();
    const firstCategory = Object.keys(db.concepts || {})[0] || 'subject';
    slots.push(normalizeSlot({ target:firstCategory in Object.fromEntries(E.FIELD_IDS.map((id)=>[id,true])) ? firstCategory : 'subject', category:firstCategory, mode:'random' }));
    persistSession();
    renderSlots();
  }

  function createOption(value, label, selected) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    option.selected = value === selected;
    return option;
  }

  function renderSlots() {
    const box = $('slotList');
    if (!box) return;
    const categories = conceptCategories();
    box.replaceChildren();

    if (!slots.length) {
      const empty = document.createElement('p');
      empty.className = 'slot-empty';
      empty.textContent = 'スロットがありません。「Slotを追加」で作成できます。';
      box.append(empty);
      return;
    }

    slots.forEach((slot, index) => {
      const row = document.createElement('div');
      row.className = 'slot-row';
      row.draggable = true;
      row.dataset.slotId = slot.id;

      const drag = document.createElement('span');
      drag.className = 'slot-drag';
      drag.textContent = '⋮⋮';
      drag.title = 'ドラッグして並べ替え';
      drag.setAttribute('aria-hidden','true');

      const enabled = document.createElement('input');
      enabled.type = 'checkbox';
      enabled.checked = slot.enabled;
      enabled.title = 'このスロットを使用';
      enabled.addEventListener('change', () => setSlot(slot.id, { enabled:enabled.checked }));

      const target = document.createElement('select');
      target.className = 'slot-target';
      E.FIELD_IDS.filter((id) => id !== 'negative').forEach((id) => target.append(createOption(id, id, slot.target)));
      target.addEventListener('change', () => setSlot(slot.id, { target:target.value }));

      const category = document.createElement('select');
      category.className = 'slot-category';
      categories.forEach((name) => category.append(createOption(name, name, slot.category)));
      if (!categories.includes(slot.category)) category.append(createOption(slot.category, slot.category, slot.category));
      category.addEventListener('change', () => setSlot(slot.id, { category:category.value, cursor:0, last:'' }));

      const mode = document.createElement('select');
      mode.className = 'slot-mode';
      [
        ['manual','manual'],
        ['random','weighted random'],
        ['sequential','sequential']
      ].forEach(([value,label]) => mode.append(createOption(value,label,slot.mode)));
      mode.addEventListener('change', () => setSlot(slot.id, { mode:mode.value, cursor:0, last:'' }));

      const value = document.createElement('input');
      value.className = 'slot-value';
      value.type = 'text';
      value.value = slot.mode === 'manual' ? slot.value : slot.last;
      value.placeholder = slot.mode === 'manual' ? 'manual value' : 'resolved value';
      value.readOnly = slot.mode !== 'manual';
      value.addEventListener('input', () => {
        const current = slots.find((item) => item.id === slot.id);
        if (current) {
          current.value = E.clean(value.value);
          persistSession();
        }
      });

      const controls = document.createElement('div');
      controls.className = 'slot-controls';
      const up = document.createElement('button');
      up.type = 'button'; up.textContent = '↑'; up.title = '上へ'; up.disabled = index === 0;
      up.addEventListener('click', () => moveSlot(slot.id,-1));
      const down = document.createElement('button');
      down.type = 'button'; down.textContent = '↓'; down.title = '下へ'; down.disabled = index === slots.length - 1;
      down.addEventListener('click', () => moveSlot(slot.id,1));
      const del = document.createElement('button');
      del.type = 'button'; del.textContent = '×'; del.title = '削除'; del.className = 'danger-button';
      del.addEventListener('click', () => removeSlot(slot.id));
      controls.append(up,down,del);

      row.addEventListener('dragstart', () => { dragId = slot.id; row.classList.add('dragging'); });
      row.addEventListener('dragend', () => { dragId = null; row.classList.remove('dragging'); });
      row.addEventListener('dragover', (event) => event.preventDefault());
      row.addEventListener('drop', (event) => {
        event.preventDefault();
        const from = slots.findIndex((item) => item.id === dragId);
        const to = slots.findIndex((item) => item.id === slot.id);
        if (from < 0 || to < 0 || from === to) return;
        const [moved] = slots.splice(from,1);
        slots.splice(to,0,moved);
        persistSession();
        renderSlots();
      });

      row.append(drag,enabled,target,category,mode,value,controls);
      box.append(row);
    });
  }

  function resolveSlot(slot, db) {
    if (!slot.enabled) return '';
    if (slot.mode === 'manual') return E.clean(slot.value);

    const entries = E.normalizeConceptEntries(db.concepts?.[slot.category], slot.category);
    if (!entries.length) return '';

    if (slot.mode === 'sequential') {
      const entry = entries[slot.cursor % entries.length];
      slot.cursor = (slot.cursor + 1) % entries.length;
      return entry.value;
    }

    return E.weightedChoice(entries)?.value || '';
  }

  function resolveSlots() {
    const db = Store.getDb();
    let changed = 0;
    slots.forEach((slot) => {
      const value = resolveSlot(slot, db);
      if (!value) return;
      slot.last = value;
      const field = $(slot.target);
      if (field) {
        field.value = value;
        field.dispatchEvent(new Event('input',{bubbles:true}));
        changed += 1;
      }
    });
    persistSession();
    renderSlots();
    if ($('slotResultNote')) $('slotResultNote').textContent = changed ? `${changed} slots resolved` : '解決できるSlotがありません';
    return changed;
  }

  function saveRecipe() {
    const title = E.clean($('recipeTitle')?.value) || `Recipe ${new Date().toLocaleString('ja-JP')}`;
    const recipe = Store.addRecipe({
      title,
      slots: slots.map((slot) => ({ ...slot, cursor:0, last:'' }))
    });
    if ($('recipeTitle')) $('recipeTitle').value = '';
    return recipe;
  }

  function loadRecipe(recipe) {
    if (!Array.isArray(recipe?.slots)) return false;
    slots = recipe.slots.map((slot) => normalizeSlot({ ...slot, id:makeId(), cursor:0, last:'' }));
    persistSession();
    renderSlots();
    if ($('recipeTitle')) $('recipeTitle').value = recipe.title || '';
    document.querySelector('.studio-tab[data-view="compose"]')?.click();
    document.querySelector('.slot-composer')?.scrollIntoView({block:'start',behavior:'smooth'});
    return true;
  }

  function getSlots() {
    return E.clone(slots);
  }

  $('addSlotButton')?.addEventListener('click', addSlot);
  $('resolveSlotsButton')?.addEventListener('click', resolveSlots);
  $('saveRecipeButton')?.addEventListener('click', () => {
    const recipe = saveRecipe();
    $('slotResultNote').textContent = `Recipe saved: ${recipe.title}`;
  });
  window.addEventListener('promptstudio:dbchange', renderSlots);

  renderSlots();

  window.PromptStudioSlots = Object.freeze({
    getSlots, resolveSlots, loadRecipe
  });
})();