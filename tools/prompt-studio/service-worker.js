'use strict';

// The cache prefix intentionally matches 1.2 so activation retires the old
// offline shell. Browser-local dictionaries are never touched.
const CACHE_PREFIX = 'prompt-studio-';
const CACHE_NAME = CACHE_PREFIX + 'v2.0.0';
const APP_SHELL = [
  './',
  './index.html',
  './v2-next.css?v=2.0.2',
  './v2-next-core.js?v=2.0.2',
  './v2-next.js?v=2.0.2',
  './manifest.webmanifest',
  './favicon.svg',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // An incomplete shell must not replace a working 1.2 installation.
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name =>
      name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME
    ).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function navigationNetworkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request, {cache: 'no-store'});
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) ||
      (await cache.match('./index.html')) ||
      Response.error();
  }
}

async function assetCacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return Response.error();
  }
}

const STATIC_ASSETS = new Set([
  'v2-next.css', 'v2-next-core.js', 'v2-next.js',
  'favicon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'
]);

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith('/prompt-studio/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(navigationNetworkFirst(request));
    return;
  }
  const filename = url.pathname.slice('/prompt-studio/'.length);
  if (STATIC_ASSETS.has(filename)) {
    event.respondWith(assetCacheFirst(request));
  }
  // Manifest and all unrelated paths remain network-fetched.
});
