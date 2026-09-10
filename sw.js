/* Service Worker: macht die Stempelkarte offline verfuegbar.
   Bei jeder neuen Version die Zahl in CACHE erhoehen. */
const CACHE = "stempelkarte-v3";
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

  // Die Seite selbst immer frisch anfragen (GitHub Pages cacht HTML 10 Minuten),
  // damit eine neue Fassung sofort ankommt. Ohne Netz kommt sie aus dem Speicher.
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(new Request(e.request.url, { cache: "no-store" }))
        .then((antwort) => {
          const kopie = antwort.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", kopie)).catch(() => {});
          return antwort;
        })
        .catch(() => caches.match("./index.html").then((t) => t || caches.match("./")))
    );
    return;
  }

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
