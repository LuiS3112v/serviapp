"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// ═══════════════════════════════════════════════════════════════════════
// ViewportGuard — rede de segurança global contra o bug do zoom do mapa
// deformar outras páginas (Safari iOS mobile / PWA).
//
// CAUSA RAIZ COMPLETA DO BUG:
//
// O logout (e qualquer saída da página /map) usa router.push do Next.js
// — uma navegação client-side que NÃO recarrega o browser. O React
// desmonta o <ServiceMap/> e monta a página seguinte no mesmo ciclo de
// reconciliação do DOM, sem qualquer reload real de página.
//
// O Safari iOS/PWA tem um bug conhecido: depois de um gesto de
// pinch-zoom dentro de uma área com touch-action:none (necessária para
// o Leaflet funcionar correctamente), o "visual viewport" do browser
// pode ficar preso numa escala diferente de 1, mesmo com
// user-scalable=no. Esse estado de zoom é global ao WebKit, não é
// scoped à página React — persiste através da troca de componentes.
//
// O fix anterior (dentro do cleanup do ServiceMap, usando
// requestAnimationFrame) tinha uma janela de corrida: em Safari mobile
// com navegação client-side, a página seguinte já podia estar pintada
// no ecrã ANTES do requestAnimationFrame correr — o utilizador chegava
// a ver um frame (ou mais) da página deformada antes da correcção.
//
// SOLUÇÃO DEFINITIVA (2 camadas):
//   1. ServiceMap continua a fazer o cleanup síncrono ao desmontar
//      (primeira linha de defesa, mais cedo possível).
//   2. Este componente, montado UMA VEZ na raiz da app (layout.tsx),
//      observa TODAS as mudanças de rota via usePathname() e força o
//      mesmo reset de viewport sempre que a rota deixa de ser /map —
//      cobre logout, navegação por Sidebar/BottomNav, back button do
//      browser, deep link — qualquer forma de sair do mapa, não só
//      logout. É a rede de segurança que garante correcção mesmo se a
//      primeira camada correr tarde demais.
// ═══════════════════════════════════════════════════════════════════════

function resetVisualViewport() {
  try {
    const existing = document.querySelector('meta[name="viewport"]');
    const viewportContent =
      existing?.getAttribute("content") ??
      "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";

    if (existing) {
      existing.remove();
    }

    // Recriação SÍNCRONA (sem requestAnimationFrame) — o objetivo é
    // que a correção aconteça no mesmo tick da navegação, antes do
    // browser pintar a página seguinte com a escala errada.
    const meta = document.createElement("meta");
    meta.name = "viewport";
    meta.content = viewportContent;
    document.head.appendChild(meta);
  } catch {
    // Silencioso — se falhar aqui, a camada 1 (ServiceMap) já terá
    // tentado o mesmo reset no momento do unmount.
  }

  try {
    window.scrollTo(0, 0);
  } catch {
    // Silencioso.
  }
}

export function ViewportGuard() {
  const pathname = usePathname();
  const wasOnMapRef = useRef(false);

  useEffect(() => {
    const isOnMap = pathname === "/map";

    // Só actua na transição DE /map PARA outra rota — é exactamente
    // o momento em que o bug pode manifestar-se. Não faz nada em
    // navegações que não envolvem a página do mapa, para não gastar
    // trabalho desnecessário no resto da app.
    if (wasOnMapRef.current && !isOnMap) {
      resetVisualViewport();
    }

    wasOnMapRef.current = isOnMap;
  }, [pathname]);

  return null;
}