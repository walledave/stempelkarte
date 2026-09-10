/* Service Worker: macht die Stempelkarte offline verfuegbar.
   Bei jeder neuen Version die Zahl in CACHE erhoehen. */
const CACHE = "stempelkarte-v2";
const DATEIEN = ["./", "./index.html", "./manifest.webmanifest",
                 "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((namen) => Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Alles, was nicht zur Seite selbst gehoert (z. B. die GitHub-API), direkt durchreichen.
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then((antwort) => {
        const kopie = antwort.clone();
        caches.open(CACHE).then((c) => c.put(e.request, kopie)).catch(() => {});
        return antwort;
      })
      .catch(() => caches.match(e.request).then((treffer) => treffer || caches.match("./index.html")))
  );
});
