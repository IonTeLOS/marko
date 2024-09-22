self.addEventListener('install', event => {
    console.log('Service Worker installed.');
});

self.addEventListener('activate', event => {
    console.log('Service Worker activated.');
});

self.addEventListener('push', function(event) {
  console.log('Push event received:', event);
  
  let data = {};
  
  if (event.data) {
    data = event.data.json();
    console.log('Push data:', data);
  }

  const options = {
    body: data.body || 'Notification',
    icon: data.icon || 'https://raw.githubusercontent.com/IonTeLOS/marko-app/main/triskelion.svg',
    badge: data.badge || 'https://raw.githubusercontent.com/IonTeLOS/marko-app/main/triskelion.svg',
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Title', options)
  );
});

// Handle notification click events
self.addEventListener('notificationclick', function(event) {
  event.notification.close(); // Close the notification when clicked

  // Handle the click event (navigate to a URL or perform another action)
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // If there is an open tab with the app, focus on it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      // If no tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});

// Optional: Handle notification close events (e.g., track dismissal)
self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed', event.notification);
});
