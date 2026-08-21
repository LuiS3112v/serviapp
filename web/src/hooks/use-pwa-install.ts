"use client";

import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

type Platform = "android" | "ios" | "desktop" | "unknown";
type Browser = "chrome" | "safari" | "firefox" | "edge" | "samsung" | "unknown";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ reporta-se como Mac, mas tem touch
    (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  if (isIOS) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Win|Mac|Linux/.test(ua)) return "desktop";
  return "unknown";
}

/**
 * Deteção de browser via UA. Ordem importa: Edge, Samsung Internet e
 * Chrome/Chromium mobile browsers no iOS/Android incluem "Safari" ou
 * "Chrome" na UA por herdarem o motor do sistema, por isso os tokens
 * mais específicos têm de ser verificados primeiro.
 */
function detectBrowser(): Browser {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;

  if (/EdgiOS|EdgA|Edg\//.test(ua)) return "edge";
  if (/SamsungBrowser/.test(ua)) return "samsung";
  if (/FxiOS|Firefox/.test(ua)) return "firefox";
  if (/CriOS|Chrome/.test(ua)) return "chrome";
  if (/Safari/.test(ua)) return "safari";
  return "unknown";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mql = window.matchMedia?.("(display-mode: standalone)").matches;
  // Safari/iOS expõe isto fora do display-mode media query
  const iosStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
    true;
  return Boolean(mql || iosStandalone);
}

export interface UsePwaInstallResult {
  /** true quando a app já está a correr como PWA instalado */
  isStandaloneMode: boolean;
  /** plataforma detetada, para escolher a UI certa */
  platform: Platform;
  /** browser detetado, para adaptar textos/instruções à UI real desse browser */
  browser: Browser;
  /** true quando o browser disponibilizou o prompt nativo (Chrome/Android/Edge) */
  canPromptInstall: boolean;
  /** true quando devemos mostrar alguma forma de convite (banner, slideshow) */
  shouldShowInstallUI: boolean;
  /** dispara o prompt nativo (só funciona quando canPromptInstall é true) */
  promptInstall: () => Promise<void>;
  /** fecha o convite apenas nesta sessão (não grava preferência persistente) */
  dismiss: () => void;
}

/**
 * Hook único responsável por toda a lógica de deteção e instalação PWA.
 * Isolado do resto da app — nenhum componente de UI decide esta lógica
 * sozinho, todos consomem este hook.
 *
 * Sem cooldown de dispensa: o convite de instalação (popup e secção de
 * tutorial) aparece sempre que a app ainda não está instalada, em toda
 * visita/sessão. Só deixa de aparecer quando a app é mesmo instalada
 * (modo standalone). "Agora não" no popup fecha apenas aquela sessão —
 * não fica gravado entre visitas.
 */
export function usePwaInstall(): UsePwaInstallResult {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [browser, setBrowser] = useState<Browser>("unknown");
  const [standaloneMode, setStandaloneMode] = useState(false);
  const [dismissedThisSession, setDismissedThisSession] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPlatform(detectPlatform());
    setBrowser(detectBrowser());
    setStandaloneMode(isStandalone());

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setStandaloneMode(true);
    };

    // Se o browser passar a suportar/deixar de suportar o display-mode
    // standalone durante a sessão (ex: instalado noutra janela).
    const mql = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setStandaloneMode(e.matches);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    mql.addEventListener?.("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      mql.removeEventListener?.("change", handleDisplayModeChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setStandaloneMode(true);
    }
    // O evento só pode ser usado uma vez.
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    // Fecha apenas a sessão atual (não persiste em localStorage).
    // Ao recarregar a página ou voltar noutra visita, o convite
    // volta a aparecer normalmente enquanto a app não estiver instalada.
    setDismissedThisSession(true);
  }, []);

  const canPromptInstall = Boolean(deferredPrompt);

  // Mostra UI de instalação quando:
  // - já montou no client (evita hydration mismatch)
  // - não está já em modo standalone (app instalada)
  // - não foi dispensado NESTA sessão (fecha o popup ao clicar "agora não",
  //   mas sem persistir entre visitas — a próxima visita mostra de novo)
  // - E não estamos numa plataforma "unknown" (bots, ambientes sem UA fiável)
  //
  // Em desktop e Android mostramos mesmo sem o prompt nativo disponível:
  // o Chrome só dispara beforeinstallprompt depois de heurísticas de
  // "engagement" (várias visitas, tempo de uso), por isso a secção teria
  // de ficar escondida na maior parte das primeiras visitas — em vez
  // disso, mostramos sempre instruções válidas (menu do browser) e só
  // trocamos para o botão de instalação nativa quando o evento chega.
  const shouldShowInstallUI =
    mounted && !standaloneMode && !dismissedThisSession && platform !== "unknown";

  return {
    isStandaloneMode: standaloneMode,
    platform,
    browser,
    canPromptInstall,
    shouldShowInstallUI,
    promptInstall,
    dismiss,
  };
}