(() => {
  'use strict';
  const E = window.PromptStudioEngine;
  const Store = window.PromptStudioStore;
  const $ = (id) => document.getElementById(id);
  let toastTimer = null;

  function showToast(message) {
    const el = $('toast');
    el.textContent = message; el.classList.remove('hidden'); clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), 2400);
  }

  function download(name, content, type = 'application/json') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function getSemantic() {
    const semantic = {};
    E.FIELD_IDS.forEach((id) => { semantic[id] = E.clean($(id).value); });
    return semantic;
  }

  function setSemantic(semantic = {}) {
    E.FIELD_IDS.forEach((id) => { $(id).value = E.clean(semantic[id] || ''); });
    renderCurrent();
  }

  function renderCurrent() {
    const profileId = $('profileSelect').value;
    const profile = E.PROFILE_DEFS[profileId];
    const semantic = getSemantic();
    const rendered = E.renderForProfile(profileId, semantic);
    $('positiveOutput').value = rendered.positive;
    $('negativeOutput').value = rendered.negative;
    $('negativeField').hidden = !profile.supportsNegative;
    $('negativeOutputWrap').hidden = !profile.supportsNegative;
    $('profileNote').textContent = profile.note;
    $('renderSummary').textContent = `${profile.family} · ${profile.dialect}${E.clean($('modelName').value) ? ` · ${E.clean($('modelName').value)}` : ''}`;
    $('semanticPreview').textContent = JSON.stringify({ schema:'prompt-semantic-v1', model_name:E.clean($('modelName').value), ...semantic }, null, 2);
  }

  function fillProfileSelect() {
    const select = $('profileSelect'); select.replaceChildren();
    Object.entries(E.PROFILE_DEFS).forEach(([id, profile]) => {
      const option = document.createElement('option'); option.value = id; option.textContent = profile.label; select.append(option);
    });
    select.value = 'flux-natural';
  }

  function randomizeFromDb() {
    const db = Store.getDb();
    const map = { subject:'subject', appearance:'appearance', expression:'expression', outfit:'outfit', action:'action', pose:'pose', environment:'environment', lighting:'lighting', camera:'camera', composition:'composition', style:'style', visibleText:'visibleText', constraints:'constraints' };
    Object.entries(map).forEach(([field, category]) => {
      const entry = E.weightedChoice(db.concepts?.[category] || []);
      if (entry) $(field).value = entry.value;
    });
    renderCurrent(); showToast('PromptDBのConceptから組みました');
  }

  function registerCurrent() {
    const semantic = getSemantic();
    const title = E.clean($('entryTitle').value) || E.clean(semantic.subject) || `Prompt ${new Date().toLocaleString('ja-JP')}`;
    const tags = E.unique(E.list($('entryTags').value));
    Store.addLibraryEntry({ title, tags, modelName:E.clean($('modelName').value), semantic });
    $('entryTitle').value = '';
    showToast('PromptDBの作業コピーへ登録しました');
  }

  function loadEntry(entry) {
    setSemantic(entry.semantic || {});
    $('modelName').value = E.clean(entry.model_name || '');
    $('entryTitle').value = E.clean(entry.title || '');
    $('entryTags').value = Array.isArray(entry.tags) ? entry.tags.join(', ') : '';
    setView('compose'); renderCurrent(); showToast('DBの内容をComposerへ読み込みました');
  }

  function renderLibrary() {
    const db = Store.getDb();
    const box = $('libraryList');
    const query = E.clean($('dbSearch').value).toLowerCase();
    const status = $('dbStatusFilter').value;
    const entries = db.library.filter((entry) => {
      if (status !== 'all' && entry.status !== status) return false;
      if (!query) return true;
      const haystack = [entry.title, ...(entry.tags || []), entry.semantic?.subject, entry.semantic?.environment, ...(entry.outputs || []).map((x) => x.positive)].join(' ').toLowerCase();
      return haystack.includes(query);
    });
    box.replaceChildren();
    if (!entries.length) {
      const empty = document.createElement('div'); empty.className = 'library-empty';
      empty.textContent = db.library.length ? '条件に一致するPromptはありません。' : 'まだPromptDBに登録されていません。Composeで良いPromptができたら「DBに登録」で追加できます。';
      box.append(empty); return;
    }
    entries.forEach((entry) => {
      const currentOutput = (entry.outputs || []).find((x) => x.profile_id === $('profileSelect').value) || entry.outputs?.[0];
      const article = document.createElement('article'); article.className = 'library-entry';
      const info = document.createElement('div');
      const title = document.createElement('h3'); title.textContent = entry.title;
      const meta = document.createElement('div'); meta.className = 'library-entry-meta'; meta.textContent = `${entry.status || 'saved'} · ${entry.created_at ? new Date(entry.created_at).toLocaleString('ja-JP') : ''}`;
      const tags = document.createElement('div'); tags.className = 'library-entry-tags'; tags.textContent = (entry.tags || []).join(' · ');
      info.append(title, meta, tags);
      const prompt = document.createElement('div'); prompt.className = 'library-entry-prompt'; prompt.textContent = currentOutput?.positive || entry.semantic?.subject || '';
      const actions = document.createElement('div'); actions.className = 'library-entry-actions';
      const edit = document.createElement('button'); edit.textContent = 'Edit'; edit.addEventListener('click', () => loadEntry(entry));
      const copy = document.createElement('button'); copy.textContent = 'Copy'; copy.addEventListener('click', async () => { await navigator.clipboard.writeText(currentOutput?.positive || ''); showToast('コピーしました'); });
      const del = document.createElement('button'); del.textContent = 'Delete'; del.className = 'danger-button'; del.addEventListener('click', () => { Store.deleteLibraryEntry(entry.id); showToast('Libraryから削除しました'); });
      actions.append(edit, copy, del); article.append(info, prompt, actions); box.append(article);
    });
  }

  function updateDbUi() {
    const db = Store.getDb();
    $('dbStatus').textContent = `${db.source || 'Working DB'} · updated ${new Date(db.updated_at || Date.now()).toLocaleString('ja-JP')}`;
    $('libraryCount').textContent = String(db.library.length);
    $('conceptCount').textContent = String(Object.keys(db.concepts || {}).filter((key) => E.normalizeConceptValues(db.concepts[key]).length).length);
    $('recipeCount').textContent = String(db.recipes.length);
    renderLibrary();
  }

  function setView(name) {
    document.querySelectorAll('.studio-tab').forEach((button) => {
      const active = button.dataset.view === name; button.classList.toggle('active', active); button.setAttribute('aria-selected', String(active));
    });
    const compose = name === 'compose';
    $('composeView').classList.toggle('active', compose); $('composeView').hidden = !compose;
    $('databaseView').classList.toggle('active', !compose); $('databaseView').hidden = compose;
    if (!compose) renderLibrary();
  }

  async function copyCurrent() {
    const profile = E.PROFILE_DEFS[$('profileSelect').value];
    const positive = $('positiveOutput').value, negative = $('negativeOutput').value;
    await navigator.clipboard.writeText(profile.supportsNegative && negative ? `${positive}\n\nNegative: ${negative}` : positive);
    showToast('Promptをコピーしました');
  }

  function loadExample() {
    setSemantic({
      subject:'a young woman', appearance:'gentle, intelligent appearance', expression:'calm expression', outfit:'white shirt and dark skirt',
      action:'reading a book', pose:'standing naturally', environment:'quiet library at night', lighting:'soft warm window light',
      camera:'50mm eye-level medium shot', composition:'foreground bookshelves framing the subject', style:'quiet editorial photography', visibleText:'',
      constraints:'natural hands and fingers, consistent character identity', negative:'blurry, distorted anatomy, extra fingers, unreadable text'
    });
    $('entryTitle').value = '夜の図書館で読書'; $('entryTags').value = 'library, reading, portrait'; renderCurrent();
  }

  function clearComposer() {
    E.FIELD_IDS.forEach((id) => { $(id).value = ''; });
    $('modelName').value = ''; $('entryTitle').value = ''; $('entryTags').value = ''; renderCurrent();
  }

  fillProfileSelect();
  document.querySelectorAll('.studio-tab').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
  E.FIELD_IDS.forEach((id) => $(id).addEventListener('input', renderCurrent));
  $('profileSelect').addEventListener('change', () => { renderCurrent(); renderLibrary(); });
  $('modelName').addEventListener('input', renderCurrent);
  $('randomizeButton').addEventListener('click', randomizeFromDb);
  $('clearButton').addEventListener('click', clearComposer);
  $('loadExampleButton').addEventListener('click', loadExample);
  $('copyButton').addEventListener('click', copyCurrent);
  $('registerButton').addEventListener('click', registerCurrent);
  $('dbSearch').addEventListener('input', renderLibrary);
  $('dbStatusFilter').addEventListener('change', renderLibrary);
  $('newFromDbButton').addEventListener('click', () => setView('compose'));
  $('exportDbButton').addEventListener('click', () => { download('prompt-db-v2.json', JSON.stringify(Store.exportObject(), null, 2)); showToast('PromptDB v2を書き出しました'); });
  $('importDbButton').addEventListener('click', () => $('dbFileInput').click());
  $('dbFileInput').addEventListener('change', async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    try { await Store.importV2(file); showToast('PromptDB v2をマージしました'); } catch (error) { showToast(error.message || String(error)); }
    event.target.value = '';
  });
  $('importLegacyButton').addEventListener('click', () => $('legacyFolderInput').click());
  $('legacyFolderInput').addEventListener('change', async (event) => {
    try { const result = await Store.importLegacy(event.target.files); showToast(`旧PromptDBを取込: ${result.categories} categories / ${result.recipes} recipes`); }
    catch (error) { showToast(error.message || String(error)); }
    event.target.value = '';
  });
  document.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); copyCurrent(); } });
  window.addEventListener('promptstudio:dbchange', updateDbUi);

  window.PromptStudio = Object.freeze({
    version: E.APP_VERSION, getDb: Store.getDb, getSemantic, renderForProfile: E.renderForProfile, importLegacyPromptDb: Store.importLegacy
  });

  updateDbUi(); loadExample();
})();
