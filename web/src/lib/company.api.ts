import { api } from "./api";
import { getToken } from "./auth.api";
import {
  Company, CompanyStats, TimelineItem, CompanyServiceBadge,
  CompanyEmployee, CompanyInvitation, CompanyPortfolioItem,
  CompanyGalleryImage, CompanyCertification, CompanyVerification,
  CompanyEmployeeRole, CreateCompanyPayload, UpdateCompanyPayload,
  CreateInvitationPayload, SubmitCompanyKycPayload, SocialLinks,
  WorkingHourDay,
} from "@/types/company.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function uploadRequest<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(Array.isArray(err.message) ? err.message[0] : err.message || "Erro no upload");
  }
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

export const companyApi = {
  // ── Perfil ────────────────────────────────────────────────────────────
  create: (payload: CreateCompanyPayload) =>
    api.post<Company>("/company", payload),

  getMine: () =>
    api.get<Company>("/company/me"),

  // Perfil público — não precisa de autenticação
  getPublic: (companyId: string) =>
    api.get<Company>(`/company/${companyId}/public`),

  // Serviços públicos da empresa (visíveis no perfil público)
  getServicesPublic: (companyId: string) =>
    api.get<CompanyServiceBadge[]>(`/company/${companyId}/services/public`),

  update: (companyId: string, payload: UpdateCompanyPayload) =>
    api.patch<Company>(`/company/${companyId}`, payload),

  updateAbout: (companyId: string, about: string) =>
    api.patch<Company>(`/company/${companyId}/about`, { about }),

  updateWorkingHours: (companyId: string, hours: WorkingHourDay[]) =>
    api.patch<Company>(`/company/${companyId}/working-hours`, { hours }),

  updateCoverage: (companyId: string, provinces: string[]) =>
    api.patch<Company>(`/company/${companyId}/coverage`, { provinces }),

  updateSocialLinks: (companyId: string, links: SocialLinks) =>
    api.patch<Company>(`/company/${companyId}/social-links`, links),

  uploadLogo: (companyId: string, file: File) => {
    const fd = new FormData();
    fd.append("logo", file);
    return uploadRequest<Company>(`/company/${companyId}/logo`, fd);
  },

  uploadBanner: (companyId: string, file: File) => {
    const fd = new FormData();
    fd.append("banner", file);
    return uploadRequest<Company>(`/company/${companyId}/banner`, fd);
  },

  // ── Stats e Timeline ──────────────────────────────────────────────────
  getStats: (companyId: string) =>
    api.get<CompanyStats>(`/company/${companyId}/stats`),

  getTimeline: (companyId: string) =>
    api.get<TimelineItem[]>(`/company/${companyId}/timeline`),

  // ── Serviços (privado — painel da empresa) ────────────────────────────
  getServices: (companyId: string) =>
    api.get<CompanyServiceBadge[]>(`/company/${companyId}/services`),

  addService: (companyId: string, label: string, category: string) =>
    api.post<CompanyServiceBadge>(`/company/${companyId}/services`, { label, category }),

  removeService: (companyId: string, serviceId: string) =>
    api.delete<{ deleted: boolean }>(`/company/${companyId}/services/${serviceId}`),

  // ── Equipa ────────────────────────────────────────────────────────────
  getTeam: (companyId: string) =>
    api.get<CompanyEmployee[]>(`/company/${companyId}/team`),

  removeEmployee: (companyId: string, employeeId: string) =>
    api.delete<{ deleted: boolean }>(`/company/${companyId}/team/${employeeId}`),

  updateEmployeeRole: (companyId: string, employeeId: string, role: CompanyEmployeeRole) =>
    api.patch<CompanyEmployee>(`/company/${companyId}/team/${employeeId}/role`, { role }),

  // ── Convites ──────────────────────────────────────────────────────────
  getInvitations: (companyId: string) =>
    api.get<CompanyInvitation[]>(`/company/${companyId}/invitations`),

  sendInvitation: (companyId: string, payload: CreateInvitationPayload) =>
    api.post<CompanyInvitation>(`/company/${companyId}/invitations`, payload),

  respondInvitation: (invitationId: string, accept: boolean) =>
    api.patch<CompanyInvitation>(`/company/invitations/${invitationId}/respond`, { accept }),

  // ── Portfólio (privado) ───────────────────────────────────────────────
  getPortfolio: (companyId: string) =>
    api.get<CompanyPortfolioItem[]>(`/company/${companyId}/portfolio`),

  addPortfolioItem: (companyId: string, data: { name: string; client?: string; category?: string; value?: number; projectDate?: string }) =>
    api.post<CompanyPortfolioItem>(`/company/${companyId}/portfolio`, data),

  addPortfolioPhotos: (companyId: string, itemId: string, files: File[]) => {
    const fd = new FormData();
    files.forEach(f => fd.append("photos", f));
    return uploadRequest<CompanyPortfolioItem>(`/company/${companyId}/portfolio/${itemId}/photos`, fd);
  },

  removePortfolioItem: (companyId: string, itemId: string) =>
    api.delete<{ deleted: boolean }>(`/company/${companyId}/portfolio/${itemId}`),

  // ── Galeria (privada — só dono e funcionários) ────────────────────────
  getGallery: (companyId: string) =>
    api.get<CompanyGalleryImage[]>(`/company/${companyId}/gallery`),

  addGalleryImage: (companyId: string, file: File, caption?: string) => {
    const fd = new FormData();
    fd.append("image", file);
    if (caption) fd.append("caption", caption);
    return uploadRequest<CompanyGalleryImage>(`/company/${companyId}/gallery`, fd);
  },

  removeGalleryImage: (companyId: string, imageId: string) =>
    api.delete<{ deleted: boolean }>(`/company/${companyId}/gallery/${imageId}`),

  // ── Certificações (privadas) ──────────────────────────────────────────
  getCertifications: (companyId: string) =>
    api.get<CompanyCertification[]>(`/company/${companyId}/certifications`),

  addCertification: (companyId: string, data: { name: string; issuer?: string; year?: string }) =>
    api.post<CompanyCertification>(`/company/${companyId}/certifications`, data),

  removeCertification: (companyId: string, certId: string) =>
    api.delete<{ deleted: boolean }>(`/company/${companyId}/certifications/${certId}`),

  // ── KYC da Empresa ────────────────────────────────────────────────────
  getKycStatus: (companyId: string) =>
    api.get<CompanyVerification | null>(`/company-kyc/${companyId}/status`),

  submitKyc: (
    companyId: string,
    payload: SubmitCompanyKycPayload,
    files: { nifDoc: File; commercialLicense: File; commercialRegistry: File; representativeId: File },
  ) => {
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => fd.append(k, String(v)));
    fd.append("nifDoc", files.nifDoc);
    fd.append("commercialLicense", files.commercialLicense);
    fd.append("commercialRegistry", files.commercialRegistry);
    fd.append("representativeId", files.representativeId);
    return uploadRequest<CompanyVerification>(`/company-kyc/${companyId}/submit`, fd);
  },
};