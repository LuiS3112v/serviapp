export interface UpdateLocationPayload {
  latitude: number;
  longitude: number;
  isOnline?: boolean;
}

export interface UpdateSharingPayload {
  enabled: boolean;
}

export interface NearbyQueryPayload {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  category?: string;
  status?: 'online' | 'offline' | 'all';
  availableOnly?: boolean;
}

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
  lastSeenAt: Date | null;
}

export interface ProviderWithDistance extends ProviderLocation {
  distanceKm: number;
  etaMinutes: number;
}