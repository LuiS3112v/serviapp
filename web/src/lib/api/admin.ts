import { getToken } from '@/lib/auth.api';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  type: 'individual' | 'company';
  companyId?: string;
  createdAt?: string;
  // NOVO — só preenchidos quando type === 'individual', devolvidos por
  // AdminService.getPendingKyc() (backend). Nenhum campo novo na base de
  // dados: phoneNumber e os *Url já existiam em ProviderVerification,
  // avatarUrl já existia em User — só passaram a ser incluídos na
  // resposta deste endpoint.
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  frontBiUrl?: string;
  backBiUrl?: string;
  selfieUrl?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').replace(/\/$/, '');

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

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
  // Stats
  getStats: () => request<AdminStats>('/admin/stats'),

  // Utilizadores
  getRecentUsers: () => request<AdminUser[]>('/admin/recent-users'),

  // KYC individual (providers)
  getPendingKyc: () => request<AdminKyc[]>('/admin/pending-kyc'),
  approveKyc: (id: string) => request<void>(`/admin/kyc/${id}/approve`, { method: 'PATCH' }),
  rejectKyc:  (id: string) => request<void>(`/admin/kyc/${id}/reject`,  { method: 'PATCH' }),

  // KYC empresarial
  getPendingCompanyKyc: () => request<AdminKyc[]>('/admin/pending-company-kyc'),
  approveCompanyKyc: (id: string) => request<void>(`/admin/company-kyc/${id}/approve`, { method: 'PATCH' }),
  rejectCompanyKyc:  (id: string, reason: string) => request<void>(`/admin/company-kyc/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  }),
} as const;