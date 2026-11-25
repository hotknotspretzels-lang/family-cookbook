// Intentionally does no caching. It only exists so phones treat the cookbook
// as installable. Caching pages here would serve stale recipes.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // No-op: let the browser handle every request.
});
