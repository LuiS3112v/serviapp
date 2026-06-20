"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Edit, Users, Briefcase, Phone, Mail, MapPin, Plus, X, Check,
  Globe, ShieldCheck, Clock, TrendingUp, Star, FileText,
  Image as ImageIcon, History, Share2, Search, Trash2, AlertCircle,
  UserPlus, Building2, MessageCircle,
} from "lucide-react";

type VerificationStatus = "verified" | "pending" | "suspended";
type EmployeeStatus = "active" | "busy" | "offline";
type EmployeeRole = "admin" | "manager" | "supervisor" | "employee";
type InviteStatus = "pending" | "accepted" | "rejected";
type DocStatus = "approved" | "pending" | "rejected";
type TabKey = "overview" | "services" | "team" | "invites" | "portfolio" | "more";

interface CompanyInfo {
  name: string;
  verification: VerificationStatus;
  mainCategory: string;
  foundedYear: number;
  website: string;
  email: string;
  phone: string;
  nif: string;
  headquarters: string;
  province: string;
  municipality: string;
  address: string;
  sector: string;
  about: string;
}

interface ServiceBadge { id: string; label: string; category: string; }

interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  email: string;
  phone: string;
  completedServices: number;
  avgRating: number;
  totalEarned: number;
  avgResponseMin: number;
}

interface Invitation {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  status: InviteStatus;
  sentAt: string;
}

interface PortfolioProject {
  id: string;
  name: string;
  client: string;
  category: string;
  date: string;
  value: number;
}

interface Certification { id: string; name: string; issuer: string; year: string; }
interface CompanyDocument { id: string; name: string; status: DocStatus; }
interface SocialLinks { facebook: string; instagram: string; tiktok: string; linkedin: string; whatsapp: string; website: string; }
interface DayHours { day: string; open: boolean; from: string; to: string; }
interface TimelineItem { id: string; label: string; date: string; achieved: boolean; }

const ROLE_LABEL: Record<EmployeeRole, string> = {
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

const initialCompany: CompanyInfo = {
  name: "Nome da empresa",
  verification: "pending",
  mainCategory: "Não definida",
  foundedYear: new Date().getFullYear(),
  website: "",
  email: "email@empresa.ao",
  phone: "+244 —",
  nif: "Não definido",
  headquarters: "Luanda, Angola",
  province: "Luanda",
  municipality: "Não definido",
  address: "Não definido",
  sector: "Não definido",
  about: "",
};

const initialHours: DayHours[] = WEEK_DAYS.map(d => ({ day: d, open: false, from: "08:00", to: "17:00" }));
const initialSocial: SocialLinks = { facebook: "", instagram: "", tiktok: "", linkedin: "", whatsapp: "", website: "" };

const initialTimeline: TimelineItem[] = [
  { id: "t1", label: "Empresa criada", date: new Date().toISOString().slice(0, 10), achieved: true },
  { id: "t2", label: "Primeiros funcionários", date: "", achieved: false },
  { id: "t3", label: "100 clientes atendidos", date: "", achieved: false },
  { id: "t4", label: "Empresa verificada", date: "", achieved: false },
];

function buildStats(employees: Employee[]) {
  return [
    { label: "Funcionários", value: String(employees.length), color: "#1D9E75" },
    { label: "Clientes atendidos", value: "0", color: "#378ADD" },
    { label: "Serviços activos", value: "0", color: "#378ADD" },
    { label: "Serviços concluídos", value: "0", color: "#1D9E75" },
    { label: "Avaliação média", value: "—", color: "#EF9F27" },
    { label: "Total ganho", value: "0 Kz", color: "#EF9F27" },
    { label: "Ganhos do mês", value: "0 Kz", color: "#EF9F27" },
    { label: "Anos de actividade", value: "0", color: "#8B5CF6" },
    { label: "Tempo médio de resposta", value: "—", color: "#8B5CF6" },
    { label: "Taxa de conclusão", value: "0%", color: "#1D9E75" },
    { label: "Clientes recorrentes", value: "0", color: "#378ADD" },
  ];
}

function VerificationBadge({ status }: { status: VerificationStatus }) {
  const map = {
    verified: { label: "Verificada", color: "#1D9E75", Icon: ShieldCheck },
    pending: { label: "Em análise", color: "#EF9F27", Icon: AlertCircle },
    suspended: { label: "Suspensa", color: "#E24B4A", Icon: X },
  } as const;
  const { label, color, Icon } = map[status];
  return (
    <span className="v-badge" style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
      <Icon size={12} /> {label}
    </span>
  );
}

function StatusDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="dot-badge">
      <span className="dot" style={{ background: color }} />
      {label}
    </span>
  );
}

