// ─── Types ────────────────────────────────────────────────────────────────────

import { getToken } from '@/lib/auth.api';  // ← ADD THIS

export interface AdminStats {
  totalUsers: number;
  activeServices: number;
  totalVolume: number;
  pendingKyc: number;
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface AdminKyc {
  id: string;
  userName: string;
  documentStatus: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').replace(/\/$/, '');

// ─── REMOVED local getToken() — it was looking under wrong keys.
// Now uses getToken() from auth.api.ts which reads serviapp_token_{role}

function authHeaders(): HeadersInit {
  const token = getToken();  // ← now reads serviapp_token_admin correctly
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── Core request helper ──────────────────────────────────────────────────────

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...authHeaders(),
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(text || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as unknown as T;

  return res.json() as Promise<T>;
}

// ─── Admin API ────────────────────────────────────────────────────────────────

export const adminApi = {
  getStats:       ()           => request<AdminStats>('/admin/stats'),
  getRecentUsers: ()           => request<AdminUser[]>('/admin/recent-users'),
  getPendingKyc:  ()           => request<AdminKyc[]>('/admin/pending-kyc'),
  approveKyc:     (id: string) => request<void>(`/admin/kyc/${id}/approve`, { method: 'PATCH' }),
  rejectKyc:      (id: string) => request<void>(`/admin/kyc/${id}/reject`,  { method: 'PATCH' }),
} as const;