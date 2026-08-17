"use client";

// Carrega o Google Identity Services (GIS) uma única vez e renderiza
// o botão oficial "Continuar com Google". Não implementamos popup ou
// redirect manual — o GIS trata de tudo (funciona em desktop, tablet
// e mobile) e devolve um ID token assinado pela Google no callback,
// que é o único dado enviado ao nosso backend.

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