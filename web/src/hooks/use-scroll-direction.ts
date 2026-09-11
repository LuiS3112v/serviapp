"use client";
import { useEffect, useRef, useState } from "react";

const SCROLL_END_DELAY_MS = 500;
const DIRECTION_NOISE_THRESHOLD_PX = 4;
const TOP_THRESHOLD_PX = 60;

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
          const maxScroll = Math.max(
            document.documentElement.scrollHeight - window.innerHeight,
            0,
          );
          const currentY = Math.min(Math.max(window.scrollY, 0), maxScroll);
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

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (endTimer.current) clearTimeout(endTimer.current);
    };
  }, []);

  return visible;
}