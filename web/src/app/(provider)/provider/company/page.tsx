"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Edit, Users, Briefcase, Phone, Mail, MapPin, Plus, X, Check,
  Globe, ShieldCheck, Clock, Star, FileText,
  Image as ImageIcon, History, Share2, Search, Trash2, AlertCircle,
  UserPlus, Building2, MessageCircle, Loader2, Building,
} from "lucide-react";
import { companyApi } from "@/lib/company.api";
import {
  Company, CompanyStats, TimelineItem, CompanyServiceBadge,
  CompanyEmployee, CompanyInvitation, CompanyPortfolioItem,
  CompanyEmployeeRole, CompanyVerificationStatus, SocialLinks,
  WorkingHourDay, CompanyVerification, CompanyGalleryImage,
  CompanyCertification,
} from "@/types/company.types";

type TabKey = "overview" | "services" | "team" | "invites" | "portfolio" | "more";

const ROLE_LABEL: Record<CompanyEmployeeRole, string> = {
  owner: "Dono",
  admin: "Admin",
  manager: "Gerente",
  supervisor: "Supervisor",
  employee: "Funcionário",
};

const PROVINCES = [
  "Luanda", "Benguela", "Huambo", "Huíla", "Cabinda", "Bié", "Cuanza Norte",
  "Cuanza Sul", "Cunene", "Lunda Norte", "Lunda Sul", "Malanje", "Moxico",
  "Namibe", "Uíge", "Zaire", "Bengo", "Cuando Cubango",
];

const WEEK_DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

function defaultHours(): WorkingHourDay[] {
  return WEEK_DAYS.map(d => ({ day: d, open: false, from: "08:00", to: "17:00" }));
}

function StatusDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="dot-badge">
      <span className="dot" style={{ background: color }} />
      {label}
    </span>
  );
}

function VerificationBadge({ status }: { status: CompanyVerificationStatus }) {
  const map = {
    verified:  { label: "Verificada",  color: "#1D9E75", Icon: ShieldCheck },
    pending:   { label: "Em análise",  color: "#EF9F27", Icon: AlertCircle },
    suspended: { label: "Suspensa",    color: "#E24B4A", Icon: X },
  } as const;
  const { label, color, Icon } = map[status];
  return (
    <span className="v-badge" style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
      <Icon size={12} /> {label}
    </span>
  );
}

function EmployeeStatusBadge({ status }: { status: CompanyEmployee["status"] }) {
  const map = {
    active:  { label: "Activo",  color: "#1D9E75" },
    busy:    { label: "Ocupado", color: "#EF9F27" },
    offline: { label: "Offline", color: "#5a6a7a" },
  } as const;
  const s = map[status];
  return <StatusDot color={s.color} label={s.label} />;
}

function InviteStatusBadge({ status }: { status: CompanyInvitation["status"] }) {
  const map = {
    pending:  { label: "Pendente",  color: "#EF9F27" },
    accepted: { label: "Aceite",    color: "#1D9E75" },
    rejected: { label: "Rejeitado", color: "#E24B4A" },
  } as const;
  const s = map[status];
  return <StatusDot color={s.color} label={s.label} />;
}

