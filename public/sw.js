// public/sw.js
// ─── Service Worker for AapdaSetu Offline-First Caching ─────────────

const CACHE_NAME = "aapadasetu-v2";

// Core static app shell files to precache
const PRECACHE_URLS = ["/", "/index.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests with http/https schemes
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith("http")) return;

  // Network-first strategy with SPA fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful basic responses
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone))
            .catch(() => {
              /* ignore cache write errors */
            });
        }
        return response;
      })
      .catch(async () => {
        // Attempt to match cached request
        const cached = await caches.match(event.request);
        if (cached) return cached;

        // If navigation request fails offline, serve cached SPA root
        if (event.request.mode === "navigate") {
          const rootCached = await caches.match("/");
          if (rootCached) return rootCached;
        }

        return new Response("Offline - AapdaSetu", {
          status: 503,
          statusText: "Offline",
          headers: { "Content-Type": "text/plain" },
        });
      })
  );
});
