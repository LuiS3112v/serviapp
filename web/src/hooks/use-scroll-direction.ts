"use client";
import { useEffect, useRef, useState } from "react";
import { useScrollContainer } from "@/contexts/scroll-container-context";

const SCROLL_END_DELAY_MS = 500;
const DIRECTION_NOISE_THRESHOLD_PX = 4;
const TOP_THRESHOLD_PX = 60;

export function useScrollDirection() {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const endTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ticking = useRef(false);
  const containerRef = useScrollContainer();

  useEffect(() => {
    // O ref pode ainda ser null no primeiro render se o <main> ainda
    // não foi pintado. Usamos um rAF para garantir que o DOM está pronto.
    let target: EventTarget | null = null;
    let cleanup: (() => void) | null = null;

    const frameId = requestAnimationFrame(() => {
      const el = containerRef?.current ?? null;
      target = el ?? window;

      const getScrollY = (): number =>
        el ? el.scrollTop : window.scrollY;

      const getMaxScroll = (): number =>
        el
          ? Math.max(el.scrollHeight - el.clientHeight, 0)
          : Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);

      lastScrollY.current = getScrollY();

      const handleScroll = () => {
        if (endTimer.current) clearTimeout(endTimer.current);

        if (!ticking.current) {
          ticking.current = true;
          requestAnimationFrame(() => {
            const maxScroll = getMaxScroll();
            const currentY = Math.min(Math.max(getScrollY(), 0), maxScroll);
            const delta = currentY - lastScrollY.current;

            if (currentY <= TOP_THRESHOLD_PX) {
              setVisible(true);
            } else if (Math.abs(delta) > DIRECTION_NOISE_THRESHOLD_PX) {
              setVisible(delta <= 0);
            }

            lastScrollY.current = currentY;
            ticking.current = false;
          });
        }

        endTimer.current = setTimeout(() => setVisible(true), SCROLL_END_DELAY_MS);
      };

      target.addEventListener("scroll", handleScroll, { passive: true });

      cleanup = () => {
        target!.removeEventListener("scroll", handleScroll);
        if (endTimer.current) clearTimeout(endTimer.current);
      };
    });

    return () => {
      cancelAnimationFrame(frameId);
      cleanup?.();
    };
  // containerRef.current muda silenciosamente (é um ref) — deps vazio correcto.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return visible;
}