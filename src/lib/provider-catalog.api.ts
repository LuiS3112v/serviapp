import { api } from './api';

export interface ProviderCatalogEntry {
  id: string;
  providerId: string;
  title: string;
  description: string;
  category: string;
  address?: string;
  pricePerHour?: number;
  isActive: boolean;
  provider?: { id: string; fullName: string; isVerified: boolean };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCatalogPayload {
  title: string;
  description: string;
  category: string;
  address?: string;
  pricePerHour?: number;
}

export const providerCatalogApi = {
  create: (data: CreateCatalogPayload) =>
    api.post<ProviderCatalogEntry>('/catalog', data),

  getMyCatalog: () =>
    api.get<ProviderCatalogEntry[]>('/catalog/my'),

  getAll: (category?: string) =>
    api.get<ProviderCatalogEntry[]>(
      `/catalog${category ? `?category=${encodeURIComponent(category)}` : ''}`
    ),

  getOne: (id: string) =>
    api.get<ProviderCatalogEntry>(`/catalog/${id}`),

  update: (id: string, data: Partial<CreateCatalogPayload> & { isActive?: boolean }) =>
    api.patch<ProviderCatalogEntry>(`/catalog/${id}`, data),

  remove: (id: string) =>
    api.delete<void>(`/catalog/${id}`),
};