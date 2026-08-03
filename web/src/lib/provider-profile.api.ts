import { api } from './api';
import { getToken } from './auth.api';
import {
  ProviderPublicProfile, ProviderGalleryImageData, ProviderPricedServiceData,
  CreatePricedServicePayload, UpdatePricedServicePayload,
} from '@/types/provider-profile.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Mesmo padrão de upload multipart já usado em company.api.ts —
// FormData não pode passar pela wrapper `api` genérica (que força
// Content-Type: application/json).
async function uploadRequest<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(Array.isArray(err.message) ? err.message[0] : err.message || 'Erro no upload');
  }
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

export const providerProfileApi = {
  // ── Público ─────────────────────────────────────────────────────────
  getPublicProfile: (providerId: string) =>
    api.get<ProviderPublicProfile>(`/provider-profile/${providerId}/public`),

  getMoreGallery: (providerId: string, offset: number) =>
    api.get<ProviderGalleryImageData[]>(`/provider-profile/${providerId}/gallery/more?offset=${offset}`),

  // ── Bio (privado) ───────────────────────────────────────────────────
  updateBio: (bio: string) =>
    api.patch<{ bio: string }>('/provider-profile/me/bio', { bio }),

  // ── Galeria (privada) ───────────────────────────────────────────────
  getMyGallery: () =>
    api.get<ProviderGalleryImageData[]>('/provider-profile/me/gallery'),

  addGalleryImage: (file: File, caption?: string) => {
    const fd = new FormData();
    fd.append('image', file);
    if (caption) fd.append('caption', caption);
    return uploadRequest<ProviderGalleryImageData>('/provider-profile/me/gallery', fd);
  },

  removeGalleryImage: (imageId: string) =>
    api.delete<{ deleted: boolean }>(`/provider-profile/me/gallery/${imageId}`),

  // ── Serviços e preços (privado) ─────────────────────────────────────
  getMyPricedServices: () =>
    api.get<ProviderPricedServiceData[]>('/provider-profile/me/services'),

  addPricedService: (payload: CreatePricedServicePayload) =>
    api.post<ProviderPricedServiceData>('/provider-profile/me/services', payload),

  updatePricedService: (serviceId: string, payload: UpdatePricedServicePayload) =>
    api.patch<ProviderPricedServiceData>(`/provider-profile/me/services/${serviceId}`, payload),

  removePricedService: (serviceId: string) =>
    api.delete<{ deleted: boolean }>(`/provider-profile/me/services/${serviceId}`),
};