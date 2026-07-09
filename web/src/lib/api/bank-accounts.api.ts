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

export interface PlatformBankAccount {
  id: string;
  bankName: string;
  accountHolder: string;
  iban: string;
  accountNumber: string | null;
  isActive: boolean;
  isDefault: boolean;
}

export interface ProviderBankAccount {
  id: string;
  userId: string;
  bankName: string;
  accountHolder: string;
  iban: string;
  accountNumber: string | null;
}

export interface UpsertProviderBankAccountPayload {
  bankName: string;
  accountHolder: string;
  iban: string;
  accountNumber?: string;
}

export const bankAccountsApi = {
  // Conta da ServiApp — visível a qualquer utilizador autenticado
  getPlatformAccount: () =>
    req<PlatformBankAccount>('/bank-accounts/platform'),

  // Admin: gestão de contas da plataforma
  listPlatformAccounts: () =>
    req<PlatformBankAccount[]>('/bank-accounts/platform/all'),

  createPlatformAccount: (payload: Omit<PlatformBankAccount, 'id' | 'isActive'>) =>
    req<PlatformBankAccount>('/bank-accounts/platform', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updatePlatformAccount: (id: string, payload: Partial<PlatformBankAccount>) =>
    req<PlatformBankAccount>(`/bank-accounts/platform/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Conta do próprio prestador
  getMyProviderAccount: () =>
    req<ProviderBankAccount | null>('/bank-accounts/provider/me'),

  upsertMyProviderAccount: (payload: UpsertProviderBankAccountPayload) =>
    req<ProviderBankAccount>('/bank-accounts/provider/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};