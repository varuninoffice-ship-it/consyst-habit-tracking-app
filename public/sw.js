/**
 * Consyst Service Worker
 *
 * Strategy:
 *   - Static assets (_next/static/**): cache-first, immutable
 *   - Public assets (icons, images):   cache-first, long-lived
 *   - Navigation requests (HTML):      network-first, offline fallback
 *   - POST / server actions:           never intercepted
 */

const CACHE = "consyst-v1";
const OFFLINE_URL = "/offline";

// ── Install ────────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting()),
  );
});

// ── Activate ───────────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ── Fetch ──────────────────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // Next.js server actions use POST — already excluded above.
  // Also skip RSC payloads and internal Next.js prefetch routes.
  if (url.pathname.startsWith("/_next/data/")) return;
  if (url.searchParams.has("_rsc")) return;

  // ── Cache-first: immutable static chunks ──────────────────────────────────
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ── Cache-first: public static assets ────────────────────────────────────
  if (/\.(svg|png|ico|webp|jpg|jpeg|woff2?|ttf)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ── Network-first: navigation (HTML pages) ────────────────────────────────
  if (request.mode === "navigate") {
    event.respondWith(networkFirstWithOffline(request));
    return;
  }
});

// ── Helpers ────────────────────────────────────────────────────────────────────

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Network error", { status: 408 });
  }
}

async function networkFirstWithOffline(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    return offline ?? new Response("Offline", { status: 503 });
  }
}
