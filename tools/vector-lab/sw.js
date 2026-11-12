// Vector Lab shell cache ONLY. Never cache user images, generated SVG/PNG or imports.
const CACHE="vector-lab-shell-v1-20261112";
const PREFIX="vector-lab-shell-";
const ASSETS=["./","./index.html","./style.css","./app.mjs","./options.mjs","./worker.mjs",
 "./manifest.webmanifest","./icon.svg","./licenses.html",
 "./vendor/vtracer10-browser.mjs","./vendor/vtracer_wasm_bg.wasm",
 "./vendor/imagetracer_v1.2.6.js","./vendor/LICENSE-VTRACER"];
self.addEventListener("install",event=>event.waitUntil(
  caches.open(CACHE).then(cache=>cache.addAll(ASSETS))
));
self.addEventListener("activate",event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
));
self.addEventListener("fetch",event=>{
  const req=event.request;if(req.method!=="GET")return;
  const u=new URL(req.url),base=new URL(self.registration.scope);
  if(u.origin!==base.origin)return;
  const pathname=u.pathname;
  const allowed=ASSETS.map(p=>new URL(p,base).pathname);
  if(!allowed.includes(pathname))return;
  event.respondWith(fetch(req).catch(()=>caches.match(new Request(new URL(pathname,base.origin)))));
});
