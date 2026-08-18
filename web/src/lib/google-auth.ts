"use client";

// ============================================================
// PATCH TEMPORÁRIO DE DIAGNÓSTICO — remover depois de confirmar a causa.
// Não expõe nenhum secret: client_id do Google é público por definição
// (é enviado no pedido HTTP de qualquer forma, visível no Network tab).
// Isto só torna visível, em produção, o valor exato que o bundle
// publicado está a usar — sem precisar de abrir DevTools manualmente.
// ============================================================

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let scriptLoadingPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if ((window as any).google?.accounts?.id) return Promise.resolve();
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Falha ao carregar o Google.")));
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Falha ao carregar o Google."));
    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}

interface RenderGoogleButtonOptions {
  containerId: string;
  onCredential: (idToken: string) => void;
  onError?: (error: Error) => void;
}

export async function renderGoogleButton({
  containerId,
  onCredential,
  onError,
}: RenderGoogleButtonOptions): Promise<void> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // ---- DIAGNÓSTICO TEMPORÁRIO ----
  // Mostra no console o valor exato (comprimento incluído, para apanhar
  // espaços/quebras de linha invisíveis) que este bundle publicado tem.
  // client_id é público — não é um secret — por isso é seguro logar.
  if (typeof window !== "undefined") {
    console.log("[DIAG] NEXT_PUBLIC_GOOGLE_CLIENT_ID:", JSON.stringify(clientId));
    console.log("[DIAG] length:", clientId?.length);
    console.log("[DIAG] trimmed === original:", clientId === clientId?.trim());
  }
  // ---- FIM DIAGNÓSTICO ----

  if (!clientId) {
    onError?.(new Error("Google Client ID não configurado."));
    return;
  }

  try {
    await loadGoogleScript();
  } catch (err) {
    onError?.(err instanceof Error ? err : new Error("Erro ao carregar o Google."));
    return;
  }

  const google = (window as any).google;
  if (!google?.accounts?.id) {
    onError?.(new Error("Google Identity Services indisponível."));
    return;
  }

  google.accounts.id.initialize({
    client_id: clientId,
    callback: (response: { credential: string }) => {
      if (response?.credential) {
        onCredential(response.credential);
      } else {
        onError?.(new Error("Google não devolveu credenciais."));
      }
    },
  });

  const container = document.getElementById(containerId);
  if (!container) return;

  // Limpa antes de renderizar — evita botões duplicados em re-renders
  // (ex: troca de accountType no login).
  container.innerHTML = "";

  google.accounts.id.renderButton(container, {
    type: "standard",
    theme: "outline",
    size: "large",
    shape: "pill",
    text: "continue_with",
    width: container.clientWidth || 320,
  });
}