'use strict';

const CACHE_PREFIX='prompt-studio-';
const CACHE_NAME=CACHE_PREFIX+'v1.1.0';
const APP_SHELL=[
  './',
  './index.html',
  './style.css?v=1.1.0',
  './favicon.svg',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './manifest.webmanifest',
  './engine.js?v=1.1.0',
  './store.js?v=1.1.0',
  './app.js?v=1.1.0',
  './slots.js?v=1.1.0',
  './db-editor.js?v=1.1.0',
  './pwa.js?v=1.0.0'
];

self.addEventListener('install',(event)=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',(event)=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter((name)=>name.startsWith(CACHE_PREFIX)&&name!==CACHE_NAME).map((name)=>caches.delete(name)));
    await self.clients.claim();
  })());
});

async function networkFirst(request){
  const cache=await caches.open(CACHE_NAME);
  try{
    const response=await fetch(request);
    if(response.ok) await cache.put(request,response.clone());
    return response;
  }catch{
    return (await cache.match(request))||(await cache.match('./index.html'))||Response.error();
  }
}

async function staleWhileRevalidate(request){
  const cache=await caches.open(CACHE_NAME);
  const cached=await cache.match(request);
  const network=fetch(request).then(async(response)=>{
    if(response.ok) await cache.put(request,response.clone());
    return response;
  }).catch(()=>null);
  if(cached){network.catch(()=>null);return cached;}
  return (await network)||Response.error();
}

self.addEventListener('fetch',(event)=>{
  const request=event.request;
  if(request.method!=='GET') return;
  const url=new URL(request.url);
  const inScope=url.origin===self.location.origin&&url.pathname.startsWith('/prompt-studio/');
  if(request.mode==='navigate'&&inScope){event.respondWith(networkFirst(request));return;}
  if(inScope) event.respondWith(staleWhileRevalidate(request));
});
