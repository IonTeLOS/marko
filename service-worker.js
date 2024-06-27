self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('marko-cache-v1').then(function(cache) {
      return cache.addAll([
        '/',
        'newfile.html',
        // Add other files you want to cache
      ]);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