function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  const map = {
    active: { label: "Activo", color: "#1D9E75" },
    busy: { label: "Ocupado", color: "#EF9F27" },
    offline: { label: "Offline", color: "#5a6a7a" },
  } as const;
  const s = map[status];
  return <StatusDot color={s.color} label={s.label} />;
}

function InviteStatusBadge({ status }: { status: InviteStatus }) {
  const map = {
    pending: { label: "Pendente", color: "#EF9F27" },
    accepted: { label: "Aceite", color: "#1D9E75" },
    rejected: { label: "Rejeitado", color: "#E24B4A" },
  } as const;
  const s = map[status];
  return <StatusDot color={s.color} label={s.label} />;
}

function DocStatusBadge({ status }: { status: DocStatus }) {
  const map = {
    approved: { label: "Aprovado", color: "#1D9E75" },
    pending: { label: "Em análise", color: "#EF9F27" },
    rejected: { label: "Rejeitado", color: "#E24B4A" },
  } as const;
  const s = map[status];
  return <StatusDot color={s.color} label={s.label} />;
}

function EditCompanyModal({
  open, company, onClose, onSave,
}: { open: boolean; company: CompanyInfo; onClose: () => void; onSave: (u: Partial<CompanyInfo>) => void; }) {
  const [form, setForm] = useState(company);
  if (!open) return null;
  const set = (k: keyof CompanyInfo, v: string | number) => setForm(f => ({ ...f, [k]: v }));

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
          <button className="btn-primary" onClick={() => onSave(form)}>
            <Check size={15} /> Guardar alterações
          </button>
        </div>
      </div>
    </div>
  );
}

