export interface UpdateLocationPayload {
  latitude: number;
  longitude: number;
  isOnline?: boolean;          // ← was "isBoolean" (typo) — fixed
}

export interface NearbyQueryPayload {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  category?: string;
  status?: 'online' | 'offline' | 'all';   // ← new: Estado filter
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
  locationEnabled: boolean;     // ← new: derived field (has coords + isOnline)
  isVerified: boolean;
  lastSeenAt: Date | null;
}

export interface ProviderWithDistance extends ProviderLocation {
  distanceKm: number;
  etaMinutes: number;
}