// Service Worker — Controle de Obra
// Faz cache do app para abrir offline e permitir instalação como PWA.
const CACHE = 'obra-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  // Nunca faz cache das chamadas ao Google Apps Script (dados sempre ao vivo)
  if (req.url.includes('script.google.com') || req.url.includes('script.googleusercontent.com')) {
    return; // deixa passar direto para a rede
  }
  if (req.method !== 'GET') return;
  // Estratégia: cache primeiro, rede como fallback (app estático)
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      // guarda cópia dos próprios arquivos do app
      if (res && res.status === 200 && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
