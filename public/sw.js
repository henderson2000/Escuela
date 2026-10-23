// Guarda la plataforma en la computadora para que siga andando si se corta internet.
// - La página (index.html): primero se pide a internet (así siempre llega la versión nueva); sin conexión, la guardada.
// - Los archivos de /assets/ tienen un nombre único por versión: se guardan la primera vez y después se usan desde acá.
// - Las imágenes de /img/: se muestran las guardadas al instante y, de fondo, se actualizan para la próxima vez.
const CACHE = 'talleres-v2'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  if (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy))
          }
          return res
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./'))),
    )
    return
  }

  if (url.pathname.includes('/img/')) {
    e.respondWith(
      caches.open(CACHE).then((c) =>
        c.match(req).then((hit) => {
          const net = fetch(req)
            .then((res) => {
              if (res.ok) c.put(req, res.clone())
              return res
            })
            .catch(() => hit)
          return hit || net
        }),
      ),
    )
    return
  }

  if (url.pathname.includes('/assets/')) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(CACHE).then((c) => c.put(req, copy))
            }
            return res
          }),
      ),
    )
  }
})
