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

export interface PaymentBankAccount {
  bankName: string;
  accountHolder: string;
  iban: string;
  accountNumber: string | null;
}

export interface ServicePayment {
  id: string;
  serviceId: string;
  amount: number;
  platformFee: number;
  providerAmount: number;
  commissionPercentageUsed: number;
  status: string;
  platformBankAccountId: string | null;
  createdAt: string;
  confirmedAt: string | null;
  releasedAt: string | null;
}

export const servicesDetailApi = {
  // Leitura
  get:        (id: string) => req<any>(`/services/${id}`),
  timeline:   (id: string) => req<any[]>(`/services/${id}/timeline`),
  myRequests: ()          => req<any[]>(`/services/my-requests`),
  myJobs:     ()          => req<any[]>(`/services/my-jobs`),

  // Aceitação / rejeição
  accept: (id: string, agreedPrice?: number) =>
    req<any>(`/services/${id}/accept`, { method: 'PATCH', body: JSON.stringify({ agreedPrice }) }),
  reject: (id: string, reason?: string) =>
    req<any>(`/services/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) }),

  // Pagamento — agora devolve payment + dados bancários da ServiApp,
  // porque não existe mais débito automático de wallet.
  pay: (id: string) =>
    req<{ payment: ServicePayment; bankAccount: PaymentBankAccount }>(`/services/${id}/pay`, { method: 'POST' }),

  // Consultar o estado do pagamento sem reiniciar o processo (para o
  // Service ID recarregar o estado ao entrar na página)
  getPayment: (serviceId: string) =>
    req<ServicePayment | null>(`/services/${serviceId}/payment`),

  // PIN
  generatePin: (id: string) => req<{ pin: string; expiresAt: string }>(`/services/${id}/generate-pin`, { method: 'POST' }),
  startService: (id: string, pin: string) =>
    req<any>(`/services/${id}/start`, { method: 'PATCH', body: JSON.stringify({ pin }) }),

  // Conclusão
  providerComplete: (id: string, warrantyDays?: number) =>
    req<any>(`/services/${id}/provider-complete`, { method: 'PATCH', body: JSON.stringify({ warrantyDays }) }),
  confirm: (id: string, review?: { rating?: number; review?: string }) =>
    req<any>(`/services/${id}/confirm`, { method: 'PATCH', body: JSON.stringify(review ?? {}) }),

  // Cancelamento + disputa
  cancel:      (id: string, reason?: string) =>
    req<any>(`/services/${id}/cancel`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
  openDispute: (id: string, reason: string) =>
    req<any>(`/services/${id}/dispute`, { method: 'POST', body: JSON.stringify({ reason }) }),
};