"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Globe, MapPin, Calendar, BadgeCheck, Clock, ShieldAlert,
  CheckCircle, Package, Briefcase,
  MessageCircle, X, Loader2, Building2, ArrowLeft,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { companyApi } from "@/lib/company.api";
import { servicesApi } from "@/lib/services.api";
import { chatApi } from "@/lib/chat.api";
import { getToken } from "@/lib/auth.api";
import { Company, CompanyServiceBadge } from "@/types/company.types";

// ─── Badge de verificação ─────────────────────────────────────────────────────
function VerificationBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; Icon: any }> = {
    verified:  { label: "Verificada",  color: "#D4A017", Icon: BadgeCheck  },
    pending:   { label: "Em análise",  color: "#B45309", Icon: Clock       },
    suspended: { label: "Suspensa",    color: "#dc2626", Icon: ShieldAlert },
  };
  const s = map[status] ?? map.pending;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      fontSize:12, fontWeight:700, padding:"4px 10px", borderRadius:99,
      background:`${s.color}15`, color:s.color, border:`1px solid ${s.color}38`,
    }}>
      <s.Icon size={12} /> {s.label}
    </span>
  );
}

// ─── Modal: Solicitar serviço ─────────────────────────────────────────────────
function RequestServiceModal({
  open, company, onClose,
}: { open: boolean; company: Company; onClose: () => void }) {
  const [title, setTitle]     = useState("");
  const [desc, setDesc]       = useState("");
  const [address, setAddress] = useState(company.headquarters ?? "");
  const [budget, setBudget]   = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  if (!open) return null;

  const canSubmit = title.trim() && address.trim() && Number(budget) > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await servicesApi.create({
        title: title.trim(),
        description: desc.trim() || title.trim(),
        category: company.mainCategory,
        address: address.trim(),
        budget: Number(budget),
        targetProviderId: company.ownerId,
      });
      setDone(true);
    } catch (e: any) {
      alert(e.message || "Erro ao solicitar serviço.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width:"100%", padding:"11px 14px", borderRadius:10,
    background:"#F8FAFC", border:"1px solid #E2E8F0",
    color:"#0F172A", fontSize:14, outline:"none", fontFamily:"inherit",
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
      <div style={{ background:"#FFFFFF", border:"1px solid #E2E8F0", borderRadius:20, width:"100%", maxWidth:480, maxHeight:"88vh", display:"flex", flexDirection:"column", boxShadow:"0 24px 60px rgba(15,23,42,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 24px", borderBottom:"1px solid #E2E8F0" }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:"#0F172A", margin:0 }}>Solicitar serviço</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#64748B", cursor:"pointer", display:"flex" }}><X size={18}/></button>
        </div>

        {done ? (
          <div style={{ padding:40, display:"flex", flexDirection:"column", alignItems:"center", gap:14, textAlign:"center" }}>
            <CheckCircle size={40} style={{ color:"#1D9E75" }}/>
            <p style={{ fontSize:16, fontWeight:700, color:"#0F172A", margin:0 }}>Pedido enviado!</p>
            <p style={{ fontSize:13.5, color:"#64748B", lineHeight:1.6, margin:0 }}>
              A empresa <b style={{ color:"#334155" }}>{company.name}</b> irá receber o teu pedido.
            </p>
            <button onClick={onClose} style={{ padding:"10px 24px", borderRadius:10, background:"linear-gradient(135deg,#1D9E75,#159163)", color:"white", border:"none", fontSize:13.5, fontWeight:700, cursor:"pointer" }}>Fechar</button>
          </div>
        ) : (
          <>
            <div style={{ padding:"22px 24px", display:"flex", flexDirection:"column", gap:16, overflowY:"auto", flex:1 }}>
              <div>
                <label style={{ fontSize:12.5, fontWeight:600, color:"#64748B", display:"block", marginBottom:7 }}>Título do serviço *</label>
                <input style={inputStyle} placeholder={`Ex: Instalação de ${company.mainCategory}`} value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize:12.5, fontWeight:600, color:"#64748B", display:"block", marginBottom:7 }}>Descrição (opcional)</label>
                <textarea style={{ ...inputStyle, resize:"none", height:84 } as any} placeholder="Mais detalhes sobre o que precisas..." value={desc} onChange={e => setDesc(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize:12.5, fontWeight:600, color:"#64748B", display:"block", marginBottom:7 }}>Local do serviço *</label>
                <input style={inputStyle} placeholder="Endereço" value={address} onChange={e => setAddress(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize:12.5, fontWeight:600, color:"#64748B", display:"block", marginBottom:7 }}>Orçamento (Kz) *</label>
                <input type="number" style={inputStyle} placeholder="Ex: 25000" value={budget} onChange={e => setBudget(e.target.value)} />
              </div>
            </div>
            <div style={{ padding:"18px 24px", borderTop:"1px solid #E2E8F0" }}>
              <button
                disabled={!canSubmit || loading}
                onClick={handleSubmit}
                style={{
                  width:"100%", padding:13, borderRadius:11, border:"none",
                  background: canSubmit ? "linear-gradient(135deg,#1D9E75,#159163)" : "#E2E8F0",
                  color: canSubmit ? "white" : "#94a3b8",
                  fontSize:14, fontWeight:700, cursor: canSubmit ? "pointer" : "not-allowed",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  transition:"all 0.2s",
                }}
              >
                {loading ? <Loader2 size={15} style={{ animation:"spin 1s linear infinite" }}/> : <CheckCircle size={15}/>}
                {loading ? "A enviar..." : "Confirmar pedido"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function CompanyPublicPage() {
  const params = useParams();
  const router = useRouter();
  const id     = params?.id as string;

  const [company, setCompany]         = useState<Company | null>(null);
  const [services, setServices]       = useState<CompanyServiceBadge[]>([]);
  const [loading, setLoading]         = useState(true);
  const [notFound, setNotFound]       = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const isLoggedIn = !!getToken();

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        // Perfil público + serviços públicos (sem auth)
        const [compRes, svcRes] = await Promise.allSettled([
          companyApi.getPublic(id),
          companyApi.getServicesPublic(id),
        ]);
        if (compRes.status === "fulfilled") setCompany(compRes.value);
        else { setNotFound(true); return; }
        if (svcRes.status === "fulfilled") setServices(svcRes.value);
      } catch { setNotFound(true); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const handleChat = async () => {
    if (!company) return;
    setChatLoading(true);
    try {
      const { room } = await chatApi.createOrGetRoom({ participantId: company.ownerId });
      // Mensagem automática para contextualizar o contacto com a empresa
      await chatApi.sendMessage(
        room.id,
        `Olá! Estou interessado nos serviços da ${company.name}. Podem dar-me mais informações?`,
      );
      router.push(`/chat/${room.id}`);
    } catch {
      router.push("/chat");
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#FFFFFF" }}>
      <Sidebar/>
      <div style={{ flex:1, marginLeft:240, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Loader2 size={28} style={{ color:"#0D9488", animation:"spin 1s linear infinite" }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (notFound || !company) return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#FFFFFF" }}>
      <Sidebar/>
      <div style={{ flex:1, marginLeft:240, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, padding:40 }}>
        <Briefcase size={48} style={{ color:"#cbd5e1" }}/>
        <p style={{ fontSize:18, fontWeight:700, color:"#0F172A", margin:0 }}>Empresa não encontrada</p>
        <p style={{ fontSize:13.5, color:"#64748B", margin:0 }}>Esta empresa pode não existir ou não estar verificada.</p>
        <button onClick={() => router.push("/search")} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px", borderRadius:10, background:"#E2E8F0", border:"1px solid #cbd5e1", color:"#334155", cursor:"pointer", fontSize:13.5, fontFamily:"inherit" }}>
          <ArrowLeft size={14}/> Voltar à pesquisa
        </button>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  const workingDays = (company.workingHours ?? []).filter((h: any) => h.open);
  const hasSocial   = company.socialLinks && Object.values(company.socialLinks).some(Boolean);

  return (
    <>
      <style>{`
        *{box-sizing:border-box}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

        .cpub-wrap{display:flex;min-height:100vh;background:#FFFFFF}
        .cpub-main{flex:1;margin-left:240px;display:flex;flex-direction:column}
        .cpub-inner{flex:1;display:flex;flex-direction:column;max-width:1120px;width:100%;margin:0 auto;padding-bottom:64px}

        /* ── Grade de espaçamento consistente ── */
        .cpub-px{padding-left:24px;padding-right:24px}

        .cpub-back-row{padding-top:20px}
        .btn-back{display:flex;align-items:center;gap:7px;background:none;border:none;color:#64748B;cursor:pointer;font-size:13.5px;font-family:inherit;width:fit-content;padding:6px 0;transition:color 0.15s}
        .btn-back:hover{color:#0F172A}

        /* ── Banner ── */
        .cpub-banner{
          margin-top:16px;height:184px;border-radius:20px;position:relative;overflow:hidden;
          background:linear-gradient(135deg,#1D9E7516,#0D948812);
          animation:fadeUp 0.4s ease both;
        }

        /* ── Logo: sempre fora do banner (não sobreposta), 100% visível em qualquer tamanho ── */
        .cpub-logo-row{
          display:flex;align-items:flex-end;gap:0;
          margin-top:-48px;padding:0 28px;position:relative;z-index:2;
        }
        .cpub-logo{
          width:96px;height:96px;border-radius:20px;flex-shrink:0;
          background:#FFFFFF;border:4px solid #FFFFFF;
          display:flex;align-items:center;justify-content:center;
          overflow:hidden;box-shadow:0 10px 26px rgba(15,23,42,0.16);
        }
        .cpub-logo img{width:100%;height:100%;object-fit:cover;display:block}

        /* ── Cabeçalho ── */
        .cpub-header{padding-top:18px;padding-bottom:28px;display:flex;flex-direction:column;gap:18px;animation:fadeUp 0.45s ease both}
        .cpub-header-top{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;flex-wrap:wrap}
        .cpub-name-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:9px}
        .cpub-name{font-size:26px;font-weight:800;color:#0F172A;margin:0;letter-spacing:-0.015em;line-height:1.15}
        .cpub-type-tag{
          font-size:11px;font-weight:700;padding:3px 9px;border-radius:99px;
          background:#EEECFE;color:#4F46E5;border:1px solid #D7D5FB;
          display:flex;align-items:center;gap:4px;
        }
        .cpub-meta-row{display:flex;align-items:center;gap:16px;flex-wrap:wrap;row-gap:8px}
        .cpub-meta-item{font-size:13.5px;color:#64748B;display:flex;align-items:center;gap:6px;text-decoration:none}
        .cpub-about{font-size:15px;color:#334155;line-height:1.75;margin:14px 0 0;max-width:680px}

        .cpub-actions{display:flex;gap:10px;flex-wrap:wrap;flex-shrink:0}

        .cpub-divider{height:1px;background:#EEF1F5}

        /* ── Secções: ritmo vertical, sem linhas pesadas em toda a largura ── */
        .cpub-section{padding-top:28px;padding-bottom:28px;animation:fadeUp 0.5s ease both}
        .cpub-section + .cpub-section{border-top:1px solid #EEF1F5}
        .sec-title{font-size:12.5px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#8A948E;margin-bottom:16px;margin-top:0;display:flex;align-items:center;gap:8px}

        .badge-pill{display:inline-flex;align-items:center;gap:7px;padding:8px 14px;border-radius:11px;background:#F5F3FF;border:1px solid #EDE7FE;color:#7C3AED;font-size:13px;font-weight:600}

        /* ── Horário de funcionamento: tabela limpa e alinhada ── */
        .hours-card{border:1px solid #EEF1F5;border-radius:16px;overflow:hidden}
        .hours-grid{display:grid;grid-template-columns:repeat(2,1fr)}
        .hour-row{
          display:flex;align-items:center;justify-content:space-between;
          padding:14px 20px;border-bottom:1px solid #F1F5F9;
        }
        .hours-grid .hour-row:nth-child(odd){border-right:1px solid #F1F5F9}
        .hour-day{font-size:13.5px;color:#0F172A;font-weight:600}
        .hour-time{font-size:13.5px;color:#64748B;font-variant-numeric:tabular-nums;white-space:nowrap}

        .cov-pills{display:flex;flex-wrap:wrap;gap:8px}
        .cov-pill{padding:7px 14px;border-radius:99px;background:#FEF6E7;border:1px solid #FCEACB;color:#B45309;font-size:12.5px;font-weight:600}

        .social-grid{display:flex;flex-wrap:wrap;gap:10px}
        .social-link{display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:11px;text-decoration:none;font-size:13.5px;font-weight:600;transition:all 0.15s}
        .social-link:hover{transform:translateY(-1px)}

        .btn-green{display:flex;align-items:center;gap:8px;padding:12px 22px;border-radius:12px;border:none;background:linear-gradient(135deg,#1D9E75,#159163);color:white;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;box-shadow:0 4px 14px rgba(29,158,117,0.24);transition:all 0.2s}
        .btn-green:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(29,158,117,0.32)}
        .btn-chat{display:flex;align-items:center;gap:8px;padding:12px 20px;border-radius:12px;border:1px solid #99E0D6;background:#E6F7F4;color:#0D9488;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;transition:all 0.2s}
        .btn-chat:hover:not(:disabled){background:#0D9488;color:white;border-color:#0D9488}
        .btn-chat:disabled{opacity:0.6;cursor:not-allowed}

        @media(max-width:1024px){
          .cpub-main{margin-left:0}
          .cpub-back-row{padding-top:76px}
          .cpub-px{padding-left:20px;padding-right:20px}
        }
        @media(max-width:640px){
          .cpub-px{padding-left:16px;padding-right:16px}
          .cpub-banner{height:132px;margin-top:12px;border-radius:16px}
          .cpub-logo-row{margin-top:-40px;padding:0 16px}
          .cpub-logo{width:80px;height:80px;border-radius:18px;border-width:3px}
          .cpub-header{padding-top:14px;padding-bottom:24px;gap:14px}
          .cpub-name{font-size:20px}
          .hours-grid{grid-template-columns:1fr}
          .hours-grid .hour-row:nth-child(odd){border-right:none}
          .hour-row{padding:13px 16px}
          .cpub-section{padding-top:22px;padding-bottom:22px}
          .cpub-actions{width:100%}
          .cpub-actions .btn-green,.cpub-actions .btn-chat{flex:1;justify-content:center}
        }
      `}</style>

      <div className="cpub-wrap">
        <Sidebar/>
        <div className="cpub-main">
          <Navbar/>
          <div className="cpub-inner cpub-px">

            <div className="cpub-back-row">
              <button className="btn-back" onClick={() => router.push("/search")}>
                <ArrowLeft size={15}/> Voltar à pesquisa
              </button>
            </div>

            {/* ── Banner ── */}
            <div className="cpub-banner" style={company.bannerUrl ? { background:`url(${company.bannerUrl}) center/cover` } : undefined}/>

            {/* ── Logo: colocada abaixo do banner (fora da área cortada), sempre 100% visível ── */}
            <div className="cpub-logo-row">
              <div className="cpub-logo">
                {company.logoUrl
                  ? <img src={company.logoUrl} alt={company.name}/>
                  : <Building2 size={32} style={{ color:"#0D9488" }}/>}
              </div>
            </div>

            {/* ── Cabeçalho ── */}
            <div className="cpub-header">
              <div className="cpub-header-top">
                <div style={{ flex:1, minWidth:260 }}>
                  <div className="cpub-name-row">
                    <h1 className="cpub-name">{company.name}</h1>
                    <VerificationBadge status={company.verificationStatus}/>
                    <span className="cpub-type-tag"><Building2 size={12}/> Empresa</span>
                  </div>
                  <div className="cpub-meta-row">
                    <span className="cpub-meta-item"><Briefcase size={13}/>{company.mainCategory}</span>
                    <span className="cpub-meta-item"><Calendar size={13}/>Fundada em {company.foundedYear}</span>
                    {company.province && (
                      <span className="cpub-meta-item"><MapPin size={13}/>{company.province}</span>
                    )}
                    {company.website && (
                      <a href={company.website} target="_blank" rel="noreferrer" className="cpub-meta-item" style={{ color:"#0D9488" }}>
                        <Globe size={13}/>{company.website.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </div>
                  {company.about && (
                    <p className="cpub-about">{company.about}</p>
                  )}
                </div>

                {isLoggedIn && (
                  <div className="cpub-actions">
                    <button className="btn-green" onClick={() => setRequestOpen(true)}>
                      <CheckCircle size={15}/> Solicitar serviço
                    </button>
                    <button className="btn-chat" disabled={chatLoading} onClick={handleChat}>
                      {chatLoading
                        ? <Loader2 size={15} style={{ animation:"spin 1s linear infinite" }}/>
                        : <MessageCircle size={15}/>}
                      {chatLoading ? "A abrir..." : "Conversar"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── Serviços oferecidos ── */}
            {services.length > 0 && (
              <div className="cpub-section">
                <p className="sec-title">Serviços oferecidos</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
                  {services.map(s => (
                    <span className="badge-pill" key={s.id}>
                      <span style={{ width:6, height:6, borderRadius:"50%", background:"#7C3AED", flexShrink:0 }}/>
                      {s.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Horário de funcionamento ── */}
            {workingDays.length > 0 && (
              <div className="cpub-section">
                <p className="sec-title">Horário de funcionamento</p>
                <div className="hours-card">
                  <div className="hours-grid">
                    {workingDays.map((h: any) => (
                      <div className="hour-row" key={h.day}>
                        <span className="hour-day">{h.day}</span>
                        <span className="hour-time">{h.from} – {h.to}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Área de cobertura ── */}
            {(company.coverageProvinces ?? []).length > 0 && (
              <div className="cpub-section">
                <p className="sec-title">Área de cobertura</p>
                <div className="cov-pills">
                  {(company.coverageProvinces ?? []).map((p: string) => (
                    <span className="cov-pill" key={p}>{p}</span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Redes sociais ── */}
            {hasSocial && (
              <div className="cpub-section">
                <p className="sec-title">Contactos e redes sociais</p>
                <div className="social-grid">
                  {company.socialLinks?.whatsapp && (
                    <a href={`https://wa.me/${company.socialLinks.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
                      className="social-link" style={{ background:"#E6F7F4", border:"1px solid #99E0D6", color:"#0D9488" }}>
                      <MessageCircle size={14}/> WhatsApp
                    </a>
                  )}
                  {company.socialLinks?.facebook && (
                    <a href={company.socialLinks.facebook} target="_blank" rel="noreferrer"
                      className="social-link" style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", color:"#2563EB" }}>
                      Facebook
                    </a>
                  )}
                  {company.socialLinks?.instagram && (
                    <a href={company.socialLinks.instagram} target="_blank" rel="noreferrer"
                      className="social-link" style={{ background:"#FCE7F3", border:"1px solid #FBCFE8", color:"#DB2777" }}>
                      Instagram
                    </a>
                  )}
                  {company.socialLinks?.linkedin && (
                    <a href={company.socialLinks.linkedin} target="_blank" rel="noreferrer"
                      className="social-link" style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", color:"#2563EB" }}>
                      LinkedIn
                    </a>
                  )}
                  {company.socialLinks?.website && (
                    <a href={company.socialLinks.website} target="_blank" rel="noreferrer"
                      className="social-link" style={{ background:"#F5F3FF", border:"1px solid #DDD6FE", color:"#7C3AED" }}>
                      <Globe size={14}/> Website
                    </a>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {company && (
        <RequestServiceModal open={requestOpen} company={company} onClose={() => setRequestOpen(false)}/>
      )}
    </>
  );
}