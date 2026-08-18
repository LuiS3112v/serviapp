// Service Worker mínimo — apenas o necessário para o browser
// aceitar a app como instalável (beforeinstallprompt).
// Não altera nenhum comportamento de cache ou de rede existente.

const CACHE = "mestroo-v1";

self.addEventListener("install", (event) => {
  // Activa imediatamente, sem esperar pelo fecho de outras abas
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch passthrough — não interceptamos nada, o Next.js gere o cache dele
self.addEventListener("fetch", () => {});