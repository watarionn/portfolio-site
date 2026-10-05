(() => {
  'use strict';
  const E = window.PromptStudioEngine;
  const Store = window.PromptStudioStore;
  const $ = (id) => document.getElementById(id);
  let toastTimer = null;
  const HISTORY_KEY = 'prompt-studio-pwa-history-v1';
  const HISTORY_LIMIT = 40;

  function loadHistory() {
    try {
      const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function persistHistory(items) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, HISTORY_LIMIT)));
  }

  const HELP = {
    quickstart: {
      title: 'Prompt Studio の使い方',
      body: '1. 「出力先モデル」で使う画像生成モデルに合った書式を選びます。\n2. 「画像の内容」に描きたいものを入力します。\n3. 右側の「生成プロンプト」をコピーして画像生成ツールで使います。\n4. 気に入った組み合わせは「DBに登録」で保存できます。\n\n「組み立てルール」は、登録済みのパーツをランダムや順番で自動入力したいときに使います。最初は使わず、直接「画像の内容」へ入力しても大丈夫です。'
    },
    'render-target': {
      title: '出力先モデル',
      body: '同じ画像内容でも、FLUX、SDXL、GPT Imageでは得意なプロンプトの書き方が違います。ここを切り替えると、入力した内容はそのモデル向けの文章やタグへ自動変換されます。'
    },
    dialect: {
      title: 'モデル / プロンプト書式',
      body: '「自然文」「指示文」「タグ形式」など、最終的なプロンプトの書き方を選びます。モデル名だけでなく、Checkpointの学習傾向に合わせて書式を選び分けられます。'
    },
    'model-name': {
      title: 'Checkpoint / モデル名',
      body: '使うCheckpointやモデル名をメモしておく任意欄です。ここに書いた名前は保存データへ一緒に記録されます。プロンプト本文には追加されません。'
    },
    slots: {
      title: '組み立てルール',
      body: 'プロンプトDBの「パーツ辞書」から値を取り出し、「画像の内容」の各項目へ自動入力するためのルールです。\n\n手動: 自分で固定値を入力\n重み付きランダム: 登録した重みに応じて抽選\n順番: 辞書の項目を上から順番に使用'
    },
    scene: {
      title: '画像の内容',
      body: 'ここがプロンプトの元になる情報です。主役、服装、動作、背景、光、カメラ、構図などを分けて入力すると、モデルを切り替えても同じ意味を保ったまま書式だけ変換できます。空欄は無視されます。'
    },
    constraints: {
      title: '守りたい条件',
      body: '生成結果で維持したい条件を書きます。例: 手を自然にする、同じ人物として描く、シルエットを読みやすくする。FLUXやGPT Imageでは、否定文より「どうしてほしいか」を肯定形で書く方針で出力します。'
    },
    negative: {
      title: '避けたい要素',
      body: 'SDXLなどネガティブプロンプトに対応するモデルで、避けたい崩れや要素を書きます。FLUXやGPT Imageなど、この欄を使わない出力先では自動的に非表示になります。'
    },
    output: {
      title: '生成プロンプト',
      body: '左側で入力した「画像の内容」を、選択中のモデル向けに変換した最終出力です。「コピー」でそのまま画像生成ツールへ貼り付けられます。'
    },
    semantic: {
      title: '内容データ',
      body: 'プロンプト文章になる前の元データです。モデルを切り替えても、この内容は変わりません。Prompt Studioでは完成した文章だけでなく、この元データも一緒に保存します。'
    },
    'save-db': {
      title: 'プロンプトDBに保存',
      body: '気に入ったプロンプトをタイトル・タグ付きで保存します。保存時には現在の画像内容と、各モデル向けに変換したプロンプトも一緒に記録されます。'
    },
    concepts: {
      title: 'パーツ辞書',
      body: 'よく使う人物、服装、動作、ポーズ、場所、光、カメラなどを部品として登録する場所です。「DBから自動入力」や「組み立てルール」の材料になります。'
    },
    category: {
      title: 'カテゴリ',
      body: 'パーツを用途ごとに分ける名前です。例: subject、pose、lighting。既存カテゴリを選んでも、新しいカテゴリ名を作っても構いません。'
    },
    weight: {
      title: '抽選の重み',
      body: '「重み付きランダム」で選ばれやすさを調整する数字です。1が標準です。2なら重み1の項目より約2倍選ばれやすくなります。'
    },
    recipes: {
      title: '組み立てレシピ',
      body: '「どの項目へ、どのパーツ辞書から、どの選び方で入れるか」というルール一式を保存します。似た構成のプロンプトを何度も作るときに再利用できます。'
    }
  };

  function showToast(message) {
    const el = $('toast');
    el.textContent = message;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), 2400);
  }

  function showHelp(key) {
    const item = HELP[key];
    if (!item) return;
    $('helpDialogTitle').textContent = item.title;
    $('helpDialogBody').textContent = item.body;
    const dialog = $('helpDialog');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function closeHelp() {
    const dialog = $('helpDialog');
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
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
    $('renderSummary').textContent = `${profile.label}${E.clean($('modelName').value) ? ` · ${E.clean($('modelName').value)}` : ''}`;
    $('semanticPreview').textContent = JSON.stringify({ schema:'prompt-semantic-v1', model_name:E.clean($('modelName').value), ...semantic }, null, 2);
  }

  function fillProfileSelect() {
    const select = $('profileSelect');
    select.replaceChildren();
    Object.entries(E.PROFILE_DEFS).forEach(([id, profile]) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = profile.label;
      select.append(option);
    });
    select.value = 'flux-natural';
  }

  function applyExternalModelPreset() {
    const params = new URLSearchParams(location.search);
    const model = E.clean(params.get('model'));
    const profile = E.clean(params.get('profile'));
    let applied = false;
    if (model) {
      $('modelName').value = model;
      applied = true;
    }
    if (profile && E.PROFILE_DEFS[profile]) {
      $('profileSelect').value = profile;
      applied = true;
    }
    if (applied) {
      renderCurrent();
      setTimeout(() => showToast('Model Inspectorの設定を受け取りました'), 80);
    }
  }

  function randomizeFromDb() {
    const db = Store.getDb();
    const map = {
      subject:'subject', appearance:'appearance', expression:'expression', outfit:'outfit',
      action:'action', pose:'pose', environment:'environment', lighting:'lighting',
      camera:'camera', composition:'composition', style:'style',
      visibleText:'visibleText', constraints:'constraints'
    };
    Object.entries(map).forEach(([field, category]) => {
      const entry = E.weightedChoice(db.concepts?.[category] || []);
      if (entry) $(field).value = entry.value;
    });
    renderCurrent();
    showToast('プロンプトDBのパーツから自動入力しました');
  }

  function registerCurrent() {
    const semantic = getSemantic();
    const title = E.clean($('entryTitle').value) || E.clean(semantic.subject) || ('プロンプト ' + new Date().toLocaleString('ja-JP'));
    const tags = E.unique(E.list($('entryTags').value));
    Store.addLibraryEntry({
      title,
      tags,
      modelName:E.clean($('modelName').value),
      semantic,
      profileId:$('profileSelect').value,
      positive:$('positiveOutput').value,
      negative:$('negativeOutput').value
    });
    saveHistorySnapshot('db');
    $('entryTitle').value = '';
    showToast('プロンプトDBへ保存しました');
  }

  function loadEntry(entry) {
    setSemantic(entry.semantic || {});
    $('modelName').value = E.clean(entry.model_name || '');
    $('entryTitle').value = E.clean(entry.title || '');
    $('entryTags').value = Array.isArray(entry.tags) ? entry.tags.join(', ') : '';
    setView('compose');
    renderCurrent();
    showToast('保存内容をプロンプト作成へ読み込みました');
  }

  function renderLibrary() {
    const db = Store.getDb();
    const box = $('libraryList');
    const query = E.clean($('dbSearch').value).toLowerCase();
    const status = $('dbStatusFilter').value;
    const entries = db.library.filter((entry) => {
      if (status !== 'all' && entry.status !== status) return false;
      if (!query) return true;
      const haystack = [
        entry.title, ...(entry.tags || []), entry.semantic?.subject, entry.semantic?.environment,
        ...(entry.outputs || []).map((item) => item.positive)
      ].join(' ').toLowerCase();
      return haystack.includes(query);
    });

    box.replaceChildren();
    if (!entries.length) {
      const empty = document.createElement('div');
      empty.className = 'library-empty';
      empty.textContent = db.library.length
        ? '条件に一致するプロンプトはありません。'
        : 'まだプロンプトが保存されていません。「プロンプト作成」で良いものができたら「DBに登録」で追加できます。';
      box.append(empty);
      return;
    }

    entries.forEach((entry) => {
      const currentOutput = (entry.outputs || []).find((item) => item.profile_id === $('profileSelect').value) || entry.outputs?.[0];
      const article = document.createElement('article');
      article.className = 'library-entry';

      const info = document.createElement('div');
      const title = document.createElement('h3');
      title.textContent = entry.title;
      const meta = document.createElement('div');
      meta.className = 'library-entry-meta';
      const statusLabel = entry.status === 'draft' ? '下書き' : '保存済み';
      meta.textContent = `${statusLabel} · ${entry.created_at ? new Date(entry.created_at).toLocaleString('ja-JP') : ''}`;
      const tags = document.createElement('div');
      tags.className = 'library-entry-tags';
      tags.textContent = (entry.tags || []).join(' · ');
      info.append(title, meta, tags);

      const prompt = document.createElement('div');
      prompt.className = 'library-entry-prompt';
      prompt.textContent = currentOutput?.positive || entry.semantic?.subject || '';

      const actions = document.createElement('div');
      actions.className = 'library-entry-actions';
      const edit = document.createElement('button');
      edit.textContent = '編集';
      edit.addEventListener('click', () => loadEntry(entry));
      const copy = document.createElement('button');
      copy.textContent = 'コピー';
      copy.addEventListener('click', async () => {
        await navigator.clipboard.writeText(currentOutput?.positive || '');
        showToast('コピーしました');
      });
      const del = document.createElement('button');
      del.textContent = '削除';
      del.className = 'danger-button';
      del.addEventListener('click', () => {
        Store.deleteLibraryEntry(entry.id);
        showToast('保存済みプロンプトから削除しました');
      });
      actions.append(edit, copy, del);
      article.append(info, prompt, actions);
      box.append(article);
    });
  }

  function updateDbUi() {
    const db = Store.getDb();
    $('dbStatus').textContent = `作業データ · 最終更新 ${new Date(db.updated_at || Date.now()).toLocaleString('ja-JP')}`;
    $('libraryCount').textContent = String(db.library.length);
    $('conceptCount').textContent = String(
      Object.keys(db.concepts || {}).filter((key) => E.normalizeConceptValues(db.concepts[key]).length).length
    );
    $('recipeCount').textContent = String(db.recipes.length);
    renderLibrary();
  }

  function setView(name) {
    const allowed = ['compose','history','database'];
    if (!allowed.includes(name)) name = 'compose';
    document.querySelectorAll('.studio-tab').forEach((button) => {
      const active = button.dataset.view === name;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    allowed.forEach((viewName) => {
      const section = $(viewName + 'View');
      if (!section) return;
      const active = viewName === name;
      section.classList.toggle('active', active);
      section.hidden = !active;
    });
    if (name === 'database') renderLibrary();
    if (name === 'history') renderHistory();
  }

  function historySignature(item) {
    return [item.profile_id, item.model_name, item.positive, item.negative].join('\n');
  }

  function saveHistorySnapshot(reason = 'manual') {
    const positive = String($('positiveOutput').value || '').trim();
    const negative = String($('negativeOutput').value || '').trim();
    if (!positive && !negative) return null;
    const item = {
      id:'history.' + Date.now().toString(36) + '.' + Math.random().toString(36).slice(2,7),
      created_at:E.now(),
      reason,
      profile_id:$('profileSelect').value,
      model_name:E.clean($('modelName').value),
      semantic:getSemantic(),
      positive,
      negative
    };
    const items = loadHistory();
    const signature = historySignature(item);
    const deduped = items.filter((entry) => historySignature(entry) !== signature);
    deduped.unshift(item);
    persistHistory(deduped);
    renderHistory();
    return item;
  }

  function restoreHistoryItem(item) {
    if (!item) return;
    if (item.profile_id && E.PROFILE_DEFS[item.profile_id]) $('profileSelect').value = item.profile_id;
    $('modelName').value = E.clean(item.model_name);
    setSemantic(item.semantic || {});
    $('positiveOutput').value = String(item.positive || '');
    $('negativeOutput').value = String(item.negative || '');
    setView('compose');
    showToast('履歴を作成画面へ戻しました');
  }

  function renderHistory() {
    const list = $('historyList');
    if (!list) return;
    const items = loadHistory();
    list.replaceChildren();
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'history-empty';
      empty.textContent = 'まだ履歴はありません。プロンプトをコピーまたはDB登録すると、ここへ残ります。';
      list.append(empty);
      return;
    }

    items.forEach((item) => {
      const row = document.createElement('article');
      row.className = 'history-entry';

      const main = document.createElement('button');
      main.type = 'button';
      main.className = 'history-entry-main';
      const time = document.createElement('strong');
      time.textContent = item.created_at ? new Date(item.created_at).toLocaleString('ja-JP') : '履歴';
      const meta = document.createElement('span');
      meta.textContent = [E.PROFILE_DEFS[item.profile_id]?.label || item.profile_id, item.model_name].filter(Boolean).join(' · ');
      const prompt = document.createElement('p');
      prompt.textContent = item.positive || '';
      main.append(time, meta, prompt);
      main.addEventListener('click', () => restoreHistoryItem(item));

      const actions = document.createElement('div');
      actions.className = 'history-entry-actions';
      const copy = document.createElement('button');
      copy.type = 'button';
      copy.textContent = 'コピー';
      copy.addEventListener('click', async () => {
        const profile = E.PROFILE_DEFS[item.profile_id];
        const text = profile?.supportsNegative && item.negative
          ? item.positive + '\n\nNegative: ' + item.negative
          : item.positive;
        await navigator.clipboard.writeText(text || '');
        showToast('履歴のプロンプトをコピーしました');
      });
      const del = document.createElement('button');
      del.type = 'button';
      del.textContent = '削除';
      del.className = 'danger-button';
      del.addEventListener('click', () => {
        persistHistory(loadHistory().filter((entry) => entry.id !== item.id));
        renderHistory();
      });
      actions.append(copy, del);
      row.append(main, actions);
      list.append(row);
    });
  }

  function formatText(text, tagsMode = false) {
    const source = String(text || '').trim();
    if (!source) return '';
    if (!tagsMode) {
      return source.replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, ' ').replace(/\s+([.,])/g, '$1').trim();
    }
    const seen = new Set();
    return source.split(',').map((part) => part.replace(/\s+/g, ' ').trim()).filter((part) => {
      if (!part) return false;
      const key = part.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).join(', ');
  }

  function formatCurrent() {
    const profile = E.PROFILE_DEFS[$('profileSelect').value];
    $('positiveOutput').value = formatText($('positiveOutput').value, profile?.dialect === 'tags');
    $('negativeOutput').value = formatText($('negativeOutput').value, true);
    showToast('プロンプトを整形しました');
  }

  function getDraftSnapshot() {
    return {
      profile_id:$('profileSelect').value,
      model_name:$('modelName').value,
      semantic:getSemantic(),
      positive:$('positiveOutput').value,
      negative:$('negativeOutput').value,
      entry_title:$('entryTitle').value,
      entry_tags:$('entryTags').value,
      updated_at:E.now()
    };
  }

  function restoreDraft(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return false;
    if (snapshot.profile_id && E.PROFILE_DEFS[snapshot.profile_id]) $('profileSelect').value = snapshot.profile_id;
    $('modelName').value = E.clean(snapshot.model_name);
    setSemantic(snapshot.semantic || {});
    if (typeof snapshot.positive === 'string') $('positiveOutput').value = snapshot.positive;
    if (typeof snapshot.negative === 'string') $('negativeOutput').value = snapshot.negative;
    $('entryTitle').value = E.clean(snapshot.entry_title);
    $('entryTags').value = E.clean(snapshot.entry_tags);
    renderLibrary();
    return true;
  }

  async function copyCurrent() {
    const profile = E.PROFILE_DEFS[$('profileSelect').value];
    const positive = $('positiveOutput').value;
    const negative = $('negativeOutput').value;
    await navigator.clipboard.writeText(
      profile.supportsNegative && negative ? (positive + '\n\nNegative: ' + negative) : positive
    );
    saveHistorySnapshot('copy');
    showToast('プロンプトをコピーしました');
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
    E.FIELD_IDS.forEach((id) => { $(id).value = ''; });
    $('modelName').value = '';
    $('entryTitle').value = '';
    $('entryTags').value = '';
    renderCurrent();
  }

  fillProfileSelect();
  applyExternalModelPreset();
  document.querySelectorAll('.studio-tab').forEach((button) => {
    button.addEventListener('click', () => setView(button.dataset.view));
  });
  E.FIELD_IDS.forEach((id) => $(id).addEventListener('input', renderCurrent));
  $('profileSelect').addEventListener('change', () => {
    renderCurrent();
    renderLibrary();
  });
  $('modelName').addEventListener('input', renderCurrent);
  $('randomizeButton').addEventListener('click', randomizeFromDb);
  $('clearButton').addEventListener('click', clearComposer);
  $('loadExampleButton').addEventListener('click', loadExample);
  $('copyButton').addEventListener('click', copyCurrent);
  $('registerButton').addEventListener('click', registerCurrent);
  $('dbSearch').addEventListener('input', renderLibrary);
  $('dbStatusFilter').addEventListener('change', renderLibrary);
  $('newFromDbButton').addEventListener('click', () => setView('compose'));
  $('clearHistoryButton')?.addEventListener('click', () => {
    persistHistory([]);
    renderHistory();
    showToast('履歴を消去しました');
  });

  $('exportDbButton').addEventListener('click', () => {
    download('prompt-db.json', JSON.stringify(Store.exportObject(), null, 2));
    showToast('プロンプトDBを書き出しました');
  });
  $('importDbButton').addEventListener('click', () => $('dbFileInput').click());
  $('dbFileInput').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await Store.importDb(file);
      showToast('プロンプトDBを読み込みました');
    } catch (error) {
      showToast(error.message || String(error));
    }
    event.target.value = '';
  });

  document.querySelectorAll('[data-help-key]').forEach((button) => {
    button.addEventListener('click', () => showHelp(button.dataset.helpKey));
  });
  $('helpDialogClose').addEventListener('click', closeHelp);
  $('helpDialog').addEventListener('click', (event) => {
    if (event.target === $('helpDialog')) closeHelp();
  });

  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      copyCurrent();
    }
  });
  window.addEventListener('promptstudio:dbchange', updateDbUi);

  window.PromptStudio = Object.freeze({
    version: E.APP_VERSION,
    getDb: Store.getDb,
    getSemantic,
    setSemantic,
    setView,
    renderCurrent,
    renderForProfile: E.renderForProfile,
    importDb: Store.importDb,
    copyCurrent,
    registerCurrent,
    formatCurrent,
    getDraftSnapshot,
    restoreDraft,
    saveHistorySnapshot,
    renderHistory
  });

  updateDbUi();
  loadExample();
})();