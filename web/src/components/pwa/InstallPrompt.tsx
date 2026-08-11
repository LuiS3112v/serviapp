"use client";

import { X, Download, Share } from "lucide-react";
import { usePwaInstall } from "@/hooks/use-pwa-install";

const BRAND = "#1D9E75"; // token --teal do design system (globals.css)
const INK = "#0f172a";

/**
 * Banner discreto de instalação. Não é modal, não bloqueia o Home.
 * Só renderiza quando shouldShowInstallUI é true (ver hook).
 * Android/Chrome/Edge/Samsung Internet: mostra botão que dispara o prompt nativo.
 * iOS (qualquer navegador): mostra instrução textual curta — todos os
 * navegadores no iPhone conseguem "Adicionar ao Ecrã Principal", só que
 * pelo próprio menu deles (não há prompt nativo em nenhum caso).
 */
export function InstallPrompt() {
  const { platform, canPromptInstall, shouldShowInstallUI, promptInstall, dismiss } =
    usePwaInstall();

  if (!shouldShowInstallUI) return null;

  const isIOS = platform === "ios";

  return (
    <div
      role="region"
      aria-label="Instalar aplicação"
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        maxWidth: 420,
        margin: "0 auto",
        zIndex: 60,
        background: "#fff",
        border: "1px solid #eef1f5",
        borderRadius: 16,
        boxShadow: "0 10px 30px rgba(15,23,42,0.16)",
        padding: "16px 16px 16px 18px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          background: BRAND,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        <Download size={18} color="#fff" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {isIOS ? (
          <>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: INK, margin: 0 }}>
              Instale a aplicação
            </p>
            <p
              style={{
                fontSize: 12.5,
                color: "#64748b",
                margin: "3px 0 0",
                lineHeight: 1.4,
                display: "flex",
                alignItems: "center",
                gap: 4,
                flexWrap: "wrap",
              }}
            >
              Toque em <Share size={13} style={{ display: "inline", verticalAlign: "middle" }} aria-label="Partilhar" /> e depois em &quot;Adicionar ao Ecrã Principal&quot;
            </p>
          </>
        ) : (
          <>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: INK, margin: 0 }}>
              Instale a aplicação
            </p>
            <p style={{ fontSize: 12.5, color: "#64748b", margin: "3px 0 0" }}>
              Acesso mais rápido, direto do seu ecrã inicial.
            </p>
          </>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {!isIOS && canPromptInstall && (
          <button
            type="button"
            onClick={promptInstall}
            style={{
              padding: "9px 14px",
              borderRadius: 10,
              border: "none",
              background: BRAND,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
          >
            Instalar
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dispensar convite de instalação"
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            border: "none",
            background: "transparent",
            color: "#94a3b8",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}