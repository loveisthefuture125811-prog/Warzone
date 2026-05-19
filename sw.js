const CACHE = 'warzone-armory-v2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './weapons.js',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=VT323&display=swap'
];

// Install: cache all assets fresh
self.addEventListener('install', e => {
  e.waitUntil(
    caches.delete(CACHE)
      .then(() => caches.open(CACHE))
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: wipe every old cache, take control immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => caches.open(CACHE))
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.clients.claim())
  );
});

// Fetch: network-first for JS, cache-first for everything else
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isJS = url.pathname.endsWith('.js');

  if (isJS) {
    // Network-first: always get fresh JS, update cache, fall back to cache
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Cache-first for static assets (icons, html, fonts)
    e.respondWith(
      caches.match(e.request)
        .then(cached => cached || fetch(e.request)
          .catch(() => caches.match('./index.html')))
    );
  }
});
