// serviceworker.js
self.addEventListener('install', event => {
  console.log('Service Worker installed.');
});

self.addEventListener('activate', event => {
  console.log('Service Worker activated.');
});

self.addEventListener('message', event => {
  if (event.data && event.data.action === 'scheduleNotification') {
    const notificationData = event.data.notification;
    
    setTimeout(() => {
      self.registration.showNotification(notificationData.title, {
        body: notificationData.body,
        icon: notificationData.icon
      });
    }, notificationData.delay);
  }
});

// Example: Listen for notification click events
self.addEventListener('notificationclick', event => {
  event.notification.close();
  // Handle notification click event as needed
});

