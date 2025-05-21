const CACHE_NAME = 'text-checker-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/offline.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.destination === 'script' || event.request.destination === 'style') {
    event.respondWith(
      caches.match(event.request).then(response => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        });
        return response || fetchPromise;
      })
    );
  }
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('api.languagetool.org')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => caches.match(event.request))
    );
  }
});

self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html'))
    );
  }
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
});

navigator.serviceWorker.ready.then(registration => {
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: '<ваш-публичный-ключ>'
  });
}).then(subscription => {
  console.log('Подписка успешна:', subscription);
});

self.addEventListener('push', event => {
  const data = event.data ? event.data.text() : 'Новое уведомление!';
  event.waitUntil(
    self.registration.showNotification('Проверка текста', {
      body: data,
      icon: '/icons/icon-192.png'
    })
  );
});


