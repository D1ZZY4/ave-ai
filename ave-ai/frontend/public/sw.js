/**
 * Diagram 29, 30: Service Worker — offline detection, queue, and PWA caching.
 * Caches static assets, queues AI requests when offline, replays on reconnect.
 */
const CACHE_NAME = "ave-ai-v3";
const STATIC_ASSETS = ["/", "/favicon.svg", "/manifest.json"];
const OFFLINE_QUEUE_KEY = "ave-ai-offline-queue";

// ─── Install: pre-cache static assets ──────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ─── Activate: clean up old caches ─────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ─── Fetch: intercept all requests ──────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // API requests: pass through, return offline error if network fails
  if (url.pathname.includes("/api/ollama/chat")) {
    event.respondWith(
      fetch(event.request.clone()).catch(() =>
        new Response(
          JSON.stringify({
            error: "offline",
            message: "You appear to be offline. Your message has been queued.",
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
    );
    return;
  }

  // Other API requests: pass through with offline fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: "offline" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }

  // Static assets: cache-first strategy
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && event.request.method === "GET") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Return cached index.html for SPA navigation
        if (event.request.mode === "navigate") {
          return caches.match("/") || new Response("Offline", { status: 503 });
        }
        return new Response("Offline", { status: 503 });
      });
    })
  );
});

// ─── Messages from app ───────────────────────────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();

  if (event.data?.type === "ENQUEUE_REQUEST") {
    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
    queue.push({ ...event.data.payload, queuedAt: Date.now() });
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  }
});

// ─── Background sync: replay offline queue ────────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "ave-ai-sync") {
    event.waitUntil(replayOfflineQueue());
  }
});

async function replayOfflineQueue() {
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    client.postMessage({ type: "SYNC_QUEUE" });
  }
}
