// PHASE-04: cache-first service worker so the app keeps working once the
// venue network drops after a single successful load. index.html is always
// network-first so a redeploy is picked up the moment the network returns.
const STATIC_URLS = ['/', '/index.html', '/favicon.svg', '/icons.svg', '/brand/allotrope-logo.png']

// __SW_VERSION__ is replaced with the build commit by the inject-sw-version build
// plugin (app/vite.config.js). Under `npm run dev` the token survives and the worker
// falls back to the unversioned cache name, matching the old development behaviour.
const SW_VERSION = '__SW_VERSION__'
const CACHE_NAME = `dppa-app-${SW_VERSION.startsWith('__') ? 'unknown' : SW_VERSION}`

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
    const network = fetch(request).then((response) => {
      // Never cache error responses: a 404/500 shell served offline on
      // the next visit is worse than no cached copy at all.
      if (response.ok) {
        caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()))
      }
      return response
    })
    // A slow-but-alive venue network must not block first paint until the
    // browser's own timeout when a valid cached copy exists: after 2,000 ms
    // the cached shell wins (a redeploy may need one extra load to appear --
    // load the app once on a good network before the session).
    const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 2000))
    const fallback = () =>
      caches.match(request).then((cached) => cached || caches.match('/index.html'))
    event.respondWith(Promise.race([network, timeout]).then((response) => response || fallback(), fallback))
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok) {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()))
        }
        return response
      })
    }),
  )
})
