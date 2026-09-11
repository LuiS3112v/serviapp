"use client";
import { useEffect, useRef, useState } from "react";

// Tempo sem eventos de scroll para considerar "parou" —
// 500ms é suficiente para deixar o momentum do iOS/Android terminar.
const SCROLL_END_DELAY_MS = 500;

// Ignora deltas de sub-pixel que browsers mobile disparam sem
// movimento real do utilizador.
const DIRECTION_NOISE_THRESHOLD_PX = 4;

// Mostra sempre a barra quando estamos perto do topo da página.
const TOP_THRESHOLD_PX = 60;

export function useScrollDirection() {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const endTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ticking = useRef(false);

  useEffect(() => {
    // O scroll do cliente acontece no <main id="cl-scroll-main"> com
    // overflowY:auto — não no window. Tentamos esse elemento primeiro;
    // se não existir (ex: provider home que usa window) usamos window.
    const scrollTarget: EventTarget =
      document.getElementById("cl-scroll-main") ?? window;

    const getScrollY = (): number => {
      if (scrollTarget instanceof Window) return window.scrollY;
      return (scrollTarget as HTMLElement).scrollTop;
    };

    const getMaxScroll = (): number => {
      if (scrollTarget instanceof Window) {
        return Math.max(
          document.documentElement.scrollHeight - window.innerHeight,
          0,
        );
      }
      const el = scrollTarget as HTMLElement;
      return Math.max(el.scrollHeight - el.clientHeight, 0);
    };

    lastScrollY.current = getScrollY();

    const handleScroll = () => {
      if (endTimer.current) clearTimeout(endTimer.current);

      if (!ticking.current) {
        ticking.current = true;
        requestAnimationFrame(() => {
          const maxScroll = getMaxScroll();
          const currentY = Math.min(Math.max(getScrollY(), 0), maxScroll);
          const delta = currentY - lastScrollY.current;

          // Perto do topo — barra sempre visível
          if (currentY <= TOP_THRESHOLD_PX) {
            setVisible(true);
          } else if (Math.abs(delta) > DIRECTION_NOISE_THRESHOLD_PX) {
            setVisible(delta <= 0); // up → mostra, down → esconde
          }

          lastScrollY.current = currentY;
          ticking.current = false;
        });
      }

      // Scroll parou → mostra a barra após delay
      endTimer.current = setTimeout(() => {
        setVisible(true);
      }, SCROLL_END_DELAY_MS);
    };

    scrollTarget.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      scrollTarget.removeEventListener("scroll", handleScroll);
      if (endTimer.current) clearTimeout(endTimer.current);
    };
  }, []);

  return visible;
}