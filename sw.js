/* Service worker de Bitácora Sensorial: la app abre sin internet.
   Los registros NO pasan por aquí: viven en el almacenamiento del navegador del celular. */
const CACHE = 'bitacora-3.3';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'xlsx.full.min.js', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') {            // la página: primero la red (para recibir actualizaciones), si no hay, la copia guardada
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put('index.html', cp)); return r; })
      .catch(() => caches.match('index.html')));
    return;
  }
  if (url.origin === location.origin) {     // archivos de la app: copia guardada primero
    e.respondWith(caches.match(req).then(r => r || fetch(req)));
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {   // tipografías: se guardan la primera vez
    e.respondWith(caches.open(CACHE).then(c => c.match(req).then(r => r || fetch(req).then(n => { c.put(req, n.clone()); return n; }).catch(() => r))));
  }
});
