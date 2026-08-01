// PHASE-04: cache-first service worker so the app keeps working once the
// venue network drops after a single successful load. index.html is always
// network-first so a redeploy is picked up the moment the network returns.
const STATIC_URLS = ['/', '/index.html', '/favicon.svg', '/icons.svg', '/brand/allotrope-logo.png']

let CACHE_NAME = 'dppa-app-unknown'

async function loadManifest() {
  try {
    const res = await fetch('/sw-manifest.json', { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function precache() {
  const manifest = await loadManifest()
  CACHE_NAME = `dppa-app-${manifest ? manifest.version : 'unknown'}`
  const urls = [...STATIC_URLS, ...(manifest ? manifest.assets : [])]
  const cache = await caches.open(CACHE_NAME)
  await cache.addAll(urls.map((url) => new Request(url, { cache: 'reload' })))
}

async function cleanupOldCaches() {
  const keys = await caches.keys()
  await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(cleanupOldCaches().then(() => self.clients.claim()))
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()))
          return response
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html'))),
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()))
        return response
      })
    }),
  )
})
