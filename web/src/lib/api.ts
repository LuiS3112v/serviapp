import { getToken, clearSession } from "./auth.api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Adicionado suporte opcional a AbortSignal em todos os métodos.
// Motivo: fetchNearbyProviders (chamado a partir do map/page.tsx) não
// tinha nenhuma forma de cancelar um pedido em curso quando o
// utilizador troca de filtro/categoria rapidamente. Sem isto, uma
// resposta antiga podia chegar depois de uma mais recente e sobrescrever
// o resultado correto no ecrã (race condition real, não hipotética).
// `signal` é opcional em todos os métodos — chamadas existentes que não
// o passam continuam a funcionar exatamente como antes, sem qualquer
// mudança de comportamento.
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    clearSession();
    if (typeof window !== "undefined") window.location.href = "/";
    throw new Error("Sessão expirada. Faz login novamente.");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      Array.isArray(err.message) ? err.message[0] : err.message || "Erro na API"
    );
  }

  const text = await res.text();
  return text ? JSON.parse(text) : (null as T);
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal }),
  post: <T>(path: string, body: unknown, signal?: AbortSignal) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body), signal }),
  patch: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
      signal,
    }),
  delete: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>(path, {
      method: "DELETE",
      body: body ? JSON.stringify(body) : undefined,
      signal,
    }),
};