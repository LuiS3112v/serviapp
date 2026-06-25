// ════════════════════════════════════════════════════════════════════════
// Espelha exactamente as entities do backend (Company, CompanyVerification,
// CompanyEmployee, CompanyInvitation, CompanyService, CompanyPortfolioItem,
// CompanyGalleryImage, CompanyCertification).
// ════════════════════════════════════════════════════════════════════════

export type CompanyVerificationStatus = "pending" | "verified" | "suspended";
export type CompanyEmployeeRole = "owner" | "admin" | "manager" | "supervisor" | "employee";
export type CompanyEmployeeStatus = "active" | "busy" | "offline";
export type CompanyInvitationStatus = "pending" | "accepted" | "rejected";
export type KycStatus = "pending" | "approved" | "rejected";

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  linkedin?: string;
  whatsapp?: string;
  website?: string;
}

export interface WorkingHourDay {
  day: string;
  open: boolean;
  from: string;
  to: string;
}

export interface Company {
  id: string;
  ownerId: string;
  name: string;
  logoUrl?: string;
  bannerUrl?: string;
  verificationStatus: CompanyVerificationStatus;
  verifiedAt?: string | null;
  mainCategory: string;
  foundedYear: number;
  website?: string;
  email: string;
  phone: string;
  nif?: string;
  headquarters?: string;
  province?: string;
  municipality?: string;
  address?: string;
  sector?: string;
  about?: string;
  workingHours?: WorkingHourDay[] | null;
  coverageProvinces?: string[] | null;
  socialLinks?: SocialLinks | null;
  services?: CompanyServiceBadge[];
  verification?: CompanyVerification;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyStats {
  employees: number;
  clientsServed: number;
  activeServices: number;
  completedServices: number;
  averageRating: number;
  totalEarnings: number;
  monthlyEarnings: number;
  yearsActive: number;
  avgResponseTimeHours: number;
  completionRate: number;
  recurringClients: number;
}

export interface TimelineItem {
  id: string;
  label: string;
  date: string;
  achieved: boolean;
}

export interface CompanyServiceBadge {
  id: string;
  companyId: string;
  label: string;
  category: string;
  createdAt: string;
}

export interface CompanyEmployee {
  id: string;
  companyId: string;
  userId: string;
  user?: { id: string; fullName: string; email: string; phone?: string; avatarUrl?: string };
  jobTitle?: string;
  role: CompanyEmployeeRole;
  status: CompanyEmployeeStatus;
  department?: string;
  completedServices: number;
  averageRating: number;
  earningsGenerated: number;
  avgResponseTimeMinutes: number;
  joinedAt: string;
}

export interface CompanyInvitation {
  id: string;
  companyId: string;
  invitedByUserId: string;
  inviteeUserId: string;
  invitee?: { id: string; fullName: string; email: string; phone?: string };
  proposedRole: CompanyEmployeeRole;
  proposedDepartment?: string;
  status: CompanyInvitationStatus;
  respondedAt?: string | null;
  sentAt: string;
}

export interface CompanyPortfolioItem {
  id: string;
  companyId: string;
  name: string;
  client?: string;
  category?: string;
  value: number;
  projectDate?: string;
  photoUrls: string[];
  createdAt: string;
}

export interface CompanyGalleryImage {
  id: string;
  companyId: string;
  url: string;
  publicId: string;
  caption?: string;
  createdAt: string;
}

export interface CompanyCertification {
  id: string;
  companyId: string;
  name: string;
  issuer?: string;
  year?: string;
  certificateUrl?: string;
  createdAt: string;
}

export interface CompanyVerification {
  id: string;
  companyId: string;
  legalName: string;
  nif: string;
  representativeFullName: string;
  representativeBiNumber: string;
  phoneNumber: string;
  province: string;
  nifDocUrl: string;
  commercialLicenseUrl: string;
  commercialRegistryUrl: string;
  representativeIdUrl: string;
  status: KycStatus;
  rejectionReason?: string;
  reviewedByAdminId?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Payloads para criação/edição ──────────────────────────────────────────

export interface CreateCompanyPayload {
  name: string;
  mainCategory: string;
  foundedYear: number;
  email: string;
  phone: string;
  website?: string;
  nif?: string;
  headquarters?: string;
  province?: string;
  municipality?: string;
  address?: string;
  sector?: string;
}

export type UpdateCompanyPayload = Partial<CreateCompanyPayload>;

export interface CreateInvitationPayload {
  inviteeUserId: string;
  proposedRole: CompanyEmployeeRole;
  proposedDepartment?: string;
}

export interface SubmitCompanyKycPayload {
  legalName: string;
  nif: string;
  representativeFullName: string;
  representativeBiNumber: string;
  phoneNumber: string;
  province: string;
}