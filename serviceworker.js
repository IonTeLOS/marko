self.addEventListener('install', event => {
  console.log('Service Worker installed.');
});

self.addEventListener('activate', event => {
  console.log('Service Worker activated.');
});

self.addEventListener('push', event => {
  console.log('Push notification received:', event);

  let notificationData = {
    title: 'Marko Notification',
    body: 'open your reminder...',
    icon: 'https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/notification_active/default/48px.svg',
    data: {} // Initialize data as an empty object
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        ...notificationData,
        ...payload
      };
      console.log('Parsed payload:', payload);
    } catch (e) {
      console.error('Error parsing push notification data:', e);
    }
  }

  console.log('Notification data to be shown:', notificationData);

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      data: notificationData.data // Ensure data is passed to the notification
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
        icon: notificationData.icon,
        data: notificationData.data // Ensure data is passed to the notification
      });
    }, notificationData.delay || 0);
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  console.log('Notification clicked:', event.notification);

const uuid = event.notification.data ? event.notification.data.uuid : null;
console.log('UUID from notification data:', uuid);

  if (uuid) {
    const urlToOpen = `https://teloslinux.org/marko/newfile?uuid=${uuid}`;
    console.log('Opening URL:', urlToOpen);

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        if (clientList.length > 0) {
          let client = clientList[0];
          for (let i = 0; i < clientList.length; i++) {
            if (clientList[i].url === urlToOpen && 'focus' in clientList[i]) {
              return clientList[i].focus();
            }
          }
          if (client && 'navigate' in client) {
            return client.navigate(urlToOpen);
          }
        }
        return clients.openWindow(urlToOpen);
      })
    );
  } else {
    console.error('UUID is missing in notification data');
  }
});
