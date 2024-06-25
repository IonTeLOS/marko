// serviceworker.js
self.addEventListener('install', event => {
  console.log('Service Worker installed.');
});

self.addEventListener('activate', event => {
  console.log('Service Worker activated.');
});

// Example: Listen for messages from the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'scheduleNotification') {
    const { title, body, icon, timeToShow } = event.data.payload;

    // Schedule the notification to show at the specified time
    setTimeout(() => {
      self.registration.showNotification(title, {
        body: body,
        icon: icon
      });
    }, timeToShow - Date.now()); // Calculate the delay
  }
});

// Example: Listen for notification click events
self.addEventListener('notificationclick', event => {
  event.notification.close();
  // Handle notification click event as needed
});

