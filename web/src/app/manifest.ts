import type { MetadataRoute } from "next";
import { PWA_CONFIG } from "@/lib/pwa-config";

/**
 * Web App Manifest — gerado dinamicamente pelo Next.js (App Router).
 * Acessível em /manifest.webmanifest.
 *
 * Toda a identidade (nome, cores, ícones) vem de PWA_CONFIG
 * (src/lib/pwa-config.ts). Não hardcodes valores aqui.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: PWA_CONFIG.name,
    short_name: PWA_CONFIG.shortName,
    description: PWA_CONFIG.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: PWA_CONFIG.backgroundColor,
    theme_color: PWA_CONFIG.themeColor,
    orientation: "portrait-primary",
    icons: [
      {
        src: PWA_CONFIG.icons.icon192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: PWA_CONFIG.icons.icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: PWA_CONFIG.icons.maskable512,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}