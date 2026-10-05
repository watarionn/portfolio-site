(() => {
  'use strict';

  const standalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const isiOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const installButton=document.getElementById('installPwaButton');
  const DRAFT_KEY='prompt-studio-pwa-draft-v1';
  let deferredPrompt=null;
  let draftTimer=null;

  function showInstallHelp(){
    const dialog=document.getElementById('helpDialog');
    const title=document.getElementById('helpDialogTitle');
    const body=document.getElementById('helpDialogBody');
    if(!dialog||!title||!body) return;
    title.textContent='Prompt Studio をホーム画面に追加';
    body.textContent=isiOS
      ? 'Safariの共有メニューから「ホーム画面に追加」を選ぶと、Prompt Studioを専用アプリのように起動できます。'
      : 'ブラウザの「アプリをインストール」または「ホーム画面に追加」からインストールできます。';
    if(typeof dialog.showModal==='function') dialog.showModal();
    else dialog.setAttribute('open','');
  }

  function saveDraft(){
    if(!standalone||!window.PromptStudio?.getDraftSnapshot) return;
    try{localStorage.setItem(DRAFT_KEY,JSON.stringify(window.PromptStudio.getDraftSnapshot()));}catch{}
  }

  function scheduleDraft(){
    clearTimeout(draftTimer);
    draftTimer=setTimeout(saveDraft,250);
  }

  function restoreDraft(){
    if(!standalone||!window.PromptStudio?.restoreDraft) return;
    try{
      const parsed=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');
      if(parsed) window.PromptStudio.restoreDraft(parsed);
    }catch{}
  }

  function makeDrawer(){
    const panel=document.querySelector('.composer-panel');
    if(!panel) return;
    const savePanel=document.querySelector('.save-panel');
    if(savePanel&&!panel.contains(savePanel)) panel.append(savePanel);

    const sections=[
      ...panel.querySelectorAll(':scope > .panel-section'),
      savePanel
    ].filter(Boolean);
    sections.forEach((section)=>section.classList.add('pwa-drawer-section'));

    const head=document.createElement('div');
    head.className='pwa-drawer-head';
    const label=document.createElement('strong');
    label.textContent='設定';
    const select=document.createElement('select');
    select.id='pwaDrawerSelect';
    select.setAttribute('aria-label','設定カテゴリ');
    const names=['出力先モデル','組み立てルール','画像の内容','DB保存'];
    sections.forEach((section,index)=>{
      const option=document.createElement('option');
      option.value=String(index);
      option.textContent=names[index]||section.querySelector('h2,h3')?.textContent||('設定 '+(index+1));
      select.append(option);
      section.classList.toggle('pwa-drawer-active',index===2);
    });
    select.value='2';

    const close=document.createElement('button');
    close.type='button';
    close.textContent='閉じる';
    head.append(label,select,close);
    panel.prepend(head);

    const setSection=(index)=>{
      select.value=String(index);
      sections.forEach((section,i)=>section.classList.toggle('pwa-drawer-active',i===index));
    };
    const setOpen=(open)=>document.documentElement.classList.toggle('pwa-drawer-open',open);

    select.addEventListener('change',()=>setSection(Number(select.value)));
    close.addEventListener('click',()=>setOpen(false));

    document.getElementById('pwaConditionsButton')?.addEventListener('click',()=>{setSection(2);setOpen(true);});
    document.getElementById('pwaSlotsButton')?.addEventListener('click',()=>{setSection(1);setOpen(true);});
    document.getElementById('pwaFormatButton')?.addEventListener('click',()=>window.PromptStudio?.formatCurrent?.());
    document.getElementById('pwaCopyButton')?.addEventListener('click',()=>window.PromptStudio?.copyCurrent?.());

    panel.querySelector('.composer-actions')?.classList.add('pwa-composer-actions');
  }

  function enhanceStandalone(){
    if(!standalone) return;
    document.documentElement.classList.add('pwa-standalone');

    const composeTab=document.querySelector('.studio-tab[data-view="compose"]');
    const databaseTab=document.querySelector('.studio-tab[data-view="database"]');
    if(composeTab) composeTab.textContent='作成';
    if(databaseTab) databaseTab.textContent='DB';

    const labels=[
      ['helpButton','?'],
      ['importDbButton','読込'],
      ['exportDbButton','保存'],
      ['copyButton','コピー'],
      ['registerButton','DB登録']
    ];
    labels.forEach(([id,label])=>{
      const button=document.getElementById(id);
      if(!button) return;
      if(!button.dataset.fullLabel) button.dataset.fullLabel=button.textContent;
      if(!button.hasAttribute('aria-label')) button.setAttribute('aria-label',button.dataset.fullLabel);
      button.textContent=label;
    });

    const positive=document.getElementById('positiveOutput');
    const negative=document.getElementById('negativeOutput');
    positive?.removeAttribute('readonly');
    negative?.removeAttribute('readonly');
    positive?.setAttribute('spellcheck','false');
    negative?.setAttribute('spellcheck','false');

    makeDrawer();
    restoreDraft();

    document.getElementById('composeView')?.addEventListener('input',scheduleDraft);
    document.getElementById('composeView')?.addEventListener('change',scheduleDraft);
    window.addEventListener('pagehide',saveDraft);
    window.addEventListener('beforeunload',saveDraft);
  }

  if(installButton&&!standalone&&isiOS) installButton.hidden=false;
  window.addEventListener('beforeinstallprompt',(event)=>{
    event.preventDefault();
    deferredPrompt=event;
    if(installButton&&!standalone) installButton.hidden=false;
  });
  installButton?.addEventListener('click',async()=>{
    if(deferredPrompt){
      const prompt=deferredPrompt;
      deferredPrompt=null;
      await prompt.prompt();
      await prompt.userChoice;
      installButton.hidden=true;
      return;
    }
    showInstallHelp();
  });
  window.addEventListener('appinstalled',()=>{deferredPrompt=null;if(installButton)installButton.hidden=true;});

  enhanceStandalone();

  if('serviceWorker' in navigator){
    window.addEventListener('load',()=>{
      navigator.serviceWorker.register('./service-worker.js',{scope:'./'}).catch((error)=>{
        console.warn('Prompt Studio service worker registration failed',error);
      });
    },{once:true});
  }

  window.PromptStudioPWA=Object.freeze({version:'1.0.0',standalone});
})();
