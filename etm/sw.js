/* Hapee · ETM Day — service worker. Precarga todo y responde desde la caché (cache-first).
   Para publicar cambios: sube VERSION (y el ?v= de index.html si cambiaste app.css/app.js). */
var VERSION = 'hapee-etm-v2';
var ARCHIVOS = [
  './',
  './index.html',
  './app.css?v=1',
  './app.js?v=2',
  './manifest.webmanifest',
  './fonts/plus-jakarta-sans.woff2',
  './img/logo-hapee-blanco.svg',
  './img/icon-192.png',
  './img/icon-512.png',
  './img/icon-maskable-512.png',
  './img/apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) {
    return c.addAll(ARCHIVOS.map(function (u) { return new Request(u, { cache: 'reload' }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf('hapee-etm-') === 0 && k !== VERSION; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    // Cualquier navegación dentro de /etm/ abre la app desde la caché
    e.respondWith(caches.open(VERSION).then(function (c) {
      return c.match('./index.html').then(function (r) {
        return r || c.match('./').then(function (r2) { return r2 || fetch(req); });
      });
    }));
    return;
  }
  e.respondWith(caches.open(VERSION).then(function (c) {
    return c.match(req).then(function (r) {
      if (r) return r;
      return fetch(req).then(function (res) {
        if (res && res.ok && res.type === 'basic') c.put(req, res.clone());
        return res;
      });
    });
  }));
});
