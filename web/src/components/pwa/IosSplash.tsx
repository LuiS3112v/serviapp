"use client";

import { useEffect } from "react";

/**
 * IosSplash
 * =========
 * O iOS Safari ignora o manifest.webmanifest para splash screens.
 * Exige <link rel="apple-touch-startup-image"> com uma imagem gerada
 * para a resolução exata do ecrã atual.
 *
 * Este componente gera essa imagem dinamicamente via Canvas:
 * fundo branco + logo Mestroo centrada — idêntico ao Android.
 *
 * Não renderiza nada visível. Coloca dentro do <body> no layout.tsx.
 */
export function IosSplash() {
  useEffect(() => {
    const isIos =
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    if (!isIos) return;

    // Já foi injetado (ex: hot reload)
    if (document.querySelector('link[rel="apple-touch-startup-image"]')) return;

    const dpr = window.devicePixelRatio || 1;
    const w = window.screen.width * dpr;
    const h = window.screen.height * dpr;

    const img = new Image();
    img.src = "/apple-touch-icon.png";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Fundo branco — igual ao fundo do logo Mestroo
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);

      // Logo centrada — 28% da largura (proporcional a qualquer ecrã)
      const size = Math.round(w * 0.28);
      const x = Math.round((w - size) / 2);
      const y = Math.round((h - size) / 2);
      ctx.drawImage(img, x, y, size, size);

      const link = document.createElement("link");
      link.rel = "apple-touch-startup-image";
      link.href = canvas.toDataURL("image/png");
      link.setAttribute(
        "media",
        `(device-width: ${window.screen.width}px) and (device-height: ${window.screen.height}px) and (-webkit-device-pixel-ratio: ${dpr})`
      );
      document.head.appendChild(link);
    };
  }, []);

  return null;
}