function InviteModal({
  open, onClose, onSend,
}: { open: boolean; onClose: () => void; onSend: (data: { name: string; email: string; phone: string }, role: EmployeeRole) => void; }) {
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<EmployeeRole>("employee");
  if (!open) return null;

  const reset = () => { setQuery(""); setName(""); setEmail(""); setPhone(""); setRole("employee"); };
  const handleSend = () => {
    if (!name.trim() || (!email.trim() && !phone.trim())) return;
    onSend({ name: name.trim(), email: email.trim(), phone: phone.trim() }, role);
    reset();
    onClose();
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
              <Search size={15} style={{ color: "#4a6a6a" }} />
              <input
                className="search-input"
                placeholder="Pesquisar utilizador existente..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <p className="hint">Ligação à pesquisa de utilizadores fica pronta quando o backend existir. Por agora, preenche os dados manualmente abaixo.</p>
          </div>
          <div className="field">
            <label>Nome completo</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Nome do funcionário" />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div className="field">
              <label>Telefone</label>
              <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+244 9XX XXX XXX" />
            </div>
          </div>
          <div className="field">
            <label>Cargo / permissão</label>
            <select className="input" value={role} onChange={e => setRole(e.target.value as EmployeeRole)}>
              <option value="admin">Admin</option>
              <option value="manager">Gerente</option>
              <option value="supervisor">Supervisor</option>
              <option value="employee">Funcionário</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-primary" onClick={handleSend}>
            <UserPlus size={15} /> Enviar convite
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CompanyProfilePage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("overview");

  const [company, setCompany] = useState<CompanyInfo>(initialCompany);
  const [editOpen, setEditOpen] = useState(false);
  const [aboutDraft, setAboutDraft] = useState(initialCompany.about);

  const [services, setServices] = useState<ServiceBadge[]>([]);
  const [newService, setNewService] = useState("");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);

  const [portfolio, setPortfolio] = useState<PortfolioProject[]>([]);
  const [projName, setProjName] = useState("");
  const [projClient, setProjClient] = useState("");

  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [certName, setCertName] = useState("");
  const [certIssuer, setCertIssuer] = useState("");

  const [documents] = useState<CompanyDocument[]>([
    { id: "d1", name: "NIF", status: "pending" },
    { id: "d2", name: "Alvará comercial", status: "pending" },
    { id: "d3", name: "Documento KYC", status: "pending" },
  ]);

  const [social, setSocial] = useState<SocialLinks>(initialSocial);
  const [hours, setHours] = useState<DayHours[]>(initialHours);
  const [coverage, setCoverage] = useState<string[]>([company.province]);
  const [coverageDraft, setCoverageDraft] = useState(PROVINCES[0]);
  const [timeline] = useState<TimelineItem[]>(initialTimeline);

  const stats = buildStats(employees);

  const handleSaveCompany = (updated: Partial<CompanyInfo>) => {
    setCompany(prev => ({ ...prev, ...updated }));
    setEditOpen(false);
  };

  const handleSaveAbout = () => {
    setCompany(prev => ({ ...prev, about: aboutDraft }));
  };

  const handleAddService = () => {
    if (!newService.trim()) return;
    setServices(prev => [...prev, { id: `tmp_${Date.now()}`, label: newService.trim(), category: company.mainCategory }]);
    setNewService("");
  };

  const handleRemoveService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const handleSendInvite = (data: { name: string; email: string; phone: string }, role: EmployeeRole) => {
    setInvitations(prev => [
      { id: `tmp_${Date.now()}`, ...data, role, status: "pending", sentAt: new Date().toISOString() },
      ...prev,
    ]);
  };

  const handleAddProject = () => {
    if (!projName.trim()) return;
    setPortfolio(prev => [...prev, {
      id: `tmp_${Date.now()}`, name: projName.trim(), client: projClient.trim() || "—",
      category: company.mainCategory, date: new Date().toISOString().slice(0, 10), value: 0,
    }]);
    setProjName(""); setProjClient("");
  };

  const handleRemoveProject = (id: string) => setPortfolio(prev => prev.filter(p => p.id !== id));

  const handleAddCertification = () => {
    if (!certName.trim()) return;
    setCertifications(prev => [...prev, { id: `tmp_${Date.now()}`, name: certName.trim(), issuer: certIssuer.trim() || "—", year: String(new Date().getFullYear()) }]);
    setCertName(""); setCertIssuer("");
  };

  const handleRemoveCertification = (id: string) => setCertifications(prev => prev.filter(c => c.id !== id));

  const toggleDay = (day: string) => setHours(prev => prev.map(h => h.day === day ? { ...h, open: !h.open } : h));
  const updateDayTime = (day: string, field: "from" | "to", value: string) =>
    setHours(prev => prev.map(h => h.day === day ? { ...h, [field]: value } : h));

  const updateSocial = (key: keyof SocialLinks, value: string) => setSocial(prev => ({ ...prev, [key]: value }));

  const addCoverage = () => {
    if (coverage.includes(coverageDraft)) return;
    setCoverage(prev => [...prev, coverageDraft]);
  };
  const removeCoverage = (p: string) => setCoverage(prev => prev.filter(c => c !== p));

  const TABS: { key: TabKey; label: string; icon: any }[] = [
    { key: "overview", label: "Visão geral", icon: Briefcase },
    { key: "services", label: "Serviços", icon: Star },
    { key: "team", label: "Equipa", icon: Users },
    { key: "invites", label: "Convites", icon: UserPlus },
    { key: "portfolio", label: "Portfólio", icon: ImageIcon },
    { key: "more", label: "Mais", icon: FileText },
  ];

  return (
    <>
      <style>{`
        /* ── Reset base ── */
        *, *::before, *::after { box-sizing: border-box; }

        /* ── Layout ── */
        .cp-inner {
          padding: 28px 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-width: 760px;
          width: 100%;
        }
        .cp-card {
          background: #131b27;
          border: 1px solid #1a2535;
          border-radius: 20px;
          padding: 24px;
          width: 100%;
        }

        /* ── Info rows ── */
        .info-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid #1a2535;
        }
        .info-row:last-child { border-bottom: none; }

        /* ── Stats ── */
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          width: 100%;
        }
        .stat {
          background: #0d1117;
          border: 1px solid #1a2535;
          border-radius: 12px;
          padding: 14px;
          text-align: center;
          min-width: 0;
        }

        /* ── Empty state ── */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 32px;
          gap: 10px;
          text-align: center;
        }

        /* ── Buttons ── */
        .edit-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 12px;
          border: 1px solid #1a2535;
          background: #131b27;
          color: #8a9ab0;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .add-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          background: #1d9e7520;
          color: #1D9E75;
          border: 1px solid #1d9e7540;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* ── Badges ── */
        .v-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 99px;
        }
        .dot-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #8a9ab0;
          font-weight: 600;
        }
        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* ── Tabs ── */
        .tabs {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 4px;
          border-bottom: 1px solid #1a2535;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .tabs::-webkit-scrollbar { display: none; }
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          border-radius: 10px 10px 0 0;
          border: none;
          background: transparent;
          color: #4a6a6a;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .tab-btn.active {
          color: #378ADD;
          background: #131b27;
          border: 1px solid #1a2535;
          border-bottom: 1px solid #131b27;
          margin-bottom: -1px;
        }

        /* ── Badge pills ── */
        .badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 12px;
          border-radius: 10px;
          background: #0d1117;
          border: 1px solid #1a2535;
          color: #c0d0e0;
          font-size: 13px;
        }
        .badge-pill button {
          background: none;
          border: none;
          color: #4a6a6a;
          cursor: pointer;
          display: flex;
          padding: 0;
        }

        /* ── Inline add ── */
        .inline-add {
          display: flex;
          gap: 8px;
          width: 100%;
        }

        /* ── Inputs ── */
        .input {
          width: 100%;
          padding: 10px 13px;
          border-radius: 10px;
          background: #0d1117;
          border: 1px solid #1a2535;
          color: #e2e8f0;
          font-size: 13px;
          outline: none;
          font-family: inherit;
          min-width: 0;
        }
        .input:focus { border-color: #378ADD; }

        /* ── Textarea "Sobre a empresa" ── */
        textarea.about-textarea {
          width: 100%;
          min-width: 0;
          padding: 12px 14px;
          border-radius: 10px;
          background: #0d1117;
          border: 1px solid #1a2535;
          color: #e2e8f0;
          font-size: 13px;
          outline: none;
          font-family: inherit;
          /* Horizontal: ocupa toda a largura, sem resize lateral */
          resize: none;
          /* Vertical: altura fixa confortável, scroll se o texto for longo */
          height: 96px;
          max-height: 96px;
          overflow-y: auto;
          line-height: 1.6;
          display: block;
        }
        textarea.about-textarea:focus { border-color: #378ADD; }

        /* ── Employee cards ── */
        .emp-card {
          background: #0d1117;
          border: 1px solid #1a2535;
          border-radius: 14px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .emp-top {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .emp-avatar {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #1a2232;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #378ADD;
          font-weight: 700;
          font-size: 14px;
          flex-shrink: 0;
        }
        .emp-mini-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          border-top: 1px solid #1a2535;
          padding-top: 12px;
        }
        .emp-mini { text-align: center; min-width: 0; }
        .emp-mini b { display: block; font-size: 13px; color: #e2e8f0; }
        .emp-mini span { font-size: 10px; color: #4a6a6a; }

        /* ── Invite row ── */
        .invite-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px;
          background: #0d1117;
          border: 1px solid #1a2535;
          border-radius: 12px;
          min-width: 0;
        }

        /* ── Modal ── */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modal-card {
          background: #131b27;
          border: 1px solid #1a2535;
          border-radius: 20px;
          width: 100%;
          max-width: 520px;
          max-height: 88vh;
          display: flex;
          flex-direction: column;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 22px;
          border-bottom: 1px solid #1a2535;
          flex-shrink: 0;
        }
        .modal-header h2 {
          font-size: 16px;
          font-weight: 700;
          color: #e2e8f0;
          margin: 0;
        }
        .icon-btn {
          background: none;
          border: none;
          color: #4a6a6a;
          cursor: pointer;
          padding: 0;
        }
        .modal-body {
          padding: 20px 22px;
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          width: 100%;
        }
        .field { width: 100%; min-width: 0; }
        .field label {
          font-size: 12px;
          font-weight: 600;
          color: #6a7a8a;
          display: block;
          margin-bottom: 6px;
        }
        .modal-footer {
          padding: 16px 22px;
          border-top: 1px solid #1a2535;
          flex-shrink: 0;
        }
        .btn-primary {
          width: 100%;
          padding: 13px;
          border-radius: 11px;
          background: #378ADD;
          color: white;
          border: none;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 13px;
          border-radius: 10px;
          background: #0d1117;
          border: 1px solid #1a2535;
        }
        .search-input {
          flex: 1;
          min-width: 0;
          background: none;
          border: none;
          outline: none;
          color: #e2e8f0;
          font-size: 13px;
          font-family: inherit;
        }
        .hint {
          font-size: 11px;
          color: #4a6a6a;
          margin-top: 6px;
          line-height: 1.5;
        }

        /* ── Working hours ── */
        .day-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid #1a2535;
          flex-wrap: wrap;
        }
        .day-row:last-child { border-bottom: none; }
        .day-name {
          flex: 1;
          font-size: 13px;
          color: #c0d0e0;
          font-weight: 600;
          min-width: 70px;
        }
        .toggle {
          width: 38px;
          height: 22px;
          border-radius: 99px;
          cursor: pointer;
          position: relative;
          flex-shrink: 0;
          border: none;
        }
        .time-input {
          width: 78px;
          padding: 6px 8px;
          border-radius: 8px;
          background: #0d1117;
          border: 1px solid #1a2535;
          color: #e2e8f0;
          font-size: 12px;
          font-family: inherit;
          flex-shrink: 0;
        }

        /* ── Timeline ── */
        .timeline { display: flex; flex-direction: column; }
        .tl-item {
          display: flex;
          gap: 12px;
          padding-bottom: 18px;
          position: relative;
        }
        .tl-item:last-child { padding-bottom: 0; }
        .tl-line {
          position: absolute;
          left: 9px;
          top: 20px;
          bottom: 0;
          width: 1px;
          background: #1a2535;
        }
        .tl-item:last-child .tl-line { display: none; }
        .tl-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          z-index: 1;
        }

        /* ── Gallery ── */
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          width: 100%;
        }
        .gallery-empty {
          aspect-ratio: 1;
          border-radius: 10px;
          background: #0d1117;
          border: 1px dashed #1a2535;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2a3a4a;
        }

        /* ── Section title ── */
        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          font-size: 15px;
          font-weight: 700;
          color: #c0d0e0;
        }

        /* ── Responsive: tablet (≤768px) ── */
        @media (max-width: 768px) {
          .cp-inner { padding: 20px 20px; }
          .stat-grid { grid-template-columns: repeat(2, 1fr); }
          .gallery-grid { grid-template-columns: repeat(3, 1fr); }
        }

        /* ── Responsive: mobile (≤640px) ── */
        @media (max-width: 640px) {
          .cp-inner { padding: 14px 14px; gap: 14px; }
          .cp-card { padding: 16px; border-radius: 16px; }
          .stat-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .field-row { grid-template-columns: 1fr; }
          .emp-mini-stats { grid-template-columns: repeat(2, 1fr); }
          .gallery-grid { grid-template-columns: repeat(2, 1fr); }
          .modal-card { border-radius: 16px; }
          .day-row { gap: 8px; }
          .time-input { width: 68px; }
          .emp-top { flex-wrap: wrap; }
        }

        /* ── Responsive: small mobile (≤380px) ── */
        @media (max-width: 380px) {
          .cp-inner { padding: 10px 10px; }
          .tabs { gap: 2px; }
          .tab-btn { padding: 8px 10px; font-size: 12px; }
          .stat-grid { grid-template-columns: 1fr 1fr; gap: 6px; }
          .stat { padding: 10px 8px; }
          .gallery-grid { grid-template-columns: repeat(2, 1fr); }
          .field-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="cp-inner">

        {/* ── Cabeçalho ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", marginBottom: 4, margin: "0 0 4px" }}>Perfil da empresa</h1>
            <p style={{ fontSize: 13, color: "#4a6a6a", margin: 0 }}>Gere a tua empresa e equipa</p>
          </div>
          <button className="edit-btn" onClick={() => setEditOpen(true)}><Edit size={14} /> Editar</button>
        </div>

        {/* ── Card da empresa ── */}
        <div className="cp-card">
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ width: 72, height: 72, borderRadius: 16, background: "#1a2232", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Building2 size={30} style={{ color: "#378ADD" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>{company.name}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <VerificationBadge status={company.verification} />
                <span className="v-badge" style={{ background: "#378ADD20", color: "#378ADD", border: "1px solid #378ADD40" }}>
                  {company.mainCategory}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 20, marginTop: 18, paddingTop: 18, borderTop: "1px solid #1a2535", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "#4a6a6a" }}>Fundada em <b style={{ color: "#c0d0e0" }}>{company.foundedYear}</b></span>
            {company.website ? (
              <a href={company.website} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#378ADD", display: "flex", alignItems: "center", gap: 4, wordBreak: "break-all" }}>
                <Globe size={12} /> {company.website}
              </a>
            ) : (
              <span style={{ fontSize: 12, color: "#4a6a6a", display: "flex", alignItems: "center", gap: 4 }}><Globe size={12} /> Sem website</span>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="tabs">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} className={`tab-btn ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* ════════════ VISÃO GERAL ════════════ */}
        {tab === "overview" && (
          <>
            <div className="cp-card">
              {[
                { icon: Mail, label: "Email", value: company.email, color: "#1D9E75" },
                { icon: Phone, label: "Telefone", value: company.phone, color: "#378ADD" },
                { icon: MapPin, label: "Sede", value: company.headquarters, color: "#EF9F27" },
                { icon: Briefcase, label: "Sector", value: company.sector, color: "#8B5CF6" },
                { icon: FileText, label: "NIF", value: company.nif, color: "#5a6a7a" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div className="info-row" key={i}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `${item.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={16} style={{ color: item.color }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 11, color: "#4a5a6a", marginBottom: 2, margin: "0 0 2px" }}>{item.label}</p>
                      <p style={{ fontSize: 14, color: "#c0d0e0", margin: 0, wordBreak: "break-word" }}>{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Sobre a empresa — campo largo e eficiente ── */}
            <div className="cp-card">
              <div className="section-title"><FileText size={15} style={{ color: "#378ADD" }} /> Sobre a empresa</div>
              <textarea
                className="about-textarea"
                placeholder="Descreve a tua empresa: o que fazem, há quanto tempo, o que vos diferencia..."
                value={aboutDraft}
                onChange={e => setAboutDraft(e.target.value)}
              />
              <button className="edit-btn" style={{ marginTop: 12 }} onClick={handleSaveAbout}>
                <Check size={14} /> Guardar descrição
              </button>
            </div>

            {/* ── Stats ── */}
            <div className="stat-grid">
              {stats.map((s, i) => (
                <div className="stat" key={i}>
                  <p style={{ fontSize: 20, fontWeight: 700, color: s.color, marginBottom: 4, margin: "0 0 4px" }}>{s.value}</p>
                  <p style={{ fontSize: 11, color: "#4a6a6a", margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ════════════ SERVIÇOS ════════════ */}
        {tab === "services" && (
          <div className="cp-card">
            <div className="section-title"><Star size={15} style={{ color: "#EF9F27" }} /> Serviços oferecidos</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {services.length === 0 && <p style={{ fontSize: 13, color: "#4a6a6a", margin: 0 }}>Ainda não adicionaste serviços.</p>}
              {services.map(s => (
                <span className="badge-pill" key={s.id}>
                  {s.label}
                  <button onClick={() => handleRemoveService(s.id)}><X size={13} /></button>
                </span>
              ))}
            </div>
            <div className="inline-add">
              <input className="input" placeholder="Ex: Instalação eléctrica" value={newService} onChange={e => setNewService(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddService()} />
              <button className="add-btn" onClick={handleAddService}><Plus size={13} /> Adicionar</button>
            </div>
          </div>
        )}

        {/* ════════════ EQUIPA ════════════ */}
        {tab === "team" && (
          <div className="cp-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div className="section-title" style={{ marginBottom: 0 }}><Users size={15} style={{ color: "#1D9E75" }} /> Equipa</div>
              <button className="add-btn" onClick={() => setInviteOpen(true)}><Plus size={13} /> Adicionar</button>
            </div>

            {employees.length === 0 ? (
              <div className="empty-state">
                <Users size={28} style={{ color: "#2a3a4a" }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: "#c0d0e0", margin: 0 }}>Sem funcionários ainda</p>
                <p style={{ fontSize: 13, color: "#4a6a6a", lineHeight: 1.6, maxWidth: 280, margin: 0, textAlign: "center" }}>
                  Adiciona funcionários para distribuir serviços pela equipa. Os convites aceites aparecem aqui automaticamente.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {employees.map(emp => (
                  <div className="emp-card" key={emp.id}>
                    <div className="emp-top">
                      <div className="emp-avatar">{emp.name.split(" ").map(n => n[0]).slice(0, 2).join("")}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>{emp.name}</p>
                        <p style={{ fontSize: 12, color: "#4a6a6a", margin: 0 }}>{ROLE_LABEL[emp.role]}</p>
                      </div>
                      <EmployeeStatusBadge status={emp.status} />
                    </div>
                    <div className="emp-mini-stats">
                      <div className="emp-mini"><b>{emp.completedServices}</b><span>concluídos</span></div>
                      <div className="emp-mini"><b>{emp.avgRating.toFixed(1)}★</b><span>avaliação</span></div>
                      <div className="emp-mini"><b>{emp.totalEarned.toLocaleString("pt-AO")} Kz</b><span>gerado</span></div>
                      <div className="emp-mini"><b>{emp.avgResponseMin}min</b><span>resposta</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════ CONVITES ════════════ */}
        {tab === "invites" && (
          <div className="cp-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div className="section-title" style={{ marginBottom: 0 }}><UserPlus size={15} style={{ color: "#378ADD" }} /> Convites enviados</div>
              <button className="add-btn" onClick={() => setInviteOpen(true)}><Plus size={13} /> Convidar</button>
            </div>

            {invitations.length === 0 ? (
              <div className="empty-state">
                <UserPlus size={28} style={{ color: "#2a3a4a" }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: "#c0d0e0", margin: 0 }}>Nenhum convite enviado</p>
                <p style={{ fontSize: 13, color: "#4a6a6a", lineHeight: 1.6, maxWidth: 280, margin: 0, textAlign: "center" }}>
                  Pesquisa um utilizador por nome, email ou telefone e convida-o para a tua equipa.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {invitations.map(inv => (
                  <div className="invite-row" key={inv.id}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", margin: 0 }}>{inv.name}</p>
                      <p style={{ fontSize: 11, color: "#4a6a6a", margin: 0 }}>{inv.email || inv.phone} · {ROLE_LABEL[inv.role]}</p>
                    </div>
                    <InviteStatusBadge status={inv.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════ PORTFÓLIO ════════════ */}
        {tab === "portfolio" && (
          <>
            <div className="cp-card">
              <div className="section-title"><Briefcase size={15} style={{ color: "#378ADD" }} /> Projectos realizados</div>
              {portfolio.length === 0 ? (
                <p style={{ fontSize: 13, color: "#4a6a6a", marginBottom: 16 }}>Ainda não adicionaste projectos ao portfólio.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  {portfolio.map(p => (
                    <div className="invite-row" key={p.id}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", margin: 0 }}>{p.name}</p>
                        <p style={{ fontSize: 11, color: "#4a6a6a", margin: 0 }}>{p.client} · {p.category} · {p.date}</p>
                      </div>
                      <button className="icon-btn" onClick={() => handleRemoveProject(p.id)}><Trash2 size={15} /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="field-row">
                <input className="input" placeholder="Nome do projecto" value={projName} onChange={e => setProjName(e.target.value)} />
                <input className="input" placeholder="Cliente (opcional)" value={projClient} onChange={e => setProjClient(e.target.value)} />
              </div>
              <button className="add-btn" style={{ marginTop: 10 }} onClick={handleAddProject}><Plus size={13} /> Adicionar projecto</button>
              <p className="hint">Upload de fotos via Cloudinary fica disponível na integração com o backend.</p>
            </div>

            <div className="cp-card">
              <div className="section-title"><ImageIcon size={15} style={{ color: "#8B5CF6" }} /> Galeria de trabalhos</div>
              <div className="gallery-grid">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div className="gallery-empty" key={i}><ImageIcon size={20} /></div>
                ))}
              </div>
              <p className="hint">Brevemente: upload e remoção de imagens via Cloudinary.</p>
            </div>
          </>
        )}

        {/* ════════════ MAIS ════════════ */}
        {tab === "more" && (
          <>
            {/* Horário */}
            <div className="cp-card">
              <div className="section-title"><Clock size={15} style={{ color: "#378ADD" }} /> Horário de funcionamento</div>
              {hours.map(h => (
                <div className="day-row" key={h.day}>
                  <span className="day-name">{h.day}</span>
                  <button
                    className="toggle"
                    style={{ background: h.open ? "#1D9E75" : "#1a2535" }}
                    onClick={() => toggleDay(h.day)}
                  >
                    <span style={{ position: "absolute", left: h.open ? 19 : 3, top: 3, width: 16, height: 16, borderRadius: "50%", background: "white", transition: "left .15s" }} />
                  </button>
                  {h.open ? (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input className="time-input" type="time" value={h.from} onChange={e => updateDayTime(h.day, "from", e.target.value)} />
                      <span style={{ color: "#4a6a6a", fontSize: 12, flexShrink: 0 }}>às</span>
                      <input className="time-input" type="time" value={h.to} onChange={e => updateDayTime(h.day, "to", e.target.value)} />
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: "#4a6a6a" }}>Fechado</span>
                  )}
                </div>
              ))}
            </div>

            {/* Cobertura */}
            <div className="cp-card">
              <div className="section-title"><MapPin size={15} style={{ color: "#EF9F27" }} /> Área de cobertura</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {coverage.map(p => (
                  <span className="badge-pill" key={p}>
                    {p}
                    <button onClick={() => removeCoverage(p)}><X size={13} /></button>
                  </span>
                ))}
              </div>
              <div className="inline-add">
                <select className="input" value={coverageDraft} onChange={e => setCoverageDraft(e.target.value)}>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <button className="add-btn" onClick={addCoverage}><Plus size={13} /> Adicionar</button>
              </div>
            </div>

            {/* Redes sociais */}
            <div className="cp-card">
              <div className="section-title"><Share2 size={15} style={{ color: "#378ADD" }} /> Redes sociais</div>
              {[
                { key: "website" as const, label: "Website", icon: Globe, placeholder: "https://..." },
                { key: "whatsapp" as const, label: "WhatsApp", icon: MessageCircle, placeholder: "+244 9XX XXX XXX" },
                { key: "facebook" as const, label: "Facebook", icon: Share2, placeholder: "https://facebook.com/..." },
                { key: "instagram" as const, label: "Instagram", icon: Share2, placeholder: "https://instagram.com/..." },
                { key: "tiktok" as const, label: "TikTok", icon: Share2, placeholder: "https://tiktok.com/@..." },
                { key: "linkedin" as const, label: "LinkedIn", icon: Share2, placeholder: "https://linkedin.com/company/..." },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div className="field" key={s.key} style={{ marginBottom: 12 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon size={12} /> {s.label}</label>
                    <input className="input" placeholder={s.placeholder} value={social[s.key]} onChange={e => updateSocial(s.key, e.target.value)} />
                  </div>
                );
              })}
            </div>

            {/* Certificações */}
            <div className="cp-card">
              <div className="section-title"><ShieldCheck size={15} style={{ color: "#1D9E75" }} /> Certificações e especializações</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {certifications.length === 0 && <p style={{ fontSize: 13, color: "#4a6a6a", margin: 0 }}>Sem certificações registadas.</p>}
                {certifications.map(c => (
                  <span className="badge-pill" key={c.id}>
                    {c.name} · {c.issuer}
                    <button onClick={() => handleRemoveCertification(c.id)}><X size={13} /></button>
                  </span>
                ))}
              </div>
              <div className="field-row">
                <input className="input" placeholder="Nome da certificação" value={certName} onChange={e => setCertName(e.target.value)} />
                <input className="input" placeholder="Entidade emissora" value={certIssuer} onChange={e => setCertIssuer(e.target.value)} />
              </div>
              <button className="add-btn" style={{ marginTop: 10 }} onClick={handleAddCertification}><Plus size={13} /> Adicionar</button>
            </div>

            {/* Documentos */}
            <div className="cp-card">
              <div className="section-title"><FileText size={15} style={{ color: "#5a6a7a" }} /> Documentos</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {documents.map(d => (
                  <div className="invite-row" key={d.id}>
                    <p style={{ fontSize: 13, color: "#e2e8f0", margin: 0 }}>{d.name}</p>
                    <DocStatusBadge status={d.status} />
                  </div>
                ))}
              </div>
              <p className="hint">Upload de documentos liga-se ao módulo de KYC já existente quando o backend for integrado.</p>
            </div>

            {/* Timeline */}
            <div className="cp-card">
              <div className="section-title"><History size={15} style={{ color: "#8B5CF6" }} /> Histórico da empresa</div>
              <div className="timeline">
                {timeline.map((item, i) => (
                  <div className="tl-item" key={item.id}>
                    {i < timeline.length - 1 && <span className="tl-line" />}
                    <div className="tl-dot" style={{ background: item.achieved ? "#1D9E7520" : "#0d1117", border: `1px solid ${item.achieved ? "#1D9E75" : "#1a2535"}` }}>
                      {item.achieved ? <Check size={11} style={{ color: "#1D9E75" }} /> : <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4a6a6a" }} />}
                    </div>
                    <div style={{ paddingTop: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: item.achieved ? "#e2e8f0" : "#4a6a6a", margin: 0 }}>{item.label}</p>
                      {item.date && <p style={{ fontSize: 11, color: "#4a6a6a", margin: 0 }}>{item.date}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </div>

      <EditCompanyModal open={editOpen} company={company} onClose={() => setEditOpen(false)} onSave={handleSaveCompany} />
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} onSend={handleSendInvite} />
    </>
  );
}