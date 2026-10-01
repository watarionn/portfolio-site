(() => {
  'use strict';
  const E = window.PromptStudioEngine;
  const STORAGE_KEY = 'prompt-studio-v2-working-db';
  let db = loadWorkingDb();

  function loadWorkingDb() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return E.normalizeDb(E.DEFAULT_DB);
      const parsed = JSON.parse(raw);
      return parsed?.format === 'prompt-db-v2' ? E.normalizeDb(parsed) : E.normalizeDb(E.DEFAULT_DB);
    } catch {
      return E.normalizeDb(E.DEFAULT_DB);
    }
  }

  function persist(sourceLabel) {
    db = E.normalizeDb(db);
    db.app_version = E.APP_VERSION;
    db.version = '2.1.0';
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

  function addLibraryEntry({ title, tags, modelName, semantic }) {
    const outputs = Object.keys(E.PROFILE_DEFS).map((profileId) => E.renderForProfile(profileId, semantic));
    const entry = {
      id: makeId('prompt'), title, status: 'saved', tags, model_name: modelName,
      semantic: E.clone(semantic), outputs, created_at: E.now(), updated_at: E.now(), source: 'prompt-studio'
    };
    db.library.unshift(entry);
    persist(db.source || 'Prompt Studio working DB');
    return E.clone(entry);
  }

  function deleteLibraryEntry(id) {
    db.library = db.library.filter((entry) => entry.id !== id);
    persist();
  }

  function addConcept(category, input) {
    const cleanCategory = E.clean(category).toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
    if (!cleanCategory) throw new Error('Category名が必要です');
    const entry = E.normalizeConceptEntry(input, cleanCategory);
    if (!entry) throw new Error('Concept valueが必要です');
    db.concepts[cleanCategory] = E.mergeConceptEntries(db.concepts[cleanCategory] || [], [entry], cleanCategory);
    persist();
    return E.clone(entry);
  }

  function updateConcept(category, id, patch) {
    const values = E.normalizeConceptEntries(db.concepts[category] || [], category);
    const current = values.find((entry) => entry.id === id);
    if (!current) throw new Error('Conceptが見つかりません');
    const next = E.normalizeConceptEntry({ ...current, ...patch, id: current.id }, category);
    if (!next) throw new Error('Concept valueが必要です');
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
      title: E.clean(title) || 'Untitled recipe',
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
    if (index < 0) throw new Error('Recipeが見つかりません');
    db.recipes[index] = { ...db.recipes[index], ...E.clone(patch), id, updated_at: E.now() };
    persist();
    return E.clone(db.recipes[index]);
  }

  function deleteRecipe(id) {
    db.recipes = db.recipes.filter((recipe) => recipe.id !== id);
    persist();
  }

  function usableLines(text) {
    return String(text).split(/\r?\n/).map(E.clean).filter((line) => line && !line.startsWith('#'));
  }

  async function importLegacy(files) {
    const listFiles = [...files];
    const configFile = listFiles.find((file) => /(^|\/)config\.json$/i.test(file.webkitRelativePath || file.name));
    if (!configFile) throw new Error('旧PromptDBのconfig.jsonが見つかりません');
    const config = JSON.parse(await configFile.text());
    const importedConcepts = {};
    const sentenceFiles = {};

    for (const file of listFiles) {
      const path = (file.webkitRelativePath || file.name).replaceAll('\\','/');
      const wordMatch = path.match(/(?:^|\/)words\/([^/]+)\.txt$/i);
      const sentenceMatch = path.match(/(?:^|\/)sentences\/([^/]+\.txt)$/i);
      if (wordMatch) importedConcepts[wordMatch[1].toLowerCase().replaceAll('-','_')] = usableLines(await file.text());
      if (sentenceMatch) sentenceFiles[sentenceMatch[1]] = usableLines(await file.text());
    }

    Object.entries(importedConcepts).forEach(([category, values]) => {
      db.concepts[category] = E.mergeConceptEntries(db.concepts[category] || [], values, category);
    });

    Object.entries(config.groups || {}).forEach(([groupName, group]) => {
      const refs = (group.sentence_files || []).map((item) => typeof item === 'string' ? item : item.file).filter(Boolean);
      refs.forEach((fileName) => (sentenceFiles[fileName] || []).forEach((template, index) => {
        db.recipes.push({
          id: `legacy.${groupName}.${fileName.replace(/\W+/g,'_')}.${index + 1}`,
          type: 'legacy-template', group: groupName, title: `${groupName} / ${fileName} #${index + 1}`,
          template, sentence_file: fileName, source: 'prompt-db-v1'
        });
      }));
    });

    db.recipes = [...new Map(db.recipes.map((recipe) => [recipe.id || JSON.stringify(recipe), recipe])).values()];
    persist(`Imported legacy PromptDB: ${configFile.webkitRelativePath.split('/')[0] || 'folder'}`);
    return { categories: Object.keys(importedConcepts).length, recipes: db.recipes.length };
  }

  async function importV2(file) {
    const parsed = JSON.parse(await file.text());
    if (parsed?.format !== 'prompt-db-v2') throw new Error('PromptDB v2形式ではありません');
    merge(parsed, `Imported PromptDB v2: ${file.name}`);
  }

  function exportObject() {
    return { ...E.clone(db), app_version: E.APP_VERSION, version: '2.1.0', updated_at: E.now() };
  }

  window.PromptStudioStore = Object.freeze({
    getDb: () => E.clone(db),
    persist, merge,
    addLibraryEntry, deleteLibraryEntry,
    addConcept, updateConcept, deleteConcept,
    addRecipe, updateRecipe, deleteRecipe,
    importLegacy, importV2, exportObject
  });
})();