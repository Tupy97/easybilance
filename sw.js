/* EasyBilance – service worker: fa funzionare l'app anche senza connessione.
   Quando pubblichi una nuova versione, aumenta il numero in VERSIONE. */
const VERSIONE = "easybilance-v6";
const FILE_APP = ["./", "index.html", "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/icon-180.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSIONE).then(c => c.addAll(FILE_APP)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== VERSIONE).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // La pagina: prima la rete (così ricevi gli aggiornamenti), senza rete la copia salvata
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSIONE).then(x => x.put("index.html", c)); return r; })
      .catch(() => caches.match("index.html")));
    return;
  }
  // Font di Google e file dell'app: copia salvata, aggiornata in background
  if (url.origin === location.origin || url.host.endsWith("fonts.googleapis.com") || url.host.endsWith("fonts.gstatic.com")) {
    e.respondWith(caches.open(VERSIONE).then(c => c.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })));
  }
});
