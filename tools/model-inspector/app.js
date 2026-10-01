(() => {
  'use strict';

  const E = window.ModelInspectorEngine;
  const Store = window.ModelInspectorStore;
  const $ = (id) => document.getElementById(id);
  let toastTimer = null;
  let inspectRecords = [];
  const offlineDb = E.makeOfflineDb();

  const HELP = {
    quickstart:{
      title:'Model Inspector の使い方',
      body:'1. Civitai URLを貼って「取得する」を押します。\n2. 必要なモデルを「モデルDBへ登録」します。\n3. モデルDBでFamily、推奨プロンプト書式、VRAM目安、評価、メモなどを整えます。\n4. 制作時は「Prompt Studioで使う」からモデル名と推奨書式をそのまま渡せます。\n\nCivitaiにないローカルモデルは「手入力で登録」またはローカルファイル選択から登録できます。'
    },
    inspect:{
      title:'Civitaiから取得',
      body:'CivitaiのモデルURL、model-version API URL、download URLを認識します。「保存JSONを優先 → API」では、先に読み込んだJSONを探し、見つからない場合だけCivitai APIへ通信します。'
    },
    offline:{
      title:'保存済みAPI JSON',
      body:'以前保存したCivitai model / model-version API JSONをブラウザ内へ一時読込できます。外部通信せずにモデル情報を確認したい時に使います。読み込んだJSONそのものは保存しません。'
    },
    'local-file':{
      title:'ローカルファイル',
      body:'safetensorsやGGUFなどを選ぶと、ファイル名と容量だけを登録画面へ移します。モデルファイル本体をサイトへアップロードする処理はありません。SHA256はCivitai APIから取得できる場合は自動入力し、ローカル専用モデルでは必要に応じて手入力します。'
    },
    database:{
      title:'モデルDB',
      body:'実際の制作で使うためのモデル台帳です。Civitaiの取得情報だけでなく、推奨プロンプト書式、解像度、ControlNet / IP-Adapter対応、VRAM目安、自分用評価・タグ・メモを保存できます。ブラウザ内は作業コピーなので、長期保存時はJSONを書き出します。'
    }
  };

  function toast(message) {
    const el = $('toast');
    el.textContent = message;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), 2400);
  }

  function download(name, content, type = 'application/json') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content],{type}));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1200);
  }

  function csvCell(value) {
    const text = Array.isArray(value) ? value.join(' | ') : String(value ?? '');
    return `"${text.replaceAll('"','""')}"`;
  }

  function showHelp(key) {
    const item = HELP[key];
    if (!item) return;
    $('helpDialogTitle').textContent = item.title;
    $('helpDialogBody').textContent = item.body;
    const dialog = $('helpDialog');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open','');
  }

  function closeDialog(dialog) {
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
  }

  function setView(name) {
    document.querySelectorAll('.studio-tab').forEach((button) => {
      const active = button.dataset.view === name;
      button.classList.toggle('active',active);
      button.setAttribute('aria-selected',String(active));
    });
    for (const viewName of ['inspect','database']) {
      const section = $(viewName + 'View');
      const active = viewName === name;
      section.classList.toggle('active',active);
      section.hidden = !active;
    }
    if (name === 'database') renderDatabase();
  }

  function updateOfflineStatus() {
    $('offlineStatus').textContent =
      `${offlineDb.models.size} models / ${offlineDb.versions.size} versions / ${offlineDb.records.size} records`;
  }

  async function importOfflineFiles(files) {
    let loaded = 0;
    for (const file of files) {
      try {
        const data = JSON.parse(await file.text());
        E.importOfflineObject(offlineDb,data);
        loaded += 1;
      } catch {}
    }
    updateOfflineStatus();
    toast(`${loaded}件のJSONを読み込みました`);
  }

  function statusChip(record) {
    return record.status === 'ERROR' ? '<span class="chip error">ERROR</span>' : '<span class="chip good">OK</span>';
  }

  function esc(value) {
    const div = document.createElement('div');
    div.textContent = String(value ?? '');
    return div.innerHTML;
  }

  function resultDetails(record) {
    const size = E.formatBytes(record.file_size_bytes);
    const trigger = E.list(record.trigger_words).join(', ');
    return [
      ['Family',record.family || '-'],
      ['種類',record.model_type || '-'],
      ['Version',record.version_name || '-'],
      ['Base model',record.base_model || '-'],
      ['Creator',record.creator || '-'],
      ['File',[record.file_name,size].filter(Boolean).join(' · ') || '-'],
      ['SHA256',record.sha256 || '-'],
      ['Trigger',trigger || '-'],
      ['推奨書式',E.PROFILE_LABELS[record.prompt_profile] || record.prompt_profile || '-'],
      ['推奨設定',record.recommended_settings || '-']
    ];
  }

  function renderInspectResults() {
    const box = $('inspectResults');
    box.replaceChildren();
    const ok = inspectRecords.filter((record) => record.status === 'OK').length;
    $('inspectSummary').textContent = inspectRecords.length
      ? `${inspectRecords.length}件 · 取得成功 ${ok} / エラー ${inspectRecords.length-ok}`
      : 'URLを入力してください。';
    box.classList.toggle('empty-state',inspectRecords.length === 0);
    if (!inspectRecords.length) {
      box.textContent = 'モデル情報がここに並びます。';
      return;
    }

    inspectRecords.forEach((record,index) => {
      const article = document.createElement('article');
      article.className = 'result-card';

      const main = document.createElement('div');
      const meta = document.createElement('div');
      meta.className = 'result-meta';
      meta.innerHTML = `${statusChip(record)}<span class="chip">${esc(record.source || '-')}</span><span class="chip">${esc(record.family || 'Other')}</span>`;
      const title = document.createElement('h3');
      title.textContent = record.model_name || record.input_url || '取得エラー';
      const dl = document.createElement('dl');
      dl.className = 'detail-grid';
      if (record.error) {
        const dt = document.createElement('dt'); dt.textContent = 'エラー';
        const dd = document.createElement('dd'); dd.textContent = record.error; dd.className = 'danger-button';
        dl.append(dt,dd);
      }
      resultDetails(record).forEach(([label,value]) => {
        const dt = document.createElement('dt'); dt.textContent = label;
        const dd = document.createElement('dd'); dd.textContent = value;
        dl.append(dt,dd);
      });
      main.append(meta,title,dl);

      const actions = document.createElement('div');
      actions.className = 'result-actions';
      if (record.status === 'OK') {
        const add = document.createElement('button');
        add.type = 'button';
        add.className = 'primary-button';
        add.textContent = 'モデルDBへ登録';
        add.addEventListener('click',() => {
          Store.addEntry(record);
          toast('モデルDBへ登録しました');
        });

        const edit = document.createElement('button');
        edit.type = 'button';
        edit.textContent = '確認して登録';
        edit.addEventListener('click',() => openEditor(record));

        actions.append(add,edit);
      }

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '結果から外す';
      remove.addEventListener('click',() => {
        inspectRecords.splice(index,1);
        renderInspectResults();
      });
      actions.append(remove);

      article.append(main,actions);
      box.append(article);
    });
  }

  async function inspectUrls() {
    const urls = $('modelUrls').value.split(/\r?\n/).map((value) => value.trim()).filter((value) => value && !value.startsWith('#'));
    if (!urls.length) { toast('Civitai URLを入力してください'); return; }
    $('inspectButton').disabled = true;
    inspectRecords = [];
    renderInspectResults();
    const mode = $('fetchMode').value;
    const key = $('apiKey').value.trim();
    for (let i=0;i<urls.length;i++) {
      $('inspectSummary').textContent = `${i+1} / ${urls.length} 取得中…`;
      inspectRecords.push(await E.inspectOne(urls[i],key,mode,offlineDb));
      renderInspectResults();
    }
    $('inspectButton').disabled = false;
  }

  const EDIT_FIELDS = {
    model_name:'editModelName',
    version_name:'editVersionName',
    family:'editFamily',
    model_type:'editModelType',
    base_model:'editBaseModel',
    creator:'editCreator',
    file_name:'editFileName',
    file_size_label:'editFileSize',
    sha256:'editSha256',
    source_url:'editSourceUrl',
    model_id:'editModelId',
    version_id:'editVersionId',
    prompt_profile:'editPromptProfile',
    resolution:'editResolution',
    vram_gb:'editVram',
    rating:'editRating',
    recommended_settings:'editRecommended',
    notes:'editNotes'
  };

  function editorValue(record,key) {
    if (key === 'source_url') return record.source_url || record.input_url || '';
    if (key === 'file_size_label') return record.file_size_label || E.formatBytes(record.file_size_bytes);
    return record[key] ?? '';
  }

  function openEditor(record = {}) {
    const isExisting = Boolean(record.id);
    $('editorTitle').textContent = isExisting ? 'モデルを編集' : 'モデルを登録';
    $('entryId').value = record.id || '';

    const normalized = E.normalizeRecord(record);
    const source = {...normalized,...record};
    for (const [key,id] of Object.entries(EDIT_FIELDS)) {
      const el = $(id);
      let value = editorValue(source,key);
      if (key === 'rating') value = Number(value) || 0;
      if ([...el.options || []].length && ![...el.options].some((option) => String(option.value) === String(value))) {
        if (key === 'family') value = source.family || 'Other';
        else if (key === 'model_type') value = source.model_type || 'Other';
        else if (key === 'prompt_profile') value = E.inferPromptProfile(source.family,source.model_name,source.base_model);
      }
      el.value = String(value ?? '');
    }
    $('editControlNet').checked = Boolean(source.controlnet);
    $('editIpAdapter').checked = Boolean(source.ip_adapter);
    $('editTriggerWords').value = E.list(source.trigger_words).join(', ');
    $('editTags').value = E.list(source.tags).join(', ');
    $('deleteEntryButton').classList.toggle('hidden',!isExisting);

    const dialog = $('editorDialog');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open','');
    setTimeout(() => $('editModelName').focus(),30);
  }

  function collectEditor() {
    const id = $('entryId').value.trim();
    const sizeLabel = $('editFileSize').value.trim();
    return {
      id,
      model_name:$('editModelName').value.trim(),
      version_name:$('editVersionName').value.trim(),
      family:$('editFamily').value,
      model_type:$('editModelType').value,
      base_model:$('editBaseModel').value.trim(),
      creator:$('editCreator').value.trim(),
      file_name:$('editFileName').value.trim(),
      file_size_label:sizeLabel,
      sha256:$('editSha256').value.trim(),
      source_url:$('editSourceUrl').value.trim(),
      input_url:$('editSourceUrl').value.trim(),
      model_id:$('editModelId').value.trim(),
      version_id:$('editVersionId').value.trim(),
      prompt_profile:$('editPromptProfile').value,
      resolution:$('editResolution').value.trim(),
      vram_gb:$('editVram').value.trim(),
      rating:Number($('editRating').value) || 0,
      controlnet:$('editControlNet').checked,
      ip_adapter:$('editIpAdapter').checked,
      trigger_words:E.list($('editTriggerWords').value),
      recommended_settings:$('editRecommended').value.trim(),
      tags:E.list($('editTags').value),
      notes:$('editNotes').value.trim()
    };
  }

  function saveEditor(event) {
    event.preventDefault();
    const record = collectEditor();
    if (!record.model_name) { toast('モデル名を入力してください'); return; }
    if (record.id) Store.updateEntry(record.id,record);
    else Store.addEntry(record);
    closeDialog($('editorDialog'));
    toast(record.id ? 'モデル情報を更新しました' : 'モデルDBへ登録しました');
    setView('database');
  }

  function stars(rating) {
    const n = Number(rating) || 0;
    return n ? '★'.repeat(n) + '☆'.repeat(5-n) : '未評価';
  }

  function renderFamilyOptions(entries) {
    const select = $('familyFilter');
    const current = select.value;
    const families = [...new Set(entries.map((entry) => entry.family).filter(Boolean))].sort((a,b) => a.localeCompare(b,'ja'));
    select.replaceChildren();
    const all = document.createElement('option'); all.value='all'; all.textContent='すべて'; select.append(all);
    families.forEach((family) => {
      const option=document.createElement('option'); option.value=family; option.textContent=family; select.append(option);
    });
    select.value = families.includes(current) ? current : 'all';
  }

  function promptStudioUrl(entry) {
    const model = [entry.model_name,entry.version_name].filter(Boolean).join(' / ');
    const params = new URLSearchParams({model,profile:entry.prompt_profile || 'generic-tags'});
    return `/prompt-studio/?${params.toString()}`;
  }

  function renderDatabase() {
    const db = Store.getDb();
    renderFamilyOptions(db.entries);
    const query = $('dbSearch').value.trim().toLowerCase();
    const family = $('familyFilter').value;
    const type = $('typeFilter').value;
    const rating = $('ratingFilter').value;
    const minimumRating = rating === 'all' ? 0 : Number(rating);

    const entries = db.entries.filter((entry) => {
      if (family !== 'all' && entry.family !== family) return false;
      if (type !== 'all' && entry.model_type !== type) return false;
      if (minimumRating && Number(entry.rating || 0) < minimumRating) return false;
      if (!query) return true;
      return [
        entry.model_name,entry.version_name,entry.family,entry.base_model,entry.file_name,
        ...(entry.tags || []),entry.notes,...(entry.trigger_words || [])
      ].join(' ').toLowerCase().includes(query);
    });

    $('dbCount').textContent = String(db.entries.length);
    $('familyCount').textContent = String(new Set(db.entries.map((entry) => entry.family).filter(Boolean)).size);
    $('highRatingCount').textContent = String(db.entries.filter((entry) => Number(entry.rating) >= 4).length);

    const list = $('dbList');
    list.replaceChildren();
    if (!entries.length) {
      const empty=document.createElement('div');
      empty.className='empty-state';
      empty.textContent=db.entries.length ? '条件に一致するモデルはありません。' : 'まだモデルが登録されていません。「モデルを調べる」または「新規登録」から追加できます。';
      list.append(empty);
      return;
    }

    entries.forEach((entry) => {
      const article = document.createElement('article');
      article.className='db-entry';

      const main=document.createElement('div');
      const meta=document.createElement('div');
      meta.className='entry-meta';
      for (const value of [entry.family,entry.model_type,entry.base_model].filter(Boolean)) {
        const chip=document.createElement('span'); chip.className='chip'; chip.textContent=value; meta.append(chip);
      }
      const title=document.createElement('h3');
      title.textContent=[entry.model_name,entry.version_name].filter(Boolean).join(' · ');
      const rating=document.createElement('div');
      rating.className='rating';
      rating.textContent=stars(entry.rating);
      const dl=document.createElement('dl'); dl.className='detail-grid';
      const details=[
        ['File',[entry.file_name,entry.file_size_label].filter(Boolean).join(' · ') || '-'],
        ['SHA256',entry.sha256 || '-'],
        ['Trigger',(entry.trigger_words || []).join(', ') || '-'],
        ['推奨書式',E.PROFILE_LABELS[entry.prompt_profile] || '-'],
        ['解像度',entry.resolution || '-'],
        ['VRAM',entry.vram_gb || '-'],
        ['対応',[entry.controlnet?'ControlNet':'',entry.ip_adapter?'IP-Adapter':''].filter(Boolean).join(' / ') || '-'],
        ['タグ',(entry.tags || []).join(' · ') || '-'],
        ['メモ',entry.notes || '-']
      ];
      details.forEach(([label,value]) => {
        const dt=document.createElement('dt');dt.textContent=label;
        const dd=document.createElement('dd');dd.textContent=value;
        dl.append(dt,dd);
      });
      main.append(meta,title,rating,dl);

      const actions=document.createElement('div');
      actions.className='entry-actions';
      const use=document.createElement('button');
      use.type='button'; use.className='primary-button'; use.textContent='Prompt Studioで使う';
      use.addEventListener('click',() => window.open(promptStudioUrl(entry),'_blank','noopener'));
      const edit=document.createElement('button');
      edit.type='button'; edit.textContent='編集';
      edit.addEventListener('click',() => openEditor(entry));
      const copy=document.createElement('button');
      copy.type='button'; copy.textContent='モデル名をコピー';
      copy.addEventListener('click',async() => {
        await navigator.clipboard.writeText([entry.model_name,entry.version_name].filter(Boolean).join(' / '));
        toast('モデル名をコピーしました');
      });
      actions.append(use,edit,copy);
      article.append(main,actions);
      list.append(article);
    });
  }

  function dbCsv() {
    const head=[
      'model_name','version_name','family','model_type','base_model','creator','source_url',
      'model_id','version_id','file_name','file_size_label','sha256','trigger_words',
      'prompt_profile','resolution','controlnet','ip_adapter','vram_gb','rating','tags',
      'recommended_settings','notes'
    ];
    const rows=[head,...Store.getDb().entries.map((entry) => head.map((key) => entry[key] ?? ''))];
    return '\ufeff' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
  }

  function inspectCsv() {
    const head=[
      'input_url','status','source','error','model_type','model_name','version_name','family',
      'base_model','creator','file_name','file_size_bytes','sha256','trigger_words',
      'prompt_profile','recommended_settings','model_id','version_id','download_url'
    ];
    const rows=[head,...inspectRecords.map((entry) => head.map((key) => entry[key] ?? ''))];
    return '\ufeff' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
  }

  document.querySelectorAll('.studio-tab').forEach((button) => {
    button.addEventListener('click',() => setView(button.dataset.view));
  });
  document.querySelectorAll('[data-help-key]').forEach((button) => {
    button.addEventListener('click',() => showHelp(button.dataset.helpKey));
  });

  $('helpDialogClose').addEventListener('click',() => closeDialog($('helpDialog')));
  $('helpDialog').addEventListener('click',(event) => { if (event.target === $('helpDialog')) closeDialog($('helpDialog')); });

  $('inspectButton').addEventListener('click',inspectUrls);
  $('clearInspectButton').addEventListener('click',() => {
    inspectRecords=[];
    $('modelUrls').value='';
    $('apiKey').value='';
    renderInspectResults();
  });

  $('offlineJsonButton').addEventListener('click',() => $('offlineJsonInput').click());
  $('offlineJsonInput').addEventListener('change',async(event) => {
    await importOfflineFiles([...event.target.files]);
    event.target.value='';
  });
  $('clearOfflineButton').addEventListener('click',() => {
    offlineDb.models.clear(); offlineDb.versions.clear(); offlineDb.records.clear();
    updateOfflineStatus();
    toast('保存JSONの読み込みを解除しました');
  });

  $('localModelFile').addEventListener('change',(event) => {
    const file=event.target.files?.[0];
    if (!file) return;
    openEditor({
      model_name:file.name.replace(/\.[^.]+$/,''),
      file_name:file.name,
      file_size_bytes:file.size,
      file_size_label:E.formatBytes(file.size),
      source:'ローカルファイル'
    });
    event.target.value='';
  });

  $('newManualButton').addEventListener('click',() => openEditor({}));
  $('newDbEntryButton').addEventListener('click',() => openEditor({}));

  $('editorCloseButton').addEventListener('click',() => closeDialog($('editorDialog')));
  $('cancelEditorButton').addEventListener('click',() => closeDialog($('editorDialog')));
  $('editorDialog').addEventListener('click',(event) => { if (event.target === $('editorDialog')) closeDialog($('editorDialog')); });
  $('editorForm').addEventListener('submit',saveEditor);
  $('deleteEntryButton').addEventListener('click',() => {
    const id=$('entryId').value.trim();
    if (!id) return;
    Store.deleteEntry(id);
    closeDialog($('editorDialog'));
    toast('モデルDBから削除しました');
  });

  $('dbSearch').addEventListener('input',renderDatabase);
  $('familyFilter').addEventListener('change',renderDatabase);
  $('typeFilter').addEventListener('change',renderDatabase);
  $('ratingFilter').addEventListener('change',renderDatabase);
  window.addEventListener('modelinspector:dbchange',renderDatabase);

  $('importDbButton').addEventListener('click',() => $('dbFileInput').click());
  $('dbFileInput').addEventListener('change',async(event) => {
    const file=event.target.files?.[0];
    if (!file) return;
    try {
      await Store.importDb(file);
      toast('モデルDBを読み込みました');
    } catch (error) {
      toast(error.message || String(error));
    }
    event.target.value='';
  });

  $('exportDbButton').addEventListener('click',() => {
    download('model-db.json',JSON.stringify(Store.exportObject(),null,2));
    toast('モデルDBを書き出しました');
  });
  $('exportDbCsvButton').addEventListener('click',() => {
    if (!Store.getDb().entries.length) { toast('モデルDBは空です'); return; }
    download('model-db.csv',dbCsv(),'text/csv;charset=utf-8');
  });
  $('exportInspectCsvButton').addEventListener('click',() => {
    if (!inspectRecords.length) { toast('取得結果がありません'); return; }
    download('model-inspector-results.csv',inspectCsv(),'text/csv;charset=utf-8');
  });

  document.addEventListener('keydown',(event) => {
    if (event.key === 'Escape') {
      closeDialog($('editorDialog'));
      closeDialog($('helpDialog'));
    }
  });

  updateOfflineStatus();
  renderInspectResults();
  renderDatabase();

  window.ModelInspector = Object.freeze({
    version:E.APP_VERSION,
    getDb:Store.getDb,
    getInspectRecords:() => E.clone(inspectRecords),
    inspectOne:(url,mode='auto') => E.inspectOne(url,'',mode,offlineDb),
    openEditor
  });
})();
