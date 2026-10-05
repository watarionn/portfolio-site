(() => {
  'use strict';

  const installButton=document.getElementById('installPwaButton');
  const standalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const isiOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  let deferredPrompt=null;

  if(standalone){
    document.documentElement.classList.add('pwa-standalone');
    enhanceStandaloneLayout();
  }

  function enhanceStandaloneLayout(){
    if(!standalone) return;

    const compactLabels=[
      ['helpButton','?'],
      ['importDbButton','読込'],
      ['exportDbButton','保存']
    ];
    compactLabels.forEach(([id,label])=>{
      const button=document.getElementById(id);
      if(!button) return;
      if(!button.dataset.fullLabel) button.dataset.fullLabel=button.textContent;
      button.textContent=label;
    });

    document.querySelectorAll('.editor-layout').forEach((layout)=>{
      const stageToolbar=layout.querySelector('.stage-toolbar .toolbar-actions');
      const panel=layout.querySelector('.control-panel');
      if(!stageToolbar||!panel||panel.dataset.pwaEnhanced==='true') return;
      panel.dataset.pwaEnhanced='true';

      const sections=[...panel.children].filter((child)=>
        child.classList.contains('control-section')||child.classList.contains('save-meta')
      );
      if(!sections.length) return;

      const panelHead=document.createElement('div');
      panelHead.className='pwa-panel-head';

      const title=document.createElement('strong');
      title.textContent='操作';

      const select=document.createElement('select');
      select.className='pwa-panel-select';
      select.setAttribute('aria-label','操作カテゴリ');

      sections.forEach((section,index)=>{
        const heading=section.querySelector('h2')?.textContent?.trim()||`操作 ${index+1}`;
        const option=document.createElement('option');
        option.value=String(index);
        option.textContent=heading;
        select.append(option);
        section.classList.toggle('pwa-section-active',index===0);
      });

      const close=document.createElement('button');
      close.type='button';
      close.className='pwa-panel-close';
      close.textContent='閉じる';

      panelHead.append(title,select,close);
      panel.prepend(panelHead);

      const toggle=document.createElement('button');
      toggle.type='button';
      toggle.className='pwa-control-toggle';
      toggle.textContent='操作';
      toggle.setAttribute('aria-expanded','false');
      toggle.setAttribute('aria-label','操作パネルを開く');
      stageToolbar.append(toggle);

      const setOpen=(open)=>{
        layout.classList.toggle('pwa-panel-open',open);
        toggle.setAttribute('aria-expanded',String(open));
      };

      toggle.addEventListener('click',()=>setOpen(!layout.classList.contains('pwa-panel-open')));
      close.addEventListener('click',()=>setOpen(false));
      select.addEventListener('change',()=>{
        const selected=Number(select.value);
        sections.forEach((section,index)=>section.classList.toggle('pwa-section-active',index===selected));
      });
    });
  }

  function showInstallHelp(){
    const dialog=document.getElementById('helpDialog');
    const title=document.getElementById('helpDialogTitle');
    const body=document.getElementById('helpDialogBody');
    if(!dialog||!title||!body) return;
    title.textContent='Pose Studio をホーム画面に追加';
    body.textContent=isiOS
      ? 'Safariの共有メニューを開き、「ホーム画面に追加」を選ぶとPose Studioをアプリのように起動できます。追加後はホーム画面のPose Studioアイコンから直接開けます。'
      : 'ブラウザのメニューから「アプリをインストール」または「ホーム画面に追加」を選ぶと、Pose Studioを独立したアプリのように起動できます。';
    if(typeof dialog.showModal==='function') dialog.showModal();
    else dialog.setAttribute('open','');
  }

  if(installButton&&!standalone&&isiOS){
    installButton.hidden=false;
  }

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

  window.addEventListener('appinstalled',()=>{
    if(installButton) installButton.hidden=true;
    deferredPrompt=null;
  });

  if('serviceWorker' in navigator){
    window.addEventListener('load',()=>{
      navigator.serviceWorker.register('./service-worker.js',{scope:'./'}).catch((error)=>{
        console.warn('Pose Studio service worker registration failed',error);
      });
    },{once:true});
  }

  window.PoseStudioPWA=Object.freeze({
    version:'1.1.0',
    standalone
  });
})();
