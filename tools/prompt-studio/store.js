(() => {
  'use strict';
  const E = window.PromptStudioEngine;
  const STORAGE_KEY = 'prompt-studio-working-db';
  const PREVIOUS_STORAGE_KEYS = ['prompt-studio-v2-working-db'];
  let db = loadWorkingDb();

  function parseStored(raw) {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.format === 'prompt-db' || parsed?.format === 'prompt-db-v2') return E.normalizeDb(parsed);
    } catch {}
    return null;
  }

  function loadWorkingDb() {
    const current = parseStored(localStorage.getItem(STORAGE_KEY));
    if (current) return current;
    for (const key of PREVIOUS_STORAGE_KEYS) {
      const previous = parseStored(localStorage.getItem(key));
      if (previous) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(previous));
        return previous;
      }
    }
    return E.normalizeDb(E.DEFAULT_DB);
  }

  function persist(sourceLabel) {
    db = E.normalizeDb(db);
    db.app_version = E.APP_VERSION;
    db.schema_version = 1;
    delete db.version;
    db.updated_at = E.now();
    if (sourceLabel) db.source = sourceLabel;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    window.dispatchEvent(new CustomEvent('promptstudio:dbchange'));
  }

  function makeId(prefix) {
    return `${prefix}.${Date.now().toString(36)}.${Math.random().toString(36).slice(2, 8)}`;
  }

  function merge(incoming, sourceLabel) {
    const normalized = E.normalizeDb(incoming);
    Object.entries(normalized.concepts).forEach(([category, values]) => {
      db.concepts[category] = E.mergeConceptEntries(db.concepts[category] || [], values, category);
    });

    const recipeMap = new Map(db.recipes.map((recipe) => [recipe.id || JSON.stringify(recipe), recipe]));
    normalized.recipes.forEach((recipe) => recipeMap.set(recipe.id || makeId('recipe'), recipe));
    db.recipes = [...recipeMap.values()];

    const libraryMap = new Map(db.library.map((entry) => [entry.id, entry]));
    normalized.library.forEach((entry) => libraryMap.set(entry.id || makeId('prompt'), entry));
    db.library = [...libraryMap.values()].sort((a, b) =>
      String(b.updated_at || b.created_at || '').localeCompare(String(a.updated_at || a.created_at || ''))
    );
    persist(sourceLabel);
  }

  function addLibraryEntry({ title, tags, modelName, semantic, profileId = '', positive = '', negative = '' }) {
    const outputs = Object.keys(E.PROFILE_DEFS).map((candidateId) => {
      const rendered = E.renderForProfile(candidateId, semantic);
      if (candidateId === profileId && E.clean(positive)) {
        rendered.positive = String(positive).trim();
        rendered.negative = String(negative || '').trim();
      }
      return rendered;
    });
    const entry = {
      id: makeId('prompt'), title, status: 'saved', tags, model_name: modelName,
      semantic: E.clone(semantic), outputs, created_at: E.now(), updated_at: E.now(), source: 'prompt-studio'
    };
    db.library.unshift(entry);
    persist('Prompt Studio');
    return E.clone(entry);
  }

  function deleteLibraryEntry(id) {
    db.library = db.library.filter((entry) => entry.id !== id);
    persist();
  }

  function addConcept(category, input) {
    const cleanCategory = E.clean(category).toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
    if (!cleanCategory) throw new Error('カテゴリ名が必要です');
    const entry = E.normalizeConceptEntry(input, cleanCategory);
    if (!entry) throw new Error('プロンプト用の内容が必要です');
    db.concepts[cleanCategory] = E.mergeConceptEntries(db.concepts[cleanCategory] || [], [entry], cleanCategory);
    persist();
    return E.clone(entry);
  }

  function updateConcept(category, id, patch) {
    const values = E.normalizeConceptEntries(db.concepts[category] || [], category);
    const current = values.find((entry) => entry.id === id);
    if (!current) throw new Error('パーツが見つかりません');
    const next = E.normalizeConceptEntry({ ...current, ...patch, id: current.id }, category);
    if (!next) throw new Error('プロンプト用の内容が必要です');
    db.concepts[category] = values.map((entry) => entry.id === id ? next : entry);
    persist();
    return E.clone(next);
  }

  function deleteConcept(category, id) {
    db.concepts[category] = E.normalizeConceptEntries(db.concepts[category] || [], category).filter((entry) => entry.id !== id);
    persist();
  }

  function addRecipe({ title, slots, notes = '' }) {
    const entry = {
      id: makeId('recipe'),
      type: 'slot-recipe',
      title: E.clean(title) || '名称未設定のレシピ',
      slots: E.clone(Array.isArray(slots) ? slots : []),
      notes: E.clean(notes),
      created_at: E.now(),
      updated_at: E.now(),
      source: 'prompt-studio'
    };
    db.recipes.unshift(entry);
    persist();
    return E.clone(entry);
  }

  function updateRecipe(id, patch) {
    const index = db.recipes.findIndex((recipe) => recipe.id === id);
    if (index < 0) throw new Error('レシピが見つかりません');
    db.recipes[index] = { ...db.recipes[index], ...E.clone(patch), id, updated_at: E.now() };
    persist();
    return E.clone(db.recipes[index]);
  }

  function deleteRecipe(id) {
    db.recipes = db.recipes.filter((recipe) => recipe.id !== id);
    persist();
  }

  async function importDb(file) {
    const parsed = JSON.parse(await file.text());
    if (parsed?.format !== 'prompt-db' && parsed?.format !== 'prompt-db-v2') {
      throw new Error('プロンプトDBのJSON形式ではありません');
    }
    merge(parsed, `読み込んだデータ: ${file.name}`);
  }

  function exportObject() {
    const exported = { ...E.clone(db), format: 'prompt-db', schema_version: 1, app_version: E.APP_VERSION, updated_at: E.now() };
    delete exported.version;
    return exported;
  }

  window.PromptStudioStore = Object.freeze({
    getDb: () => E.clone(db),
    persist, merge,
    addLibraryEntry, deleteLibraryEntry,
    addConcept, updateConcept, deleteConcept,
    addRecipe, updateRecipe, deleteRecipe,
    importDb, exportObject
  });
})();