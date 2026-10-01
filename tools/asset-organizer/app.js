(() => {
  'use strict';

  const E = window.AssetOrganizerEngine;
  const Store = window.AssetOrganizerStore;
  const $ = (id) => document.getElementById(id);

  let auditRecords = [];
  let sourceFiles = new Map();
  let previewUrls = [];
  let toastTimer = null;

  const HELP = {
    quickstart:{
      title:'Asset Organizer の使い方',
      body:'1. 「フォルダを選ぶ」で画像とJSONを監査します。\n2. PAIR / IMAGE_ONLY / JSON_ONLY / BROKEN_JSON と、collect時の同名衝突を確認します。\n3. 必要ならManifestやcollect計画を書き出します。\n4. 「collectへ非破壊コピー」で、元ファイルを残したまま整理済みコピーを作れます。\n5. 長く参照したい監査結果はAsset DBへ登録します。'
    },
    audit:{
      title:'フォルダ監査',
      body:'PNG / JPG / JPEG / WEBPとJSONを再帰的に読みます。同じ相対stemの画像とJSONを1組として扱い、画像寸法、ファイルサイズ、JSON構文エラー、孤立ファイルを確認します。トップ階層のcollectフォルダは再監査から除外します。'
    },
    collect:{
      title:'非破壊collect',
      body:'Chrome / EdgeなどFile System Access API対応ブラウザで使えます。コピー元フォルダをもう一度選び、その直下のcollectへコピーします。元ファイルは移動・削除しません。\n\n同じbasenameが別フォルダにある場合は、ペア単位で name / name_1 / name_2 のように割り当てます。画像とJSONは必ず同じcollect stemを使います。既存collect内の同名ファイルも上書きしません。'
    },
    database:{
      title:'Asset DB',
      body:'監査結果のメタデータだけを保存する台帳です。画像やJSON本体はlocalStorageへ保存しません。stem、元パス、サイズ、画像寸法、状態、collect名、タグ、メモを検索できます。ブラウザ内は作業コピーなので、長期保存時はAsset DBを書き出してGitHub / Google Driveへ保存します。'
    }
  };

  function showToast(message) {
    const el = $('toast');
    el.textContent = message;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'),2400);
  }

  function download(name,content,type='application/json') {
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([content],{type}));
    a.download=name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href),1200);
  }

  function csvCell(value) {
    const text=Array.isArray(value)?value.join(' | '):String(value ?? '');
    return `"${text.replaceAll('"','""')}"`;
  }

  function closeDialog(dialog) {
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
  }

  function showHelp(key) {
    const item=HELP[key];
    if (!item) return;
    $('helpDialogTitle').textContent=item.title;
    $('helpDialogBody').textContent=item.body;
    const dialog=$('helpDialog');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open','');
  }

  function setView(name) {
    document.querySelectorAll('.studio-tab').forEach((button) => {
      const active=button.dataset.view===name;
      button.classList.toggle('active',active);
      button.setAttribute('aria-selected',String(active));
    });
    for (const viewName of ['audit','database']) {
      const section=$(viewName+'View');
      const active=viewName===name;
      section.classList.toggle('active',active);
      section.hidden=!active;
    }
    if (name==='database') renderDatabase();
  }

  function sourceFilePath(file) {
    return E.relativePath(file);
  }

  function clearPreviewUrls() {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    previewUrls=[];
  }

  async function auditFiles(files) {
    clearPreviewUrls();
    sourceFiles=new Map();
    [...files].forEach((file) => sourceFiles.set(sourceFilePath(file),file));
    auditRecords=await E.auditFiles(files);
    renderAudit();
    return E.clone(auditRecords);
  }

  function recordFileCount(record,kind) {
    if (kind==='image') return (record.image?1:0)+(record.extra_images?.length||0);
    return (record.json?1:0)+(record.extra_jsons?.length||0);
  }

  function updateStats() {
    const imageCount=auditRecords.reduce((sum,r)=>sum+recordFileCount(r,'image'),0);
    const jsonCount=auditRecords.reduce((sum,r)=>sum+recordFileCount(r,'json'),0);
    const pairCount=auditRecords.filter((r)=>r.status==='PAIR').length;
    const orphanCount=auditRecords.filter((r)=>r.status==='IMAGE_ONLY'||r.status==='JSON_ONLY').length;
    const brokenCount=auditRecords.filter((r)=>r.status==='BROKEN_JSON').length;
    const collisionCount=auditRecords.filter((r)=>r.name_collision).length;
    $('imageCount').textContent=String(imageCount);
    $('jsonCount').textContent=String(jsonCount);
    $('pairCount').textContent=String(pairCount);
    $('orphanCount').textContent=String(orphanCount);
    $('brokenCount').textContent=String(brokenCount);
    $('collisionCount').textContent=String(collisionCount);
    $('auditSummary').textContent=auditRecords.length
      ? `${auditRecords.length} stems · ${imageCount+jsonCount} files`
      : 'フォルダを選んでください。';
  }

  function chip(label,kind='') {
    const span=document.createElement('span');
    span.className=`chip ${kind}`.trim();
    span.textContent=label;
    return span;
  }

  function statusKind(record) {
    if (record.status==='PAIR') return 'good';
    if (record.status==='BROKEN_JSON') return 'error';
    return 'warn';
  }

  function imageDetail(record) {
    if (!record.image) return '-';
    const dims=record.image.width&&record.image.height?`${record.image.width}×${record.image.height}`:'寸法不明';
    return `${record.image.name} · ${dims} · ${E.formatBytes(record.image.bytes)}`;
  }

  function jsonDetail(record) {
    if (!record.json) return '-';
    const state=record.json.valid?'valid':`broken: ${record.json.error || 'parse error'}`;
    return `${record.json.name} · ${E.formatBytes(record.json.bytes)} · ${state}`;
  }

  function existingDbEntry(record) {
    return Store.getDb().entries.find((entry) => entry.id===record.id || entry.stem===record.stem) || null;
  }

  function openEditor(entry) {
    $('entryId').value=entry.id;
    $('editStem').value=entry.stem;
    $('editTags').value=(entry.tags||[]).join(', ');
    $('editNotes').value=entry.notes||'';
    const dialog=$('editorDialog');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open','');
  }

  function registerRecord(record,openAfter=false) {
    const saved=Store.upsert(record);
    showToast('Asset DBへ登録しました');
    if (openAfter) openEditor(saved);
  }

  function filteredAuditRecords() {
    const query=$('auditSearch').value.trim().toLowerCase();
    const status=$('auditStatusFilter').value;
    return auditRecords.filter((record) => {
      if (status==='NAME_COLLISION' && !record.name_collision) return false;
      if (status!=='all' && status!=='NAME_COLLISION' && record.status!==status) return false;
      if (!query) return true;
      return [
        record.stem,record.base_stem,record.directory,
        record.image?.name,record.image?.path,record.json?.name,record.json?.path,
        record.collect_stem
      ].filter(Boolean).join(' ').toLowerCase().includes(query);
    });
  }

  function renderAudit() {
    updateStats();
    clearPreviewUrls();
    const box=$('auditList');
    const records=filteredAuditRecords();
    box.replaceChildren();
    box.classList.toggle('empty-state',records.length===0);
    if (!records.length) {
      box.textContent=auditRecords.length?'条件に一致するアセットはありません。':'監査結果がここに並びます。';
      return;
    }

    records.forEach((record) => {
      const article=document.createElement('article');
      article.className='asset-row';

      let preview;
      const file=record.image ? sourceFiles.get(record.image.path) : null;
      if (file) {
        preview=document.createElement('img');
        preview.className='asset-thumb';
        preview.alt='';
        const url=URL.createObjectURL(file);
        previewUrls.push(url);
        preview.src=url;
      } else {
        preview=document.createElement('div');
        preview.className='asset-placeholder';
        preview.textContent=record.json?'JSON':'ASSET';
      }

      const main=document.createElement('div');
      const meta=document.createElement('div');
      meta.className='asset-meta';
      meta.append(chip(record.status,statusKind(record)));
      if (record.name_collision) meta.append(chip(`NAME ×${record.collision_group_size}`,'warn'));
      if ((record.extra_images?.length||0)+(record.extra_jsons?.length||0)>0) meta.append(chip('MULTI FILE','warn'));

      const title=document.createElement('h3');
      title.textContent=record.stem;
      const dl=document.createElement('dl');
      dl.className='detail-grid';
      const details=[
        ['Image',imageDetail(record)],
        ['JSON',jsonDetail(record)],
        ['collect',recordFilesLabel(record)],
        ['Source dir',record.directory || '(root)']
      ];
      details.forEach(([label,value]) => {
        const dt=document.createElement('dt');dt.textContent=label;
        const dd=document.createElement('dd');dd.textContent=value;
        dl.append(dt,dd);
      });
      main.append(meta,title,dl);

      const actions=document.createElement('div');
      actions.className='row-actions';
      const add=document.createElement('button');
      add.type='button';
      add.className='primary-button';
      add.textContent=existingDbEntry(record)?'DB更新':'DBへ登録';
      add.addEventListener('click',() => registerRecord(record,false));
      const memo=document.createElement('button');
      memo.type='button';
      memo.textContent='タグ・メモ';
      memo.addEventListener('click',() => {
        const existing=existingDbEntry(record) || Store.upsert(record);
        openEditor(existing);
      });
      actions.append(add,memo);

      article.append(preview,main,actions);
      box.append(article);
    });
  }

  function recordFilesLabel(record) {
    const plan=E.buildCollectPlan([record])[0];
    const extensions=(plan?.files||[]).map((item)=>item.extension).join(' + ');
    return `${record.collect_stem || record.base_stem}${extensions?` · ${extensions}`:''}`;
  }

  function manifestCsv() {
    const head=['stem','status','name_collision','collect_stem','image_path','image_bytes','image_width','image_height','json_path','json_bytes','json_valid','json_error'];
    const rows=[head,...auditRecords.map((r)=>[
      r.stem,r.status,r.name_collision,r.collect_stem,
      r.image?.path||'',r.image?.bytes||0,r.image?.width||0,r.image?.height||0,
      r.json?.path||'',r.json?.bytes||0,r.json?.valid??'',r.json?.error||''
    ])];
    return '\ufeff'+rows.map((row)=>row.map(csvCell).join(',')).join('\r\n');
  }

  function collectPlanObject() {
    return {
      format:'asset-organizer-collect-plan',
      schema_version:1,
      app_version:E.APP_VERSION,
      created_at:E.now(),
      records:E.buildCollectPlan(auditRecords)
    };
  }

  function dbCsv() {
    const head=['stem','status','name_collision','collect_stem','image_path','image_bytes','image_width','image_height','json_path','json_bytes','json_valid','tags','notes','updated_at'];
    const rows=[head,...Store.getDb().entries.map((r)=>[
      r.stem,r.status,r.name_collision,r.collect_stem,
      r.image?.path||'',r.image?.bytes||0,r.image?.width||0,r.image?.height||0,
      r.json?.path||'',r.json?.bytes||0,r.json?.valid??'',r.tags||[],r.notes||'',r.updated_at||''
    ])];
    return '\ufeff'+rows.map((row)=>row.map(csvCell).join(',')).join('\r\n');
  }

  function renderDatabase() {
    const db=Store.getDb();
    const query=$('dbSearch').value.trim().toLowerCase();
    const status=$('dbStatusFilter').value;
    const entries=db.entries.filter((entry) => {
      if (status!=='all' && entry.status!==status) return false;
      if (!query) return true;
      return [
        entry.stem,entry.base_stem,entry.directory,entry.collect_stem,
        ...(entry.tags||[]),entry.notes,entry.image?.path,entry.json?.path
      ].filter(Boolean).join(' ').toLowerCase().includes(query);
    });

    $('dbCount').textContent=String(db.entries.length);
    $('dbPairCount').textContent=String(db.entries.filter((entry)=>entry.status==='PAIR').length);
    $('dbReviewCount').textContent=String(db.entries.filter((entry)=>entry.status!=='PAIR'||entry.name_collision).length);

    const box=$('dbList');
    box.replaceChildren();
    if (!entries.length) {
      const empty=document.createElement('div');
      empty.className='empty-state';
      empty.textContent=db.entries.length?'条件に一致するアセットはありません。':'まだAsset DBに登録されていません。フォルダ監査から登録できます。';
      box.append(empty);
      return;
    }

    entries.forEach((entry) => {
      const article=document.createElement('article');
      article.className='db-entry';
      const main=document.createElement('div');
      const meta=document.createElement('div');
      meta.className='entry-meta';
      meta.append(chip(entry.status,statusKind(entry)));
      if (entry.name_collision) meta.append(chip('NAME COLLISION','warn'));
      (entry.tags||[]).forEach((tag)=>meta.append(chip(tag)));

      const title=document.createElement('h3');
      title.textContent=entry.stem;
      const dl=document.createElement('dl');
      dl.className='detail-grid';
      const details=[
        ['Image',imageDetail(entry)],
        ['JSON',jsonDetail(entry)],
        ['collect',entry.collect_stem||entry.base_stem||'-'],
        ['メモ',entry.notes||'-']
      ];
      details.forEach(([label,value]) => {
        const dt=document.createElement('dt');dt.textContent=label;
        const dd=document.createElement('dd');dd.textContent=value;
        dl.append(dt,dd);
      });
      main.append(meta,title,dl);

      const actions=document.createElement('div');
      actions.className='entry-actions';
      const edit=document.createElement('button');
      edit.type='button';edit.textContent='編集';
      edit.addEventListener('click',()=>openEditor(entry));
      actions.append(edit);

      article.append(main,actions);
      box.append(article);
    });
  }

  async function scanSelectedFolder(files) {
    $('scanFolderButton').disabled=true;
    $('auditSummary').textContent='監査中…';
    try {
      await auditFiles(files);
      showToast(`${auditRecords.length} stemを監査しました`);
    } finally {
      $('scanFolderButton').disabled=false;
    }
  }

  document.querySelectorAll('.studio-tab').forEach((button) => {
    button.addEventListener('click',()=>setView(button.dataset.view));
  });
  document.querySelectorAll('[data-help-key]').forEach((button) => {
    button.addEventListener('click',()=>showHelp(button.dataset.helpKey));
  });
  $('helpDialogClose').addEventListener('click',()=>closeDialog($('helpDialog')));
  $('helpDialog').addEventListener('click',(event)=>{if(event.target===$('helpDialog'))closeDialog($('helpDialog'));});

  $('scanFolderButton').addEventListener('click',()=>$('folderInput').click());
  $('folderInput').addEventListener('change',async(event)=>{
    await scanSelectedFolder([...event.target.files]);
    event.target.value='';
  });
  $('auditSearch').addEventListener('input',renderAudit);
  $('auditStatusFilter').addEventListener('change',renderAudit);

  $('registerAllButton').addEventListener('click',()=>{
    if (!auditRecords.length) {showToast('先にフォルダを監査してください');return;}
    Store.upsertMany(auditRecords);
    showToast(`${auditRecords.length}件をAsset DBへ登録しました`);
  });

  $('exportManifestJsonButton').addEventListener('click',()=>{
    if(!auditRecords.length){showToast('監査結果がありません');return;}
    download('asset-organizer-manifest.json',JSON.stringify(E.manifest(auditRecords),null,2));
  });
  $('exportManifestCsvButton').addEventListener('click',()=>{
    if(!auditRecords.length){showToast('監査結果がありません');return;}
    download('asset-organizer-manifest.csv',manifestCsv(),'text/csv;charset=utf-8');
  });
  $('exportCollectPlanButton').addEventListener('click',()=>{
    if(!auditRecords.length){showToast('監査結果がありません');return;}
    download('asset-organizer-collect-plan.json',JSON.stringify(collectPlanObject(),null,2));
  });

  $('collectButton').addEventListener('click',async()=>{
    if (!window.showDirectoryPicker) {
      showToast('このブラウザはフォルダへの書き込みに対応していません');
      return;
    }
    try {
      const source=await window.showDirectoryPicker({mode:'readwrite'});
      $('collectButton').disabled=true;
      const result=await E.copyToCollect(source,(count)=>{$('auditSummary').textContent=`collectへコピー中 · ${count} files`;});
      showToast(`${result.copied_files}ファイルをcollectへコピーしました`);
      $('auditSummary').textContent=`collect完了 · ${result.copied_files} files copied`;
    } catch (error) {
      if (error?.name!=='AbortError') showToast(error?.message||String(error));
    } finally {
      $('collectButton').disabled=false;
    }
  });

  $('editorForm').addEventListener('submit',(event)=>{
    event.preventDefault();
    const id=$('entryId').value;
    Store.updateEntry(id,{
      tags:$('editTags').value,
      notes:$('editNotes').value
    });
    closeDialog($('editorDialog'));
    showToast('Asset DBを更新しました');
  });
  $('editorCloseButton').addEventListener('click',()=>closeDialog($('editorDialog')));
  $('cancelEditorButton').addEventListener('click',()=>closeDialog($('editorDialog')));
  $('deleteEntryButton').addEventListener('click',()=>{
    const id=$('entryId').value;
    if (!id) return;
    Store.deleteEntry(id);
    closeDialog($('editorDialog'));
    showToast('Asset DBから削除しました');
  });
  $('editorDialog').addEventListener('click',(event)=>{if(event.target===$('editorDialog'))closeDialog($('editorDialog'));});

  $('dbSearch').addEventListener('input',renderDatabase);
  $('dbStatusFilter').addEventListener('change',renderDatabase);
  window.addEventListener('assetorganizer:dbchange',()=>{
    renderDatabase();
    renderAudit();
  });

  $('exportDbButton').addEventListener('click',()=>{
    download('asset-db.json',JSON.stringify(Store.exportObject(),null,2));
    showToast('Asset DBを書き出しました');
  });
  $('exportDbCsvButton').addEventListener('click',()=>{
    if(!Store.getDb().entries.length){showToast('Asset DBは空です');return;}
    download('asset-db.csv',dbCsv(),'text/csv;charset=utf-8');
  });
  $('importDbButton').addEventListener('click',()=>$('dbFileInput').click());
  $('dbFileInput').addEventListener('change',async(event)=>{
    const file=event.target.files?.[0];
    if(!file)return;
    try{
      await Store.importDb(file);
      showToast('Asset DBを読み込みました');
    }catch(error){
      showToast(error?.message||String(error));
    }
    event.target.value='';
  });

  document.addEventListener('keydown',(event)=>{
    if(event.key==='Escape'){
      closeDialog($('editorDialog'));
      closeDialog($('helpDialog'));
    }
  });

  updateStats();
  renderAudit();
  renderDatabase();

  window.AssetOrganizer=Object.freeze({
    version:E.APP_VERSION,
    auditFiles,
    getAuditRecords:()=>E.clone(auditRecords),
    getManifest:()=>E.manifest(auditRecords),
    getCollectPlan:()=>E.clone(E.buildCollectPlan(auditRecords)),
    getDb:Store.getDb,
    registerAll:()=>Store.upsertMany(auditRecords)
  });
})();
