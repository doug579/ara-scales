// ARA Scales service worker: keeps a full copy of the app on the phone so it opens with no signal.
// Bump CACHE whenever any app file changes; phones pick up the new version the next time they open the app with signal.
const CACHE = "ara-scales-v1.0.3";
const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./fonts/Montserrat-Regular.woff",
  "./fonts/Montserrat-ExtraBold.woff",
  "./fonts/SairaExpanded-ExtraBold.woff",
  "./icons/ara-logo-reversed.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  // cache: "reload" skips the phone's HTTP cache (GitHub Pages lets it keep files ~10 min),
  // so a new version never stores a stale copy of an old file.
  event.waitUntil(caches.open(CACHE)
    .then((c) => c.addAll(APP_FILES.map((u) => new Request(u, { cache: "reload" }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("ara-scales-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  // Only the app's own files are served from the phone. The entry list (Google) always goes to the network;
  // the page itself saves the list, so it is never stale-cached here.
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    event.respondWith(caches.match("./index.html").then((hit) => hit || fetch(req)));
    return;
  }
  event.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req)));
});
