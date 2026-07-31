import { api } from './api';

export interface SubcategoryServiceProposalData {
  id: string;
  providerId: string;
  provider?: { id: string; fullName: string };
  proposedPrice: number;
  createdAt: string;
}

export interface SubcategoryServiceData {
  id: string;
  category: string;
  subcategory: string;
  address: string;
  status: 'broadcasting' | 'client_reviewing' | 'converted' | 'cancelled';
  clientId: string;
  client?: { id: string; fullName: string };
  convertedServiceId: string | null;
  proposals?: SubcategoryServiceProposalData[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubcategoryServicePayload {
  category: string;
  subcategory: string;
  address: string;
}

export const subcategoryServicesApi = {
  create: (data: CreateSubcategoryServicePayload) =>
    api.post<SubcategoryServiceData>('/subcategory-services', data),

  getMyServices: () =>
    api.get<SubcategoryServiceData[]>('/subcategory-services/my'),

  getAvailable: () =>
    api.get<SubcategoryServiceData[]>('/subcategory-services/available'),

  getOne: (id: string) =>
    api.get<SubcategoryServiceData>(`/subcategory-services/${id}`),

  proposePrice: (id: string, proposedPrice: number) =>
    api.post<SubcategoryServiceProposalData>(`/subcategory-services/${id}/propose`, { proposedPrice }),

  dismiss: (id: string) =>
    api.patch<void>(`/subcategory-services/${id}/dismiss`),

  acceptProposal: (id: string, proposalId: string) =>
    api.patch<{ id: string }>(`/subcategory-services/${id}/proposals/${proposalId}/accept`),

  reject: (id: string) =>
    api.patch<void>(`/subcategory-services/${id}/reject`),
};