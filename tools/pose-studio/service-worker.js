'use strict';

const CACHE_PREFIX='pose-studio-';
const CACHE_NAME=CACHE_PREFIX+'v1.3.0';
const APP_SHELL=[
  './',
  './index.html',
  './style.css?v=1.3.0',
  './favicon.svg',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './manifest.webmanifest',
  './gif.js?v=1.2.0',
  './store.js?v=1.2.0',
  './pose2d.js?v=1.2.0',
  './pose3d.js?v=1.2.0',
  './app.js?v=1.3.0',
  './pwa.js?v=1.0.0'
];
const RUNTIME_ASSETS=[
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
];

self.addEventListener('install',(event)=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    await Promise.allSettled(RUNTIME_ASSETS.map(async(url)=>{
      const response=await fetch(url,{mode:'no-cors',cache:'no-cache'});
      await cache.put(url,response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',(event)=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names
      .filter((name)=>name.startsWith(CACHE_PREFIX)&&name!==CACHE_NAME)
      .map((name)=>caches.delete(name)));
    await self.clients.claim();
  })());
});

async function networkFirst(request){
  const cache=await caches.open(CACHE_NAME);
  try{
    const response=await fetch(request);
    if(response.ok) await cache.put(request,response.clone());
    return response;
  }catch(error){
    return (await cache.match(request))||(await cache.match('./index.html'))||Response.error();
  }
}

async function staleWhileRevalidate(request){
  const cache=await caches.open(CACHE_NAME);
  const cached=await cache.match(request);
  const network=fetch(request).then(async(response)=>{
    if(response.ok||response.type==='opaque') await cache.put(request,response.clone());
    return response;
  }).catch(()=>null);
  if(cached){
    network.catch(()=>null);
    return cached;
  }
  return (await network)||Response.error();
}

self.addEventListener('fetch',(event)=>{
  const request=event.request;
  if(request.method!=='GET') return;

  const url=new URL(request.url);
  const inScope=url.origin===self.location.origin&&url.pathname.startsWith('/pose-studio/');
  const runtimeAsset=RUNTIME_ASSETS.includes(url.href);

  if(request.mode==='navigate'&&inScope){
    event.respondWith(networkFirst(request));
    return;
  }

  if(inScope||runtimeAsset){
    event.respondWith(staleWhileRevalidate(request));
  }
});
