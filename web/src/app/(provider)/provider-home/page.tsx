"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Briefcase, Wallet, Star, Clock, ArrowRight, ChevronDown,
  Shield, Zap, Users, TrendingUp, CheckCircle, AlertCircle, Loader2,
  Handshake, KeyRound, ImagePlus, MapPin, Sparkles,
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
  { Icon: CheckCircle, color:"#0E7A5F", bg:"#ECFDF5", ring:"#A7E8CE", title:"Completa o KYC",          desc:"Verifica a tua identidade para activar o perfil e receber pedidos.", action:"Verificar agora", href:"/kyc?role=provider"    },
  { Icon: ImagePlus,   color:"#B45309", bg:"#FFF7E6", ring:"#FBD98A", title:"Cria o teu portfólio",     desc:"Adiciona fotos e descrição dos serviços que ofereces.",               action:"Editar perfil",   href:"/provider/profile"     },
  { Icon: Zap,         color:"#2563EB", bg:"#EFF6FF", ring:"#BFDBFE", title:"Recebe o primeiro pedido", desc:"Quando o perfil estiver activo, os clientes vão encontrar-te.",        action:"Ver pedidos",     href:"/provider/services"    },
  { Icon: MapPin,      color:"#0E7A5F", bg:"#ECFDF5", ring:"#A7E8CE", title:"Activa a tua localização", desc:"Liga a partilha de localização no teu painel para apareceres no mapa e receberes pedidos perto de ti." },
  { Icon: Handshake,   color:"#7C3AED", bg:"#F5F3FF", ring:"#DDD6FE", title:"Aceita e negoceia",        desc:"Analisa o pedido, propõe um preço se quiseres, e aceita para começar." },
  { Icon: KeyRound,    color:"#B45309", bg:"#FFF7E6", ring:"#FBD98A", title:"Valida o PIN no local",    desc:"O cliente dá-te um código quando chegares — introduz para iniciares o serviço com segurança." },
  { Icon: Wallet,      color:"#0E7A5F", bg:"#ECFDF5", ring:"#A7E8CE", title:"Recebe o pagamento protegido", desc:"O valor fica reservado desde o início; depois de confirmado, a comissão é descontada automaticamente e transferido para ti." },
  { Icon: TrendingUp,  color:"#DB2777", bg:"#FDF2F8", ring:"#FBCFE8", title:"Constrói a tua reputação", desc:"Cada serviço concluído soma avaliações e aumenta a tua visibilidade nas pesquisas." },
];

const FEATS = [
  { Icon: Wallet,     color:"#0E7A5F", bg:"#ECFDF5", title:"Wallet integrada",    desc:"Recebe pagamentos directamente na tua wallet. Levanta quando quiseres."        },
  { Icon: Shield,     color:"#2563EB", bg:"#EFF6FF", title:"Pagamento garantido",  desc:"O escrow protege-te — o valor é retido até confirmares a conclusão."           },
  { Icon: Users,      color:"#B45309", bg:"#FFF7E6", title:"Gestão de equipa",     desc:"Tens uma empresa? Adiciona funcionários e distribui os serviços."               },
  { Icon: TrendingUp, color:"#DB2777", bg:"#FDF2F8", title:"Sistema de ranking",   desc:"Quanto mais serviços via app, maior a tua visibilidade e ranking."              },
];

