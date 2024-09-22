self.addEventListener('install', event => {
    console.log('Service Worker installed.');
});

self.addEventListener('activate', event => {
    console.log('Service Worker activated.');
});

self.addEventListener('push', function(event) {
  // Default options for the notification
  let options = {
    body: 'This is a default message.',
    icon: 'https://raw.githubusercontent.com/IonTeLOS/marko-app/main/triskelion.svg', // Path to your notification icon
    badge: 'https://raw.githubusercontent.com/IonTeLOS/marko-app/main/triskelion.svg', // Path to your notification badge icon
    data: {
      url: '/', // Default URL to open when the notification is clicked
    },
  };

  // Parse and handle the incoming notification payload
  if (event.data) {
    const data = event.data.json(); // Assumes payload is JSON formatted

    options.body = data.body || options.body;
    options.icon = data.icon || options.icon;
    options.badge = data.badge || options.badge;
    options.data.url = data.url || options.data.url; // Use a custom URL if provided
    options.actions = data.actions || []; // Custom actions (buttons) for the notification
  }

  // Show the notification
  event.waitUntil(
    self.registration.showNotification('Notification Title', options)
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
