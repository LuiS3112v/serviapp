import { getToken } from '@/lib/auth.api';

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').replace(/\/$/, '');

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(Array.isArray(err.message) ? err.message[0] : err.message || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

export interface PaymentProof {
  id: string;
  paymentId: string;
  uploadedByUserId: string;
  fileUrl: string;
  filePublicId: string | null;
  fileType: string;
  status: 'active' | 'replaced' | 'confirmed';
  confirmedByAdminId: string | null;
  confirmedAt: string | null;
  createdAt: string;
}

// FIX: URL do proxy do backend em vez da URL directa da Cloudinary
// (proof.fileUrl). O proxy autentica o pedido com o token do
// utilizador e serve o ficheiro através da nossa própria API,
// contornando as restrições de acesso a ficheiros 'raw' (PDFs) que a
// Cloudinary pode aplicar consoante o plano da conta. Como é uma
// chamada GET autenticada por header, para <img>/<iframe>/<object>
// não podemos simplesmente pôr a URL — precisamos de buscar o ficheiro
// via fetch com o token e criar um Blob URL local (ver getProofBlobUrl).
export function getProofFileUrl(proofId: string): string {
  return `${BASE}/payment-proofs/file/${proofId}`;
}

// Busca o ficheiro autenticado e devolve um Object URL local (blob:...)
// que pode ser usado directamente em <img src>, <object data>, ou
// window.open(). Isto é necessário porque tags HTML não conseguem
// enviar um header Authorization — só window.fetch consegue.
export async function getProofBlobUrl(proofId: string): Promise<{ url: string; contentType: string }> {
  const token = getToken();
  const res = await fetch(getProofFileUrl(proofId), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Não foi possível carregar o ficheiro (${res.status})`);
  }
  const contentType = res.headers.get('Content-Type') ?? 'application/octet-stream';
  const blob = await res.blob();
  return { url: URL.createObjectURL(blob), contentType };
}

export const paymentProofApi = {
  upload: (paymentId: string, file: File) => {
    const fd = new FormData();
    fd.append('proof', file);
    return req<PaymentProof>(`/payment-proofs/${paymentId}/upload`, {
      method: 'POST',
      body: fd,
    });
  },

  getMyHistory: (paymentId: string) =>
    req<PaymentProof[]>(`/payment-proofs/${paymentId}/history/mine`),

  getForProvider: (paymentId: string) =>
    req<PaymentProof>(`/payment-proofs/${paymentId}/for-provider`),

  getHistoryForAdmin: (paymentId: string) =>
    req<PaymentProof[]>(`/payment-proofs/${paymentId}/history/admin`),
};