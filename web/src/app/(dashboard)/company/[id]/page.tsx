"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Globe, MapPin, Calendar, BadgeCheck, Clock, ShieldAlert,
  CheckCircle, Package, Award, Briefcase,
  MessageCircle, X, ChevronLeft, ChevronRight,
  Loader2, Building2, ArrowLeft,
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
      background:`${s.color}18`, color:s.color, border:`1px solid ${s.color}40`,
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
    width:"100%", padding:"10px 13px", borderRadius:10,
    background:"#F8FAFC", border:"1px solid #E2E8F0",
    color:"#0F172A", fontSize:13, outline:"none", fontFamily:"inherit",
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
      <div style={{ background:"#FFFFFF", border:"1px solid #E2E8F0", borderRadius:20, width:"100%", maxWidth:480, maxHeight:"88vh", display:"flex", flexDirection:"column", boxShadow:"0 24px 60px rgba(15,23,42,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 22px", borderBottom:"1px solid #E2E8F0" }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:"#0F172A", margin:0 }}>Solicitar serviço</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#64748B", cursor:"pointer" }}><X size={18}/></button>
        </div>

        {done ? (
          <div style={{ padding:40, display:"flex", flexDirection:"column", alignItems:"center", gap:14, textAlign:"center" }}>
            <CheckCircle size={40} style={{ color:"#1D9E75" }}/>
            <p style={{ fontSize:16, fontWeight:700, color:"#0F172A", margin:0 }}>Pedido enviado!</p>
            <p style={{ fontSize:13, color:"#64748B", lineHeight:1.6, margin:0 }}>
              A empresa <b style={{ color:"#334155" }}>{company.name}</b> irá receber o teu pedido.
            </p>
            <button onClick={onClose} style={{ padding:"10px 24px", borderRadius:10, background:"linear-gradient(135deg,#1D9E75,#159163)", color:"white", border:"none", fontSize:13, fontWeight:700, cursor:"pointer" }}>Fechar</button>
          </div>
        ) : (
          <>
            <div style={{ padding:"20px 22px", display:"flex", flexDirection:"column", gap:14, overflowY:"auto", flex:1 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:"#64748B", display:"block", marginBottom:6 }}>Título do serviço *</label>
                <input style={inputStyle} placeholder={`Ex: Instalação de ${company.mainCategory}`} value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:"#64748B", display:"block", marginBottom:6 }}>Descrição (opcional)</label>
                <textarea style={{ ...inputStyle, resize:"none", height:80 } as any} placeholder="Mais detalhes sobre o que precisas..." value={desc} onChange={e => setDesc(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:"#64748B", display:"block", marginBottom:6 }}>Local do serviço *</label>
                <input style={inputStyle} placeholder="Endereço" value={address} onChange={e => setAddress(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:"#64748B", display:"block", marginBottom:6 }}>Orçamento (Kz) *</label>
                <input type="number" style={inputStyle} placeholder="Ex: 25000" value={budget} onChange={e => setBudget(e.target.value)} />
              </div>
            </div>
            <div style={{ padding:"16px 22px", borderTop:"1px solid #E2E8F0" }}>
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
        <p style={{ fontSize:13, color:"#64748B", margin:0 }}>Esta empresa pode não existir ou não estar verificada.</p>
        <button onClick={() => router.push("/search")} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px", borderRadius:10, background:"#E2E8F0", border:"1px solid #cbd5e1", color:"#334155", cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>
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
        .cpub-wrap{display:flex;min-height:100vh;background:#FFFFFF}
        .cpub-main{flex:1;margin-left:240px;display:flex;flex-direction:column}
        .cpub-inner{flex:1;padding:28px 32px;display:flex;flex-direction:column;gap:20px;max-width:820px}
        .cpub-card{background:#E2E8F0;border:1px solid #cbd5e1;border-radius:18px;padding:24px;box-shadow:0 1px 4px rgba(15,23,42,0.05)}
        .sec-title{font-size:15px;font-weight:700;color:#0F172A;margin-bottom:14px;margin-top:0;display:flex;align-items:center;gap:8px}
        .badge-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:10px;background:#FFFFFF;border:1px solid #cbd5e1;color:#334155;font-size:13px}
        .hours-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
        .hour-row{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:9px;font-size:12px}
        .cov-pills{display:flex;flex-wrap:wrap;gap:8px}
        .cov-pill{padding:5px 12px;border-radius:99px;background:#FEF3C7;border:1px solid #FDE68A;color:#B45309;font-size:12px;font-weight:600}
        .btn-green{display:flex;align-items:center;gap:8px;padding:13px 24px;border-radius:12px;border:none;background:linear-gradient(135deg,#1D9E75,#159163);color:white;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;box-shadow:0 4px 14px rgba(29,158,117,0.3);transition:all 0.2s}
        .btn-green:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(29,158,117,0.45)}
        .btn-chat{display:flex;align-items:center;gap:8px;padding:13px 20px;border-radius:12px;border:1px solid #99E0D6;background:#E6F7F4;color:#0D9488;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;transition:all 0.2s}
        .btn-chat:hover:not(:disabled){background:#0D9488;color:white}
        .btn-chat:disabled{opacity:0.6;cursor:not-allowed}
        .btn-back{display:flex;align-items:center;gap:8px;background:none;border:none;color:#64748B;cursor:pointer;fontSize:13;font-family:inherit;width:fit-content;padding:4px 0;transition:color 0.15s}
        .btn-back:hover{color:#0F172A}
        @media(max-width:1024px){.cpub-main{margin-left:0}.cpub-inner{padding:80px 20px 24px}}
        @media(max-width:768px){.cpub-inner{padding:72px 16px 24px}.hours-grid{grid-template-columns:1fr}}
        @media(max-width:480px){.cpub-inner{padding:68px 12px 20px}}
      `}</style>

      <div className="cpub-wrap">
        <Sidebar/>
        <div className="cpub-main">
          <Navbar/>
          <div className="cpub-inner">

            {/* ── Voltar ── */}
            <button className="btn-back" onClick={() => router.push("/search")}>
              <ArrowLeft size={15}/> Voltar à pesquisa
            </button>

            {/* ── Header da empresa ── */}
            <div className="cpub-card">
              {/* Banner */}
              <div style={{
                height:100, borderRadius:"12px 12px 0 0",
                background: company.bannerUrl
                  ? `url(${company.bannerUrl}) center/cover`
                  : "linear-gradient(135deg,#1D9E7515,#0D948815)",
                marginLeft:-24, marginRight:-24, marginTop:-24, position:"relative",
              }}>
                <div style={{
                  position:"absolute", bottom:-32, left:20,
                  width:68, height:68, borderRadius:14,
                  background:"#FFFFFF", border:"3px solid #E2E8F0",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  overflow:"hidden", boxShadow:"0 4px 16px rgba(15,23,42,0.14)",
                }}>
                  {company.logoUrl
                    ? <img src={company.logoUrl} alt={company.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                    : <Building2 size={26} style={{ color:"#0D9488" }}/>
                  }
                </div>
              </div>

              <div style={{ height:40 }}/>

              {/* Nome, badges */}
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:10 }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginBottom:6 }}>
                    <h1 style={{ fontSize:22, fontWeight:800, color:"#0F172A", margin:0 }}>{company.name}</h1>
                    <VerificationBadge status={company.verificationStatus}/>
                    <span style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:99, background:"#EEECFE", color:"#4F46E5", border:"1px solid #D7D5FB" }}>
                      🏢 Empresa
                    </span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
                    <span style={{ fontSize:13, color:"#64748B", display:"flex", alignItems:"center", gap:5 }}>
                      <Briefcase size={13}/>{company.mainCategory}
                    </span>
                    <span style={{ fontSize:13, color:"#64748B", display:"flex", alignItems:"center", gap:5 }}>
                      <Calendar size={13}/>Fundada em {company.foundedYear}
                    </span>
                    {company.province && (
                      <span style={{ fontSize:13, color:"#64748B", display:"flex", alignItems:"center", gap:5 }}>
                        <MapPin size={13}/>{company.province}
                      </span>
                    )}
                    {company.website && (
                      <a href={company.website} target="_blank" rel="noreferrer" style={{ fontSize:13, color:"#0D9488", display:"flex", alignItems:"center", gap:5, textDecoration:"none" }}>
                        <Globe size={13}/>{company.website.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* About */}
              {company.about && (
                <p style={{ fontSize:14, color:"#1e293b", lineHeight:1.7, margin:"12px 0 0" }}>
                  {company.about}
                </p>
              )}

              {/* CTAs */}
              {isLoggedIn && (
                <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:20 }}>
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

            {/* ── Serviços oferecidos ── */}
            {services.length > 0 && (
              <div className="cpub-card">
                <p className="sec-title"><Package size={15} style={{ color:"#7C3AED" }}/> Serviços oferecidos</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {services.map(s => (
                    <span className="badge-pill" key={s.id} style={{ background:"#F5F3FF", borderColor:"#DDD6FE", color:"#7C3AED" }}>
                      <span style={{ width:7, height:7, borderRadius:"50%", background:"#7C3AED", flexShrink:0 }}/>
                      {s.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Horário de funcionamento ── */}
            {workingDays.length > 0 && (
              <div className="cpub-card">
                <p className="sec-title"><Clock size={15} style={{ color:"#0D9488" }}/> Horário de funcionamento</p>
                <div className="hours-grid">
                  {workingDays.map((h: any) => (
                    <div className="hour-row" key={h.day}>
                      <span style={{ color:"#334155", fontWeight:600 }}>{h.day}</span>
                      <span style={{ color:"#64748B" }}>{h.from} – {h.to}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Área de cobertura ── */}
            {(company.coverageProvinces ?? []).length > 0 && (
              <div className="cpub-card">
                <p className="sec-title"><MapPin size={15} style={{ color:"#B45309" }}/> Área de cobertura</p>
                <div className="cov-pills">
                  {(company.coverageProvinces ?? []).map((p: string) => (
                    <span className="cov-pill" key={p}>{p}</span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Redes sociais ── */}
            {hasSocial && (
              <div className="cpub-card">
                <p className="sec-title"><Globe size={15} style={{ color:"#0D9488" }}/> Contactos e redes sociais</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
                  {company.socialLinks?.whatsapp && (
                    <a href={`https://wa.me/${company.socialLinks.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 14px", borderRadius:10, background:"#E6F7F4", border:"1px solid #99E0D6", color:"#0D9488", textDecoration:"none", fontSize:13, fontWeight:600 }}>
                      <MessageCircle size={14}/> WhatsApp
                    </a>
                  )}
                  {company.socialLinks?.facebook && (
                    <a href={company.socialLinks.facebook} target="_blank" rel="noreferrer"
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 14px", borderRadius:10, background:"#EFF6FF", border:"1px solid #BFDBFE", color:"#2563EB", textDecoration:"none", fontSize:13, fontWeight:600 }}>
                      Facebook
                    </a>
                  )}
                  {company.socialLinks?.instagram && (
                    <a href={company.socialLinks.instagram} target="_blank" rel="noreferrer"
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 14px", borderRadius:10, background:"#FCE7F3", border:"1px solid #FBCFE8", color:"#DB2777", textDecoration:"none", fontSize:13, fontWeight:600 }}>
                      Instagram
                    </a>
                  )}
                  {company.socialLinks?.linkedin && (
                    <a href={company.socialLinks.linkedin} target="_blank" rel="noreferrer"
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 14px", borderRadius:10, background:"#EFF6FF", border:"1px solid #BFDBFE", color:"#2563EB", textDecoration:"none", fontSize:13, fontWeight:600 }}>
                      LinkedIn
                    </a>
                  )}
                  {company.socialLinks?.website && (
                    <a href={company.socialLinks.website} target="_blank" rel="noreferrer"
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 14px", borderRadius:10, background:"#F5F3FF", border:"1px solid #DDD6FE", color:"#7C3AED", textDecoration:"none", fontSize:13, fontWeight:600 }}>
                      <Globe size={14}/> Website
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* ── CTA final ── */}
            {isLoggedIn && (
              <div className="cpub-card" style={{ background:"linear-gradient(135deg,#1D9E7510,#0D948810)", borderColor:"#1D9E7530" }}>
                <p style={{ fontSize:15, fontWeight:700, color:"#0F172A", margin:"0 0 6px" }}>
                  Precisas dos serviços de <span style={{ color:"#1D9E75" }}>{company.name}</span>?
                </p>
                <p style={{ fontSize:13, color:"#334155", lineHeight:1.6, margin:"0 0 16px" }}>
                  Envia um pedido directamente ou fala com a empresa pelo chat. Resposta garantida.
                </p>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  <button className="btn-green" onClick={() => setRequestOpen(true)}>
                    <CheckCircle size={15}/> Solicitar serviço
                  </button>
                  <button className="btn-chat" disabled={chatLoading} onClick={handleChat}>
                    {chatLoading ? <Loader2 size={15} style={{ animation:"spin 1s linear infinite" }}/> : <MessageCircle size={15}/>}
                    {chatLoading ? "A abrir..." : "Conversar"}
                  </button>
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