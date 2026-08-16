// src/lib/geolocation.api.ts

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

// `signal` opcional — permite ao chamador (map/page.tsx) cancelar um
// pedido em curso quando um filtro/categoria muda antes da resposta
// anterior chegar. Sem alteração de comportamento para quem não o passa.
export async function fetchNearbyProviders(
  query: NearbyQuery,
  signal?: AbortSignal,
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
  return api.get<ProviderWithDistance[]>(`/geolocation/providers/nearby?${params}`, signal);
}

export async function fetchProviders(category?: string, signal?: AbortSignal): Promise<ProviderLocation[]> {
  const params = category && category !== 'Todos'
    ? `?category=${encodeURIComponent(category)}`
    : '';
  return api.get<ProviderLocation[]>(`/users/providers${params}`, signal);
}