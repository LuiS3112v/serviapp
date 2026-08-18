"use client";

import { useEffect } from "react";

export function SWRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() => {
          // falha silenciosa — não quebra nada se o SW não registar
        });
    }
  }, []);

  return null;
}