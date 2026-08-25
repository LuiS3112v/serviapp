import type { NextConfig } from "next";

// ── Security headers ──────────────────────────────────────────────────────────
//
// SECURITY FIX (M-4): sem headers de segurança, o browser não tinha
// protecções contra XSS (sem CSP), clickjacking (sem frame-ancestors),
// MIME sniffing (sem X-Content-Type-Options) ou downgrade HTTPS (sem
// HSTS). Adicionados os headers standard sem quebrar:
//   • PWA: manifest.json e service worker servidos em / continuam a
//     funcionar — os headers aplicam-se a todas as rotas mas não
//     interferem com os endpoints de ficheiro estático.
//   • WebSockets: CSP não afecta WebSocket — ws:// e wss:// são
//     controlados por connect-src, que inclui NEXT_PUBLIC_API_URL.
//   • Cloudinary: imagens e vídeos carregados da Cloudinary estão
//     em img-src e media-src.
//   • Google Fonts / Firebase: domínios permitidos em style-src,
//     font-src e connect-src.
//
// Content-Security-Policy:
//   default-src 'self'          — tudo bloqueado por defeito
//   script-src 'self' + unsafe-eval — Next.js precisa de eval em dev;
//     em produção podes remover 'unsafe-eval' se não usares eval
//   style-src 'self' 'unsafe-inline' — Tailwind e CSS-in-JS precisam
//     de inline styles; se usares styled-components com nonce, podes
//     remover 'unsafe-inline'
//   img-src 'self' data: blob: https: — avatars e imagens de
//     terceiros (Cloudinary, Google Photos, etc.)
//   connect-src 'self' + API + WebSocket + Firebase — liga o frontend
//     ao backend NestJS e ao Firebase para push notifications
//   frame-ancestors 'none'     — equivalente a X-Frame-Options: DENY,
//     bloqueia clickjacking em todos os browsers modernos
//
// HSTS apenas em produção — em dev o header quebraria HTTP local.

const isDev = process.env.NODE_ENV !== "production";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001")
  .replace(/\/api$/, "")
  .replace(/\/$/, "");

// ws:// em dev, wss:// em produção — o WebSocket usa a mesma origin
// que a API REST mas com protocolo diferente.
const WS_ORIGIN = API_ORIGIN.replace(/^http/, "ws");

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
  // HSTS — apenas em produção. Em dev quebraria o reload em HTTP.
  ...(!isDev
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js precisa de 'unsafe-eval' em desenvolvimento (Fast Refresh).
      // Em produção podes remover 'unsafe-eval' se não usares eval.
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com`,
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
      `font-src 'self' https://fonts.gstatic.com data:`,
      // img-src alargado para Cloudinary (CDN de imagens) e Google
      // (avatares OAuth e Google Maps).
      `img-src 'self' data: blob: https:`,
      // connect-src: backend NestJS + WebSocket + Firebase (push)
      `connect-src 'self' ${API_ORIGIN} ${WS_ORIGIN} https://fcm.googleapis.com https://firebaseinstallations.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com`,
      // media-src: vídeos e áudios (galeria)
      `media-src 'self' blob: https:`,
      // worker-src: service worker do PWA
      `worker-src 'self' blob:`,
      // manifest do PWA
      `manifest-src 'self'`,
      // frame-src: Google OAuth popup
      `frame-src https://accounts.google.com`,
      // Bloqueia o próprio site de ser embutido noutro — previne
      // clickjacking. Substitui X-Frame-Options em browsers modernos.
      `frame-ancestors 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `upgrade-insecure-requests`,
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        // Aplica a todas as rotas
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;