(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = 'prompt-studio-v2-working-db';
  const APP_VERSION = '0.1.0';
  let toastTimer = null;

  const FIELD_IDS = [
    'subject','appearance','expression','outfit','action','pose','environment',
    'lighting','camera','composition','style','visibleText','constraints','negative'
  ];

  const PROFILE_DEFS = {
    'flux-natural': {
      label: 'FLUX · natural language',
      family: 'FLUX',
      dialect: 'natural-language',
      supportsNegative: false,
      note: '自然言語で被写体・行動・環境・光・カメラを明示。Negative欄は使わず、欲しい状態を肯定形で書く。'
    },
    'gpt-image-instruction': {
      label: 'GPT Image · instruction',
      family: 'GPT Image',
      dialect: 'instruction',
      supportsNegative: false,
      note: '作ってほしい画像を明示する指示文。制約は「何を保持するか」「何を避けたいか」を肯定的に書く。'
    },
    'sdxl-natural': {
      label: 'SDXL · natural language',
      family: 'SDXL',
      dialect: 'natural-language',
      supportsNegative: true,
      note: '自然言語寄りのSDXL向け。Checkpointの学習傾向によってはtag dialectへ切り替える。'
    },
    'sdxl-tags': {
      label: 'SDXL · tag / booru style',
      family: 'SDXL',
      dialect: 'tags',
      supportsNegative: true,
      note: 'カンマ区切りのタグ表現。アニメ系・タグ学習系Checkpoint向けの出力形式。'
    },
    'generic-tags': {
      label: 'Generic · compact tags',
      family: 'Generic',
      dialect: 'tags',
      supportsNegative: true,
      note: 'モデルを限定しないコンパクトなタグ列。未知のCheckpointを試すための中立プロファイル。'
    }
  };

  const DEFAULT_DB = {
    format: 'prompt-db-v2',
    version: '2.0.0',
    app_version: APP_VERSION,
    updated_at: new Date().toISOString(),
    source: 'Built-in working DB',
    concepts: {
      subject: ['a young woman','a lone traveler','a small reading room','a vintage camera'],
      appearance: ['gentle, intelligent appearance','soft natural features','refined editorial look'],
      expression: ['calm expression','subtle smile','focused expression','curious expression'],
      outfit: ['white shirt and dark skirt','layered casual outfit','minimal monochrome outfit','classic coat'],
      action: ['reading a book','turning a page','adjusting glasses','holding a notebook','reaching for a shelf'],
      pose: ['standing naturally','sitting at a desk','walking forward','looking over one shoulder','leaning against a wall'],
      environment: ['quiet library','sunlit cafe','small design studio','night city street','bookstore aisle'],
      lighting: ['soft window light','warm tungsten light','overcast daylight','neon rim light','late afternoon backlight'],
      camera: ['35mm medium shot','50mm eye-level portrait','wide environmental shot','close-up portrait','three-quarter view'],
      composition: ['centered composition','rule-of-thirds composition','foreground framing','strong leading lines'],
      style: ['quiet editorial photography','cinematic and restrained','cozy and intimate','clean illustration'],
      visibleText: [],
      constraints: ['natural hands and fingers','consistent character identity','clean readable silhouette']
    },
    recipes: [],
    library: []
  };

  let db = loadWorkingDb();

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function clean(value) { return String(value || '').replace(/\s+/g, ' ').trim(); }
  function list(value) { return clean(value).split(',').map(clean).filter(Boolean); }
  function unique(values) { return [...new Set(values.filter(Boolean))]; }
  function now() { return new Date().toISOString(); }

  function loadWorkingDb() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return clone(DEFAULT_DB);
      const parsed = JSON.parse(raw);
      if (parsed?.format !== 'prompt-db-v2') return clone(DEFAULT_DB);
      return normalizeDb(parsed);
    } catch {
      return clone(DEFAULT_DB);
    }
  }

  function normalizeDb(input) {
    const normalized = {
      ...clone(DEFAULT_DB),
      ...input,
      concepts: { ...clone(DEFAULT_DB.concepts), ...(input.concepts || {}) },
      recipes: Array.isArray(input.recipes) ? input.recipes : [],
      library: Array.isArray(input.library) ? input.library : []
    };
    Object.keys(normalized.concepts).forEach((key) => {
      normalized.concepts[key] = normalizeConceptValues(normalized.concepts[key]);
    });
    return normalized;
  }

  function normalizeConceptValues(values) {
    if (!Array.isArray(values)) return [];
    return unique(values.map((item) => typeof item === 'string' ? clean(item) : clean(item?.value || item?.label_en || item?.label_ja)));
  }

  function persistDb(sourceLabel) {
    db.updated_at = now();
    if (sourceLabel) db.source = sourceLabel;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    updateDbUi();
  }

  function showToast(message) {
    const el = $('toast');
    el.textContent = message;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), 2400);
  }

  function download(name, content, type = 'application/json') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function getSemantic() {
    const semantic = {};
    FIELD_IDS.forEach((id) => { semantic[id] = clean($(id).value); });
    return semantic;
  }

  function setSemantic(semantic = {}) {
    FIELD_IDS.forEach((id) => { $(id).value = clean(semantic[id] || ''); });
    renderCurrent();
  }

  function positiveConstraints(text) {
    if (!text) return '';
    return text
      .replace(/\b(no|without|avoid)\s+/gi, '')
      .replace(/\bdo not\s+/gi, '')
      .trim();
  }

  function renderNatural(semantic, instruction = false) {
    const subjectParts = unique([semantic.subject, semantic.appearance, semantic.expression, semantic.outfit]);
    const actionParts = unique([semantic.action, semantic.pose]);
    const sceneParts = unique([semantic.environment, semantic.lighting]);
    const framingParts = unique([semantic.camera, semantic.composition]);
    const styleParts = unique([semantic.style]);
    const constraintParts = unique([positiveConstraints(semantic.constraints)]);

    const sentences = [];
    if (instruction) {
      if (subjectParts.length) sentences.push(`Create an image featuring ${subjectParts.join(', ')}.`);
      if (actionParts.length) sentences.push(`Show the subject ${actionParts.join(', ')}.`);
      if (sceneParts.length) sentences.push(`Set the scene in ${sceneParts.join(', ')}.`);
      if (framingParts.length) sentences.push(`Use ${framingParts.join(', ')}.`);
      if (styleParts.length) sentences.push(`Use ${styleParts.join(', ')}.`);
      if (semantic.visibleText) sentences.push(`Include the visible text exactly as: "${semantic.visibleText}".`);
      if (constraintParts.length) sentences.push(`Keep ${constraintParts.join(', ')}.`);
    } else {
      const lead = subjectParts.join(', ');
      if (lead) sentences.push(`${lead}.`);
      if (actionParts.length) sentences.push(`${actionParts.join(', ')}.`);
      if (sceneParts.length) sentences.push(`${sceneParts.join(', ')}.`);
      if (framingParts.length) sentences.push(`${framingParts.join(', ')}.`);
      if (styleParts.length) sentences.push(`${styleParts.join(', ')}.`);
      if (semantic.visibleText) sentences.push(`Visible text: "${semantic.visibleText}".`);
      if (constraintParts.length) sentences.push(`${constraintParts.join(', ')}.`);
    }
    return sentences.join(' ').replace(/\s+([.,])/g, '$1').trim();
  }

  function renderTags(semantic) {
    const ordered = [
      semantic.subject, semantic.appearance, semantic.expression, semantic.outfit,
      semantic.action, semantic.pose, semantic.environment, semantic.lighting,
      semantic.camera, semantic.composition, semantic.style,
      semantic.visibleText ? `text: ${semantic.visibleText}` : '', semantic.constraints
    ];
    const tags = [];
    ordered.forEach((segment) => list(segment).forEach((tag) => tags.push(tag)));
    return unique(tags).join(', ');
  }

  function renderForProfile(profileId, semantic) {
    const profile = PROFILE_DEFS[profileId] || PROFILE_DEFS['flux-natural'];
    let positive = '';
    if (profileId === 'gpt-image-instruction') positive = renderNatural(semantic, true);
    else if (profile.dialect === 'tags') positive = renderTags(semantic);
    else positive = renderNatural(semantic, false);

    let negative = '';
    if (profile.supportsNegative) negative = clean(semantic.negative);
    return { profile_id: profileId, family: profile.family, dialect: profile.dialect, positive, negative };
  }

  function renderCurrent() {
    const profileId = $('profileSelect').value;
    const profile = PROFILE_DEFS[profileId];
    const semantic = getSemantic();
    const rendered = renderForProfile(profileId, semantic);
    $('positiveOutput').value = rendered.positive;
    $('negativeOutput').value = rendered.negative;
    $('negativeField').hidden = !profile.supportsNegative;
    $('negativeOutputWrap').hidden = !profile.supportsNegative;
    $('profileNote').textContent = profile.note;
    $('renderSummary').textContent = `${profile.family} · ${profile.dialect}${clean($('modelName').value) ? ` · ${clean($('modelName').value)}` : ''}`;
    $('semanticPreview').textContent = JSON.stringify({
      schema: 'prompt-semantic-v1',
      model_name: clean($('modelName').value),
      ...semantic
    }, null, 2);
  }

  function fillProfileSelect() {
    const select = $('profileSelect');
    select.replaceChildren();
    Object.entries(PROFILE_DEFS).forEach(([id, profile]) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = profile.label;
      select.append(option);
    });
    select.value = 'flux-natural';
  }

  function randomChoice(values) {
    if (!values?.length) return '';
    return values[Math.floor(Math.random() * values.length)];
  }

  function randomizeFromDb() {
    const map = {
      subject:'subject', appearance:'appearance', expression:'expression', outfit:'outfit',
      action:'action', pose:'pose', environment:'environment', lighting:'lighting',
      camera:'camera', composition:'composition', style:'style', visibleText:'visibleText', constraints:'constraints'
    };
    Object.entries(map).forEach(([field, category]) => {
      const values = normalizeConceptValues(db.concepts?.[category]);
      const value = randomChoice(values);
      if (value) $(field).value = value;
    });
    renderCurrent();
    showToast('PromptDBのConceptから組みました');
  }

  function makeId(prefix) {
    const stamp = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 8);
    return `${prefix}.${stamp}.${rand}`;
  }

  function registerCurrent() {
    const semantic = getSemantic();
    const title = clean($('entryTitle').value) || clean(semantic.subject) || `Prompt ${new Date().toLocaleString('ja-JP')}`;
    const tags = unique(list($('entryTags').value));
    const outputs = Object.keys(PROFILE_DEFS).map((profileId) => renderForProfile(profileId, semantic));
    const entry = {
      id: makeId('prompt'),
      title,
      status: 'saved',
      tags,
      model_name: clean($('modelName').value),
      semantic,
      outputs,
      created_at: now(),
      updated_at: now(),
      source: 'prompt-studio'
    };
    db.library.unshift(entry);
    persistDb(db.source || 'Prompt Studio working DB');
    $('entryTitle').value = '';
    showToast('PromptDBの作業コピーへ登録しました');
  }

  function loadEntry(entry) {
    setSemantic(entry.semantic || {});
    $('modelName').value = clean(entry.model_name || '');
    $('entryTitle').value = clean(entry.title || '');
    $('entryTags').value = Array.isArray(entry.tags) ? entry.tags.join(', ') : '';
    setView('compose');
    renderCurrent();
    showToast('DBの内容をComposerへ読み込みました');
  }

  function deleteEntry(id) {
    db.library = db.library.filter((entry) => entry.id !== id);
    persistDb();
    renderLibrary();
    showToast('Libraryから削除しました');
  }

  function renderLibrary() {
    const box = $('libraryList');
    const query = clean($('dbSearch').value).toLowerCase();
    const status = $('dbStatusFilter').value;
    const entries = db.library.filter((entry) => {
      if (status !== 'all' && entry.status !== status) return false;
      if (!query) return true;
      const haystack = [entry.title, ...(entry.tags || []), entry.semantic?.subject, entry.semantic?.environment, ...(entry.outputs || []).map((x) => x.positive)].join(' ').toLowerCase();
      return haystack.includes(query);
    });

    box.replaceChildren();
    if (!entries.length) {
      const empty = document.createElement('div');
      empty.className = 'library-empty';
      empty.textContent = db.library.length ? '条件に一致するPromptはありません。' : 'まだPromptDBに登録されていません。Composeで良いPromptができたら「DBに登録」で追加できます。';
      box.append(empty);
      return;
    }

    entries.forEach((entry) => {
      const currentOutput = (entry.outputs || []).find((x) => x.profile_id === $('profileSelect').value) || entry.outputs?.[0];
      const article = document.createElement('article');
      article.className = 'library-entry';

      const info = document.createElement('div');
      const title = document.createElement('h3');
      title.textContent = entry.title;
      const meta = document.createElement('div');
      meta.className = 'library-entry-meta';
      meta.textContent = `${entry.status || 'saved'} · ${entry.created_at ? new Date(entry.created_at).toLocaleString('ja-JP') : ''}`;
      const tags = document.createElement('div');
      tags.className = 'library-entry-tags';
      tags.textContent = (entry.tags || []).join(' · ');
      info.append(title, meta, tags);

      const prompt = document.createElement('div');
      prompt.className = 'library-entry-prompt';
      prompt.textContent = currentOutput?.positive || entry.semantic?.subject || '';

      const actions = document.createElement('div');
      actions.className = 'library-entry-actions';
      const load = document.createElement('button'); load.textContent = 'Edit'; load.addEventListener('click', () => loadEntry(entry));
      const copy = document.createElement('button'); copy.textContent = 'Copy'; copy.addEventListener('click', async () => { await navigator.clipboard.writeText(currentOutput?.positive || ''); showToast('コピーしました'); });
      const del = document.createElement('button'); del.textContent = 'Delete'; del.className = 'danger-button'; del.addEventListener('click', () => deleteEntry(entry.id));
      actions.append(load, copy, del);

      article.append(info, prompt, actions);
      box.append(article);
    });
  }

  function updateDbUi() {
    $('dbStatus').textContent = `${db.source || 'Working DB'} · updated ${new Date(db.updated_at || Date.now()).toLocaleString('ja-JP')}`;
    $('libraryCount').textContent = String(db.library.length);
    $('conceptCount').textContent = String(Object.keys(db.concepts || {}).filter((key) => normalizeConceptValues(db.concepts[key]).length).length);
    $('recipeCount').textContent = String(db.recipes.length);
    renderLibrary();
  }

  function mergeDb(incoming, sourceLabel) {
    const normalized = normalizeDb(incoming);
    Object.entries(normalized.concepts).forEach(([category, values]) => {
      db.concepts[category] = unique([...(db.concepts[category] || []), ...normalizeConceptValues(values)]);
    });
    const recipeMap = new Map(db.recipes.map((r) => [r.id || JSON.stringify(r), r]));
    normalized.recipes.forEach((r) => recipeMap.set(r.id || JSON.stringify(r), r));
    db.recipes = [...recipeMap.values()];
    const libraryMap = new Map(db.library.map((entry) => [entry.id, entry]));
    normalized.library.forEach((entry) => libraryMap.set(entry.id || makeId('prompt'), entry));
    db.library = [...libraryMap.values()].sort((a,b) => String(b.updated_at || b.created_at || '').localeCompare(String(a.updated_at || a.created_at || '')));
    persistDb(sourceLabel);
  }

  function usableLines(text) {
    return String(text).split(/\r?\n/).map(clean).filter((line) => line && !line.startsWith('#'));
  }

  async function importLegacyPromptDb(files) {
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
      db.concepts[category] = unique([...(db.concepts[category] || []), ...values]);
    });

    const groups = config.groups || {};
    Object.entries(groups).forEach(([groupName, group]) => {
      const refs = (group.sentence_files || []).map((item) => typeof item === 'string' ? item : item.file).filter(Boolean);
      refs.forEach((fileName) => {
        (sentenceFiles[fileName] || []).forEach((template, index) => {
          db.recipes.push({
            id: `legacy.${groupName}.${fileName.replace(/\W+/g,'_')}.${index + 1}`,
            type: 'legacy-template',
            group: groupName,
            template,
            sentence_file: fileName,
            source: 'prompt-db-v1'
          });
        });
      });
    });

    db.recipes = [...new Map(db.recipes.map((r) => [r.id || JSON.stringify(r), r])).values()];
    persistDb(`Imported legacy PromptDB: ${configFile.webkitRelativePath.split('/')[0] || 'folder'}`);
    showToast(`旧PromptDBを取込: ${Object.keys(importedConcepts).length} categories / ${db.recipes.length} recipes`);
  }

  function setView(name) {
    document.querySelectorAll('.studio-tab').forEach((button) => {
      const active = button.dataset.view === name;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    const compose = name === 'compose';
    $('composeView').classList.toggle('active', compose);
    $('composeView').hidden = !compose;
    $('databaseView').classList.toggle('active', !compose);
    $('databaseView').hidden = compose;
    if (!compose) renderLibrary();
  }

  async function copyCurrent() {
    const profile = PROFILE_DEFS[$('profileSelect').value];
    const positive = $('positiveOutput').value;
    const negative = $('negativeOutput').value;
    const text = profile.supportsNegative && negative ? `${positive}\n\nNegative: ${negative}` : positive;
    await navigator.clipboard.writeText(text);
    showToast('Promptをコピーしました');
  }

  function loadExample() {
    setSemantic({
      subject:'a young woman',
      appearance:'gentle, intelligent appearance',
      expression:'calm expression',
      outfit:'white shirt and dark skirt',
      action:'reading a book',
      pose:'standing naturally',
      environment:'quiet library at night',
      lighting:'soft warm window light',
      camera:'50mm eye-level medium shot',
      composition:'foreground bookshelves framing the subject',
      style:'quiet editorial photography',
      visibleText:'',
      constraints:'natural hands and fingers, consistent character identity',
      negative:'blurry, distorted anatomy, extra fingers, unreadable text'
    });
    $('entryTitle').value = '夜の図書館で読書';
    $('entryTags').value = 'library, reading, portrait';
    renderCurrent();
  }

  function clearComposer() {
    FIELD_IDS.forEach((id) => { $(id).value = ''; });
    $('modelName').value = '';
    $('entryTitle').value = '';
    $('entryTags').value = '';
    renderCurrent();
  }

  function exportDb() {
    const payload = { ...db, app_version: APP_VERSION, updated_at: now() };
    download('prompt-db-v2.json', JSON.stringify(payload, null, 2));
    showToast('PromptDB v2を書き出しました');
  }

  async function importDbFile(file) {
    const parsed = JSON.parse(await file.text());
    if (parsed?.format !== 'prompt-db-v2') throw new Error('PromptDB v2形式ではありません');
    mergeDb(parsed, `Imported PromptDB v2: ${file.name}`);
    showToast('PromptDB v2をマージしました');
  }

  fillProfileSelect();

  document.querySelectorAll('.studio-tab').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
  FIELD_IDS.forEach((id) => $(id).addEventListener('input', renderCurrent));
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

  $('exportDbButton').addEventListener('click', exportDb);
  $('importDbButton').addEventListener('click', () => $('dbFileInput').click());
  $('dbFileInput').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try { await importDbFile(file); } catch (error) { showToast(error.message || String(error)); }
    event.target.value = '';
  });
  $('importLegacyButton').addEventListener('click', () => $('legacyFolderInput').click());
  $('legacyFolderInput').addEventListener('change', async (event) => {
    try { await importLegacyPromptDb(event.target.files); } catch (error) { showToast(error.message || String(error)); }
    event.target.value = '';
  });

  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      copyCurrent();
    }
  });

  window.PromptStudio = Object.freeze({
    version: APP_VERSION,
    getDb: () => clone(db),
    getSemantic,
    renderForProfile,
    importLegacyPromptDb
  });

  updateDbUi();
  loadExample();
})();
