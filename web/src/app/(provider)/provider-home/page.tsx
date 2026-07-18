"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Briefcase, Wallet, Star, Clock, ArrowRight, ChevronDown,
  Shield, Zap, Users, TrendingUp, CheckCircle, AlertCircle, Loader2,
  Handshake, KeyRound, ImagePlus, MapPin,
} from "lucide-react";
import { servicesApi, ProviderStats } from "@/lib/services.api";
import { chatApi } from "@/lib/chat.api";
import { getSession } from "@/lib/auth.api";
import { kycApi } from "@/lib/api/kyc.api";

// ── Static data ─────────────────────────────────────────────────────────────
// 3 sempre visíveis (mantidos tal como estavam) + 5 atrás de "Ver todos"
// (8 no total). `action`/`href` só existem nos passos com CTA própria —
// os restantes são apenas informativos.
const STEPS = [
  { Icon: CheckCircle, color:"#1D9E75", bg:"#0b2a20", title:"Completa o KYC",          desc:"Verifica a tua identidade para activar o perfil e receber pedidos.", action:"Verificar agora", href:"/kyc?role=provider"    },
  { Icon: ImagePlus,   color:"#EF9F27", bg:"#271a05", title:"Cria o teu portfólio",     desc:"Adiciona fotos e descrição dos serviços que ofereces.",               action:"Editar perfil",   href:"/provider/profile"     },
  { Icon: Zap,         color:"#378ADD", bg:"#071830", title:"Recebe o primeiro pedido", desc:"Quando o perfil estiver activo, os clientes vão encontrar-te.",        action:"Ver pedidos",     href:"/provider/services"    },
  { Icon: MapPin,      color:"#1D9E75", bg:"#0b2a20", title:"Activa a tua localização", desc:"Liga a partilha de localização no teu painel para apareceres no mapa e receberes pedidos perto de ti." },
  { Icon: Handshake,   color:"#8B5CF6", bg:"#1a1030", title:"Aceita e negoceia",        desc:"Analisa o pedido, propõe um preço se quiseres, e aceita para começar." },
  { Icon: KeyRound,    color:"#EF9F27", bg:"#271a05", title:"Valida o PIN no local",    desc:"O cliente dá-te um código quando chegares — introduz para iniciares o serviço com segurança." },
  { Icon: Wallet,      color:"#1D9E75", bg:"#0b2a20", title:"Recebe o pagamento protegido", desc:"O valor fica reservado desde o início; depois de confirmado, a comissão é descontada automaticamente e transferido para ti." },
  { Icon: TrendingUp,  color:"#D4537E", bg:"#2a0f1a", title:"Constrói a tua reputação", desc:"Cada serviço concluído soma avaliações e aumenta a tua visibilidade nas pesquisas." },
];

const FEATS = [
  { Icon: Wallet,     color:"#1D9E75", title:"Wallet integrada",    desc:"Recebe pagamentos directamente na tua wallet. Levanta quando quiseres."        },
  { Icon: Shield,     color:"#378ADD", title:"Pagamento garantido",  desc:"O escrow protege-te — o valor é retido até confirmares a conclusão."           },
  { Icon: Users,      color:"#EF9F27", title:"Gestão de equipa",     desc:"Tens uma empresa? Adiciona funcionários e distribui os serviços."               },
  { Icon: TrendingUp, color:"#D4537E", title:"Sistema de ranking",   desc:"Quanto mais serviços via app, maior a tua visibilidade e ranking."              },
];

const HERO_PROV = "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=900&auto=format&fit=crop";

