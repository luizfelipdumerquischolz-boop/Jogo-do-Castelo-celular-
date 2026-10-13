// Service worker do Coroa de Pedra (gerado no build a partir de src/sw-template.js).
// Estratégia: pré-cache completo na instalação e respostas somente do cache.
const VERSION = '__VERSION__';
const CACHE = `coroa-de-pedra-${VERSION}`;
const FILES = __FILES__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(req, { ignoreSearch: true, ignoreVary: true });
      if (hit) return hit;
      // Navegações para qualquer rota abrem o jogo.
      if (req.mode === 'navigate') {
        const index = await cache.match('./', { ignoreVary: true });
        if (index) return index;
      }
      return fetch(req);
    }),
  );
});
