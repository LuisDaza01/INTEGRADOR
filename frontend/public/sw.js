// ============================================================
// sw.js — Service Worker NaturaPiscis
// Estrategia: Cache First para assets, Network First para API
// ============================================================

const CACHE_NAME = 'naturapiscis-v1'
const CACHE_STATIC = 'naturapiscis-static-v1'

// Assets que se cachean al instalar
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo-naturapiscis.png',
  '/manifest.json',
]

// ── Instalación — cachear assets estáticos ──────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    }).then(() => self.skipWaiting())
  )
})

// ── Activación — limpiar caches viejos ──────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== CACHE_STATIC)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  )
})

// ── Fetch — estrategia híbrida ───────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorar requests que no son GET
  if (request.method !== 'GET') return

  // Ignorar requests a la API — siempre van a la red
  if (url.pathname.startsWith('/api/')) return

  // Ignorar Firebase y otros servicios externos
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('railway.app')) {
    return
  }

  // Para el resto: Cache First con fallback a red
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached

      return fetch(request)
        .then((response) => {
          // Solo cachear respuestas válidas
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response
          }
          const cloned = response.clone()
          caches.open(CACHE_STATIC).then(cache => cache.put(request, cloned))
          return response
        })
        .catch(() => {
          // Sin red y sin cache — mostrar página offline si es HTML
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html')
          }
        })
    })
  )
})

// ── Notificaciones push (para futuras notif web) ─────────────
self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || 'NaturaPiscis', {
      body:  data.body  || '',
      icon:  '/logo-naturapiscis.png',
      badge: '/logo-naturapiscis.png',
      data:  data.data  || {},
      tag:   data.tag   || 'naturapiscis',
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(clients.openWindow(url))
})