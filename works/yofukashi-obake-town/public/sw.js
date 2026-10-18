/* Offline-first PWA service worker. Scoped only to this game directory. */
const CACHE = 'obake-town-v1.0.0';
const SHELL = ['./','./index.html','./style.css','./game.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([caches.keys().then(names=>Promise.all(names.filter(name=>name.startsWith('obake-town-')&&name!==CACHE).map(name=>caches.delete(name)))),self.clients.claim()]));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==location.origin)return;
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});
