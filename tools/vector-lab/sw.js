// Vector Lab shell cache ONLY. Never cache user images, generated SVG/PNG or imports.
const CACHE="vector-lab-shell-v4-20261112-standalone";
const PREFIX="vector-lab-shell-";
const ASSETS=["./","./index.html","./style.css","./app.mjs","./options.mjs","./worker.mjs",
 "./manifest.webmanifest","./icon.svg","./icon-192.png","./icon-512.png","./apple-touch-icon.png","./licenses.html",
 "./vendor/vtracer10-browser.mjs","./vendor/vtracer_wasm_bg.wasm",
 "./vendor/imagetracer_v1.2.6.js","./vendor/LICENSE-VTRACER",
 "./adapters/primitive.mjs","./adapters/geometrize.mjs","./adapters/primeval.mjs",
 "./vendor/primitive/wasm_exec.js","./vendor/primitive/primitive.wasm",
 "./vendor/primitive/LICENSE-PLAYGROUND","./vendor/primitive/LICENSE-GO",
 "./vendor/geometrize-haxe.js","./vendor/LICENSE-GEOMETRIZE",
 "./vendor/primeval/LICENSE",
 "./vendor/primeval/dist/browser.js","./vendor/primeval/dist/browser-runtime.js",
 "./vendor/primeval/dist/errors.js","./vendor/primeval/dist/data-uri.js",
 "./vendor/primeval/dist/result.js","./vendor/primeval/dist/request.js",
 "./vendor/primeval/dist/types.js","./vendor/primeval/dist/worker-common.js",
 "./vendor/primeval/dist/worker-protocol.js","./vendor/primeval/dist/worker-single.js",
 "./vendor/primeval/dist/worker-threaded.js",
 "./vendor/primeval/wasm/single/primeval.js","./vendor/primeval/wasm/single/primeval_bg.wasm",
 "./vendor/primeval/wasm/threaded/primeval.js","./vendor/primeval/wasm/threaded/primeval_bg.wasm",
 "./vendor/primeval/wasm/single/snippets/primeval-wasm-7cebd9fb8a7a84be/inline0.js",
 "./vendor/primeval/wasm/threaded/snippets/primeval-wasm-7cebd9fb8a7a84be/inline0.js"];
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
