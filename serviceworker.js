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
        new Promise((resolve, reject) => {
            self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
                // Notify clients of new notification
                for (let client of clientList) {
                    client.postMessage({
                        action: 'checkNotificationCancellation',
                        uuid: notificationData.data.uuid
                    });
                }
                resolve();
            }).catch(error => {
                console.error('Error getting client list:', error);
                reject(error);
            });
        }).then(() => {
            return self.registration.showNotification(notificationData.title, {
                body: notificationData.body,
                icon: notificationData.icon,
                data: notificationData.data // Ensure data is passed to the notification
            });
        })
    );
});

const scheduledNotifications = new Map();

self.addEventListener('message', event => {
    if (event.data && event.data.action === 'scheduleNotification') {
        const notificationData = event.data.notification;
        console.log('Scheduling notification with data:', notificationData);

        const timeoutId = setTimeout(() => {
            self.registration.showNotification(notificationData.title, {
                body: notificationData.body,
                icon: notificationData.icon,
                data: notificationData.data
            });
            scheduledNotifications.delete(notificationData.data.uuid);
        }, notificationData.delay || 0);

        scheduledNotifications.set(notificationData.data.uuid, timeoutId);
    } else if (event.data && event.data.action === 'cancelNotification') {
        const uuid = event.data.uuid;
        console.log(`Cancel notification request received for UUID: ${uuid}`);

        if (scheduledNotifications.has(uuid)) {
            clearTimeout(scheduledNotifications.get(uuid));
            scheduledNotifications.delete(uuid);
            console.log(`Canceled scheduled notification with UUID ${uuid}`);
        }

        // Also check for shown notifications
        event.waitUntil(
            self.registration.getNotifications().then(notifications => {
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
                    // Check if there's already an open tab with the target URL
                    for (let i = 0; i < clientList.length; i++) {
                        const client = clientList[i];
                        if (client.url === urlToOpen && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    // If no existing tab with the target URL, open a new one
                    if (clientList[0].focus) {
                        return clientList[0].focus().then(client => client.navigate(urlToOpen));
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
