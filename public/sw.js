// Service Worker — Evolya'Fit (Push Notifications + page hors-ligne)

const OFFLINE_URL = '/offline.html'
const OFFLINE_CACHE = 'evolya-offline-v1'

// Mettre en cache la page hors-ligne à l'installation
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(OFFLINE_CACHE)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting())
  )
})

// Nettoyer les anciens caches + prendre le contrôle immédiatement
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== OFFLINE_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// Network-first UNIQUEMENT pour les navigations (pages).
// En cas d'échec réseau (mode avion / pas de connexion) → page hors-ligne à la marque.
// Ne touche ni aux POST, ni aux requêtes API, ni aux assets.
self.addEventListener('fetch', function (event) {
  const req = event.request
  if (req.method !== 'GET' || req.mode !== 'navigate') return
  event.respondWith(
    fetch(req).catch(() =>
      caches.match(OFFLINE_URL).then((res) =>
        res || new Response('<h1>Hors ligne</h1>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
      )
    )
  )
})

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