const HERO_PROV = "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1000&auto=format&fit=crop";

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
    { value: loadingStats ? "…" : stats ? String(stats.totalOrders) : "0",                                          label:"Pedidos",   color:"#B45309", bg:"#FFF7E6" },
    { value: loadingStats ? "…" : stats ? `${stats.totalEarnings.toLocaleString("pt-PT")} Kz` : "0 Kz",            label:"Ganhos",    color:"#0E7A5F", bg:"#ECFDF5" },
    { value: loadingStats ? "…" : stats?.averageRating != null ? stats.averageRating.toFixed(1) : "—",             label:"Avaliação", color:"#2563EB", bg:"#EFF6FF" },
  ];

  const dashStats = [
    {
      label:"Pedidos recebidos",
      value: loadingStats ? "…" : stats ? String(stats.totalOrders) : "0",
      sub: stats && stats.totalOrders > 0 ? `${stats.activeOrders} activo${stats.activeOrders !== 1 ? "s" : ""}` : "Nenhum ainda",
      color:"#B45309", bg:"#FFF7E6", Icon:Briefcase, href:"/provider/services",
    },
    {
      label:"Ganhos totais",
      value: loadingStats ? "…" : stats ? `${stats.totalEarnings.toLocaleString("pt-PT")} Kz` : "0 Kz",
      sub:"Serviços concluídos",
      color:"#0E7A5F", bg:"#ECFDF5", Icon:Wallet, href:"/provider/wallet",
    },
    {
      label:"Avaliação média",
      value: loadingStats ? "…" : stats?.averageRating != null ? `${stats.averageRating.toFixed(1)} ★` : "—",
      sub: stats?.averageRating != null ? "Baseado em reviews" : "Sem avaliações",
      color:"#2563EB", bg:"#EFF6FF", Icon:Star, href:"/provider/reviews",
    },
    {
      label:"Mensagens",
      value: loadingStats ? "…" : String(unreadMessages),
      sub: unreadMessages > 0 ? `${unreadMessages} não lida${unreadMessages !== 1 ? "s" : ""}` : "Sem mensagens novas",
      color:"#DB2777", bg:"#FDF2F8", Icon:Clock, href:"/provider/chat",
    },
  ];

  const isVerified = kycStatus === "approved";
  const firstName = user?.fullName ? user.fullName.split(" ")[0] : null;

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes floatIn{from{opacity:0;transform:translateY(10px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}

        .ph{
          padding:0 0 60px;display:flex;flex-direction:column;gap:0;
          min-width:0;background:#FAFAF9;
        }
        .ph-shell{padding:0 40px}

        /* ═══════════════════════════ TOP BAND ═══════════════════════════ */
        .ph-topband{
          background:linear-gradient(180deg,#FFFDF7 0%,#FAFAF9 100%);
          border-bottom:1px solid #EFEBE2;
          padding:36px 0 40px;
        }
        .ph-greeting-row{
          display:flex;align-items:center;justify-content:space-between;
          gap:20px;flex-wrap:wrap;margin-bottom:28px;
        }
        .ph-greeting{display:flex;align-items:center;gap:14px}
        .ph-avatar-ring{
          width:52px;height:52px;border-radius:16px;
          background:linear-gradient(135deg,#F59E0B,#D97706);
          display:flex;align-items:center;justify-content:center;
          font-size:19px;font-weight:800;color:#FFFFFF;flex-shrink:0;
          box-shadow:0 6px 16px rgba(217,119,6,0.28);
        }
        .ph-hello{font-size:13px;color:#A16207;font-weight:600;letter-spacing:0.02em}
        .ph-name{font-size:22px;font-weight:800;color:#1C1917;letter-spacing:-0.01em;line-height:1.2}
        .ph-topband-cta{display:flex;gap:10px;flex-wrap:wrap}
        .btn-ph-primary{
          display:inline-flex;align-items:center;gap:8px;
          padding:12px 20px;border-radius:12px;border:none;
          background:#1C1917;color:#FFFFFF;font-size:13.5px;font-weight:700;
          cursor:pointer;font-family:inherit;white-space:nowrap;
          transition:all 0.18s ease;
        }
        .btn-ph-primary:hover{background:#292524;transform:translateY(-1px)}
        .btn-ph-ghost{
          display:inline-flex;align-items:center;gap:6px;
          padding:12px 18px;border-radius:12px;
          background:#FFFFFF;border:1px solid #E7E2D6;
          color:#57534E;font-size:13.5px;font-weight:600;
          cursor:pointer;font-family:inherit;white-space:nowrap;transition:all 0.18s ease;
        }
        .btn-ph-ghost:hover{border-color:#D6D0C0;background:#FDFCF9}

        /* Hero split card */
        .ph-hero-card{
          display:grid;grid-template-columns:1fr 380px;gap:0;
          border-radius:26px;overflow:hidden;
          background:#1C1917;
          box-shadow:0 20px 48px -16px rgba(28,25,23,0.35);
        }
        .ph-hero-copy{
          padding:44px 44px 40px;display:flex;flex-direction:column;justify-content:center;
        }
        .ph-hero-tag{
          display:inline-flex;align-items:center;gap:7px;
          padding:6px 13px;border-radius:99px;
          background:rgba(245,158,11,0.14);border:1px solid rgba(245,158,11,0.3);
          width:fit-content;margin-bottom:18px;
        }
        .ph-hero-title{
          font-size:30px;font-weight:800;color:#FAFAF9;line-height:1.22;
          letter-spacing:-0.02em;margin-bottom:14px;max-width:420px;
        }
        .ph-hero-title em{
          font-style:normal;color:#FBBF24;
        }
        .ph-hero-desc{
          font-size:14.5px;color:#A8A29E;line-height:1.65;max-width:400px;margin-bottom:26px;
        }
        .ph-hero-stats-inline{display:flex;gap:0;flex-wrap:wrap}
        .ph-hstat{
          padding:0 22px 0 0;margin-right:22px;border-right:1px solid rgba(255,255,255,0.1);
        }
        .ph-hstat:last-child{border-right:none;padding-right:0;margin-right:0}
        .ph-hstat-val{font-size:21px;font-weight:800;line-height:1.2;display:block}
        .ph-hstat-label{font-size:11.5px;color:#78716C;font-weight:500;margin-top:2px;display:block}

        .ph-hero-photo{
          position:relative;min-height:100%;
        }
        .ph-hero-photo img{
          width:100%;height:100%;object-fit:cover;object-position:center 25%;
          display:block;min-height:340px;
        }
        .ph-hero-photo::after{
          content:"";position:absolute;inset:0;
          background:linear-gradient(115deg,#1C1917 0%,rgba(28,25,23,0.15) 34%,rgba(28,25,23,0) 60%);
        }
        .ph-hero-badge-float{
          position:absolute;bottom:20px;right:20px;z-index:2;
          background:rgba(255,255,255,0.96);backdrop-filter:blur(8px);
          border-radius:14px;padding:11px 15px;
          display:flex;align-items:center;gap:9px;
          box-shadow:0 10px 24px rgba(0,0,0,0.18);
          animation:floatIn 0.5s ease both;
        }

        /* ═══════════════════════════ BODY ═══════════════════════════ */
        .ph-body{padding-top:36px;display:flex;flex-direction:column;gap:36px}

        /* ── KYC Banner ── */
        .kyc{
          border-radius:18px;padding:18px 22px;
          background:#FFF7E6;border:1px solid #FBD98A;
          display:flex;align-items:center;gap:14px;
        }
        .kyc-ico{
          width:42px;height:42px;border-radius:12px;
          background:#FFFFFF;border:1px solid #FBD98A;
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
        }
        .btn-kyc{
          padding:10px 18px;border-radius:10px;
          background:#B45309;color:#FFFFFF;font-size:13px;font-weight:700;
          cursor:pointer;border:none;font-family:inherit;white-space:nowrap;
          transition:all 0.18s ease;margin-left:auto;flex-shrink:0;
        }
        .btn-kyc:hover{background:#92400E}
        .kyc.verified{background:#ECFDF5;border:1px solid #A7E8CE}
        .kyc-ico.verified{background:#FFFFFF;border:1px solid #A7E8CE}

        /* ── Section label ── */
        .sec-label{
          display:flex;align-items:center;gap:8px;margin-bottom:16px;
        }
        .sec-label-dot{width:7px;height:7px;border-radius:2px;background:#D97706}
        .sec-label-text{font-size:12.5px;font-weight:700;color:#78716C;text-transform:uppercase;letter-spacing:0.08em}

        /* ── Stats grid ── */
        .stats4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
        .sc{
          background:#FFFFFF;border:1px solid #EFEBE2;border-radius:18px;
          padding:22px;cursor:pointer;transition:all 0.2s ease;position:relative;overflow:hidden;
        }
        .sc:hover{border-color:transparent;box-shadow:0 10px 28px -8px rgba(28,25,23,0.16);transform:translateY(-3px)}
        .sc-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
        .sc-ico{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center}
        .sc-label{font-size:13px;color:#78716C;font-weight:600}
        .sc-value{font-size:25px;font-weight:800;margin-bottom:4px;line-height:1.15;letter-spacing:-0.01em}
        .sc-sub{font-size:12px;color:#A8A29E}

        /* ═══════════════════════════ SECTION CARD ═══════════════════════════ */
        .psec{background:#FFFFFF;border:1px solid #EFEBE2;border-radius:22px;padding:30px}
        .psec-title{font-size:18px;font-weight:800;color:#1C1917;margin-bottom:5px;letter-spacing:-0.01em}
        .psec-sub{font-size:13px;color:#A8A29E;margin-bottom:22px}
        .grid2{display:grid;grid-template-columns:1.05fr 0.95fr;gap:22px;align-items:start}

        /* ── Steps ── */
        .pstep{
          display:flex;align-items:flex-start;gap:14px;
          padding:16px;border-radius:16px;
          background:#FDFCF9;border:1px solid #F3F0E8;
          margin-bottom:10px;transition:all 0.18s ease;
        }
        .pstep:last-child{margin-bottom:0}
        .pstep:hover{border-color:#E7E2D6;transform:translateX(3px)}
        .pstep-ico{
          width:42px;height:42px;border-radius:13px;
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
        }
        .btn-step{
          display:inline-flex;align-items:center;gap:4px;
          padding:7px 13px;border-radius:9px;
          background:#1C1917;border:none;
          color:#FFFFFF;font-size:12px;font-weight:700;
          cursor:pointer;font-family:inherit;transition:all 0.15s;white-space:nowrap;
        }
        .btn-step:hover{background:#292524}
        .psteps-more-wrap{display:flex;justify-content:center;margin-top:8px}
        .btn-psteps-more{
          display:inline-flex;align-items:center;gap:6px;
          padding:10px 20px;border-radius:11px;
          background:#FDFCF9;border:1px solid #E7E2D6;
          color:#57534E;font-size:13px;font-weight:700;
          cursor:pointer;font-family:inherit;transition:all 0.16s ease;
        }
        .btn-psteps-more:hover{background:#F3F0E8;border-color:#D6D0C0}
        .btn-psteps-more svg{transition:transform 0.2s ease}
        .btn-psteps-more.open svg{transform:rotate(180deg)}

        /* ── Feature cards ── */
        .feats2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
        .pfeat{padding:18px;border-radius:16px;transition:all 0.2s ease;border:1px solid transparent}
        .pfeat:hover{transform:translateY(-2px);box-shadow:0 8px 20px -6px rgba(28,25,23,0.12)}
        .pfeat-ico{
          width:38px;height:38px;border-radius:11px;
          display:flex;align-items:center;justify-content:center;margin-bottom:12px;
          background:rgba(255,255,255,0.65);
        }

        /* ── Company CTA ── */
        .company-cta{
          padding:18px 20px;border-radius:16px;
          background:linear-gradient(120deg,#EFF6FF,#F5F3FF);
          border:1px solid #DBEAFE;
          display:flex;align-items:center;justify-content:space-between;gap:16px;
        }
        .btn-company{
          padding:10px 17px;border-radius:10px;
          background:#1C1917;border:none;
          color:#FFFFFF;font-size:13px;font-weight:700;
          cursor:pointer;font-family:inherit;
          display:flex;align-items:center;gap:5px;
          transition:all 0.15s;white-space:nowrap;flex-shrink:0;
        }
        .btn-company:hover{background:#292524}

        /* ═══════════════════════════ RESPONSIVE ═══════════════════════════ */
        @media(max-width:1024px){
          .ph-shell{padding:0 24px}
          .ph-hero-card{grid-template-columns:1fr}
          .ph-hero-photo img{min-height:220px}
          .ph-hero-photo::after{background:linear-gradient(180deg,rgba(28,25,23,0) 40%,#1C1917 96%)}
          .stats4{grid-template-columns:repeat(2,1fr)}
        }
        @media(max-width:768px){
          .ph-shell{padding:0 16px}
          .ph-topband{padding:76px 0 32px}
          .ph-greeting-row{margin-bottom:20px}
          .ph-name{font-size:19px}
          .ph-hero-copy{padding:32px 26px 30px}
          .ph-hero-title{font-size:24px}
          .ph-body{gap:26px;padding-top:28px}
          .grid2{grid-template-columns:1fr}
          .feats2{grid-template-columns:1fr}
          .kyc{flex-wrap:wrap}
          .btn-kyc{margin-left:0;width:100%;justify-content:center}
          .company-cta{flex-direction:column;text-align:center}
          .btn-company{width:100%;justify-content:center}
          .ph-topband-cta{width:100%}
          .ph-topband-cta button{flex:1;justify-content:center}
        }
        @media(max-width:480px){
          .stats4{grid-template-columns:1fr 1fr}
          .ph-hero-title{font-size:21px}
          .ph-hstat{margin-right:14px;padding-right:14px}
          .ph-hstat-val{font-size:18px}
          .psec{padding:22px}
        }
        @media(max-width:360px){
          .stats4{grid-template-columns:1fr}
        }
      `}</style>

      <div className="ph">

        {/* ═══ TOP BAND: greeting + hero card ═══ */}
        <div className="ph-topband">
          <div className="ph-shell">

            <div className="ph-greeting-row">
              <div className="ph-greeting">
                <div className="ph-avatar-ring">{firstName ? firstName.charAt(0).toUpperCase() : "P"}</div>
                <div>
                  <p className="ph-hello">Bem-vindo de volta</p>
                  <p className="ph-name">{firstName ? firstName : "Prestador"}</p>
                </div>
              </div>
              <div className="ph-topband-cta">
                <button className="btn-ph-ghost" onClick={() => router.push("/provider/profile")}>
                  Ver perfil <ArrowRight size={14} />
                </button>
                <button className="btn-ph-primary" onClick={() => router.push("/provider/services")}>
                  <Briefcase size={15} /> Ver pedidos
                </button>
              </div>
            </div>

            {/* Hero split card */}
            <div className="ph-hero-card">
              <div className="ph-hero-copy">
                <div className="ph-hero-tag">
                  <Sparkles size={13} style={{ color:"#FBBF24" }} />
                  <span style={{ fontSize:11, fontWeight:700, color:"#FBBF24", letterSpacing:"0.08em", textTransform:"uppercase" }}>
                    Serviapp Prestador
                  </span>
                </div>
                <h1 className="ph-hero-title">
                  O teu negócio, <em>digitalizado e protegido.</em>
                </h1>
                <p className="ph-hero-desc">
                  Recebe pedidos, gere a tua equipa e acompanha os pagamentos com a plataforma mais segura de Angola.
                </p>
                <div className="ph-hero-stats-inline">
                  {heroStats.map((s, i) => (
                    <div className="ph-hstat" key={i}>
                      {loadingStats
                        ? <Loader2 size={17} style={{ color:s.color, animation:"spin 1s linear infinite" }} />
                        : <span className="ph-hstat-val" style={{ color:s.color }}>{s.value}</span>
                      }
                      <span className="ph-hstat-label">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="ph-hero-photo">
                <img src={HERO_PROV} alt="Prestador profissional a trabalhar" loading="lazy" />
                <div className="ph-hero-badge-float">
                  <div style={{ width:32, height:32, borderRadius:9, background:"#ECFDF5", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Shield size={16} style={{ color:"#0E7A5F" }} />
                  </div>
                  <div>
                    <p style={{ fontSize:12, fontWeight:700, color:"#1C1917", lineHeight:1.2 }}>Escrow seguro</p>
                    <p style={{ fontSize:10.5, color:"#A8A29E" }}>Pagamento garantido</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ═══ BODY ═══ */}
        <div className="ph-shell ph-body">

          {/* ═══ KYC BANNER ═══ */}
          <div className={`kyc${isVerified ? " verified" : ""}`}>
            <div className={`kyc-ico${isVerified ? " verified" : ""}`}>
              {isVerified
                ? <CheckCircle size={19} style={{ color:"#0E7A5F" }} />
                : <AlertCircle size={19} style={{ color:"#B45309" }} />
              }
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:14, fontWeight:700, color: isVerified ? "#0E7A5F" : "#1C1917", marginBottom:3 }}>
                {isVerified ? "Perfil activo" : "Perfil inactivo — verificação pendente"}
              </p>
              <p style={{ fontSize:13, color: isVerified ? "#4B8A76" : "#92702E" }}>
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
          <div>
            <div className="sec-label">
              <span className="sec-label-dot" />
              <span className="sec-label-text">Resumo rápido</span>
            </div>
            <div className="stats4">
              {dashStats.map((s, i) => {
                const Icon = s.Icon;
                return (
                  <div className="sc" key={i} onClick={() => router.push(s.href)}>
                    <div className="sc-top">
                      <span className="sc-label">{s.label}</span>
                      <div className="sc-ico" style={{ background:s.bg }}>
                        <Icon size={18} style={{ color:s.color }} />
                      </div>
                    </div>
                    {loadingStats
                      ? <div style={{ height:29, display:"flex", alignItems:"center" }}>
                          <Loader2 size={16} style={{ color:s.color, animation:"spin 1s linear infinite" }} />
                        </div>
                      : <p className="sc-value" style={{ color:s.color }}>{s.value}</p>
                    }
                    <p className="sc-sub">{s.sub}</p>
                  </div>
                );
              })}
            </div>
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
                    <div className="pstep-ico" style={{ background:s.bg, border:`1px solid ${s.ring}` }}>
                      <Icon size={19} style={{ color:s.color }} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:14, fontWeight:700, color:"#1C1917", marginBottom:5 }}>{s.title}</p>
                      <p style={{ fontSize:12, color:"#A8A29E", lineHeight:1.55, marginBottom: s.action ? 10 : 0 }}>{s.desc}</p>
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
                    <div key={i} className="pfeat" style={{ background:f.bg, borderColor:`${f.color}20` }}>
                      <div className="pfeat-ico">
                        <Icon size={17} style={{ color:f.color }} />
                      </div>
                      <p style={{ fontSize:13, fontWeight:700, color:"#1C1917", marginBottom:5 }}>{f.title}</p>
                      <p style={{ fontSize:12, color:"#78716C", lineHeight:1.6 }}>{f.desc}</p>
                    </div>
                  );
                })}
              </div>
              <div className="company-cta">
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{
                    width:38, height:38, borderRadius:11,
                    background:"#FFFFFF", border:"1px solid #DBEAFE",
                    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                  }}>
                    <Users size={17} style={{ color:"#2563EB" }} />
                  </div>
                  <div>
                    <p style={{ fontSize:14, fontWeight:700, color:"#1C1917", marginBottom:3 }}>Tens uma empresa?</p>
                    <p style={{ fontSize:12, color:"#78716C" }}>Activa o perfil de empresa e gere toda a equipa.</p>
                  </div>
                </div>
                <button className="btn-company" onClick={() => router.push("/provider/company")}>
                  Activar <ArrowRight size={12} />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}