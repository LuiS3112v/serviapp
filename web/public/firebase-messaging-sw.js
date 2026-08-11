importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: self.FIREBASE_API_KEY || '',
  authDomain: self.FIREBASE_AUTH_DOMAIN || '',
  projectId: self.FIREBASE_PROJECT_ID || '',
  storageBucket: self.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: self.FIREBASE_APP_ID || '',
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};
  if (!title) return;
  self.registration.showNotification(title, {
    body: body ?? '',
    icon: '/icon-192.png',
    badge: '/badge-72x72.png',
    data: payload.data,
  });
});

/**
 * Ativação imediata do service worker como controlador da app.
 * Necessário para o PWA ser instalável (installability criteria do
 * Chrome exige um SW ativo com fetch handler no scope).
 * Não adiciona cache de rotas/dados — apenas assume controlo.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/**
 * Fetch handler "passthrough": necessário para o Chrome considerar
 * a app instalável, mas não intercepta nem cacheia nada — todos os
 * pedidos vão diretamente para a rede, exatamente como sem SW.
 * Autenticação, APIs protegidas e páginas dinâmicas não são afetadas.
 */
self.addEventListener('fetch', () => {
  // Intencionalmente vazio — sem cache, sem interceção de resposta.
});