(() => {
  'use strict';

  const Store=window.PoseStudioStore;
  const $=(id)=>document.getElementById(id);
  let toastTimer=null;

  const HELP={
    quickstart:{
      title:'Pose Studio の使い方',
      body:'1. まず「3Dポーズ」で大まかな姿勢を作ります。\n2. 「現在視点を2Dへ送る」で、その見え方を2D骨格へ変換できます。\n3. 「2Dポーズ」でControlNet向けに関節位置を細かく調整します。\n4. 気に入ったポーズは「DBに登録」で保存します。\n5. OpenPose画像・JSON、通常PNG、SVGなど必要な形式で書き出します。\n\n最初から2Dだけを使うこともできます。\n\n関節を動かしすぎたときは、作業面上部の「元に戻す / やり直す」を使えます。PCでは Ctrl/Cmd + Z、Ctrl/Cmd + Shift + Z でも操作できます。'
    },
    'preset-view':{
      title:'プリセットと視点',
      body:'プリセットは立つ・歩く・座るなどの基本姿勢を一度に読み込みます。視点は正面・右・背面・左へすぐ切り替えられます。背景をドラッグすれば自由な角度から確認できます。'
    },
    joint3d:{
      title:'3Dの関節編集',
      body:'水色の関節マーカーを指でそのまま掴んで動かせます。手首や足首を動かすと、腕や脚の長さを保ったまま肩・ひじ・股・膝の角度を自動計算します。細かく詰めたいときだけX・Y・Zのレバーを使えます。'
    },
    output3d:{
      title:'3Dからの出力',
      body:'現在の見た目を透明PNGで保存するほか、正面・右・背面・左の4方向シート、OpenPose画像、OpenPose JSON、3Dポーズデータを書き出せます。'
    },
    animation:{
      title:'動きの確認',
      body:'ポーズAとBを登録すると、その間を滑らかに往復させて確認できます。GIFや動画として保存できるので、動作のつながりや中間姿勢を考える資料にも使えます。'
    },
    'save-db':{
      title:'ポーズDBへ保存',
      body:'作ったポーズをタイトルとタグ付きで保存します。3Dから保存した場合は3Dの関節角度と、その時の視点を2Dへ投影した骨格の両方を保存します。'
    },
    pose2d:{
      title:'2Dポーズ編集',
      body:'OpenPose用の関節位置を直接ドラッグして編集します。3Dから送った姿勢を最後に詰める用途のほか、2Dだけでポーズを作ることもできます。'
    },
    assist2d:{
      title:'2Dの編集補助',
      body:'「骨の長さを固定」は初期ONです。ひじや膝を動かしても腕・脚が伸び縮みせず、関節角度だけを変えられます。左右対称編集、グリッド、関節名、椅子ガイドもここで切り替えられます。'
    },
    reference:{
      title:'下絵・トレース',
      body:'画像を下絵として読み込み、その上に骨格を重ねて関節位置を合わせられます。下絵はブラウザ内だけで扱い、ポーズDBには保存しません。'
    },
    joint2d:{
      title:'2Dの関節編集',
      body:'選択中の関節を数値座標でも微調整できます。キャンバス上ではドラッグ、キーボードでは矢印キーで移動できます。Shiftを押しながら矢印キーを使うと大きく動きます。'
    },
    output2d:{
      title:'2Dからの出力',
      body:'ControlNetへ渡しやすいPNG、編集しやすいSVG、COCO18形式のOpenPose JSON、再編集用の2DポーズJSONを書き出せます。'
    },
    database:{
      title:'ポーズDB',
      body:'3Dと2Dのポーズを同じ場所に保存します。3Dから保存したポーズは3Dへ戻して編集でき、2D骨格も一緒に保存されるので2Dへ読み込むこともできます。'
    }
  };

  function toast(message){
    const el=$('toast');
    el.textContent=message;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>el.classList.add('hidden'),2400);
  }

  function showHelp(key){
    const item=HELP[key];
    if(!item) return;
    $('helpDialogTitle').textContent=item.title;
    $('helpDialogBody').textContent=item.body;
    const dialog=$('helpDialog');
    if(typeof dialog.showModal==='function') dialog.showModal();
    else dialog.setAttribute('open','');
  }

  function closeHelp(){
    const dialog=$('helpDialog');
    if(typeof dialog.close==='function'&&dialog.open) dialog.close();
    else dialog.removeAttribute('open');
  }

  function setView(name){
    document.querySelectorAll('.studio-tab').forEach((button)=>{
      const active=button.dataset.view===name;
      button.classList.toggle('active',active);
      button.setAttribute('aria-selected',String(active));
    });
    ['pose3d','pose2d','database'].forEach((viewName)=>{
      const section=$(viewName+'View');
      const active=viewName===name;
      section.classList.toggle('active',active);
      section.hidden=!active;
    });
    if(name==='database') renderDb();
    if(name==='pose2d') requestAnimationFrame(()=>window.PoseStudio2D?.setState(window.PoseStudio2D.getState(),{resetHistory:false}));
    updateHistoryButtons();
  }

  function updateHistoryButtons(){
    const p3=window.PoseStudio3D;
    const p2=window.PoseStudio2D;
    $('undo3dButton').disabled=!p3?.canUndo?.();
    $('redo3dButton').disabled=!p3?.canRedo?.();
    $('undo2dButton').disabled=!p2?.canUndo?.();
    $('redo2dButton').disabled=!p2?.canRedo?.();
  }

  function activeEditor(){
    if(!$('pose3dView').hidden) return window.PoseStudio3D;
    if(!$('pose2dView').hidden) return window.PoseStudio2D;
    return null;
  }

  function undoActive(){
    const editor=activeEditor();
    if(editor?.undo?.()) updateHistoryButtons();
  }

  function redoActive(){
    const editor=activeEditor();
    if(editor?.redo?.()) updateHistoryButtons();
  }

  function splitTags(value){
    return [...new Set(String(value||'').split(',').map((x)=>x.trim()).filter(Boolean))];
  }

  function defaultTitle(prefix){
    return `${prefix} ${new Date().toLocaleString('ja-JP')}`;
  }

  function save3d(){
    if(!window.PoseStudio3D){
      toast('3D機能を読み込めませんでした');
      return;
    }
    const title=$('pose3dTitle').value.trim()||defaultTitle('3Dポーズ');
    const tags=splitTags($('pose3dTags').value);
    const pose3d=window.PoseStudio3D.getState();
    const pose2d=window.PoseStudio2D.getState();
    pose2d.points=window.PoseStudio3D.projectTo2D();
    Store.addEntry({title,tags,source_mode:'3d',pose3d,pose2d});
    $('pose3dTitle').value='';
    toast('ポーズDBへ保存しました');
  }

  function save2d(){
    const title=$('pose2dTitle').value.trim()||defaultTitle('2Dポーズ');
    const tags=splitTags($('pose2dTags').value);
    Store.addEntry({
      title,
      tags,
      source_mode:'2d',
      pose3d:null,
      pose2d:window.PoseStudio2D.getState()
    });
    $('pose2dTitle').value='';
    toast('ポーズDBへ保存しました');
  }

  function transfer3dTo2d(){
    if(!window.PoseStudio3D){
      toast('3D機能を読み込めませんでした');
      return;
    }
    const points=window.PoseStudio3D.projectTo2D();
    window.PoseStudio2D.loadProjected(points);
    setView('pose2d');
    toast('3Dの現在視点を2Dへ送りました');
  }

  function renderDb(){
    const db=Store.getDb();
    const query=$('poseDbSearch').value.trim().toLowerCase();
    const filter=$('poseDbSourceFilter').value;
    const entries=db.entries.filter((entry)=>{
      if(filter!=='all'&&entry.source_mode!==filter) return false;
      if(!query) return true;
      return [entry.title,...(entry.tags||[])].join(' ').toLowerCase().includes(query);
    });

    $('poseDbCount').textContent=String(db.entries.length);
    $('poseDb3dCount').textContent=String(db.entries.filter((entry)=>!!entry.pose3d).length);
    $('poseDb2dCount').textContent=String(db.entries.filter((entry)=>!!entry.pose2d).length);

    const list=$('poseDbList');
    list.replaceChildren();

    if(!entries.length){
      const empty=document.createElement('div');
      empty.className='pose-db-empty';
      empty.textContent=db.entries.length?'条件に一致するポーズはありません。':'まだポーズが保存されていません。3Dまたは2Dで作って「DBに登録」してください。';
      list.append(empty);
      return;
    }

    entries.forEach((entry)=>{
      const article=document.createElement('article');
      article.className='pose-db-entry';

      const preview=document.createElement('canvas');
      preview.className='pose-db-preview';
      preview.width=300;
      preview.height=380;
      if(entry.pose2d) window.PoseStudio2D.renderPreview(preview,entry.pose2d);

      const info=document.createElement('div');
      info.className='pose-db-info';
      const title=document.createElement('h3');
      title.textContent=entry.title;
      const meta=document.createElement('div');
      meta.className='pose-db-meta';
      meta.textContent=`${entry.source_mode==='3d'?'3Dから保存':'2Dから保存'} · ${entry.created_at?new Date(entry.created_at).toLocaleString('ja-JP'):''}`;
      const tags=document.createElement('div');
      tags.className='pose-db-tags';
      tags.textContent=(entry.tags||[]).join(' · ')||'タグなし';
      info.append(title,meta,tags);

      const actions=document.createElement('div');
      actions.className='pose-db-actions';

      if(entry.pose3d){
        const load3d=document.createElement('button');
        load3d.type='button';
        load3d.textContent='3Dへ読み込む';
        load3d.addEventListener('click',()=>{
          window.PoseStudio3D?.setState(entry.pose3d);
          $('pose3dTitle').value=entry.title;
          $('pose3dTags').value=(entry.tags||[]).join(', ');
          setView('pose3d');
          toast('3Dへ読み込みました');
        });
        actions.append(load3d);
      }

      if(entry.pose2d){
        const load2d=document.createElement('button');
        load2d.type='button';
        load2d.textContent='2Dへ読み込む';
        load2d.addEventListener('click',()=>{
          window.PoseStudio2D.setState(entry.pose2d);
          $('pose2dTitle').value=entry.title;
          $('pose2dTags').value=(entry.tags||[]).join(', ');
          setView('pose2d');
          toast('2Dへ読み込みました');
        });
        actions.append(load2d);
      }

      const del=document.createElement('button');
      del.type='button';
      del.className='danger-button';
      del.textContent='削除';
      del.addEventListener('click',()=>{
        Store.deleteEntry(entry.id);
        toast('ポーズDBから削除しました');
      });
      actions.append(del);

      article.append(preview,info,actions);
      list.append(article);
    });
  }

  function download(name,content){
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([content],{type:'application/json'}));
    a.download=name;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1200);
  }

  document.querySelectorAll('.studio-tab').forEach((button)=>{
    button.addEventListener('click',()=>setView(button.dataset.view));
  });

  document.querySelectorAll('[data-help-key]').forEach((button)=>{
    button.addEventListener('click',()=>showHelp(button.dataset.helpKey));
  });
  $('helpDialogClose').addEventListener('click',closeHelp);
  $('helpDialog').addEventListener('click',(event)=>{if(event.target===$('helpDialog'))closeHelp();});

  $('undo3dButton').addEventListener('click',()=>{window.PoseStudio3D?.undo?.();updateHistoryButtons();});
  $('redo3dButton').addEventListener('click',()=>{window.PoseStudio3D?.redo?.();updateHistoryButtons();});
  $('undo2dButton').addEventListener('click',()=>{window.PoseStudio2D?.undo?.();updateHistoryButtons();});
  $('redo2dButton').addEventListener('click',()=>{window.PoseStudio2D?.redo?.();updateHistoryButtons();});
  $('to2dButton').addEventListener('click',transfer3dTo2d);
  $('save3dToDbButton').addEventListener('click',save3d);
  $('save2dToDbButton').addEventListener('click',save2d);

  $('poseDbSearch').addEventListener('input',renderDb);
  $('poseDbSourceFilter').addEventListener('change',renderDb);
  window.addEventListener('posestudio:dbchange',renderDb);
  window.addEventListener('posestudio:historychange',updateHistoryButtons);

  document.addEventListener('keydown',(event)=>{
    const tag=event.target?.tagName?.toLowerCase();
    if(tag==='input'||tag==='textarea'||tag==='select'||event.target?.isContentEditable) return;
    const command=event.ctrlKey||event.metaKey;
    if(!command) return;
    const key=event.key.toLowerCase();
    if(key==='z'){
      event.preventDefault();
      if(event.shiftKey) redoActive();
      else undoActive();
    }else if(key==='y'){
      event.preventDefault();
      redoActive();
    }
  });

  $('exportDbButton').addEventListener('click',()=>{
    download('pose-db.json',JSON.stringify(Store.exportObject(),null,2));
    toast('ポーズDBを書き出しました');
  });

  $('importDbButton').addEventListener('click',()=>$('dbFileInput').click());
  $('dbFileInput').addEventListener('change',async(event)=>{
    const file=event.target.files?.[0];
    if(!file) return;
    try{
      await Store.importDb(file);
      toast('ポーズDBを読み込みました');
    }catch(error){
      toast(error.message||String(error));
    }
    event.target.value='';
  });

  renderDb();
  updateHistoryButtons();

  window.PoseStudio=Object.freeze({
    version:'1.3.0',
    setView,
    getDb:Store.getDb,
    save3d,
    save2d,
    transfer3dTo2d
  });
})();
