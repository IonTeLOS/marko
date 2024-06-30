const DB_NAME = 'NotificationsDB';
const STORE_NAME = 'notifications';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore(STORE_NAME, { keyPath: 'data.uuid' });
    };
  });
}

async function storeNotification(notification) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(notification);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function getStoredNotifications() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function deleteNotification(uuid) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(uuid);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

self.addEventListener('message', event => {
  if (event.data && event.data.action === 'storeNotification') {
    storeNotification(event.data.notification);
  } else if (event.data && event.data.action === 'cancelNotification') {
    const uuid = event.data.uuid;
    console.log(`Cancel notification request received for UUID: ${uuid}`);
    deleteNotification(uuid);
  }
});

self.addEventListener('sync', event => {
  if (event.tag === 'show-notification') {
    event.waitUntil(
      getStoredNotifications().then(notifications => {
        return Promise.all(notifications.map(notification => {
          const now = new Date();
          const scheduledTime = new Date(notification.data.scheduledTime);
          
          if (scheduledTime <= now) {
            return self.registration.showNotification(notification.title, notification)
              .then(() => deleteNotification(notification.data.uuid));
          } else {
            const delay = scheduledTime.getTime() - now.getTime();
            setTimeout(() => {
              self.registration.showNotification(notification.title, notification)
                .then(() => deleteNotification(notification.data.uuid));
            }, delay);
            return Promise.resolve();
          }
        }));
      })
    );
  }
});

// Handle push events
self.addEventListener('push', event => {
  console.log('Push notification received:', event);

  let notificationData = {
    title: 'Marko Notification',
    body: 'open your reminder...',
    icon: 'https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/notification_active/default/48px.svg',
    data: {}
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = { ...notificationData, ...payload };
      console.log('Parsed payload:', payload);
    } catch (e) {
      console.error('Error parsing push notification data:', e);
    }
  }

  event.waitUntil(
    storeNotification(notificationData)
      .then(() => self.registration.sync.register('show-notification'))
      .then(() => {
        console.log('Notification scheduled for sync');
      })
  );
});

// Handle message events (for cancelling notifications)
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'cancelNotification') {
    const uuid = event.data.uuid;
    console.log(`Cancel notification request received for UUID: ${uuid}`);

    event.waitUntil(
      deleteNotification(uuid)
        .then(() => self.registration.getNotifications())
        .then(notifications => {
          notifications.forEach(notification => {
            if (notification.data && notification.data.uuid === uuid) {
              notification.close();
              console.log(`Closed shown notification with UUID ${uuid}`);
            }
          });
        })
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  console.log('Notification clicked:', event.notification);
  console.log('Notification data:', event.notification.data);

  const uuid = event.notification.data ? event.notification.data.uuid : null;
  console.log('UUID from notification data:', uuid);

  if (uuid) {
    const urlToOpen = `https://teloslinux.org/marko/newfile?uuid=${uuid}`;
    console.log('Opening URL:', urlToOpen);

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        if (clientList.length > 0) {
          for (let client of clientList) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        }
        return clients.openWindow(urlToOpen);
      })
    );
  } else {
    console.error('UUID is missing in notification data');
    const defaultUrl = 'https://teloslinux.org/marko/newfile';
    event.waitUntil(clients.openWindow(defaultUrl));
  }
});

// Service Worker installation
self.addEventListener('install', event => {
  console.log('Service Worker installed.');
});

// Service Worker activation
self.addEventListener('activate', event => {
  console.log('Service Worker activated.');
});
