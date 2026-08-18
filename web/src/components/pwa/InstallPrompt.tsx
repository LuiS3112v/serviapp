"use client";

import { useState, useEffect } from "react";
import { Download, X, Share, SquarePlus } from "lucide-react";
import { usePwaInstall } from "@/hooks/use-pwa-install";

const SHOW_DELAY_MS = 3000;

export function InstallPrompt() {
  const {
    shouldShowInstallUI,
    canPromptInstall,
    promptInstall,
    dismiss,
    platform,
  } = usePwaInstall();

  const [delayDone, setDelayDone] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (!shouldShowInstallUI) return;
    const t = setTimeout(() => setDelayDone(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [shouldShowInstallUI]);

  const close = () => {
    setGone(true);
    dismiss();
  };

  const install = async () => {
    await promptInstall();
    setGone(true);
  };

  // Mostra para qualquer plataforma conhecida onde ainda não está instalado
  // - Chromium (Android/desktop): tem botão "Instalar" nativo
  // - iOS Safari / outros: mostra instruções manuais
  // - Não mostra se já instalado (shouldShowInstallUI = false)
  if (!shouldShowInstallUI || !delayDone || gone) return null;

  const isIOS = platform === "ios";

  return (
    <>
      <style>{`
        @keyframes _pwa_up {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .pwa-card { animation: _pwa_up 0.28s cubic-bezier(0.22,1,0.36,1) both; }
        @media (prefers-reduced-motion: reduce) { .pwa-card { animation:none; } }
      `}</style>

      <div
        className="pwa-card"
        role="dialog"
        aria-label="Instalar aplicação"
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 9999,
          width: "min(340px, calc(100vw - 24px))",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          boxShadow:
            "0 16px 48px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.08)",
          padding: "18px 18px 16px",
          fontFamily: "var(--font-manrope, system-ui, sans-serif)",
        }}
      >
        {/* X */}
        <button
          type="button"
          onClick={close}
          aria-label="Fechar"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 26,
            height: 26,
            borderRadius: 8,
            border: "none",
            background: "#f1f5f9",
            color: "#94a3b8",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
          }}
        >
          <X size={13} />
        </button>

        {/* Ícone + título + texto */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            paddingRight: 28,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 11,
              background: "#1e293b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {isIOS ? (
              <Share size={18} color="#fff" />
            ) : (
              <Download size={18} color="#fff" />
            )}
          </div>
          <div>
            <p
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "#0f172a",
                margin: "0 0 3px",
                letterSpacing: "-0.01em",
              }}
            >
              Instalar Mestroo
            </p>
            {isIOS ? (
              <p
                style={{
                  fontSize: 12.5,
                  color: "#64748b",
                  margin: 0,
                  lineHeight: 1.45,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  flexWrap: "wrap",
                }}
              >
                Toque em{" "}
                <Share
                  size={12}
                  style={{ display: "inline", verticalAlign: "middle" }}
                />{" "}
                e depois em{" "}
                <SquarePlus
                  size={12}
                  style={{ display: "inline", verticalAlign: "middle" }}
                />{" "}
                <strong style={{ fontWeight: 700 }}>
                  Adicionar ao Ecrã Principal
                </strong>
              </p>
            ) : (
              <p
                style={{
                  fontSize: 12.5,
                  color: "#64748b",
                  margin: 0,
                  lineHeight: 1.45,
                }}
              >
                Acesso rápido e offline direto do seu ecrã inicial.
              </p>
            )}
          </div>
        </div>

        {/* Botões */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={close}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: 9,
              border: "1px solid #e2e8f0",
              background: "#fff",
              color: "#64748b",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Agora não
          </button>

          {/* iOS: não há prompt nativo, só mostra "Agora não" + X */}
          {!isIOS && (
            <button
              type="button"
              onClick={canPromptInstall ? install : undefined}
              style={{
                flex: 1.4,
                padding: "9px 0",
                borderRadius: 9,
                border: "none",
                background: "#1e293b",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: canPromptInstall ? "pointer" : "default",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                opacity: canPromptInstall ? 1 : 0.5,
              }}
            >
              <Download size={14} />
              {canPromptInstall ? "Instalar" : "Instalar..."}
            </button>
          )}
        </div>
      </div>
    </>
  );
}