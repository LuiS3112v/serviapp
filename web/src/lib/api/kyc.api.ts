import { getToken } from '@/lib/auth.api';

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').replace(/\/$/, '');

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
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

// Só os campos confirmados no backend (KycService.getMyStatus devolve o
// registo ProviderVerification tal como está na base de dados, ou null
// se o prestador ainda não submeteu nenhum KYC). status usa os valores
// de KycStatus: 'pending' | 'approved' | 'rejected'.
export interface ProviderKycStatus {
  id: string;
  providerId: string;
  status: string;
  rejectionReason?: string | null;
}

export const kycApi = {
  getMyStatus: () =>
    req<ProviderKycStatus | null>('/provider/kyc/status'),
};