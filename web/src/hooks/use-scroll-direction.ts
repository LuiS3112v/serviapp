"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Deteta a direção do scroll da página para mostrar/esconder a
 * BottomNav ao estilo Gmail:
 *   - scroll para baixo → esconde
 *   - scroll para cima  → mostra
 *   - scroll parado     → mostra
 *
 * Fonte do scroll: window.scrollY. As duas Homes onde este hook é
 * usado (/home e /provider-home) usam scroll normal da página — não
 * têm nenhum container interno com overflow-y:auto a fazer scroll
 * próprio (confirmado nos respetivos ficheiros: .hi/.ph-body são
 * blocos normais dentro do fluxo do body, sem overflow definido).
 *
 * "Fim do scroll" é detetado por um pequeno debounce (this is NOT a
 * large visual threshold — é só uma janela de tempo sem novos eventos
 * de scroll, robusta a touch/momentum scrolling em iOS/Android, que
 * disparam múltiplos eventos "scroll" espaçados durante a inércia).
 * Enquanto o momentum continuar a gerar eventos, o temporizador é
 * reiniciado a cada evento — só quando os eventos param de facto por
 * SCROLL_END_DELAY_MS é que se considera o scroll terminado.
 */

const SCROLL_END_DELAY_MS = 150;
// Ignora ruído de sub-pixel (alguns browsers mobile disparam eventos
// de scroll com deltas de 1px mesmo sem movimento real do utilizador).
const DIRECTION_NOISE_THRESHOLD_PX = 4;

export function useScrollDirection() {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const endTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ticking = useRef(false);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      if (endTimer.current) clearTimeout(endTimer.current);

      if (!ticking.current) {
        ticking.current = true;
        requestAnimationFrame(() => {
          // Clamp aos limites reais do documento — no rubber-band do
          // iOS/Android, scrollY pode ultrapassar momentaneamente 0 no
          // topo ou o máximo no fundo; sem este clamp, esse movimento
          // "fantasma" do overscroll seria lido como uma mudança real
          // de direção e causaria flicker exactamente no momento em
          // que a barra deve ficar quieta (parado no limite da página).
          const maxScroll = Math.max(
            document.documentElement.scrollHeight - window.innerHeight,
            0
          );
          const currentY = Math.min(Math.max(window.scrollY, 0), maxScroll);
          const delta = currentY - lastScrollY.current;

          if (Math.abs(delta) > DIRECTION_NOISE_THRESHOLD_PX) {
            if (delta > 0) {
              setVisible(false); // scroll down → esconde
            } else {
              setVisible(true); // scroll up → mostra
            }
            lastScrollY.current = currentY;
          }
          ticking.current = false;
        });
      }

      // Reinicia sempre que houver actividade — só corre quando os
      // eventos de scroll realmente pararem (fim do touch/momentum).
      endTimer.current = setTimeout(() => {
        setVisible(true); // scroll terminou → mostra
      }, SCROLL_END_DELAY_MS);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (endTimer.current) clearTimeout(endTimer.current);
    };
  }, []);

  return visible;
}