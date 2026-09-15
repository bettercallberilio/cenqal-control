const CACHE_NAME = 'cenqal-control-static-v1';

const STATIC_ASSETS = [
  './manifest.webmanifest',
  './cenqal-icon-192.png',
  './cenqal-icon-512.png',
  './cenqal-apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // No cachear navegación ni URLs con parámetros de sesión/tokens.
  if (
    request.mode === 'navigate' ||
    url.search ||
    request.method !== 'GET'
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // No interceptar llamadas externas como Supabase o Telegram.
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(request));
    return;
  }

  // Cachear únicamente recursos estáticos de la app.
  if (
    STATIC_ASSETS.some(asset =>
      url.pathname.endsWith(asset.replace('./', '/'))
    )
  ) {
    event.respondWith(
      caches.match(request).then(cached =>
        cached || fetch(request).then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, copy));
          return response;
        })
      )
    );
    return;
  }

  event.respondWith(fetch(request));
});
