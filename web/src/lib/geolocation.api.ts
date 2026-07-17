// src/lib/geolocation.api.ts
// UPDATE existing file — adds sharing toggle support, keeps everything else intact

import { api } from './api';

export interface ProviderLocation {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  category: string | null;
  district: string | null;
  avatarUrl: string | null;
  bio: string | null;
  latitude: number | null;
  longitude: number | null;
  isOnline: boolean;
  locationSharingEnabled: boolean;
  locationEnabled: boolean;
  isVerified: boolean;
  lastSeenAt: string | null;
}

export interface ProviderWithDistance extends ProviderLocation {
  distanceKm: number;
  etaMinutes: number;
}

export type StatusFilter = 'all' | 'online' | 'offline';
export type SortFilter = 'nearest' | 'default';

export interface NearbyQuery {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  category?: string;
  status?: StatusFilter;
  availableOnly?: boolean;
}

export async function activateLocation(
  latitude: number,
  longitude: number,
): Promise<ProviderLocation> {
  return api.patch<ProviderLocation>('/geolocation/location', {
    latitude,
    longitude,
    isOnline: true,
  });
}

// Liga/desliga a partilha de localização do prestador. Distinto de
// activateLocation: este endpoint controla se o backend aceita
// atualizações de posição, não a posição em si.
export async function updateLocationSharing(enabled: boolean): Promise<ProviderLocation> {
  return api.patch<ProviderLocation>('/geolocation/sharing', { enabled });
}

export async function fetchNearbyProviders(
  query: NearbyQuery,
): Promise<ProviderWithDistance[]> {
  const params = new URLSearchParams();
  params.set('latitude', String(query.latitude));
  params.set('longitude', String(query.longitude));
  if (query.radiusKm) params.set('radiusKm', String(query.radiusKm));
  if (query.category && query.category !== 'Todos') {
    params.set('category', query.category);
  }
  if (query.status && query.status !== 'all') {
    params.set('status', query.status);
  }
  if (query.availableOnly) {
    params.set('availableOnly', 'true');
  }
  return api.get<ProviderWithDistance[]>(`/geolocation/providers/nearby?${params}`);
}

export async function fetchProviders(category?: string): Promise<ProviderLocation[]> {
  const params = category && category !== 'Todos'
    ? `?category=${encodeURIComponent(category)}`
    : '';
  return api.get<ProviderLocation[]>(`/users/providers${params}`);
}