'use strict';
const NAME='image-lab-v0.3.0';
const FILES=['./','./index.html','./style.css?v=0.2.0','./assets/main.js?v=0.2.0','./icon.svg','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(NAME);await cache.addAll(FILES);await self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const names=await caches.keys();await Promise.all(names.filter(n=>n.startsWith('image-lab-v')&&n!==NAME).map(n=>caches.delete(n)));await self.clients.claim();})()));
self.addEventListener('fetch',event=>{const req=event.request;const url=new URL(req.url);if(req.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith('/image-lab/'))return;
  event.respondWith((async()=>{const cache=await caches.open(NAME);if(req.mode==='navigate'){try{const live=await fetch(req);if(live.ok)return live;}catch{}return (await cache.match('./index.html'))||Response.error();}
  return (await cache.match(req,{ignoreSearch:true}))||(await fetch(req).then(response=>{if(response.ok)cache.put(req,response.clone());return response;}))||Response.error();})());});