// ════════════════════════════════════════════════════════════════════════
// Modal: Editar empresa
// ════════════════════════════════════════════════════════════════════════
function EditCompanyModal({
  open, company, onClose, onSave, saving,
}: {
  open: boolean; company: Company; onClose: () => void;
  onSave: (u: Partial<Company>) => void; saving: boolean;
}) {
  const [form, setForm] = useState({
    name: company.name,
    mainCategory: company.mainCategory,
    foundedYear: company.foundedYear,
    website: company.website ?? "",
    email: company.email,
    phone: company.phone,
    nif: company.nif ?? "",
    headquarters: company.headquarters ?? "",
    province: company.province ?? PROVINCES[0],
    municipality: company.municipality ?? "",
    address: company.address ?? "",
    sector: company.sector ?? "",
  });

  useEffect(() => {
    setForm({
      name: company.name,
      mainCategory: company.mainCategory,
      foundedYear: company.foundedYear,
      website: company.website ?? "",
      email: company.email,
      phone: company.phone,
      nif: company.nif ?? "",
      headquarters: company.headquarters ?? "",
      province: company.province ?? PROVINCES[0],
      municipality: company.municipality ?? "",
      address: company.address ?? "",
      sector: company.sector ?? "",
    });
  }, [company]);

  if (!open) return null;
  const set = (k: keyof typeof form, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar empresa</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Nome da empresa</label>
            <input className="input" value={form.name} onChange={e => set("name", e.target.value)} />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Categoria principal</label>
              <input className="input" value={form.mainCategory} onChange={e => set("mainCategory", e.target.value)} />
            </div>
            <div className="field">
              <label>Ano de fundação</label>
              <input className="input" type="number" value={form.foundedYear} onChange={e => set("foundedYear", Number(e.target.value))} />
            </div>
          </div>
          <div className="field">
            <label>Website</label>
            <input className="input" placeholder="https://" value={form.website} onChange={e => set("website", e.target.value)} />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Email</label>
              <input className="input" type="email" value={form.email} onChange={e => set("email", e.target.value)} />
            </div>
            <div className="field">
              <label>Telefone</label>
              <input className="input" value={form.phone} onChange={e => set("phone", e.target.value)} />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>NIF</label>
              <input className="input" value={form.nif} onChange={e => set("nif", e.target.value)} />
            </div>
            <div className="field">
              <label>Sector</label>
              <input className="input" value={form.sector} onChange={e => set("sector", e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Sede</label>
            <input className="input" value={form.headquarters} onChange={e => set("headquarters", e.target.value)} />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Província</label>
              <select className="input" value={form.province} onChange={e => set("province", e.target.value)}>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Município</label>
              <input className="input" value={form.municipality} onChange={e => set("municipality", e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Endereço</label>
            <input className="input" value={form.address} onChange={e => set("address", e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-primary" disabled={saving} onClick={() => onSave(form)}>
            {saving ? <Loader2 size={15} className="spin" /> : <Check size={15} />} Guardar alterações
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Modal: Convidar funcionário (pesquisa real de utilizadores, com role e avatar)
// ════════════════════════════════════════════════════════════════════════
function InviteModal({
  open, onClose, onSend, sending,
}: {
  open: boolean; onClose: () => void;
  onSend: (userId: string, role: CompanyEmployeeRole) => void;
  sending: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; fullName: string; email: string; phone?: string; role?: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<{ id: string; fullName: string } | null>(null);
  const [role, setRole] = useState<CompanyEmployeeRole>("employee");

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { getToken } = await import("@/lib/auth.api");
        const token = getToken();
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const res = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setResults(Array.isArray(data) ? data : []);
        }
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  if (!open) return null;

  const handleSend = () => {
    if (!selected) return;
    onSend(selected.id, role);
    setSelected(null); setQuery(""); setResults([]); setRole("employee");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Convidar funcionário</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Pesquisar por nome, email ou telefone</label>
            <div className="search-box">
              <Search size={15} style={{ color:"#4a6a6a" }} />
              <input
                className="search-input"
                placeholder="Escreve pelo menos 2 caracteres..."
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(null); }}
              />
              {searching && <Loader2 size={14} className="spin" style={{ color:"#4a6a6a" }} />}
            </div>
          </div>

          {/* Resultados da pesquisa */}
          {query.trim().length >= 2 && !selected && (
            <div style={{ display:"flex", flexDirection:"column", gap:6, maxHeight:200, overflowY:"auto" }}>
              {results.length === 0 && !searching && (
                <p className="hint" style={{ textAlign:"center", padding:"12px 0" }}>Nenhum utilizador encontrado.</p>
              )}
              {results.map(u => (
                <div
                  key={u.id}
                  className="invite-row"
                  style={{ cursor:"pointer" }}
                  onClick={() => setSelected({ id:u.id, fullName:u.fullName })}
                >
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:"50%", background:"#1a2232", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#378ADD", flexShrink:0 }}>
                      {u.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize:13, fontWeight:600, color:"#e2e8f0", margin:0 }}>{u.fullName}</p>
                      <p style={{ fontSize:11, color:"#4a6a6a", margin:0 }}>{u.email}{u.phone ? ` · ${u.phone}` : ""}</p>
                    </div>
                  </div>
                  <span style={{ fontSize:11, color:"#4a6a6a" }}>{u.role}</span>
                </div>
              ))}
            </div>
          )}

          {/* Utilizador seleccionado */}
          {selected && (
            <>
              <div className="field">
                <label>Utilizador seleccionado</label>
                <div className="invite-row" style={{ background:"#1D9E7510", borderColor:"#1D9E7540" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:"50%", background:"#1D9E7520", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#1D9E75" }}>
                      {selected.fullName.charAt(0).toUpperCase()}
                    </div>
                    <p style={{ fontSize:13, fontWeight:600, color:"#e2e8f0", margin:0 }}>{selected.fullName}</p>
                  </div>
                  <button className="icon-btn" onClick={() => setSelected(null)}><X size={14} /></button>
                </div>
              </div>
              <div className="field">
                <label>Cargo / permissão</label>
                <select className="input" value={role} onChange={e => setRole(e.target.value as CompanyEmployeeRole)}>
                  <option value="employee">Funcionário</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="manager">Gerente</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-primary" disabled={!selected || sending} onClick={handleSend}>
            {sending ? <Loader2 size={15} className="spin" /> : <UserPlus size={15} />} Enviar convite
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Modal: KYC da empresa
// ════════════════════════════════════════════════════════════════════════
function CompanyKycModal({
  open, onClose, onSubmit, submitting, defaultProvince,
}: {
  open: boolean; onClose: () => void;
  onSubmit: (
    data: { legalName:string; nif:string; representativeFullName:string; representativeBiNumber:string; phoneNumber:string; province:string },
    files: { nifDoc:File; commercialLicense:File; commercialRegistry:File; representativeId:File },
  ) => void;
  submitting: boolean;
  defaultProvince: string;
}) {
  const [legalName, setLegalName] = useState("");
  const [nif, setNif] = useState("");
  const [repName, setRepName] = useState("");
  const [repBi, setRepBi] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState(defaultProvince || PROVINCES[0]);
  const [nifDoc, setNifDoc] = useState<File | null>(null);
  const [license, setLicense] = useState<File | null>(null);
  const [registry, setRegistry] = useState<File | null>(null);
  const [repId, setRepId] = useState<File | null>(null);

  if (!open) return null;

  const canSubmit = legalName && nif && repName && repBi && phone && province && nifDoc && license && registry && repId;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Verificação da empresa (KYC)</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <p className="hint" style={{ marginBottom:4 }}>Submete os documentos legais da empresa para activares o perfil verificado.</p>
          <div className="field">
            <label>Razão social</label>
            <input className="input" value={legalName} onChange={e => setLegalName(e.target.value)} />
          </div>
          <div className="field-row">
            <div className="field">
              <label>NIF</label>
              <input className="input" value={nif} onChange={e => setNif(e.target.value)} />
            </div>
            <div className="field">
              <label>Província</label>
              <select className="input" value={province} onChange={e => setProvince(e.target.value)}>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Nome do representante legal</label>
            <input className="input" value={repName} onChange={e => setRepName(e.target.value)} />
          </div>
          <div className="field-row">
            <div className="field">
              <label>BI do representante</label>
              <input className="input" value={repBi} onChange={e => setRepBi(e.target.value)} />
            </div>
            <div className="field">
              <label>Telefone</label>
              <input className="input" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Documento NIF</label>
            <input className="input" type="file" accept="image/*,.pdf" onChange={e => setNifDoc(e.target.files?.[0] ?? null)} />
          </div>
          <div className="field">
            <label>Alvará Comercial</label>
            <input className="input" type="file" accept="image/*,.pdf" onChange={e => setLicense(e.target.files?.[0] ?? null)} />
          </div>
          <div className="field">
            <label>Certidão Comercial de Registo</label>
            <input className="input" type="file" accept="image/*,.pdf" onChange={e => setRegistry(e.target.files?.[0] ?? null)} />
          </div>
          <div className="field">
            <label>BI do representante (documento)</label>
            <input className="input" type="file" accept="image/*,.pdf" onChange={e => setRepId(e.target.files?.[0] ?? null)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-primary" disabled={!canSubmit || submitting} onClick={() => {
            if (!canSubmit) return;
            onSubmit(
              { legalName, nif, representativeFullName:repName, representativeBiNumber:repBi, phoneNumber:phone, province },
              { nifDoc:nifDoc!, commercialLicense:license!, commercialRegistry:registry!, representativeId:repId! },
            );
          }}>
            {submitting ? <Loader2 size={15} className="spin" /> : <ShieldCheck size={15} />} Submeter para análise
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Prompt de criação de empresa
// ════════════════════════════════════════════════════════════════════════
function CreateCompanyPrompt({ onCreate, creating }: { onCreate: (data: any) => void; creating: boolean }) {
  const [name, setName] = useState("");
  const [mainCategory, setMainCategory] = useState("");
  const [foundedYear, setFoundedYear] = useState(new Date().getFullYear());
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const canSubmit = name.trim() && mainCategory.trim() && email.trim() && phone.trim();

  return (
    <div className="cp-inner">
      <div className="cp-card" style={{ textAlign:"center", padding:40 }}>
        <Building size={40} style={{ color:"#378ADD", margin:"0 auto 16px" }} />
        <h1 style={{ fontSize:20, fontWeight:700, color:"#e2e8f0", marginBottom:8 }}>Cria o perfil da tua empresa</h1>
        <p style={{ fontSize:13, color:"#4a6a6a", maxWidth:380, margin:"0 auto 24px" }}>
          Preenche os dados essenciais para começares. Podes editar tudo depois.
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:12, maxWidth:380, margin:"0 auto", textAlign:"left" }}>
          <div className="field"><label>Nome da empresa</label><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Construções Silva Lda" /></div>
          <div className="field"><label>Categoria principal</label><input className="input" value={mainCategory} onChange={e => setMainCategory(e.target.value)} placeholder="Ex: Construção" /></div>
          <div className="field"><label>Ano de fundação</label><input className="input" type="number" value={foundedYear} onChange={e => setFoundedYear(Number(e.target.value))} /></div>
          <div className="field"><label>Email</label><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div className="field"><label>Telefone</label><input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+244 9XX XXX XXX" /></div>
          <button className="btn-primary" disabled={!canSubmit || creating} onClick={() => onCreate({ name, mainCategory, foundedYear, email, phone })}>
            {creating ? <Loader2 size={15} className="spin" /> : <Check size={15} />} Criar empresa
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Página principal
// ════════════════════════════════════════════════════════════════════════
export default function CompanyProfilePage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("overview");

  const [company, setCompany]       = useState<Company | null>(null);
  const [loading, setLoading]       = useState(true);
  const [notFound, setNotFound]     = useState(false);
  const [creating, setCreating]     = useState(false);

  const [stats, setStats]                   = useState<CompanyStats | null>(null);
  const [timeline, setTimeline]             = useState<TimelineItem[]>([]);
  const [services, setServices]             = useState<CompanyServiceBadge[]>([]);
  const [employees, setEmployees]           = useState<CompanyEmployee[]>([]);
  const [invitations, setInvitations]       = useState<CompanyInvitation[]>([]);
  const [portfolio, setPortfolio]           = useState<CompanyPortfolioItem[]>([]);
  const [certifications, setCertifications] = useState<CompanyCertification[]>([]);
  const [kyc, setKyc]                       = useState<CompanyVerification | null>(null);
  const [gallery, setGallery]               = useState<CompanyGalleryImage[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const [editOpen, setEditOpen]           = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [inviteOpen, setInviteOpen]       = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [kycOpen, setKycOpen]             = useState(false);
  const [submittingKyc, setSubmittingKyc] = useState(false);

  const [aboutDraft, setAboutDraft]     = useState("");
  const [savingAbout, setSavingAbout]   = useState(false);
  const [newService, setNewService]     = useState("");
  const [addingService, setAddingService] = useState(false);

  const [projName, setProjName]         = useState("");
  const [projClient, setProjClient]     = useState("");
  const [addingProject, setAddingProject] = useState(false);

  const [certName, setCertName]         = useState("");
  const [certIssuer, setCertIssuer]     = useState("");
  const [addingCert, setAddingCert]     = useState(false);

  const [hours, setHours]               = useState<WorkingHourDay[]>(defaultHours());
  const [savingHours, setSavingHours]   = useState(false);

  const [coverage, setCoverage]         = useState<string[]>([]);
  const [coverageDraft, setCoverageDraft] = useState(PROVINCES[0]);
  const [savingCoverage, setSavingCoverage] = useState(false);

  const [social, setSocial]             = useState<SocialLinks>({});
  const [savingSocial, setSavingSocial] = useState(false);

  // ── Carregamento ───────────────────────────────────────────────────────
  const loadAll = useCallback(async (companyId: string) => {
    const [statsRes, timelineRes, servicesRes, teamRes, invitesRes, portfolioRes,
      certsRes, kycRes, galleryRes] = await Promise.allSettled([
      companyApi.getStats(companyId),
      companyApi.getTimeline(companyId),
      companyApi.getServices(companyId),
      companyApi.getTeam(companyId),
      companyApi.getInvitations(companyId),
      companyApi.getPortfolio(companyId),
      companyApi.getCertifications(companyId),
      companyApi.getKycStatus(companyId),
      companyApi.getGallery(companyId),
    ]);

    if (statsRes.status     === "fulfilled") setStats(statsRes.value);
    if (timelineRes.status  === "fulfilled") setTimeline(timelineRes.value);
    if (servicesRes.status  === "fulfilled") setServices(servicesRes.value);
    if (teamRes.status      === "fulfilled") setEmployees(teamRes.value);
    if (invitesRes.status   === "fulfilled") setInvitations(invitesRes.value);
    if (portfolioRes.status === "fulfilled") setPortfolio(portfolioRes.value);
    if (certsRes.status     === "fulfilled") setCertifications(certsRes.value);
    if (kycRes.status       === "fulfilled") setKyc(kycRes.value);
    if (galleryRes.status   === "fulfilled") setGallery(galleryRes.value);
  }, []);

  const loadCompany = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const data = await companyApi.getMine();
      setCompany(data);
      setAboutDraft(data.about ?? "");
      setHours(data.workingHours?.length ? data.workingHours : defaultHours());
      setCoverage(data.coverageProvinces ?? (data.province ? [data.province] : []));
      setSocial(data.socialLinks ?? {});
      await loadAll(data.id);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [loadAll]);

  useEffect(() => { loadCompany(); }, [loadCompany]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleCreateCompany = async (data: any) => {
    setCreating(true);
    try {
      const created = await companyApi.create(data);
      setCompany(created);
      setNotFound(false);
      await loadAll(created.id);
    } catch (e: any) { alert(e.message || "Erro ao criar empresa."); }
    finally { setCreating(false); }
  };

  const handleSaveCompany = async (updated: Partial<Company>) => {
    if (!company) return;
    setSavingCompany(true);
    try {
      const saved = await companyApi.update(company.id, updated as any);
      setCompany(saved);
      setEditOpen(false);
    } catch (e: any) { alert(e.message || "Erro ao guardar empresa."); }
    finally { setSavingCompany(false); }
  };

  const handleSaveAbout = async () => {
    if (!company) return;
    setSavingAbout(true);
    try {
      const saved = await companyApi.updateAbout(company.id, aboutDraft);
      setCompany(saved);
    } catch (e: any) { alert(e.message || "Erro ao guardar descrição."); }
    finally { setSavingAbout(false); }
  };

  const handleAddService = async () => {
    if (!company || !newService.trim()) return;
    setAddingService(true);
    try {
      const created = await companyApi.addService(company.id, newService.trim(), company.mainCategory);
      setServices(prev => [...prev, created]);
      setNewService("");
    } catch (e: any) { alert(e.message || "Erro ao adicionar serviço."); }
    finally { setAddingService(false); }
  };

  const handleRemoveService = async (id: string) => {
    if (!company) return;
    try {
      await companyApi.removeService(company.id, id);
      setServices(prev => prev.filter(s => s.id !== id));
    } catch (e: any) { alert(e.message || "Erro ao remover serviço."); }
  };

  const handleSendInvite = async (userId: string, role: CompanyEmployeeRole) => {
    if (!company) return;
    setSendingInvite(true);
    try {
      const created = await companyApi.sendInvitation(company.id, { inviteeUserId: userId, proposedRole: role });
      setInvitations(prev => [created, ...prev]);
      setInviteOpen(false);
    } catch (e: any) { alert(e.message || "Erro ao enviar convite."); }
    finally { setSendingInvite(false); }
  };

  const handleAddProject = async () => {
    if (!company || !projName.trim()) return;
    setAddingProject(true);
    try {
      const created = await companyApi.addPortfolioItem(company.id, {
        name: projName.trim(), client: projClient.trim() || undefined, category: company.mainCategory,
      });
      setPortfolio(prev => [created, ...prev]);
      setProjName(""); setProjClient("");
    } catch (e: any) { alert(e.message || "Erro ao adicionar projecto."); }
    finally { setAddingProject(false); }
  };

  const handleRemoveProject = async (id: string) => {
    if (!company) return;
    try {
      await companyApi.removePortfolioItem(company.id, id);
      setPortfolio(prev => prev.filter(p => p.id !== id));
    } catch (e: any) { alert(e.message || "Erro ao remover projecto."); }
  };

  const handleAddGalleryImages = async (files: File[]) => {
    if (!company || !files.length) return;
    setUploadingGallery(true);
    try {
      for (const file of files) {
        const img = await companyApi.addGalleryImage(company.id, file);
        setGallery(prev => [img, ...prev]);
      }
    } catch (e: any) { alert(e.message || "Erro ao fazer upload."); }
    finally { setUploadingGallery(false); }
  };

  const handleRemoveGalleryImage = async (id: string) => {
    if (!company) return;
    try {
      await companyApi.removeGalleryImage(company.id, id);
      setGallery(prev => prev.filter(g => g.id !== id));
    } catch (e: any) { alert(e.message || "Erro ao remover imagem."); }
  };

  const handleAddCertification = async () => {
    if (!company || !certName.trim()) return;
    setAddingCert(true);
    try {
      const created = await companyApi.addCertification(company.id, {
        name: certName.trim(), issuer: certIssuer.trim() || undefined,
      });
      setCertifications(prev => [created, ...prev]);
      setCertName(""); setCertIssuer("");
    } catch (e: any) { alert(e.message || "Erro ao adicionar certificação."); }
    finally { setAddingCert(false); }
  };

  const handleRemoveCertification = async (id: string) => {
    if (!company) return;
    try {
      await companyApi.removeCertification(company.id, id);
      setCertifications(prev => prev.filter(c => c.id !== id));
    } catch (e: any) { alert(e.message || "Erro ao remover certificação."); }
  };

  const toggleDay = (day: string) =>
    setHours(prev => prev.map(h => h.day === day ? { ...h, open: !h.open } : h));
  const updateDayTime = (day: string, field: "from" | "to", value: string) =>
    setHours(prev => prev.map(h => h.day === day ? { ...h, [field]: value } : h));

  const handleSaveHours = async () => {
    if (!company) return;
    setSavingHours(true);
    try {
      const saved = await companyApi.updateWorkingHours(company.id, hours);
      setCompany(saved);
    } catch (e: any) { alert(e.message || "Erro ao guardar horário."); }
    finally { setSavingHours(false); }
  };

  const addCoverage = async () => {
    if (!company || coverage.includes(coverageDraft)) return;
    const next = [...coverage, coverageDraft];
    setCoverage(next);
    setSavingCoverage(true);
    try {
      const saved = await companyApi.updateCoverage(company.id, next);
      setCompany(saved);
    } catch (e: any) { alert(e.message || "Erro ao guardar cobertura."); }
    finally { setSavingCoverage(false); }
  };

  const removeCoverage = async (p: string) => {
    if (!company) return;
    const next = coverage.filter(c => c !== p);
    setCoverage(next);
    try { const saved = await companyApi.updateCoverage(company.id, next); setCompany(saved); }
    catch (e: any) { alert(e.message || "Erro ao guardar cobertura."); }
  };

  const updateSocial = (key: keyof SocialLinks, value: string) =>
    setSocial(prev => ({ ...prev, [key]: value }));

  const handleSaveSocial = async () => {
    if (!company) return;
    setSavingSocial(true);
    try {
      const saved = await companyApi.updateSocialLinks(company.id, social);
      setCompany(saved);
    } catch (e: any) { alert(e.message || "Erro ao guardar redes sociais."); }
    finally { setSavingSocial(false); }
  };

  const handleSubmitKyc = async (data: any, files: any) => {
    if (!company) return;
    setSubmittingKyc(true);
    try {
      const saved = await companyApi.submitKyc(company.id, data, files);
      setKyc(saved);
      setKycOpen(false);
    } catch (e: any) { alert(e.message || "Erro ao submeter KYC."); }
    finally { setSubmittingKyc(false); }
  };

  const TABS: { key: TabKey; label: string; icon: any }[] = [
    { key: "overview",  label: "Visão geral", icon: Briefcase },
    { key: "services",  label: "Serviços",    icon: Star      },
    { key: "team",      label: "Equipa",      icon: Users     },
    { key: "invites",   label: "Convites",    icon: UserPlus  },
    { key: "portfolio", label: "Portfólio",   icon: ImageIcon },
    { key: "more",      label: "Mais",        icon: FileText  },
  ];

  const statsDisplay = stats ? [
    { label:"Funcionários",           value: String(stats.employees),                                                    color:"#1D9E75" },
    { label:"Clientes atendidos",     value: String(stats.clientsServed),                                                color:"#378ADD" },
    { label:"Serviços activos",       value: String(stats.activeServices),                                               color:"#378ADD" },
    { label:"Serviços concluídos",    value: String(stats.completedServices),                                            color:"#1D9E75" },
    { label:"Avaliação média",        value: stats.averageRating > 0 ? `${stats.averageRating.toFixed(1)}★` : "—",      color:"#EF9F27" },
    { label:"Total ganho",            value: `${stats.totalEarnings.toLocaleString("pt-PT")} Kz`,                       color:"#EF9F27" },
    { label:"Ganhos do mês",          value: `${stats.monthlyEarnings.toLocaleString("pt-PT")} Kz`,                     color:"#EF9F27" },
    { label:"Anos de actividade",     value: String(stats.yearsActive),                                                  color:"#8B5CF6" },
    { label:"Tempo médio resposta",   value: stats.avgResponseTimeHours > 0 ? `${stats.avgResponseTimeHours}h` : "—",  color:"#8B5CF6" },
    { label:"Taxa de conclusão",      value: `${stats.completionRate}%`,                                                 color:"#1D9E75" },
    { label:"Clientes recorrentes",   value: String(stats.recurringClients),                                             color:"#378ADD" },
  ] : [];

  // ── Loading ───────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh" }}>
      <Loader2 size={28} style={{ color:"#378ADD", animation:"spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Criar empresa ─────────────────────────────────────────────────────
  if (notFound || !company) return (
    <>
      <style>{`
        .cp-inner{padding:28px 32px;display:flex;flex-direction:column;gap:20px;max-width:760px;width:100%}
        .cp-card{background:#131b27;border:1px solid #1a2535;border-radius:20px;padding:24px;width:100%}
        .field{width:100%;min-width:0}.field label{font-size:12px;font-weight:600;color:#6a7a8a;display:block;margin-bottom:6px}
        .input{width:100%;padding:10px 13px;border-radius:10px;background:#0d1117;border:1px solid #1a2535;color:#e2e8f0;font-size:13px;outline:none;font-family:inherit;min-width:0}
        .input:focus{border-color:#378ADD}
        .btn-primary{width:100%;padding:13px;border-radius:11px;background:#378ADD;color:white;border:none;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px}
        .btn-primary:disabled{opacity:0.5;cursor:not-allowed}
        @keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin 1s linear infinite}
      `}</style>
      <CreateCompanyPrompt onCreate={handleCreateCompany} creating={creating} />
    </>
  );

  // ── Perfil completo ───────────────────────────────────────────────────
  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box}
        .cp-inner{padding:28px 32px;display:flex;flex-direction:column;gap:20px;max-width:760px;width:100%}
        .cp-card{background:#131b27;border:1px solid #1a2535;border-radius:20px;padding:24px;width:100%}
        .info-row{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid #1a2535}
        .info-row:last-child{border-bottom:none}
        .stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;width:100%}
        .stat{background:#0d1117;border:1px solid #1a2535;border-radius:12px;padding:14px;text-align:center;min-width:0}
        .empty-state{display:flex;flex-direction:column;align-items:center;padding:32px;gap:10px;text-align:center}
        .edit-btn{display:flex;align-items:center;gap:8px;padding:10px 18px;border-radius:12px;border:1px solid #1a2535;background:#131b27;color:#8a9ab0;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;flex-shrink:0}
        .edit-btn:disabled{opacity:0.5;cursor:not-allowed}
        .add-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;background:#1d9e7520;color:#1D9E75;border:1px solid #1d9e7540;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;flex-shrink:0}
        .add-btn:disabled{opacity:0.5;cursor:not-allowed}
        .v-badge{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;padding:4px 10px;border-radius:99px}
        .dot-badge{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#8a9ab0;font-weight:600}
        .dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
        .tabs{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;border-bottom:1px solid #1a2535;-webkit-overflow-scrolling:touch;scrollbar-width:none}
        .tabs::-webkit-scrollbar{display:none}
        .tab-btn{display:flex;align-items:center;gap:6px;padding:10px 14px;border-radius:10px 10px 0 0;border:none;background:transparent;color:#4a6a6a;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;flex-shrink:0}
        .tab-btn.active{color:#378ADD;background:#131b27;border:1px solid #1a2535;border-bottom:1px solid #131b27;margin-bottom:-1px}
        .badge-pill{display:inline-flex;align-items:center;gap:8px;padding:7px 12px;border-radius:10px;background:#0d1117;border:1px solid #1a2535;color:#c0d0e0;font-size:13px}
        .badge-pill button{background:none;border:none;color:#4a6a6a;cursor:pointer;display:flex;padding:0}
        .inline-add{display:flex;gap:8px;width:100%}
        .input{width:100%;padding:10px 13px;border-radius:10px;background:#0d1117;border:1px solid #1a2535;color:#e2e8f0;font-size:13px;outline:none;font-family:inherit;min-width:0}
        .input:focus{border-color:#378ADD}
        textarea.about-textarea{width:100%;min-width:0;padding:12px 14px;border-radius:10px;background:#0d1117;border:1px solid #1a2535;color:#e2e8f0;font-size:13px;outline:none;font-family:inherit;resize:none;height:96px;max-height:96px;overflow-y:auto;line-height:1.6;display:block}
        textarea.about-textarea:focus{border-color:#378ADD}
        .emp-card{background:#0d1117;border:1px solid #1a2535;border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:12px}
        .emp-top{display:flex;align-items:center;gap:12px}
        .emp-avatar{width:44px;height:44px;border-radius:12px;background:#1a2232;display:flex;align-items:center;justify-content:center;color:#378ADD;font-weight:700;font-size:14px;flex-shrink:0}
        .emp-mini-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;border-top:1px solid #1a2535;padding-top:12px}
        .emp-mini{text-align:center;min-width:0}
        .emp-mini b{display:block;font-size:13px;color:#e2e8f0}
        .emp-mini span{font-size:10px;color:#4a6a6a}
        .invite-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px;background:#0d1117;border:1px solid #1a2535;border-radius:12px;min-width:0}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px}
        .modal-card{background:#131b27;border:1px solid #1a2535;border-radius:20px;width:100%;max-width:520px;max-height:88vh;display:flex;flex-direction:column}
        .modal-header{display:flex;justify-content:space-between;align-items:center;padding:20px 22px;border-bottom:1px solid #1a2535;flex-shrink:0}
        .modal-header h2{font-size:16px;font-weight:700;color:#e2e8f0;margin:0}
        .icon-btn{background:none;border:none;color:#4a6a6a;cursor:pointer;padding:0}
        .modal-body{padding:20px 22px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:14px}
        .field-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%}
        .field{width:100%;min-width:0}
        .field label{font-size:12px;font-weight:600;color:#6a7a8a;display:block;margin-bottom:6px}
        .modal-footer{padding:16px 22px;border-top:1px solid #1a2535;flex-shrink:0}
        .btn-primary{width:100%;padding:13px;border-radius:11px;background:#378ADD;color:white;border:none;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px}
        .btn-primary:disabled{opacity:0.5;cursor:not-allowed}
        .search-box{display:flex;align-items:center;gap:8px;padding:10px 13px;border-radius:10px;background:#0d1117;border:1px solid #1a2535}
        .search-input{flex:1;min-width:0;background:none;border:none;outline:none;color:#e2e8f0;font-size:13px;font-family:inherit}
        .hint{font-size:11px;color:#4a6a6a;margin-top:6px;line-height:1.5}
        .day-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #1a2535;flex-wrap:wrap}
        .day-row:last-child{border-bottom:none}
        .day-name{flex:1;font-size:13px;color:#c0d0e0;font-weight:600;min-width:70px}
        .toggle{width:38px;height:22px;border-radius:99px;cursor:pointer;position:relative;flex-shrink:0;border:none}
        .time-input{width:78px;padding:6px 8px;border-radius:8px;background:#0d1117;border:1px solid #1a2535;color:#e2e8f0;font-size:12px;font-family:inherit;flex-shrink:0}
        .timeline{display:flex;flex-direction:column}
        .tl-item{display:flex;gap:12px;padding-bottom:18px;position:relative}
        .tl-item:last-child{padding-bottom:0}
        .tl-line{position:absolute;left:9px;top:20px;bottom:0;width:1px;background:#1a2535}
        .tl-item:last-child .tl-line{display:none}
        .tl-dot{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;z-index:1}
        .gallery-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;width:100%}
        .section-title{display:flex;align-items:center;gap:8px;margin-bottom:16px;font-size:15px;font-weight:700;color:#c0d0e0}
        .spin{animation:spin 1s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:768px){.cp-inner{padding:20px 20px}.stat-grid{grid-template-columns:repeat(2,1fr)}.gallery-grid{grid-template-columns:repeat(3,1fr)}}
        @media(max-width:640px){.cp-inner{padding:14px 14px;gap:14px}.cp-card{padding:16px;border-radius:16px}.stat-grid{grid-template-columns:repeat(2,1fr);gap:8px}.field-row{grid-template-columns:1fr}.emp-mini-stats{grid-template-columns:repeat(2,1fr)}.gallery-grid{grid-template-columns:repeat(2,1fr)}.modal-card{border-radius:16px}.day-row{gap:8px}.time-input{width:68px}.emp-top{flex-wrap:wrap}}
        @media(max-width:380px){.cp-inner{padding:10px 10px}.tabs{gap:2px}.tab-btn{padding:8px 10px;font-size:12px}.stat-grid{grid-template-columns:1fr 1fr;gap:6px}.stat{padding:10px 8px}.gallery-grid{grid-template-columns:repeat(2,1fr)}.field-row{grid-template-columns:1fr}}
      `}</style>

      <div className="cp-inner">

        {/* ── Cabeçalho ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
          <div style={{ minWidth:0 }}>
            <h1 style={{ fontSize:22, fontWeight:700, color:"#e2e8f0", margin:"0 0 4px" }}>Perfil da empresa</h1>
            <p style={{ fontSize:13, color:"#4a6a6a", margin:0 }}>Gere a tua empresa e equipa</p>
          </div>
          <button className="edit-btn" onClick={() => setEditOpen(true)}><Edit size={14} /> Editar</button>
        </div>

        {/* ── Card da empresa ── */}
        <div className="cp-card">
          <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
            <div style={{ width:72, height:72, borderRadius:16, background:"#1a2232", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, overflow:"hidden" }}>
              {company.logoUrl
                ? <img src={company.logoUrl} alt={company.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <Building2 size={30} style={{ color:"#378ADD" }} />}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, minWidth:0 }}>
              <p style={{ fontSize:18, fontWeight:700, color:"#e2e8f0", margin:0 }}>{company.name}</p>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <VerificationBadge status={company.verificationStatus} />
                <span className="v-badge" style={{ background:"#378ADD20", color:"#378ADD", border:"1px solid #378ADD40" }}>{company.mainCategory}</span>
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:20, marginTop:18, paddingTop:18, borderTop:"1px solid #1a2535", flexWrap:"wrap", alignItems:"center" }}>
            <span style={{ fontSize:12, color:"#4a6a6a" }}>Fundada em <b style={{ color:"#c0d0e0" }}>{company.foundedYear}</b></span>
            {company.website
              ? <a href={company.website} target="_blank" rel="noreferrer" style={{ fontSize:12, color:"#378ADD", display:"flex", alignItems:"center", gap:4, wordBreak:"break-all" }}><Globe size={12} />{company.website}</a>
              : <span style={{ fontSize:12, color:"#4a6a6a", display:"flex", alignItems:"center", gap:4 }}><Globe size={12} />Sem website</span>
            }
            {company.verificationStatus !== "verified" && (
              <button className="add-btn" style={{ marginLeft:"auto" }} onClick={() => setKycOpen(true)}>
                <ShieldCheck size={13} />{kyc?.status === "pending" ? "KYC em análise" : "Verificar empresa"}
              </button>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="tabs">
          {TABS.map(t => { const Icon = t.icon; return (
            <button key={t.key} className={`tab-btn${tab === t.key ? " active" : ""}`} onClick={() => setTab(t.key)}>
              <Icon size={14} />{t.label}
            </button>
          );})}
        </div>

        {/* ════ VISÃO GERAL ════ */}
        {tab === "overview" && (<>
          <div className="cp-card">
            {[
              { icon:Mail,     label:"Email",    value:company.email,            color:"#1D9E75" },
              { icon:Phone,    label:"Telefone", value:company.phone,            color:"#378ADD" },
              { icon:MapPin,   label:"Sede",     value:company.headquarters||"—",color:"#EF9F27" },
              { icon:Briefcase,label:"Sector",   value:company.sector||"—",      color:"#8B5CF6" },
              { icon:FileText, label:"NIF",      value:company.nif||"—",         color:"#5a6a7a" },
            ].map((item, i) => { const Icon = item.icon; return (
              <div className="info-row" key={i}>
                <div style={{ width:38, height:38, borderRadius:10, background:`${item.color}15`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Icon size={16} style={{ color:item.color }} />
                </div>
                <div style={{ minWidth:0 }}>
                  <p style={{ fontSize:11, color:"#4a5a6a", margin:"0 0 2px" }}>{item.label}</p>
                  <p style={{ fontSize:14, color:"#c0d0e0", margin:0, wordBreak:"break-word" }}>{item.value}</p>
                </div>
              </div>
            );})}
          </div>

          <div className="cp-card">
            <div className="section-title"><FileText size={15} style={{ color:"#378ADD" }} />Sobre a empresa</div>
            <textarea className="about-textarea" placeholder="Descreve a tua empresa..." value={aboutDraft} onChange={e => setAboutDraft(e.target.value)} />
            <button className="edit-btn" style={{ marginTop:12 }} disabled={savingAbout} onClick={handleSaveAbout}>
              {savingAbout ? <Loader2 size={14} className="spin" /> : <Check size={14} />} Guardar descrição
            </button>
          </div>

          <div className="stat-grid">
            {statsDisplay.map((s, i) => (
              <div className="stat" key={i}>
                <p style={{ fontSize:20, fontWeight:700, color:s.color, margin:"0 0 4px" }}>{s.value}</p>
                <p style={{ fontSize:11, color:"#4a6a6a", margin:0 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </>)}

        {/* ════ SERVIÇOS ════ */}
        {tab === "services" && (
          <div className="cp-card">
            <div className="section-title"><Star size={15} style={{ color:"#EF9F27" }} />Serviços oferecidos</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
              {services.length === 0 && <p style={{ fontSize:13, color:"#4a6a6a", margin:0 }}>Ainda não adicionaste serviços.</p>}
              {services.map(s => (
                <span className="badge-pill" key={s.id}>{s.label}<button onClick={() => handleRemoveService(s.id)}><X size={13}/></button></span>
              ))}
            </div>
            <div className="inline-add">
              <input className="input" placeholder="Ex: Instalação eléctrica" value={newService} onChange={e => setNewService(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddService()} />
              <button className="add-btn" disabled={addingService} onClick={handleAddService}>
                {addingService ? <Loader2 size={13} className="spin"/> : <Plus size={13}/>} Adicionar
              </button>
            </div>
          </div>
        )}

        {/* ════ EQUIPA ════ */}
        {tab === "team" && (
          <div className="cp-card">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div className="section-title" style={{ marginBottom:0 }}><Users size={15} style={{ color:"#1D9E75" }}/>Equipa</div>
              <button className="add-btn" onClick={() => setInviteOpen(true)}><Plus size={13}/>Adicionar</button>
            </div>
            {employees.length === 0 ? (
              <div className="empty-state">
                <Users size={28} style={{ color:"#2a3a4a" }}/>
                <p style={{ fontSize:14, fontWeight:600, color:"#c0d0e0", margin:0 }}>Sem funcionários ainda</p>
                <p style={{ fontSize:13, color:"#4a6a6a", lineHeight:1.6, maxWidth:280, margin:0, textAlign:"center" }}>Adiciona funcionários para distribuir serviços pela equipa.</p>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {employees.map(emp => (
                  <div className="emp-card" key={emp.id}>
                    <div className="emp-top">
                      <div className="emp-avatar">{emp.user?.fullName?.split(" ").map(n => n[0]).slice(0,2).join("") ?? "?"}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:14, fontWeight:700, color:"#e2e8f0", margin:0 }}>{emp.user?.fullName ?? "—"}</p>
                        <p style={{ fontSize:12, color:"#4a6a6a", margin:0 }}>{ROLE_LABEL[emp.role]}</p>
                      </div>
                      <EmployeeStatusBadge status={emp.status}/>
                    </div>
                    <div className="emp-mini-stats">
                      <div className="emp-mini"><b>{emp.completedServices}</b><span>concluídos</span></div>
                      <div className="emp-mini"><b>{Number(emp.averageRating).toFixed(1)}★</b><span>avaliação</span></div>
                      <div className="emp-mini"><b>{Number(emp.earningsGenerated).toLocaleString("pt-AO")} Kz</b><span>gerado</span></div>
                      <div className="emp-mini"><b>{emp.avgResponseTimeMinutes}min</b><span>resposta</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════ CONVITES ════ */}
        {tab === "invites" && (
          <div className="cp-card">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div className="section-title" style={{ marginBottom:0 }}><UserPlus size={15} style={{ color:"#378ADD" }}/>Convites enviados</div>
              <button className="add-btn" onClick={() => setInviteOpen(true)}><Plus size={13}/>Convidar</button>
            </div>
            {invitations.length === 0 ? (
              <div className="empty-state">
                <UserPlus size={28} style={{ color:"#2a3a4a" }}/>
                <p style={{ fontSize:14, fontWeight:600, color:"#c0d0e0", margin:0 }}>Nenhum convite enviado</p>
                <p style={{ fontSize:13, color:"#4a6a6a", lineHeight:1.6, maxWidth:280, margin:0, textAlign:"center" }}>Pesquisa um utilizador e convida-o para a tua equipa.</p>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {invitations.map(inv => (
                  <div className="invite-row" key={inv.id}>
                    <div style={{ minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:600, color:"#e2e8f0", margin:0 }}>{inv.invitee?.fullName ?? "—"}</p>
                      <p style={{ fontSize:11, color:"#4a6a6a", margin:0 }}>{inv.invitee?.email} · {ROLE_LABEL[inv.proposedRole]}</p>
                    </div>
                    <InviteStatusBadge status={inv.status}/>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════ PORTFÓLIO ════ */}
        {tab === "portfolio" && (<>
          <div className="cp-card">
            <div className="section-title"><Briefcase size={15} style={{ color:"#378ADD" }}/>Projectos realizados</div>
            {portfolio.length === 0
              ? <p style={{ fontSize:13, color:"#4a6a6a", marginBottom:16 }}>Ainda não adicionaste projectos ao portfólio.</p>
              : (
                <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
                  {portfolio.map(p => (
                    <div className="invite-row" key={p.id}>
                      <div style={{ minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:600, color:"#e2e8f0", margin:0 }}>{p.name}</p>
                        <p style={{ fontSize:11, color:"#4a6a6a", margin:0 }}>{p.client||"—"} · {p.category||"—"} · {p.projectDate||p.createdAt.slice(0,10)}</p>
                      </div>
                      <button className="icon-btn" onClick={() => handleRemoveProject(p.id)}><Trash2 size={15}/></button>
                    </div>
                  ))}
                </div>
              )
            }
            <div className="field-row">
              <input className="input" placeholder="Nome do projecto" value={projName} onChange={e => setProjName(e.target.value)} />
              <input className="input" placeholder="Cliente (opcional)" value={projClient} onChange={e => setProjClient(e.target.value)} />
            </div>
            <button className="add-btn" style={{ marginTop:10 }} disabled={addingProject} onClick={handleAddProject}>
              {addingProject ? <Loader2 size={13} className="spin"/> : <Plus size={13}/>} Adicionar projecto
            </button>
          </div>

          {/* ── Galeria ── */}
          <div className="cp-card">
            <div className="section-title"><ImageIcon size={15} style={{ color:"#8B5CF6" }}/>Galeria de trabalhos</div>

            {gallery.length > 0 && (
              <div className="gallery-grid" style={{ marginBottom:16 }}>
                {gallery.map(img => (
                  <div key={img.id} style={{ position:"relative", aspectRatio:"1", borderRadius:10, overflow:"hidden" }}>
                    <img src={img.url} alt={img.caption || "Trabalho"} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    <button
                      onClick={() => handleRemoveGalleryImage(img.id)}
                      style={{
                        position:"absolute", top:6, right:6,
                        width:24, height:24, borderRadius:"50%",
                        background:"rgba(0,0,0,0.75)", border:"none",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        cursor:"pointer",
                      }}
                    >
                      <X size={12} style={{ color:"white" }} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label style={{
              display:"flex", alignItems:"center", gap:12,
              padding:"14px 16px", borderRadius:12,
              background:"#0d1117", border:"1px dashed #1a2535",
              cursor: uploadingGallery ? "not-allowed" : "pointer",
              opacity: uploadingGallery ? 0.6 : 1,
              transition:"border-color 0.2s",
            }}
              onMouseEnter={e => !uploadingGallery && (e.currentTarget.style.borderColor = "#8B5CF6")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#1a2535")}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display:"none" }}
                disabled={uploadingGallery}
                onChange={async e => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = "";
                  await handleAddGalleryImages(files);
                }}
              />
              {uploadingGallery
                ? <Loader2 size={20} className="spin" style={{ color:"#8B5CF6", flexShrink:0 }} />
                : <ImageIcon size={20} style={{ color:"#8B5CF6", flexShrink:0 }} />
              }
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:"#c0d0e0", margin:0 }}>
                  {uploadingGallery ? "A fazer upload..." : "Adicionar fotos ao portfólio"}
                </p>
                <p style={{ fontSize:11, color:"#4a6a6a", margin:0 }}>
                  Clica para seleccionar · JPG, PNG · múltiplas fotos
                </p>
              </div>
            </label>
          </div>
        </>)}

        {/* ════ MAIS ════ */}
        {tab === "more" && (<>
          {/* Horário */}
          <div className="cp-card">
            <div className="section-title"><Clock size={15} style={{ color:"#378ADD" }}/>Horário de funcionamento</div>
            {hours.map(h => (
              <div className="day-row" key={h.day}>
                <span className="day-name">{h.day}</span>
                <button className="toggle" style={{ background:h.open?"#1D9E75":"#1a2535" }} onClick={() => toggleDay(h.day)}>
                  <span style={{ position:"absolute", left:h.open?19:3, top:3, width:16, height:16, borderRadius:"50%", background:"white", transition:"left .15s" }}/>
                </button>
                {h.open ? (
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    <input className="time-input" type="time" value={h.from} onChange={e => updateDayTime(h.day,"from",e.target.value)} />
                    <span style={{ color:"#4a6a6a", fontSize:12, flexShrink:0 }}>às</span>
                    <input className="time-input" type="time" value={h.to} onChange={e => updateDayTime(h.day,"to",e.target.value)} />
                  </div>
                ) : <span style={{ fontSize:12, color:"#4a6a6a" }}>Fechado</span>}
              </div>
            ))}
            <button className="edit-btn" style={{ marginTop:14 }} disabled={savingHours} onClick={handleSaveHours}>
              {savingHours ? <Loader2 size={14} className="spin"/> : <Check size={14}/>} Guardar horário
            </button>
          </div>

          {/* Cobertura */}
          <div className="cp-card">
            <div className="section-title"><MapPin size={15} style={{ color:"#EF9F27" }}/>Área de cobertura</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
              {coverage.map(p => (
                <span className="badge-pill" key={p}>{p}<button onClick={() => removeCoverage(p)}><X size={13}/></button></span>
              ))}
            </div>
            <div className="inline-add">
              <select className="input" value={coverageDraft} onChange={e => setCoverageDraft(e.target.value)}>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <button className="add-btn" disabled={savingCoverage} onClick={addCoverage}>
                {savingCoverage ? <Loader2 size={13} className="spin"/> : <Plus size={13}/>} Adicionar
              </button>
            </div>
          </div>

          {/* Redes sociais */}
          <div className="cp-card">
            <div className="section-title"><Share2 size={15} style={{ color:"#378ADD" }}/>Redes sociais</div>
            {([
              { key:"website"   as const, label:"Website",   icon:Globe,          placeholder:"https://..." },
              { key:"whatsapp"  as const, label:"WhatsApp",  icon:MessageCircle,  placeholder:"+244 9XX XXX XXX" },
              { key:"facebook"  as const, label:"Facebook",  icon:Share2,         placeholder:"https://facebook.com/..." },
              { key:"instagram" as const, label:"Instagram", icon:Share2,         placeholder:"https://instagram.com/..." },
              { key:"tiktok"    as const, label:"TikTok",    icon:Share2,         placeholder:"https://tiktok.com/@..." },
              { key:"linkedin"  as const, label:"LinkedIn",  icon:Share2,         placeholder:"https://linkedin.com/company/..." },
            ]).map(s => { const Icon = s.icon; return (
              <div className="field" key={s.key} style={{ marginBottom:12 }}>
                <label style={{ display:"flex", alignItems:"center", gap:6 }}><Icon size={12}/>{s.label}</label>
                <input className="input" placeholder={s.placeholder} value={social[s.key]??""} onChange={e => updateSocial(s.key, e.target.value)} />
              </div>
            );})}
            <button className="edit-btn" disabled={savingSocial} onClick={handleSaveSocial}>
              {savingSocial ? <Loader2 size={14} className="spin"/> : <Check size={14}/>} Guardar redes sociais
            </button>
          </div>

          {/* Certificações */}
          <div className="cp-card">
            <div className="section-title"><ShieldCheck size={15} style={{ color:"#1D9E75" }}/>Certificações e especializações</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
              {certifications.length === 0 && <p style={{ fontSize:13, color:"#4a6a6a", margin:0 }}>Sem certificações registadas.</p>}
              {certifications.map(c => (
                <span className="badge-pill" key={c.id}>{c.name} · {c.issuer||"—"}<button onClick={() => handleRemoveCertification(c.id)}><X size={13}/></button></span>
              ))}
            </div>
            <div className="field-row">
              <input className="input" placeholder="Nome da certificação" value={certName} onChange={e => setCertName(e.target.value)} />
              <input className="input" placeholder="Entidade emissora" value={certIssuer} onChange={e => setCertIssuer(e.target.value)} />
            </div>
            <button className="add-btn" style={{ marginTop:10 }} disabled={addingCert} onClick={handleAddCertification}>
              {addingCert ? <Loader2 size={13} className="spin"/> : <Plus size={13}/>} Adicionar
            </button>
          </div>

          {/* Documentos KYC */}
          <div className="cp-card">
            <div className="section-title"><FileText size={15} style={{ color:"#5a6a7a" }}/>Documentos da empresa</div>
            {!kyc ? (
              <div className="empty-state" style={{ padding:"16px 0" }}>
                <p style={{ fontSize:13, color:"#4a6a6a", margin:0 }}>Nenhum documento submetido ainda.</p>
                <button className="add-btn" onClick={() => setKycOpen(true)}><ShieldCheck size={13}/>Submeter KYC</button>
              </div>
            ) : (<>
              {[
                { name:"Documento NIF",                 url:kyc.nifDocUrl },
                { name:"Alvará Comercial",              url:kyc.commercialLicenseUrl },
                { name:"Certidão Comercial de Registo", url:kyc.commercialRegistryUrl },
                { name:"BI do representante",           url:kyc.representativeIdUrl },
              ].map((d, i) => (
                <div className="invite-row" key={i}>
                  <p style={{ fontSize:13, color:"#e2e8f0", margin:0 }}>{d.name}</p>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span className="dot-badge">
                      <span className="dot" style={{ background: kyc.status==="approved"?"#1D9E75":kyc.status==="rejected"?"#E24B4A":"#EF9F27" }}/>
                      {kyc.status==="approved"?"Aprovado":kyc.status==="rejected"?"Rejeitado":"Em análise"}
                    </span>
                    {d.url && <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:"#378ADD" }}>Ver</a>}
                  </div>
                </div>
              ))}
              {kyc.status === "rejected" && kyc.rejectionReason && (
                <p className="hint" style={{ marginTop:8, color:"#E24B4A" }}>Motivo: {kyc.rejectionReason}</p>
              )}
              {kyc.status === "rejected" && (
                <button className="add-btn" style={{ marginTop:12 }} onClick={() => setKycOpen(true)}>
                  <ShieldCheck size={13}/>Submeter novamente
                </button>
              )}
            </>)}
          </div>

          {/* Timeline */}
          <div className="cp-card">
            <div className="section-title"><History size={15} style={{ color:"#8B5CF6" }}/>Histórico da empresa</div>
            <div className="timeline">
              {timeline.map((item, i) => (
                <div className="tl-item" key={item.id}>
                  {i < timeline.length - 1 && <span className="tl-line"/>}
                  <div className="tl-dot" style={{ background:item.achieved?"#1D9E7520":"#0d1117", border:`1px solid ${item.achieved?"#1D9E75":"#1a2535"}` }}>
                    {item.achieved ? <Check size={11} style={{ color:"#1D9E75" }}/> : <span style={{ width:6, height:6, borderRadius:"50%", background:"#4a6a6a" }}/>}
                  </div>
                  <div style={{ paddingTop:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:item.achieved?"#e2e8f0":"#4a6a6a", margin:0 }}>{item.label}</p>
                    {item.date && <p style={{ fontSize:11, color:"#4a6a6a", margin:0 }}>{item.date}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>)}
      </div>

      <EditCompanyModal open={editOpen} company={company} onClose={() => setEditOpen(false)} onSave={handleSaveCompany} saving={savingCompany}/>
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} onSend={handleSendInvite} sending={sendingInvite}/>
      <CompanyKycModal open={kycOpen} onClose={() => setKycOpen(false)} onSubmit={handleSubmitKyc} submitting={submittingKyc} defaultProvince={company.province ?? PROVINCES[0]}/>
    </>
  );
}