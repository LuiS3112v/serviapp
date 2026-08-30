"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAdminStats } from "@/hooks/useAdminStats";
import { AdminKyc } from "@/lib/api/admin";
import {
  Users, Briefcase, Wallet, Shield, TrendingUp,
  AlertCircle, RefreshCw, Check, X, Building2, ArrowRight,
  User, Phone, FileText, Camera, ZoomIn,
} from "lucide-react";

function formatKz(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M Kz`;
  if (value >= 1_000)     return `${(value / 1_000).toFixed(0)}K Kz`;
  return new Intl.NumberFormat("pt-PT").format(value) + " Kz";
}

function SkeletonCard() {
  return (
    <div style={{ background:"#131b27", border:"1px solid #1a2535", borderRadius:16, padding:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
        <div style={{ width:80, height:14, borderRadius:6, background:"#1a2535" }}/>
        <div style={{ width:36, height:36, borderRadius:10, background:"#1a2535" }}/>
      </div>
      <div style={{ width:60, height:28, borderRadius:8, background:"#1a2535" }}/>
    </div>
  );
}

// NOVO — descrição do documento em ecrã cheio (lightbox). Guarda só a
// URL e a legenda a mostrar; não introduz nenhum estado novo de
// aprovação/recusa, é puramente de visualização.
interface LightboxImage {
  url: string;
  label: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { stats, recentUsers, pendingKyc, loading, error, refresh, approveKyc, rejectKyc } = useAdminStats();

  // NOVO — modal de detalhe do pedido de KYC individual. Não altera
  // nenhuma lógica de aprovação/recusa, só dá espaço para mostrar
  // foto de perfil + telefone + os 3 documentos (frente do BI, verso
  // do BI, selfie) sem sobrecarregar a lista principal.
  const [detailKyc, setDetailKyc] = useState<AdminKyc | null>(null);

  // NOVO — lightbox de imagem em ecrã cheio. Aberto a partir de
  // qualquer documento dentro do modal de detalhe (clique na miniatura
  // ou no ícone de zoom). Fica por cima do modal (z-index maior),
  // fecha com X, clique fora, ou Esc.
  const [lightbox, setLightbox] = useState<LightboxImage | null>(null);

  useEffect(() => {
    if (!authLoading && user?.role !== "admin") router.replace("/");
  }, [user, authLoading, router]);

  // NOVO — fecha o lightbox com Esc, sem interferir com outros
  // atalhos de teclado da página.
  useEffect(() => {
    if (!lightbox) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightbox]);

  if (authLoading || (!authLoading && user?.role !== "admin")) return null;

  const statCards = [
    { label:"Utilizadores",    value: stats ? String(stats.totalUsers)             : null, icon:Users,    color:"#1D9E75", bg:"#1d9e7520" },
    { label:"Serviços activos", value: stats ? String(stats.activeServices)         : null, icon:Briefcase,color:"#378ADD", bg:"#378ADD20" },
    { label:"Volume total",     value: stats ? formatKz(stats.totalVolume)          : null, icon:Wallet,   color:"#EF9F27", bg:"#EF9F2720" },
    { label:"Pendentes KYC",    value: stats ? String(stats.pendingKyc)             : null, icon:Shield,   color:"#D4537E", bg:"#D4537E20" },
  ];

  return (
    <>
      <style>{`
        .adm-wrap{display:flex;min-height:100vh;background:#0d1117}
        .adm-main{flex:1;display:flex;flex-direction:column}
        .adm-inner{flex:1;padding:28px 32px;display:flex;flex-direction:column;gap:24px}
        .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
        .stat-card{background:#131b27;border:1px solid #1a2535;border-radius:16px;padding:20px}
        .adm-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
        .adm-card{background:#131b27;border:1px solid #1a2535;border-radius:16px;padding:20px}
        .user-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #1a2535}
        .user-row:last-child{border-bottom:none}
        .kyc-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #1a2535;cursor:pointer;transition:background .15s;border-radius:8px}
        .kyc-row:hover{background:#0f1620}
        .kyc-row:last-child{border-bottom:none}
        .kyc-btn{border:none;cursor:pointer;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .empty-list{display:flex;flex-direction:column;align-items:center;padding:32px;gap:8px;text-align:center}
        .role-badge{padding:3px 8px;border-radius:6px;font-size:11px;font-weight:600}
        .type-badge{padding:2px 7px;border-radius:5px;font-size:10px;font-weight:700;flex-shrink:0}
        .payments-cta{
          display:flex;align-items:center;justify-content:space-between;gap:16px;
          background:linear-gradient(135deg,#378ADD15,#378ADD05);border:1px solid #378ADD30;
          border-radius:16px;padding:20px 24px;flex-wrap:wrap;
        }
        .payments-cta-btn{
          display:flex;align-items:center;gap:8px;padding:12px 22px;border-radius:12px;
          border:none;background:linear-gradient(135deg,#378ADD,#2668b0);color:white;
          font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;
          box-shadow:0 4px 14px rgba(55,138,221,0.3);transition:all 0.2s;
        }
        .payments-cta-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(55,138,221,0.45)}
        .kyc-avatar{width:36px;height:36px;border-radius:50%;flex-shrink:0;object-fit:cover}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px}
        .modal-card{background:#131b27;border:1px solid #1a2535;border-radius:20px;padding:28px;width:100%;max-width:520px;max-height:88vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.5)}
        .modal-doc-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px}
        .modal-doc{border:1px solid #1a2535;border-radius:12px;overflow:hidden;background:#0d1117;cursor:zoom-in;position:relative}
        .modal-doc img{width:100%;height:120px;object-fit:cover;display:block;transition:transform .2s}
        .modal-doc:hover img{transform:scale(1.03)}
        .modal-doc-label{display:flex;align-items:center;gap:6px;padding:8px 10px;font-size:11px;color:#8a9ab0;font-weight:600}
        .modal-doc-zoom{
          position:absolute;top:8px;right:8px;width:26px;height:26px;border-radius:7px;
          background:rgba(13,17,23,0.75);backdrop-filter:blur(3px);
          display:flex;align-items:center;justify-content:center;
          opacity:0;transition:opacity .15s;pointer-events:none;
        }
        .modal-doc:hover .modal-doc-zoom{opacity:1}
        .modal-info-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #1a2535}
        .modal-info-row:last-child{border-bottom:none}
        .modal-actions{display:flex;gap:10px;margin-top:20px}
        .modal-btn{flex:1;padding:12px;border-radius:12px;border:none;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:opacity .15s}
        .modal-btn:hover{opacity:.88}

        /* ── NOVO: Lightbox de imagem em ecrã cheio ── */
        .lightbox-overlay{
          position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:200;
          display:flex;align-items:center;justify-content:center;padding:32px;
          cursor:zoom-out;
        }
        .lightbox-img{
          max-width:min(92vw,1100px);max-height:86vh;object-fit:contain;
          border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,0.6);
          cursor:default;
        }
        .lightbox-close{
          position:fixed;top:20px;right:24px;width:42px;height:42px;border-radius:10px;
          background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);
          display:flex;align-items:center;justify-content:center;cursor:pointer;
          transition:background .15s;
        }
        .lightbox-close:hover{background:rgba(255,255,255,0.16)}
        .lightbox-label{
          position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
          background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);
          border-radius:99px;padding:8px 18px;display:flex;align-items:center;gap:8px;
          font-size:12.5px;color:#e2e8f0;font-weight:600;backdrop-filter:blur(4px);
        }

        @media(max-width:1024px){.adm-main{}.stats-grid{grid-template-columns:repeat(2,1fr)}.adm-grid{grid-template-columns:1fr}}
        @media(max-width:640px){.adm-inner{padding:16px}.stats-grid{grid-template-columns:1fr 1fr}.payments-cta{flex-direction:column;align-items:flex-start}.modal-doc-grid{grid-template-columns:1fr}}
        @media(max-width:640px){.lightbox-overlay{padding:16px}.lightbox-close{top:14px;right:14px}}
      `}</style>

      <div className="adm-wrap">
        <div className="adm-main">
          <div className="adm-inner">

            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
              <div>
                <h1 style={{ fontSize:22, fontWeight:700, color:"#e2e8f0", marginBottom:4 }}>Painel de administração</h1>
                <p style={{ fontSize:13, color:"#4a6a6a" }}>Visão geral da plataforma Serviapp</p>
              </div>
              <button onClick={refresh} style={{ display:"flex", alignItems:"center", gap:8, background:"#131b27", border:"1px solid #1a2535", borderRadius:10, padding:"8px 16px", cursor:"pointer", color:"#8a9ab0", fontSize:13 }}>
                <RefreshCw size={14}/> Atualizar
              </button>
            </div>

            {/* ── CTA: Ir para Pagamentos ── */}
            <div className="payments-cta">
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:"#378ADD20",
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Wallet size={20} style={{ color:"#378ADD" }} />
                </div>
                <div>
                  <p style={{ fontSize:15, fontWeight:700, color:"#e2e8f0", marginBottom:2 }}>Gestão de pagamentos</p>
                  <p style={{ fontSize:12, color:"#6a7a8a" }}>Comprovativos pendentes, pagamentos protegidos e transferências a prestadores</p>
                </div>
              </div>
              <button className="payments-cta-btn" onClick={() => router.push("/admin/payments")}>
                Ver pagamentos <ArrowRight size={15} />
              </button>
            </div>

            {error && (
              <div style={{ background:"#2a0e0e", border:"1px solid #E24B4A40", borderRadius:12, padding:"12px 16px", fontSize:13, color:"#E24B4A" }}>
                {error}
              </div>
            )}

            {/* Stats */}
            <div className="stats-grid">
              {loading ? [0,1,2,3].map(i => <SkeletonCard key={i}/>) : (
                statCards.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div className="stat-card" key={i}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                        <p style={{ fontSize:13, color:"#4a6a6a" }}>{s.label}</p>
                        <div style={{ width:36, height:36, borderRadius:10, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <Icon size={16} style={{ color:s.color }}/>
                        </div>
                      </div>
                      <p style={{ fontSize:26, fontWeight:700, color:s.color }}>{s.value ?? "—"}</p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="adm-grid">

              {/* Últimos registos */}
              <div className="adm-card">
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                  <TrendingUp size={16} style={{ color:"#1D9E75" }}/>
                  <h2 style={{ fontSize:15, fontWeight:700, color:"#c0d0e0" }}>Últimos registos</h2>
                </div>
                {loading ? [0,1,2].map(i => (
                  <div key={i} style={{ display:"flex", gap:12, padding:"12px 0", borderBottom:"1px solid #1a2535" }}>
                    <div style={{ width:36, height:36, borderRadius:"50%", background:"#1a2535", flexShrink:0 }}/>
                    <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
                      <div style={{ width:"60%", height:12, borderRadius:6, background:"#1a2535" }}/>
                      <div style={{ width:"40%", height:10, borderRadius:6, background:"#1a2535" }}/>
                    </div>
                  </div>
                )) : recentUsers.length === 0 ? (
                  <div className="empty-list">
                    <Users size={28} style={{ color:"#2a3a4a" }}/>
                    <p style={{ fontSize:14, fontWeight:600, color:"#c0d0e0" }}>Sem registos ainda</p>
                    <p style={{ fontSize:12, color:"#4a6a6a" }}>Os novos utilizadores vão aparecer aqui.</p>
                  </div>
                ) : (
                  recentUsers.map(u => {
                    const roleColor = u.role === "admin" ? "#D4537E" : (u.role === "provider" || u.role === "company") ? "#EF9F27" : "#1D9E75";
                    const roleBg    = u.role === "admin" ? "#D4537E20" : (u.role === "provider" || u.role === "company") ? "#EF9F2720" : "#1d9e7520";
                    return (
                      <div className="user-row" key={u.id}>
                        <div style={{ width:36, height:36, borderRadius:"50%", background:"#1a2535", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#8a9ab0", flexShrink:0 }}>
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontSize:13, fontWeight:600, color:"#c0d0e0", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{u.fullName}</p>
                          <p style={{ fontSize:11, color:"#4a5a6a" }}>{new Date(u.createdAt).toLocaleDateString("pt-PT")}</p>
                        </div>
                        <span className="role-badge" style={{ color:roleColor, background:roleBg }}>{u.role}</span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* KYC pendentes — individual + empresa juntos */}
              <div className="adm-card">
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                  <AlertCircle size={16} style={{ color:"#EF9F27" }}/>
                  <h2 style={{ fontSize:15, fontWeight:700, color:"#c0d0e0" }}>KYC pendentes</h2>
                </div>
                {loading ? [0,1,2].map(i => (
                  <div key={i} style={{ display:"flex", gap:12, padding:"12px 0", borderBottom:"1px solid #1a2535" }}>
                    <div style={{ width:36, height:36, borderRadius:"50%", background:"#1a2535", flexShrink:0 }}/>
                    <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
                      <div style={{ width:"60%", height:12, borderRadius:6, background:"#1a2535" }}/>
                      <div style={{ width:"40%", height:10, borderRadius:6, background:"#1a2535" }}/>
                    </div>
                  </div>
                )) : pendingKyc.length === 0 ? (
                  <div className="empty-list">
                    <Shield size={28} style={{ color:"#2a3a4a" }}/>
                    <p style={{ fontSize:14, fontWeight:600, color:"#c0d0e0" }}>Sem verificações pendentes</p>
                    <p style={{ fontSize:12, color:"#4a6a6a" }}>Pedidos de KYC vão aparecer aqui.</p>
                  </div>
                ) : (
                  pendingKyc.map((k: AdminKyc) => (
                    <div
                      className="kyc-row"
                      key={k.id}
                      onClick={() => k.type === "individual" && setDetailKyc(k)}
                      style={{ cursor: k.type === "individual" ? "pointer" : "default" }}
                    >
                      {/* foto de perfil real quando disponível (individual);
                          mantém o ícone/inicial como fallback, exactamente como antes */}
                      {k.type === "individual" && k.avatarUrl ? (
                        <img src={k.avatarUrl} alt={k.userName} className="kyc-avatar" />
                      ) : (
                        <div style={{
                          width:36, height:36, borderRadius:"50%", flexShrink:0,
                          background: k.type === "company" ? "#071830" : "#2a1e08",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:13, fontWeight:700,
                          color: k.type === "company" ? "#378ADD" : "#EF9F27",
                        }}>
                          {k.type === "company"
                            ? <Building2 size={16} style={{ color:"#378ADD" }}/>
                            : k.userName.charAt(0).toUpperCase()
                          }
                        </div>
                      )}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                          <p style={{ fontSize:13, fontWeight:600, color:"#c0d0e0", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", margin:0 }}>{k.userName}</p>
                          <span
                            className="type-badge"
                            style={{
                              color:      k.type === "company" ? "#378ADD" : "#EF9F27",
                              background: k.type === "company" ? "#378ADD18" : "#EF9F2718",
                              border:     `1px solid ${k.type === "company" ? "#378ADD40" : "#EF9F2740"}`,
                            }}
                          >
                            {k.type === "company" ? "🏢 Empresa" : "👤 Individual"}
                          </span>
                        </div>
                        <p style={{ fontSize:11, color:"#4a5a6a", margin:0 }}>
                          {k.type === "individual" && k.phoneNumber ? `${k.phoneNumber} · ` : ""}{k.documentStatus}
                        </p>
                      </div>
                      <button
                        className="kyc-btn"
                        style={{ background:"#1d9e7520" }}
                        onClick={(e) => { e.stopPropagation(); approveKyc(k); }}
                        title="Aprovar"
                      >
                        <Check size={14} style={{ color:"#1D9E75" }}/>
                      </button>
                      <button
                        className="kyc-btn"
                        style={{ background:"#E24B4A20" }}
                        onClick={(e) => { e.stopPropagation(); rejectKyc(k); }}
                        title="Rejeitar"
                      >
                        <X size={14} style={{ color:"#E24B4A" }}/>
                      </button>
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Modal de detalhe do pedido KYC individual ──
          Mostra nome, telefone, foto de perfil, e os 3 documentos
          (frente do BI, verso do BI, selfie). Os botões Aceitar/Recusar
          aqui chamam exactamente as mesmas funções approveKyc/rejectKyc
          já existentes no hook — nenhuma lógica nova de aprovação foi
          criada.

          ALTERADO — cada documento agora abre o lightbox ao ser
          clicado (setLightbox), em vez de ser só uma miniatura fixa.
          Um ícone de zoom aparece no hover para deixar claro que é
          clicável. Nenhuma outra parte do modal foi alterada. */}
      {detailKyc && (
        <div className="modal-overlay" onClick={() => setDetailKyc(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                {detailKyc.avatarUrl ? (
                  <img src={detailKyc.avatarUrl} alt={detailKyc.userName} style={{ width:52, height:52, borderRadius:"50%", objectFit:"cover" }} />
                ) : (
                  <div style={{ width:52, height:52, borderRadius:"50%", background:"#2a1e08", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <User size={22} style={{ color:"#EF9F27" }} />
                  </div>
                )}
                <div>
                  <p style={{ fontSize:16, fontWeight:700, color:"#e2e8f0", marginBottom:2 }}>{detailKyc.userName}</p>
                  <span className="type-badge" style={{ color:"#EF9F27", background:"#EF9F2718", border:"1px solid #EF9F2740" }}>
                    👤 Individual
                  </span>
                </div>
              </div>
              <button onClick={() => setDetailKyc(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"#6a7a8a" }}>
                <X size={20} />
              </button>
            </div>

            {detailKyc.phoneNumber && (
              <div className="modal-info-row">
                <Phone size={15} style={{ color:"#8a9ab0" }} />
                <span style={{ fontSize:13, color:"#c0d0e0" }}>{detailKyc.phoneNumber}</span>
              </div>
            )}

            <p style={{ fontSize:12, fontWeight:700, color:"#6a7a8a", textTransform:"uppercase", letterSpacing:"0.06em", marginTop:16, marginBottom:4 }}>
              Documentos enviados
            </p>
            <p style={{ fontSize:11, color:"#4a5a6a", marginTop:0, marginBottom:4 }}>
              Clica numa imagem para ver em tamanho maior
            </p>
            <div className="modal-doc-grid">
              {detailKyc.frontBiUrl && (
                <div
                  className="modal-doc"
                  onClick={() => setLightbox({ url: detailKyc.frontBiUrl!, label: "Frente do BI" })}
                >
                  <img src={detailKyc.frontBiUrl} alt="Frente do BI" />
                  <div className="modal-doc-zoom"><ZoomIn size={13} style={{ color:"#e2e8f0" }} /></div>
                  <div className="modal-doc-label"><FileText size={12} /> Frente do BI</div>
                </div>
              )}
              {detailKyc.backBiUrl && (
                <div
                  className="modal-doc"
                  onClick={() => setLightbox({ url: detailKyc.backBiUrl!, label: "Verso do BI" })}
                >
                  <img src={detailKyc.backBiUrl} alt="Verso do BI" />
                  <div className="modal-doc-zoom"><ZoomIn size={13} style={{ color:"#e2e8f0" }} /></div>
                  <div className="modal-doc-label"><FileText size={12} /> Verso do BI</div>
                </div>
              )}
              {detailKyc.selfieUrl && (
                <div
                  className="modal-doc"
                  style={{ gridColumn: "1 / -1" }}
                  onClick={() => setLightbox({ url: detailKyc.selfieUrl!, label: "Selfie com o BI" })}
                >
                  <img src={detailKyc.selfieUrl} alt="Selfie com o BI" />
                  <div className="modal-doc-zoom"><ZoomIn size={13} style={{ color:"#e2e8f0" }} /></div>
                  <div className="modal-doc-label"><Camera size={12} /> Selfie com o BI</div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                className="modal-btn"
                style={{ background:"#1D9E75", color:"#fff" }}
                onClick={() => { approveKyc(detailKyc); setDetailKyc(null); }}
              >
                <Check size={15} /> Aceitar
              </button>
              <button
                className="modal-btn"
                style={{ background:"#E24B4A", color:"#fff" }}
                onClick={() => { rejectKyc(detailKyc); setDetailKyc(null); }}
              >
                <X size={15} /> Recusar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── NOVO: Lightbox — imagem do documento em ecrã cheio ──
          Fica por cima do modal de detalhe (z-index 200 > 100), para o
          admin poder inspecionar o documento sem perder o contexto do
          pedido por baixo. Fecha ao clicar fora da imagem, no X, ou
          com Esc (ver useEffect acima). Clicar na própria imagem não
          fecha (stopPropagation), só a área à volta. */}
      {lightbox && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <button
            className="lightbox-close"
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            title="Fechar"
          >
            <X size={20} style={{ color:"#e2e8f0" }} />
          </button>
          <img
            src={lightbox.url}
            alt={lightbox.label}
            className="lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="lightbox-label">
            <FileText size={13} /> {lightbox.label}
          </div>
        </div>
      )}
    </>
  );
}