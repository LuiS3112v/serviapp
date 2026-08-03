export interface ProviderGalleryImageData {
  id: string;
  url: string;
  caption: string | null;
}

export interface ProviderPricedServiceData {
  id: string;
  name: string;
  price: number;
}

export interface ProviderReview {
  id: string;
  title: string;
  clientName: string;
  rating: number;
  review: string | null;
  completedAt: string;
}

export interface ProviderReviewStats {
  total: number;
  average: number | null;
  distribution: Record<string, number>;
}

export interface ProviderPublicProfile {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  category: string | null;
  bio: string | null;
  isVerified: boolean;
  memberSince: string;
  completedServicesCount: number;
  gallery: ProviderGalleryImageData[];
  galleryTotal: number;
  services: ProviderPricedServiceData[];
  reviews: ProviderReview[];
  reviewStats: ProviderReviewStats;
}

export interface CreatePricedServicePayload {
  name: string;
  price: number;
}

export interface UpdatePricedServicePayload {
  name?: string;
  price?: number;
}