(() => {
  'use strict';
  const E = window.PromptStudioEngine;
  const Store = window.PromptStudioStore;
  const Studio = window.PromptStudio;
  if (!E || !Store || !Studio) return;

  const semanticSection = document.querySelector('.semantic-fields');
  const slotsSection = document.querySelector('.slot-composer');
  const panel = document.querySelector('.composer-panel');
  if (!semanticSection || !slotsSection || !panel) return;

  // Keep existing fields, recipes, and the prompt-db schema untouched.
  semanticSection.after(slotsSection);
  const BASIC_FIELDS = new Set(['subject', 'outfit', 'action', 'environment', 'lighting', 'style']);
  const FIELD_LABELS = {
    subject:'主役・被写体', appearance:'見た目', expression:'表情', outfit:'服装',
    action:'動作', pose:'ポーズ', environment:'場所・背景', lighting:'光・ライティング',
    camera:'カメラ', composition:'構図', style:'雰囲気・画風',
    visibleText:'画像内の文字', constraints:'守りたい条件', negative:'避けたい要素'
  };
  const EXAMPLES = {
    portrait: {
      title:'カフェの人物ポートレート',
      semantic:{subject:'a woman reading a book',outfit:'white shirt',action:'reading quietly',
        environment:'a quiet cafe at night',lighting:'warm indoor lighting',
        style:'natural editorial photography'}
    },
    anime: {
      title:'街角のアニメキャラクター',
      semantic:{subject:'an original anime character',outfit:'casual jacket and jeans',
        action:'standing on a street corner',environment:'a calm city street',
        lighting:'soft evening light',style:'clean anime illustration'}
    },
    landscape: {
      title:'海辺の風景',
      semantic:{subject:'a quiet coastline',environment:'a rocky coast with a distant horizon',
        lighting:'soft sunrise light',camera:'wide landscape shot',
        style:'detailed landscape photography'}
    },
    product: {
      title:'商品写真',
      semantic:{subject:'a ceramic coffee mug',environment:'a simple wooden table',
        lighting:'soft studio lighting',composition:'centered product composition',
        style:'clean commercial product photography'}
    }
  };
  const get = (id) => document.getElementById(id);
  const modeBar = document.createElement('div');
  modeBar.className = 'editor-mode-bar';
  modeBar.innerHTML =
    '<div class="editor-mode-title">作り方を選ぶ</div>' +
    '<div class="editor-mode-buttons" role="group" aria-label="編集モード">' +
      '<button type="button" data-editor-mode-target="simple">かんたん作成</button>' +
      '<button type="button" data-editor-mode-target="detail">詳細編集</button>' +
      '<button type="button" data-editor-mode-target="auto">自動組み立て</button>' +
    '</div>' +
    '<p class="section-note" id="editorModeNote"></p>';
  semanticSection.prepend(modeBar);

  function setMode(mode, options = {}) {
    if (!['simple','detail','auto'].includes(mode)) mode = 'simple';
    document.body.dataset.editorMode = mode;
    modeBar.querySelectorAll('[data-editor-mode-target]').forEach((button) => {
      const selected = button.dataset.editorModeTarget === mode;
      button.setAttribute('aria-pressed', String(selected));
      button.classList.toggle('is-active', selected);
    });
    get('editorModeNote').textContent = mode === 'simple'
      ? 'まず主役・服装・動作・背景・光・画風から。空欄はそのままで大丈夫。'
      : mode === 'detail'
      ? 'カメラや構図、保持条件まで細かく調整できるよ。'
      : '辞書とレシピで各項目を自動入力。入力結果は「画像の内容」に残るよ。';
    try { localStorage.setItem('prompt-studio-editor-mode', mode); } catch {}
    if (mode === 'auto' && options.navigate !== false &&
        document.documentElement.classList.contains('pwa-standalone')) {
      const selector = get('pwaDrawerSelect');
      if (selector && selector.value !== '2') {
        selector.value = '2';
        selector.dispatchEvent(new Event('change'));
      }
    }
  }
  modeBar.addEventListener('click', (event) => {
    const button = event.target.closest('[data-editor-mode-target]');
    if (button) setMode(button.dataset.editorModeTarget);
  });
  let initialMode = 'simple';
  try { initialMode = localStorage.getItem('prompt-studio-editor-mode') || 'simple'; } catch {}
  setMode(initialMode, {navigate:false});

  // The existing subject textarea accepts Japanese directly; no translation is claimed.
  get('subject').placeholder = '例：夜のカフェで本を読む女性（日本語でも入力できる）';
  get('outfit').placeholder = '例：白いシャツ';
  get('environment').placeholder = '例：夜の静かなカフェ';
  const heading = semanticSection.querySelector('.section-heading-row');
  const exampleRow = document.createElement('div');
  exampleRow.className = 'starter-row';
  exampleRow.innerHTML =
    '<label for="starterExample">作例から始める' +
    '<select id="starterExample"><option value="">作例を選ぶ</option>' +
    '<option value="portrait">人物ポートレート</option>' +
    '<option value="anime">アニメキャラクター</option>' +
    '<option value="landscape">風景</option>' +
    '<option value="product">商品写真</option></select></label>' +
    '<p class="section-note">日本語の入力もOK。翻訳は行わず、選んだモデル向けの書式で組み立てるよ。</p>';
  if (heading) heading.after(exampleRow); else modeBar.after(exampleRow);
  get('starterExample').addEventListener('change', (event) => {
    const preset = EXAMPLES[event.target.value];
    if (!preset) return;
    const hasExisting = Object.values(Studio.getSemantic()).some((value) => E.clean(value));
    if (!hasExisting || window.confirm('現在の画像の内容を作例で置き換える？')) {
      Studio.setSemantic(preset.semantic);
      get('entryTitle').value = preset.title;
      markChanged('subject');
    }
    event.target.value = '';
  });

  // Progressive enhancement: keep original label/input IDs and event handlers.
  const fieldWrappers = new Map();
  semanticSection.querySelectorAll('label').forEach((label) => {
    const field = label.querySelector('input[id],textarea[id]');
    if (!field || !E.FIELD_IDS.includes(field.id)) return;
    const wrap = document.createElement('div');
    wrap.className = 'semantic-field';
    if (!BASIC_FIELDS.has(field.id)) wrap.classList.add('advanced-field');
    wrap.dataset.field = field.id;
    label.parentNode.insertBefore(wrap, label);
    wrap.append(label);
    fieldWrappers.set(field.id, wrap);
    if (field.id === 'negative') return;
    const pickerButton = document.createElement('button');
    pickerButton.type = 'button';
    pickerButton.className = 'concept-pick-button';
    pickerButton.textContent = '辞書から選ぶ';
    pickerButton.setAttribute('aria-label', FIELD_LABELS[field.id] + 'をパーツ辞書から選ぶ');
    pickerButton.addEventListener('click', () => openPicker(field.id));
    wrap.append(pickerButton);
  });

  const dialog = document.createElement('dialog');
  dialog.className = 'concept-picker-dialog';
  dialog.setAttribute('aria-label','パーツ辞書から選ぶ');
  dialog.innerHTML =
    '<div class="concept-picker-header"><strong id="conceptPickerTitle">辞書から選ぶ</strong>' +
    '<button type="button" id="conceptPickerClose">閉じる</button></div>' +
    '<input type="search" id="conceptPickerSearch" placeholder="パーツを検索" aria-label="パーツを検索">' +
    '<div class="concept-picker-list" id="conceptPickerList"></div>';
  document.body.append(dialog);
  let pickerField = null;
  let pickerItems = [];
  const drawPicker = () => {
    const term = E.clean(get('conceptPickerSearch').value).toLowerCase();
    const items = pickerItems.filter((item) =>
      [item.label_ja,item.value,...(item.tags || [])].join(' ').toLowerCase().includes(term));
    const list = get('conceptPickerList');
    list.replaceChildren();
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'section-note';
      empty.textContent = '該当するパーツがないよ。「プロンプトDB → パーツ辞書」から追加できる。';
      list.append(empty);
      return;
    }
    items.forEach((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'concept-picker-item';
      const title = document.createElement('strong');
      title.textContent = item.label_ja || item.value;
      const value = document.createElement('span');
      value.textContent = item.value;
      button.append(title, value);
      button.addEventListener('click', () => {
        const field = get(pickerField);
        if (field) {
          field.value = item.value;
          field.dispatchEvent(new Event('input',{bubbles:true}));
        }
        dialog.close();
      });
      list.append(button);
    });
  };
  function openPicker(id) {
    pickerField = id;
    pickerItems = E.normalizeConceptEntries(Store.getDb().concepts?.[id] || [], id);
    get('conceptPickerTitle').textContent = FIELD_LABELS[id] + '：辞書から選ぶ';
    get('conceptPickerSearch').value = '';
    drawPicker();
    dialog.showModal();
  }
  get('conceptPickerSearch').addEventListener('input', drawPicker);
  get('conceptPickerClose').addEventListener('click', () => dialog.close());

  const outputHeaderText = document.querySelector('.output-header > div:first-child');
  const changeNote = document.createElement('p');
  changeNote.id = 'changedFieldNote';
  changeNote.setAttribute('aria-live','polite');
  if (outputHeaderText) outputHeaderText.append(changeNote);
  function markChanged(id) {
    fieldWrappers.forEach((wrap, key) => wrap.classList.toggle('just-edited', key === id));
    const value = E.clean(get(id)?.value);
    if (!value) {
      changeNote.textContent = FIELD_LABELS[id] + 'をクリアしたよ。';
      return;
    }
    const out = get(id) === get('negative') ? get('negativeOutput').value : get('positiveOutput').value;
    changeNote.textContent = FIELD_LABELS[id] + 'を更新：' + value +
      (out.includes(value) ? '（完成プロンプトに反映）' : '（出力はモデル用書式で更新）');
  }
  E.FIELD_IDS.forEach((id) => {
    get(id)?.addEventListener('input', () => markChanged(id));
  });
  get('profileSelect').addEventListener('change', () => {
    const negativeWrapper = fieldWrappers.get('negative');
    if (negativeWrapper) {
      negativeWrapper.classList.toggle('is-hidden',
        !E.PROFILE_DEFS[get('profileSelect').value]?.supportsNegative);
    }
    changeNote.textContent = '出力モデルを切り替えたよ。';
  });
  const syncNegative = () => {
    const wrap = fieldWrappers.get('negative');
    if (wrap) wrap.classList.toggle('is-hidden',
      !E.PROFILE_DEFS[get('profileSelect').value]?.supportsNegative);
  };
  syncNegative();

  const savePanel = document.querySelector('.save-panel');
  if (savePanel) {
    const status = document.createElement('p');
    status.id = 'saveScopeNote';
    status.textContent = 'DB登録はこの端末のブラウザに保存。別端末への移行・長期保管には上部の「プロンプトDBを書き出す」を使ってね。';
    savePanel.append(status);
  }
  window.PromptStudioUsability = Object.freeze({setMode, version:'1.2.0'});
})();