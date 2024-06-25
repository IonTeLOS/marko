self.addEventListener('install', event => {
  console.log('Service Worker installed');
});

self.addEventListener('activate', event => {
  console.log('Service Worker activated');
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  // Handle notification click event (e.g., open a specific URL)
});

self.addEventListener('notificationclose', event => {
  console.log('Notification closed:', event);
});

self.addEventListener('push', event => {
  console.log('Push notification received:', event);
  const notificationOptions = {
    body: 'This is a push notification from your web app!',
    icon: 'https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/mail/default/48px.svg'
  };
  event.waitUntil(self.registration.showNotification('Push Notification', notificationOptions));
});
 