// ── Component ────────────────────────────────────────────────────────────────
export default function ProviderHomePage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  useEffect(() => { setUser(getSession()); }, []);

  const [stats, setStats]               = useState<ProviderStats | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  const [kycStatus, setKycStatus] = useState<string | null>(null);

  const [showAllSteps, setShowAllSteps] = useState(false);
  const visibleSteps = showAllSteps ? STEPS : STEPS.slice(0, 3);

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        const [providerStats, chatUnread, kyc] = await Promise.allSettled([
          servicesApi.getProviderStats(),
          chatApi.getUnread(),
          kycApi.getMyStatus(),
        ]);
        if (cancelled) return;
        if (providerStats.status === "fulfilled") setStats(providerStats.value);
        if (chatUnread.status  === "fulfilled") setUnreadMessages(chatUnread.value.count);
        if (kyc.status === "fulfilled") setKycStatus(kyc.value?.status ?? null);
      } finally {
        if (!cancelled) setLoadingStats(false);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const heroStats = [
    { value: loadingStats ? "…" : stats ? String(stats.totalOrders) : "0",                                          label:"Pedidos",   color:"#EF9F27" },
    { value: loadingStats ? "…" : stats ? `${stats.totalEarnings.toLocaleString("pt-PT")} Kz` : "0 Kz",            label:"Ganhos",    color:"#1D9E75" },
    { value: loadingStats ? "…" : stats?.averageRating != null ? stats.averageRating.toFixed(1) : "—",             label:"Avaliação", color:"#378ADD" },
  ];

  const dashStats = [
    {
      label:"Pedidos recebidos",
      value: loadingStats ? "…" : stats ? String(stats.totalOrders) : "0",
      sub: stats && stats.totalOrders > 0 ? `${stats.activeOrders} activo${stats.activeOrders !== 1 ? "s" : ""}` : "Nenhum ainda",
      color:"#EF9F27", Icon:Briefcase, href:"/provider/services",
    },
    {
      label:"Ganhos totais",
      value: loadingStats ? "…" : stats ? `${stats.totalEarnings.toLocaleString("pt-PT")} Kz` : "0 Kz",
      sub:"Serviços concluídos",
      color:"#1D9E75", Icon:Wallet, href:"/provider/wallet",
    },
    {
      label:"Avaliação média",
      value: loadingStats ? "…" : stats?.averageRating != null ? `${stats.averageRating.toFixed(1)} ★` : "—",
      sub: stats?.averageRating != null ? "Baseado em reviews" : "Sem avaliações",
      color:"#378ADD", Icon:Star, href:"/provider/reviews",
    },
    {
      label:"Mensagens",
      value: loadingStats ? "…" : String(unreadMessages),
      sub: unreadMessages > 0 ? `${unreadMessages} não lida${unreadMessages !== 1 ? "s" : ""}` : "Sem mensagens novas",
      color:"#D4537E", Icon:Clock, href:"/provider/chat",
    },
  ];

  const isVerified = kycStatus === "approved";

  return (
    <>
      <style>{`
        @keyframes hdot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.8)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .ph{padding:32px;display:flex;flex-direction:column;gap:26px;min-width:0}

        /* ── Hero ── */
        .ph-hero{
          position:relative;border-radius:24px;overflow:hidden;
          min-height:420px;display:flex;align-items:stretch;
          background:linear-gradient(135deg,#130f02 0%,#1c1405 100%);
          border:1px solid rgba(239,159,39,0.16);
        }
        .ph-hero-img{
          position:absolute;top:0;right:0;width:52%;height:100%;
          object-fit:cover;object-position:center;
        }
        .ph-hero-ov{
          position:absolute;inset:0;
          background:linear-gradient(to right,#130f02 38%,rgba(19,15,2,0.92) 55%,rgba(19,15,2,0.12) 100%);
        }
        .ph-hero-body{
          position:relative;z-index:2;
          padding:52px 56px;
          display:flex;flex-direction:column;justify-content:center;
          max-width:580px;
        }
        .ph-badge{
          display:inline-flex;align-items:center;gap:8px;
          padding:6px 14px;border-radius:99px;
          background:rgba(239,159,39,0.1);border:1px solid rgba(239,159,39,0.26);
          margin-bottom:24px;width:fit-content;
        }
        .ph-dot{
          width:7px;height:7px;border-radius:50%;background:#EF9F27;
          box-shadow:0 0 8px #EF9F27;animation:hdot 2.2s ease-in-out infinite;
        }
        .ph-title{
          font-size:42px;font-weight:800;color:#f1f5f9;
          line-height:1.08;margin-bottom:18px;letter-spacing:-0.02em;
        }
        .ph-title-g{
          background:linear-gradient(135deg,#EF9F27 0%,#fbbf24 100%);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
        }
        .ph-sub{font-size:16px;color:rgba(148,130,90,0.88);line-height:1.7;margin-bottom:32px;max-width:420px}
        .ph-btns{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
        .btn-ph-primary{
          display:inline-flex;align-items:center;gap:8px;
          padding:14px 26px;border-radius:12px;border:none;
          background:linear-gradient(135deg,#EF9F27,#d4870a);
          color:#0d1117;font-size:15px;font-weight:700;
          cursor:pointer;font-family:inherit;white-space:nowrap;
          box-shadow:0 4px 20px rgba(239,159,39,0.35);transition:all 0.2s;
        }
        .btn-ph-primary:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(239,159,39,0.52)}
        .btn-ph-ghost{
          display:inline-flex;align-items:center;gap:8px;
          padding:14px 26px;border-radius:12px;
          background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);
          color:#8a9ab0;font-size:15px;font-weight:500;
          cursor:pointer;font-family:inherit;white-space:nowrap;transition:all 0.2s;
        }
        .btn-ph-ghost:hover{background:rgba(255,255,255,0.1);color:#e2e8f0;border-color:rgba(255,255,255,0.2)}
        .ph-hero-stats{
          position:absolute;bottom:28px;right:28px;
          display:flex;gap:12px;z-index:2;
        }
        .ph-hstat{
          padding:14px 20px;border-radius:16px;
          background:rgba(15,10,2,0.88);backdrop-filter:blur(12px);
          border:1px solid rgba(239,159,39,0.16);
          text-align:center;min-width:88px;
        }

        /* ── KYC Banner ── */
        .kyc{
          border-radius:16px;padding:18px 22px;
          background:linear-gradient(135deg,rgba(239,159,39,0.07),rgba(239,159,39,0.02));
          border:1px solid rgba(239,159,39,0.2);
          display:flex;align-items:center;gap:14px;
        }
        .kyc-ico{
          width:44px;height:44px;border-radius:12px;
          background:rgba(239,159,39,0.12);border:1px solid rgba(239,159,39,0.24);
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
        }
        .btn-kyc{
          padding:10px 18px;border-radius:10px;
          background:linear-gradient(135deg,#EF9F27,#d4870a);
          color:#0d1117;font-size:13px;font-weight:700;
          cursor:pointer;border:none;font-family:inherit;white-space:nowrap;
          box-shadow:0 3px 12px rgba(239,159,39,0.3);
          transition:all 0.2s;margin-left:auto;flex-shrink:0;
        }
        .btn-kyc:hover{transform:translateY(-1px);box-shadow:0 5px 18px rgba(239,159,39,0.48)}

        .kyc.verified{
          background:linear-gradient(135deg,rgba(29,158,117,0.07),rgba(29,158,117,0.02));
          border:1px solid rgba(29,158,117,0.2);
        }
        .kyc-ico.verified{
          background:rgba(29,158,117,0.12);border:1px solid rgba(29,158,117,0.24);
        }

        /* ── Stats grid ── */
        .stats4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
        .sc{
          background:#0f1923;border:1px solid #1a2535;border-radius:16px;
          padding:20px;cursor:pointer;transition:all 0.2s;
        }
        .sc:hover{border-color:rgba(239,159,39,0.28);transform:translateY(-2px);box-shadow:0 4px 18px rgba(0,0,0,0.2)}
        .sc-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
        .sc-ico{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center}

        /* ── Section card ── */
        .psec{background:#0f1923;border:1px solid #1a2535;border-radius:20px;padding:28px}
        .psec-title{font-size:17px;font-weight:700;color:#e2e8f0;margin-bottom:4px}
        .psec-sub{font-size:13px;color:#4a6a6a;margin-bottom:20px}
        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px}

        /* ── Steps ── */
        .pstep{
          display:flex;align-items:flex-start;gap:14px;
          padding:18px;border-radius:14px;
          background:#0d1117;border:1px solid #1a2535;
          margin-bottom:10px;transition:all 0.2s;
        }
        .pstep:last-child{margin-bottom:0}
        .pstep:hover{border-color:rgba(239,159,39,0.22);transform:translateX(4px)}
        .pstep-ico{
          width:44px;height:44px;border-radius:12px;
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
        }
        .btn-step{
          display:inline-flex;align-items:center;gap:4px;
          padding:7px 12px;border-radius:8px;
          background:rgba(239,159,39,0.1);border:1px solid rgba(239,159,39,0.22);
          color:#EF9F27;font-size:12px;font-weight:600;
          cursor:pointer;font-family:inherit;transition:all 0.15s;white-space:nowrap;
        }
        .btn-step:hover{background:rgba(239,159,39,0.2)}
        .psteps-more-wrap{display:flex;justify-content:center;margin-top:6px}
        .btn-psteps-more{
          display:inline-flex;align-items:center;gap:6px;
          padding:9px 18px;border-radius:10px;
          background:rgba(239,159,39,0.08);border:1px solid rgba(239,159,39,0.22);
          color:#EF9F27;font-size:13px;font-weight:600;
          cursor:pointer;font-family:inherit;transition:all 0.16s ease;
        }
        .btn-psteps-more:hover{background:rgba(239,159,39,0.16)}
        .btn-psteps-more svg{transition:transform 0.2s ease}
        .btn-psteps-more.open svg{transform:rotate(180deg)}

        /* ── Feature cards ── */
        .feats2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .pfeat{padding:20px;border-radius:14px;transition:transform 0.2s}
        .pfeat:hover{transform:translateY(-2px)}
        .pfeat-ico{
          width:40px;height:40px;border-radius:11px;
          display:flex;align-items:center;justify-content:center;margin-bottom:12px;
        }

        /* ── Company CTA ── */
        .company-cta{
          margin-top:14px;padding:16px 18px;border-radius:14px;
          background:#0d1117;border:1px solid #1a2535;
          display:flex;align-items:center;justify-content:space-between;gap:16px;
        }
        .btn-company{
          padding:9px 16px;border-radius:9px;
          background:rgba(55,138,221,0.1);border:1px solid rgba(55,138,221,0.22);
          color:#378ADD;font-size:13px;font-weight:600;
          cursor:pointer;font-family:inherit;
          display:flex;align-items:center;gap:4px;
          transition:all 0.15s;white-space:nowrap;flex-shrink:0;
        }
        .btn-company:hover{background:rgba(55,138,221,0.2)}

        /* ── Responsive ── */
        @media(max-width:1024px){
          .ph{padding:28px 20px}
          .ph-hero-img{width:42%}
          .ph-hero-body{padding:36px 36px;max-width:68%}
          .stats4{grid-template-columns:repeat(2,1fr)}
        }
        @media(max-width:768px){
          .ph{padding:72px 16px 24px;gap:20px}
          .ph-title{font-size:30px}
          .ph-hero-body{max-width:100%;padding:28px 24px}
          .ph-hero{flex-direction:column;min-height:auto}
          .ph-hero-img{display:block;position:relative;width:100%;height:220px;object-fit:cover;object-position:center}
          .ph-hero-ov{background:linear-gradient(to bottom,rgba(19,15,2,0.05) 0%,rgba(19,15,2,0.55) 40%,#130f02 65%)}
          .ph-hero-stats{position:static;flex-wrap:wrap;padding:4px 24px 24px;gap:8px}
          .grid2{grid-template-columns:1fr}
          .feats2{grid-template-columns:1fr}
          .kyc{flex-wrap:wrap}
          .btn-kyc{margin-left:0;width:100%;justify-content:center}
          .company-cta{flex-direction:column;text-align:center}
          .btn-company{width:100%;justify-content:center}
        }
        @media(max-width:480px){
          .stats4{grid-template-columns:1fr 1fr}
          .ph{padding:68px 12px 20px}
          .ph-hstat{min-width:72px;padding:12px 14px}
        }
        @media(max-width:360px){
          .stats4{grid-template-columns:1fr}
          .ph-title{font-size:26px}
        }
      `}</style>

      <div className="ph">

        {/* ═══ HERO ═══ */}
        <section className="ph-hero">
          <img className="ph-hero-img" src={HERO_PROV} alt="Prestador profissional a trabalhar" loading="lazy" />
          <div className="ph-hero-ov" />
          <div className="ph-hero-body">
            <div className="ph-badge">
              <span className="ph-dot" />
              <span style={{ fontSize:11, fontWeight:700, color:"#EF9F27", letterSpacing:"0.14em", textTransform:"uppercase" }}>
                Serviapp · Painel Prestador
              </span>
            </div>
            <h1 className="ph-title">
              {user?.fullName ? `Olá, ${user.fullName.split(" ")[0]}` : "O teu negócio"},<br />
              <span className="ph-title-g">digitalizado e protegido.</span>
            </h1>
            <p className="ph-sub">
              Recebe pedidos, gere a tua equipa, acompanha os pagamentos e cresce com a plataforma mais segura de Angola.
            </p>
            <div className="ph-btns">
              <button className="btn-ph-primary" onClick={() => router.push("/provider/services")}>
                <Briefcase size={16} /> Ver pedidos
              </button>
              <button className="btn-ph-ghost" onClick={() => router.push("/provider/profile")}>
                Ver perfil <ArrowRight size={16} />
              </button>
            </div>
          </div>
          <div className="ph-hero-stats">
            {heroStats.map((s, i) => (
              <div className="ph-hstat" key={i}>
                {loadingStats
                  ? <Loader2 size={18} style={{ color:s.color, animation:"spin 1s linear infinite", display:"block", margin:"0 auto" }} />
                  : <span style={{ fontSize:20, fontWeight:800, color:s.color, display:"block", lineHeight:1 }}>{s.value}</span>
                }
                <span style={{ fontSize:11, color:"#4a6a6a", marginTop:6, display:"block" }}>{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ KYC BANNER ═══ */}
        <div className={`kyc${isVerified ? " verified" : ""}`}>
          <div className={`kyc-ico${isVerified ? " verified" : ""}`}>
            {isVerified
              ? <CheckCircle size={20} style={{ color:"#1D9E75" }} />
              : <AlertCircle size={20} style={{ color:"#EF9F27" }} />
            }
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:14, fontWeight:700, color: isVerified ? "#1D9E75" : "#e2e8f0", marginBottom:3 }}>
              {isVerified ? "Perfil activo" : "Perfil inactivo — verificação pendente"}
            </p>
            <p style={{ fontSize:13, color: isVerified ? "#4a8a72" : "#6a5a3a" }}>
              {isVerified
                ? "A tua conta está verificada e visível para os clientes na plataforma."
                : "Completa o KYC para que os clientes possam encontrar-te na plataforma."}
            </p>
          </div>
          {!isVerified && (
            <button className="btn-kyc" onClick={() => router.push("/kyc?role=provider")}>
              Verificar agora
            </button>
          )}
        </div>

        {/* ═══ STATS DASHBOARD ═══ */}
        <div className="stats4">
          {dashStats.map((s, i) => {
            const Icon = s.Icon;
            return (
              <div className="sc" key={i} onClick={() => router.push(s.href)}>
                <div className="sc-top">
                  <p style={{ fontSize:13, color:"#4a6a6a" }}>{s.label}</p>
                  <div className="sc-ico" style={{ background:`${s.color}18` }}>
                    <Icon size={16} style={{ color:s.color }} />
                  </div>
                </div>
                {loadingStats
                  ? <div style={{ height:28, display:"flex", alignItems:"center" }}>
                      <Loader2 size={16} style={{ color:s.color, animation:"spin 1s linear infinite" }} />
                    </div>
                  : <p style={{ fontSize:22, fontWeight:800, color:s.color, marginBottom:4, lineHeight:1.1 }}>{s.value}</p>
                }
                <p style={{ fontSize:12, color:"#3a4a5a", marginTop:4 }}>{s.sub}</p>
              </div>
            );
          })}
        </div>

        {/* ═══ STEPS + FEATURES ═══ */}
        <div className="grid2">

          {/* Primeiros Passos */}
          <div className="psec">
            <p className="psec-title">Primeiros passos</p>
            <p className="psec-sub">Completa estes passos para activar o teu perfil</p>
            {visibleSteps.map((s) => {
              const Icon = s.Icon;
              return (
                <div className="pstep" key={s.title}>
                  <div className="pstep-ico" style={{ background:s.bg, border:`1px solid ${s.color}24` }}>
                    <Icon size={20} style={{ color:s.color }} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:14, fontWeight:700, color:"#e2e8f0", marginBottom:5 }}>{s.title}</p>
                    <p style={{ fontSize:12, color:"#4a6a6a", lineHeight:1.55, marginBottom: s.action ? 10 : 0 }}>{s.desc}</p>
                    {s.action && s.href && (
                      <button className="btn-step" onClick={() => router.push(s.href)}>
                        {s.action} <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <div className="psteps-more-wrap">
              <button
                className={`btn-psteps-more${showAllSteps ? " open" : ""}`}
                onClick={() => setShowAllSteps((v) => !v)}
              >
                {showAllSteps ? "Ver menos" : "Ver todos"} <ChevronDown size={15} />
              </button>
            </div>
          </div>

          {/* Vantagens */}
          <div className="psec">
            <p className="psec-title">Vantagens da plataforma</p>
            <p className="psec-sub">Tudo o que precisas para gerir o teu negócio</p>
            <div className="feats2">
              {FEATS.map((f, i) => {
                const Icon = f.Icon;
                return (
                  <div key={i} className="pfeat" style={{ background:`${f.color}08`, border:`1px solid ${f.color}1e` }}>
                    <div className="pfeat-ico" style={{ background:`${f.color}14` }}>
                      <Icon size={18} style={{ color:f.color }} />
                    </div>
                    <p style={{ fontSize:13, fontWeight:700, color:"#e2e8f0", marginBottom:5 }}>{f.title}</p>
                    <p style={{ fontSize:12, color:"#4a6a6a", lineHeight:1.6 }}>{f.desc}</p>
                  </div>
                );
              })}
            </div>
            <div className="company-cta">
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{
                  width:38, height:38, borderRadius:10,
                  background:"rgba(55,138,221,0.1)", border:"1px solid rgba(55,138,221,0.22)",
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                }}>
                  <Users size={16} style={{ color:"#378ADD" }} />
                </div>
                <div>
                  <p style={{ fontSize:14, fontWeight:700, color:"#e2e8f0", marginBottom:3 }}>Tens uma empresa?</p>
                  <p style={{ fontSize:12, color:"#4a6a6a" }}>Activa o perfil de empresa e gere toda a equipa.</p>
                </div>
              </div>
              <button className="btn-company" onClick={() => router.push("/provider/company")}>
                Activar <ArrowRight size={12} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}