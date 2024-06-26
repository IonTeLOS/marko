self.addEventListener('install', event => {
  console.log('Service Worker installed.');
});

self.addEventListener('activate', event => {
  console.log('Service Worker activated.');
});

self.addEventListener('push', event => {
  console.log('Push notification received:', event);

  let notificationData = {
    title: 'Default Title',
    body: 'This is a default notification message.',
    icon: 'https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/mail/default/48px.svg'
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        ...notificationData,
        ...payload
      };
    } catch (e) {
      console.error('Error parsing push notification data:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.action === 'scheduleNotification') {
    const notificationData = event.data.notification;
    console.log('Scheduling notification with data:', notificationData);

    setTimeout(() => {
      self.registration.showNotification(notificationData.title, {
        body: notificationData.body,
        icon: notificationData.icon
      });
    }, notificationData.delay || 0);
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  console.log('Notification clicked:', event.notification);
  // Handle notification click event as needed
});


