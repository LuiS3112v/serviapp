import { api } from './api';

export interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  address: string;
  province?: string;
  budget: number;
  agreedPrice?: number;
  proposedPrice?: number;
  proposedByProviderId?: string;
  proposedByProvider?: { id: string; fullName: string };
  targetProviderId?: string;
  status: string;
  clientId: string;
  providerId?: string;
  provider?: { id: string; fullName: string };
  client?: { id: string; fullName: string };
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
  clientRating?: number;
  clientReview?: string;
}

export interface ClientStats {
  totalCreated: number;
  totalSpent: number;
  totalCompleted: number;
  totalCancelled: number;
  averageRating: number | null;
}

export interface ProviderStats {
  totalOrders: number;
  totalCompleted: number;
  totalEarnings: number;
  averageRating: number | null;
  activeOrders: number;
}

export interface ProviderStatsByPeriod {
  totalCompleted: number;
  totalEarnings: number;
  averageRating: number | null;
  avgResponseTimeHours: number | null;
  rankingScore: number;
  earningsByPeriod: { label: string; value: number }[];
  completedByPeriod: { label: string; value: number }[];
}

export interface ProviderReview {
  id: string;
  title: string;
  clientName: string;
  rating: number;
  review: string | null;
  completedAt: string;
}

export interface ProviderReviewsData {
  reviews: ProviderReview[];
  stats: { total: number; average: number | null; distribution: Record<string, number> };
}

export interface CreateServicePayload {
  title: string;
  description: string;
  category: string;
  address: string;
  province?: string;
  budget: number;
  scheduledAt?: string;
  targetProviderId?: string;
}

export interface ReviewPayload {
  rating: number;
  review?: string;
}

export interface AvailableFilter {
  category?: string;
  province?: string;
  minBudget?: number;
  maxBudget?: number;
}

export const servicesApi = {
  // ─── CLIENT ──────────────────────────────────────────────────────────────

  create: (data: CreateServicePayload) =>
    api.post<Service>('/services', data),

  getMyServices: (status?: string) =>
    api.get<Service[]>(`/services/my${status ? `?status=${status}` : ''}`),

  getClientStats: () =>
    api.get<ClientStats>('/services/client/stats'),

  update: (id: string, data: Partial<CreateServicePayload>) =>
    api.patch<Service>(`/services/client/${id}/update`, data),

  confirm: (id: string, data: ReviewPayload) =>
    api.patch<Service>(`/services/client/${id}/confirm`, data),

  acceptProposal: (id: string) =>
    api.patch<Service>(`/services/client/${id}/accept-proposal`),

  rejectProposal: (id: string) =>
    api.patch<Service>(`/services/client/${id}/reject-proposal`),

  cancelClient: (id: string, reason: string) =>
    api.patch<Service>(`/services/client/${id}/cancel`, { reason }),

  // ─── PROVIDER ────────────────────────────────────────────────────────────

  getAvailable: (filter?: AvailableFilter) => {
    const params = new URLSearchParams();
    if (filter?.category) params.set('category', filter.category);
    if (filter?.province) params.set('province', filter.province);
    if (filter?.minBudget !== undefined) params.set('minBudget', String(filter.minBudget));
    if (filter?.maxBudget !== undefined) params.set('maxBudget', String(filter.maxBudget));
    const qs = params.toString();
    return api.get<Service[]>(`/services/available${qs ? `?${qs}` : ''}`);
  },

  getProviderServices: (status?: string) =>
    api.get<Service[]>(`/services/provider/my${status ? `?status=${status}` : ''}`),

  getMyProposals: () =>
    api.get<Service[]>('/services/provider/proposals'),

  getProviderStats: () =>
    api.get<ProviderStats>('/services/provider/stats'),

  getProviderStatsByPeriod: (period: string) =>
    api.get<ProviderStatsByPeriod>(
      `/services/provider/stats/period?period=${encodeURIComponent(period)}`
    ),

  getProviderReviews: () =>
    api.get<ProviderReviewsData>('/services/provider/reviews'),

  accept: (id: string, agreedPrice: number) =>
    api.patch<Service>(`/services/provider/${id}/accept`, { agreedPrice }),

  proposePrice: (id: string, proposedPrice: number) =>
    api.patch<Service>(`/services/provider/${id}/propose`, { proposedPrice }),

  start: (id: string) =>
    api.patch<Service>(`/services/provider/${id}/start`),

  complete: (id: string) =>
    api.patch<Service>(`/services/provider/${id}/complete`),

  cancelProvider: (id: string, reason: string) =>
    api.patch<Service>(`/services/provider/${id}/cancel`, { reason }),

  // ─── SHARED ──────────────────────────────────────────────────────────────

  getOne: (id: string) =>
    api.get<Service>(`/services/${id}`),
};