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
    } else if (event.data && event.data.action === 'cancelNotification') {
        const uuid = event.data.uuid;
        console.log(`Cancel notification request received for UUID: ${uuid}`);

        // Cancel the notification if it has not been shown yet
        event.waitUntil(
            self.registration.getNotifications().then(notifications => {
                notifications.forEach(notification => {
                    const notificationUUID = notification.data.uuid;
                    if (notificationUUID === uuid) {
                        notification.close();
                        console.log(`Canceled notification with UUID ${uuid}`);
                    }
                });
            })
        );
    } else if (event.data && event.data.action === 'checkNotificationCancellation') {
        const uuid = event.data.uuid;
        console.log(`Check notification cancellation request received for UUID: ${uuid}`);

        // Check if the notification with the UUID should be canceled
        self.registration.getNotifications().then(notifications => {
            notifications.forEach(notification => {
                const notificationUUID = notification.data.uuid;
                if (notificationUUID === uuid) {
                    console.log(`Notification with UUID ${uuid} should be canceled`);
                    notification.close();
                }
            });
        });
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
