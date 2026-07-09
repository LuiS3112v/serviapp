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

export interface LatestProofRef {
  id: string;
  fileType: string;
  createdAt: string;
}

export interface AdminPaymentRow {
  id: string;
  serviceId: string;
  serviceTitle: string;
  client: { id: string; fullName: string; phone: string };
  provider: { id: string; fullName: string };
  amount: number;
  platformFee: number;
  providerAmount: number;
  commissionPercentageUsed: number;
  status: string;
  latestProof: LatestProofRef | null;
  createdAt: string;
  confirmedAt: string | null;
  releasedAt: string | null;
  providerBankAccount?: {
    bankName: string;
    accountHolder: string;
    iban: string;
    accountNumber: string | null;
  } | null;
}

export interface AdminPaymentDetail extends AdminPaymentRow {
  proofHistory: any[];
}

export interface AdminDisputedService {
  serviceId: string;
  serviceTitle: string;
  disputeReason: string;
  client: { id: string; fullName: string; phone: string };
  provider: { id: string; fullName: string };
  payment: {
    id: string;
    amount: number;
    platformFee: number;
    providerAmount: number;
    commissionPercentageUsed: number;
    status: string;
  } | null;
  latestProof: LatestProofRef | null;
  providerBankAccount: {
    bankName: string;
    accountHolder: string;
    iban: string;
    accountNumber: string | null;
  } | null;
  updatedAt: string;
}

export const adminPaymentsApi = {
  listPendingProofs:     () => req<AdminPaymentRow[]>('/admin/payments/pending-proofs'),
  listConfirmedPayments: () => req<AdminPaymentRow[]>('/admin/payments/confirmed'),
  listPendingPayouts:    () => req<AdminPaymentRow[]>('/admin/payments/pending-payouts'),
  listDisputedServices:  () => req<AdminDisputedService[]>('/admin/payments/disputed'),
  getDetail:             (id: string) => req<AdminPaymentDetail>(`/admin/payments/${id}`),

  confirmProof: (id: string) =>
    req<AdminPaymentDetail>(`/admin/payments/${id}/confirm-proof`, { method: 'PATCH' }),

  rejectProof: (id: string, reason: string) =>
    req<AdminPaymentDetail>(`/admin/payments/${id}/reject-proof`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),

  markPayoutDone: (id: string) =>
    req<AdminPaymentDetail>(`/admin/payments/${id}/mark-payout-done`, { method: 'PATCH' }),

  resolveDisputeForClient: (serviceId: string, resolution: string) =>
    req<{ serviceId: string; resolvedFor: string }>(`/admin/payments/disputed/${serviceId}/resolve-client`, {
      method: 'PATCH',
      body: JSON.stringify({ resolution }),
    }),

  resolveDisputeForProvider: (serviceId: string, resolution: string) =>
    req<{ serviceId: string; resolvedFor: string }>(`/admin/payments/disputed/${serviceId}/resolve-provider`, {
      method: 'PATCH',
      body: JSON.stringify({ resolution }),
    }),
};