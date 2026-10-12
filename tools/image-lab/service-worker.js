'use strict';
const NAME='image-lab-v0.6.0';
// Pin precise release assets. Never cache-bust solely using query parameters.
const FILES=[
 './','./index.html','./style-v0.6.0.css','./assets/main-v0.6.0.js',
 './icon.svg','./icon-192.png','./icon-512.png',
 './apple-touch-icon.png','./manifest.webmanifest'
];
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(NAME);
 await cache.addAll(FILES);
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const names=await caches.keys();
 await Promise.all(names.filter(n=>n.startsWith('image-lab-v')&&n!==NAME).map(n=>caches.delete(n)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith('/image-lab/'))return;
 event.respondWith((async()=>{
  const cache=await caches.open(NAME);
  if(req.mode==='navigate'){
   try{
    const live=await fetch(req);
    if(live.ok)return live;
   }catch{}
   return await cache.match('./index.html')||Response.error();
  }
  // Exact URL matching prevents a cached v0.2 query from satisfying v0.3.
  const cached=await cache.match(req);
  if(cached)return cached;
  try{
   const live=await fetch(req);
   if(live.ok)await cache.put(req,live.clone());
   return live;
  }catch{
   return Response.error();
  }
 })());
});
