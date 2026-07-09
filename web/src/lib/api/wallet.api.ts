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
  return res.json();
}

export const walletApi = {
  getWallet:       ()              => req<any>('/wallet/me'),
  getTransactions: (page = 1)     => req<any>(`/wallet/transactions?page=${page}&limit=20`),
  deposit:         (amount: number, description?: string) =>
    req<any>('/wallet/deposit', { method: 'POST', body: JSON.stringify({ amount, description }) }),
  withdraw:        (amount: number) =>
    req<any>('/wallet/withdraw', { method: 'POST', body: JSON.stringify({ amount }) }),
};