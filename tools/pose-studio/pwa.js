(() => {
  'use strict';

  const installButton=document.getElementById('installPwaButton');
  const standalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const isiOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  let deferredPrompt=null;

  if(standalone){
    document.documentElement.classList.add('pwa-standalone');
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
    version:'1.0.0',
    standalone
  });
})();
