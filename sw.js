/* Case par Case : garde l'appli disponible hors ligne. Les tomes eux-mêmes sont gardés par l'appli (IndexedDB). */
const VERSION = 'cpc-v4';
const SHELL = [
  './',
  'index.html',
  'app.js?v=4',
  'manifest.webmanifest',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/favicon.png',
  'vendor/pdf.min.js?v=4',
  'vendor/pdf.worker.min.js?v=4',
  'vendor/jszip.min.js?v=4',
  'vendor/libarchive/src/libarchive.js',
  'vendor/libarchive/src/compressed-file.js',
  'vendor/libarchive/dist/worker-bundle.js',
  'vendor/libarchive/dist/wasm-gen/libarchive.wasm'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // Google Drive et Google sign-in : jamais en cache
  if (req.mode === 'navigate') {
    // Page : le réseau d'abord (mises à jour rapides), la copie en cache hors ligne
    e.respondWith(fetch(req).then((r) => {
      const copy = r.clone(); caches.open(VERSION).then((c) => c.put('index.html', copy)).catch(() => {});
      return r;
    }).catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => {
    if (r.ok) { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {}); }
    return r;
  })));
});
