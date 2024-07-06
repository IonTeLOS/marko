importScripts('https://www.gstatic.com/firebasejs/8.6.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.6.2/firebase-messaging.js');

const firebaseConfig = {
  apiKey: "AIzaSyD96IBVqGKVEdmXIVCYL_7kvlBhJNSD1Ww",
  authDomain: "marko-be9a9.firebaseapp.com",
  databaseURL: "https://marko-be9a9-default-rtdb.firebaseio.com",
  projectId: "marko-be9a9",
  storageBucket: "marko-be9a9.appspot.com",
  messagingSenderId: "7036670175",
  appId: "1:7036670175:web:99992356716578ea13996a"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: payload.notification.icon,
      data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });

  self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    const path = event.notification.data.path;

    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then(clientList => {
        if (clientList.length > 0) {
          // Focus on the first client that is already open
          const client = clientList[0];
          client.postMessage({
            action: 'open_url',
            url: path
          });
          return client.focus();
        } else {
          // If no clients are open, open a new window
          return clients.openWindow(path);
        }
      })
    );
  });

  // Caching during installation
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

  // Fetching from cache
  self.addEventListener('fetch', function(event) {
    event.respondWith(
      caches.match(event.request).then(function(response) {
        return response || fetch(event.request);
      })
    );
  });
} catch (error) {
  console.error('Firebase initialization error in Service Worker:', error);
}
