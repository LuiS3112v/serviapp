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

export interface DisputeEvidence {
  id: string;
  serviceId: string;
  uploadedByUserId: string;
  uploaderRole: 'client' | 'provider';
  fileUrl: string;
  filePublicId: string | null;
  fileType: string;
  description: string | null;
  createdAt: string;
  uploadedBy?: { id: string; fullName: string };
}

// URL do proxy do backend — prefixo dedicado /dispute-evidences/ para
// evitar conflito com as rotas /services/:id/dispute/evidence/* no Nest.
export function getEvidenceFileUrl(evidenceId: string): string {
  return `${BASE}/dispute-evidences/${evidenceId}/file`;
}

// Busca o ficheiro autenticado e devolve um Blob URL para uso em
// <img>, <object> ou window.open() — igual ao padrão do payment-proof.
export async function getEvidenceBlobUrl(
  evidenceId: string,
): Promise<{ url: string; contentType: string }> {
  const token = getToken();
  const res = await fetch(getEvidenceFileUrl(evidenceId), {
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

export const disputeEvidenceApi = {
  // Envia uma nova evidência (cliente ou prestador).
  upload: (serviceId: string, file: File, description?: string) => {
    const fd = new FormData();
    fd.append('evidence', file);
    if (description?.trim()) fd.append('description', description.trim());
    return req<DisputeEvidence>(`/services/${serviceId}/dispute/evidence`, {
      method: 'POST',
      body: fd,
    });
  },

  // Lista as evidências próprias do utilizador autenticado.
  listMine: (serviceId: string) =>
    req<DisputeEvidence[]>(`/services/${serviceId}/dispute/evidence/mine`),

  // Lista todas as evidências para o admin (ambas as partes).
  listForAdmin: (serviceId: string) =>
    req<DisputeEvidence[]>(`/services/${serviceId}/dispute/evidence/admin`),
};