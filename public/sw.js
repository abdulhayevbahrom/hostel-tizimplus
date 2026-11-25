const CACHE_NAME = 'hostel-pwa-v2'
const APP_SHELL = ['/', '/manifest.webmanifest', '/pwa-192x192.png', '/pwa-512x512.png']
const IS_LOCAL = ['localhost', '127.0.0.1', '[::1]'].includes(self.location.hostname)

self.addEventListener('install', (event) => {
  if (!IS_LOCAL) event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('hostel-pwa-') && (IS_LOCAL || key !== CACHE_NAME)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (IS_LOCAL || event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return

  // Only page navigations may fall back to HTML. Scripts, styles and API
  // requests must keep their own response type, even when the network is down.
  if (event.request.mode !== 'navigate') return

  event.respondWith(
    fetch(event.request).catch(async () => {
      const cache = await caches.open(CACHE_NAME)
      const cached = await cache.match(event.request) || await cache.match('/')
      if (cached) return cached
      return Response.error()
    }),
  )
})
