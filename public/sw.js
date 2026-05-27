// Service Worker — Evolya'Fit Push Notifications

self.addEventListener('push', function (event) {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: "Evolya'Fit", body: event.data.text(), url: '/' }
  }

  const title = payload.title || "Evolya'Fit"
  const options = {
    body: payload.body || 'Nouveau message de votre coach.',
    icon: '/logo-evolya-icon-v2.png',
    badge: '/logo-evolya-icon-v2.png',
    data: { url: payload.url || '/' },
    vibrate: [100, 50, 100],
    requireInteraction: false,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
