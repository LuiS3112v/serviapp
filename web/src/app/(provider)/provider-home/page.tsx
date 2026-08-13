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

/* ─────────────────────────────────────────────────────────────────────────
   NOTAS DE DESIGN

   Problema do design antigo: cada card/ícone tinha a sua própria cor forte
   (âmbar, azul, roxo, rosa, verde...) e a informação vivia toda dentro de
   "caixas" com fundo, borda e sombra — isso é o que faz uma interface
   parecer "AI dashboard". Os números das estatísticas herdavam a cor do
   ícone (33 em âmbar, 4.6 em azul, etc.), o que quebra a leitura de dados.

   Nova estrutura: welcome editorial (nome + foto real, sem hero escuro
   gigante) → estado do KYC → métricas em linha aberta (não 4 cards
   idênticos) → Primeiros passos como checklist vertical → Vantagens como
   lista numerada editorial → CTA de empresa no fim.

   Nova filosofia de cor: fundo #F8FAFC, cards #FFFFFF, texto #0F172A /
   #64748B / #94A3B8, bordas #E2E8F0. Os NÚMEROS são sempre #0F172A.
   O âmbar (#EF9F27) da identidade Provider fica reservado a: botão
   principal, badge "activo", ícone do passo com ação pendente e CTA de
   empresa. O verde da Mestroo aparece só no ícone de pagamento/escrow.
   Nada de roxo, rosa ou azul elétrico.

   Nenhuma API, rota, lógica de estado, polling ou dado foi alterado —
   apenas a apresentação visual (JSX/CSS) foi reescrita. STEPS e FEATS
   perderam apenas os campos de cor por item (eram só estilo), o conteúdo
   textual é o mesmo.
────────────────────────────────────────────────────────────────────────── */

const INK = "#0F172A";
const MUTED = "#64748B";
const FAINT = "#94A3B8";
const LINE = "#E2E8F0";
const SURFACE = "#F8FAFC";
const AMBER = "#EF9F27";
const AMBER_SOFT = "#FDF1DF";
const GREEN = "#0E7A5F";
const GREEN_SOFT = "#E9F5F0";

// 3 sempre visíveis + 5 atrás de "Ver todos" (8 no total) — igual ao original.
const STEPS = [
  { Icon: CheckCircle, title: "Completa o KYC",              desc: "Verifica a tua identidade para activar o perfil e receber pedidos.", action: "Verificar agora", href: "/kyc?role=provider", tone: "amber" },
  { Icon: ImagePlus,   title: "Cria o teu portfólio",         desc: "Adiciona fotos e descrição dos serviços que ofereces.",               action: "Editar perfil",   href: "/provider/profile", tone: "neutral" },
  { Icon: Zap,         title: "Recebe o primeiro pedido",     desc: "Quando o perfil estiver activo, os clientes vão encontrar-te.",        action: "Ver pedidos",     href: "/provider/services", tone: "neutral" },
  { Icon: MapPin,      title: "Activa a tua localização",     desc: "Liga a partilha de localização no teu painel para apareceres no mapa e receberes pedidos perto de ti.", tone: "neutral" },
  { Icon: Handshake,   title: "Aceita e negoceia",            desc: "Analisa o pedido, propõe um preço se quiseres, e aceita para começar.", tone: "neutral" },
  { Icon: KeyRound,    title: "Valida o PIN no local",        desc: "O cliente dá-te um código quando chegares — introduz para iniciares o serviço com segurança.", tone: "neutral" },
  { Icon: Wallet,      title: "Recebe o pagamento protegido", desc: "O valor fica reservado desde o início; depois de confirmado, a comissão é descontada automaticamente e transferido para ti.", tone: "green" },
  { Icon: TrendingUp,  title: "Constrói a tua reputação",     desc: "Cada serviço concluído soma avaliações e aumenta a tua visibilidade nas pesquisas.", tone: "neutral" },
];

const FEATS = [
  { Icon: Wallet,     title: "Wallet integrada",   desc: "Recebe pagamentos directamente na tua wallet. Levanta quando quiseres." },
  { Icon: Shield,     title: "Pagamento garantido", desc: "O escrow protege-te — o valor é retido até confirmares a conclusão." },
  { Icon: Users,      title: "Gestão de equipa",    desc: "Tens uma empresa? Adiciona funcionários e distribui os serviços." },
  { Icon: TrendingUp, title: "Sistema de ranking",  desc: "Quanto mais serviços via app, maior a tua visibilidade e ranking." },
];

// Nova fotografia: prestador em contexto real de trabalho, luz natural —
// substitui a antiga photo-1504307651254-35680f356dfd.
const HERO_PROV = "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1000&auto=format&fit=crop";

function toneColor(tone: string) {
  if (tone === "amber") return { fg: AMBER, bg: AMBER_SOFT };
  if (tone === "green") return { fg: GREEN, bg: GREEN_SOFT };
  return { fg: MUTED, bg: "#F1F5F9" };
}

export default function ProviderHomePage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  useEffect(() => { setUser(getSession()); }, []);

  const [stats, setStats] = useState<ProviderStats | null>(null);
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
        if (chatUnread.status === "fulfilled") setUnreadMessages(chatUnread.value.count);
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
    { value: loadingStats ? "…" : stats ? String(stats.totalOrders) : "0", label: "Pedidos" },
    { value: loadingStats ? "…" : stats ? `${stats.totalEarnings.toLocaleString("pt-PT")} Kz` : "0 Kz", label: "Ganhos" },
    { value: loadingStats ? "…" : stats?.averageRating != null ? stats.averageRating.toFixed(1) : "—", label: "Avaliação" },
  ];

  const dashStats = [
    {
      label: "Pedidos recebidos",
      value: loadingStats ? "…" : stats ? String(stats.totalOrders) : "0",
      sub: stats && stats.totalOrders > 0 ? `${stats.activeOrders} activo${stats.activeOrders !== 1 ? "s" : ""}` : "Nenhum ainda",
      Icon: Briefcase, href: "/provider/services",
    },
    {
      label: "Ganhos totais",
      value: loadingStats ? "…" : stats ? `${stats.totalEarnings.toLocaleString("pt-PT")} Kz` : "0 Kz",
      sub: "Serviços concluídos",
      Icon: Wallet, href: "/provider/wallet",
    },
    {
      label: "Avaliação média",
      value: loadingStats ? "…" : stats?.averageRating != null ? `${stats.averageRating.toFixed(1)} ★` : "—",
      sub: stats?.averageRating != null ? "Baseado em reviews" : "Sem avaliações",
      Icon: Star, href: "/provider/reviews",
    },
    {
      label: "Mensagens",
      value: loadingStats ? "…" : String(unreadMessages),
      sub: unreadMessages > 0 ? `${unreadMessages} não lida${unreadMessages !== 1 ? "s" : ""}` : "Sem mensagens novas",
      Icon: Clock, href: "/provider/chat",
    },
  ];

  const isVerified = kycStatus === "approved";
  const firstName = user?.fullName ? user.fullName.split(" ")[0] : null;

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

        .ph{padding:0 0 64px;display:flex;flex-direction:column;gap:0;min-width:0;background:${SURFACE}}
        .ph-shell{padding:0 40px;max-width:1180px}

        /* ═══════════ WELCOME / HEADER ═══════════ */
        .ph-top{padding:36px 0 32px;border-bottom:1px solid ${LINE}}
        .ph-welcome-row{display:grid;grid-template-columns:1.15fr 0.85fr;gap:32px;align-items:center}

        .ph-welcome-copy{display:flex;flex-direction:column}
        .ph-hello{font-size:13px;color:${MUTED};font-weight:500;margin-bottom:4px}
        .ph-name{font-size:26px;font-weight:700;color:${INK};letter-spacing:-0.02em;margin-bottom:18px}

        .ph-inline-stats{display:flex;gap:0}
        .ph-istat{padding-right:24px;margin-right:24px;border-right:1px solid ${LINE}}
        .ph-istat:last-child{border-right:none;padding-right:0;margin-right:0}
        .ph-istat-val{font-size:20px;font-weight:700;color:${INK};line-height:1.2;display:block}
        .ph-istat-label{font-size:11.5px;color:${FAINT};margin-top:3px;display:block}

        .ph-cta-row{display:flex;gap:10px;margin-top:24px}
        .btn-ph-primary{
          display:inline-flex;align-items:center;gap:8px;padding:12px 20px;border-radius:11px;border:none;
          background:${INK};color:#fff;font-size:13.5px;font-weight:600;cursor:pointer;
          font-family:inherit;white-space:nowrap;transition:all 0.18s ease;
        }
        .btn-ph-primary:hover{background:#1E293B}
        .btn-ph-ghost{
          display:inline-flex;align-items:center;gap:6px;padding:12px 18px;border-radius:11px;
          background:#fff;border:1px solid ${LINE};color:${INK};font-size:13.5px;font-weight:600;
          cursor:pointer;font-family:inherit;white-space:nowrap;transition:all 0.18s ease;
        }
        .btn-ph-ghost:hover{border-color:#CBD5E1}

        .ph-photo{position:relative;border-radius:18px;overflow:hidden;height:180px;background:#EDEFF2}
        .ph-photo img{width:100%;height:100%;object-fit:cover;display:block}
        .ph-photo-badge{
          position:absolute;left:14px;bottom:14px;z-index:2;
          background:rgba(255,255,255,0.95);backdrop-filter:blur(6px);
          border-radius:11px;padding:9px 12px;display:flex;align-items:center;gap:9px;
          box-shadow:0 6px 16px rgba(15,23,42,0.10);
        }

        /* ═══════════ BODY ═══════════ */
        .ph-body{padding-top:32px;display:flex;flex-direction:column;gap:32px}

        /* ── KYC banner: linha aberta, não um card colorido ── */
        .kyc-row{display:flex;align-items:center;gap:14px;padding:16px 0;border-bottom:1px solid ${LINE}}
        .kyc-ico{
          width:38px;height:38px;border-radius:10px;background:${AMBER_SOFT};
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
        }
        .kyc-ico.verified{background:${GREEN_SOFT}}
        .btn-kyc{
          padding:9px 16px;border-radius:9px;background:${AMBER};color:#fff;font-size:12.5px;font-weight:700;
          cursor:pointer;border:none;font-family:inherit;white-space:nowrap;margin-left:auto;flex-shrink:0;
          transition:all .18s;
        }
        .btn-kyc:hover{background:#D98E1A}

        /* ── Estatísticas: linha aberta com separadores, não 4 cards iguais ── */
        .sec-label{font-size:12px;font-weight:700;color:${FAINT};text-transform:uppercase;letter-spacing:0.07em;margin-bottom:16px}
        .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:0;background:#fff;border:1px solid ${LINE};border-radius:16px;overflow:hidden}
        .sc{padding:20px 22px;cursor:pointer;transition:background 0.15s;border-right:1px solid ${LINE}}
        .sc:last-child{border-right:none}
        .sc:hover{background:${SURFACE}}
        .sc-top{display:flex;align-items:center;gap:8px;margin-bottom:14px}
        .sc-ico{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;background:#F1F5F9;flex-shrink:0}
        .sc-label{font-size:12.5px;color:${MUTED};font-weight:600}
        .sc-value{font-size:22px;font-weight:700;color:${INK};margin-bottom:4px;line-height:1.15;letter-spacing:-0.01em}
        .sc-sub{font-size:11.5px;color:${FAINT}}

        /* ═══════════ SECTIONS ═══════════ */
        .grid2{display:grid;grid-template-columns:1.05fr 0.95fr;gap:28px;align-items:start}
        .psec-title{font-size:16.5px;font-weight:700;color:${INK};margin-bottom:4px;letter-spacing:-0.01em}
        .psec-sub{font-size:13px;color:${MUTED};margin-bottom:20px}

        /* ── Primeiros passos: checklist vertical, sem card por passo ── */
        .pstep{display:flex;align-items:flex-start;gap:13px;padding:14px 0;border-bottom:1px solid ${LINE}}
        .pstep:last-of-type{border-bottom:none}
        .pstep-ico{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .btn-step{
          display:inline-flex;align-items:center;gap:4px;margin-top:8px;padding:6px 12px;border-radius:8px;
          background:${INK};border:none;color:#fff;font-size:11.5px;font-weight:700;
          cursor:pointer;font-family:inherit;transition:all 0.15s;white-space:nowrap;
        }
        .btn-step:hover{background:#1E293B}
        .psteps-more-wrap{display:flex;justify-content:flex-start;margin-top:14px}
        .btn-psteps-more{
          display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:9px;
          background:#fff;border:1px solid ${LINE};color:${MUTED};font-size:12.5px;font-weight:700;
          cursor:pointer;font-family:inherit;transition:all 0.16s ease;
        }
        .btn-psteps-more:hover{border-color:#CBD5E1;color:${INK}}
        .btn-psteps-more svg{transition:transform 0.2s ease}
        .btn-psteps-more.open svg{transform:rotate(180deg)}

        /* ── Vantagens: lista numerada editorial ── */
        .pfeat{display:flex;align-items:flex-start;gap:14px;padding:14px 0;border-bottom:1px solid ${LINE}}
        .pfeat:last-of-type{border-bottom:none}
        .pfeat-num{font-size:12px;font-weight:700;color:${FAINT};width:22px;flex-shrink:0;padding-top:2px}
        .pfeat-ico{width:32px;height:32px;border-radius:9px;background:#F1F5F9;display:flex;align-items:center;justify-content:center;flex-shrink:0}

        .company-cta{
          margin-top:18px;padding:16px 18px;border-radius:14px;background:${SURFACE};border:1px solid ${LINE};
          display:flex;align-items:center;justify-content:space-between;gap:16px;
        }
        .btn-company{
          padding:9px 16px;border-radius:9px;background:${AMBER};border:none;color:#fff;font-size:12.5px;font-weight:700;
          cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:5px;transition:all 0.15s;white-space:nowrap;flex-shrink:0;
        }
        .btn-company:hover{background:#D98E1A}

        /* ═══════════ RESPONSIVE ═══════════ */
        @media(max-width:1024px){
          .ph-shell{padding:0 24px}
          .ph-welcome-row{grid-template-columns:1fr}
          .ph-photo{height:180px;order:-1}
          .grid2{grid-template-columns:1fr}
        }
        @media(max-width:768px){
          .ph-shell{padding:0 16px}
          .ph-top{padding:76px 0 28px}
          .ph-name{font-size:21px}
          .ph-inline-stats{flex-wrap:wrap;row-gap:12px}
          .ph-cta-row{flex-direction:column;align-items:stretch}
          .stats-row{grid-template-columns:1fr 1fr}
          .sc{border-bottom:1px solid ${LINE}}
          .sc:nth-child(2n){border-right:none}
          .ph-body{gap:26px;padding-top:26px}
          .kyc-row{flex-wrap:wrap}
          .btn-kyc{margin-left:0;width:100%;justify-content:center}
          .company-cta{flex-direction:column;text-align:center}
          .btn-company{width:100%;justify-content:center}
        }
        @media(max-width:480px){
          .stats-row{grid-template-columns:1fr}
          .sc{border-right:none !important}
          .ph-istat{padding-right:16px;margin-right:16px}
          .ph-istat-val{font-size:17px}
        }
      `}</style>

      <div className="ph">
        <div className="ph-top">
          <div className="ph-shell">
            <div className="ph-welcome-row">
              <div className="ph-welcome-copy">
                <p className="ph-hello">Bem-vindo de volta</p>
                <p className="ph-name">{firstName ? firstName : "Prestador"}</p>

                <div className="ph-inline-stats">
                  {heroStats.map((s, i) => (
                    <div className="ph-istat" key={i}>
                      {loadingStats
                        ? <Loader2 size={16} style={{ color: FAINT, animation: "spin 1s linear infinite" }} />
                        : <span className="ph-istat-val">{s.value}</span>
                      }
                      <span className="ph-istat-label">{s.label}</span>
                    </div>
                  ))}
                </div>

                <div className="ph-cta-row">
                  <button className="btn-ph-primary" onClick={() => router.push("/provider/services")}>
                    <Briefcase size={15} /> Ver pedidos
                  </button>
                  <button className="btn-ph-ghost" onClick={() => router.push("/provider/profile")}>
                    Ver perfil <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              <div className="ph-photo">
                <img src={HERO_PROV} alt="Prestador profissional a trabalhar" loading="lazy" />
                <div className="ph-photo-badge">
                  <Shield size={15} style={{ color: GREEN }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: INK }}>Pagamento protegido</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ph-shell ph-body">

          {/* ═══ KYC ═══ */}
          <div className="kyc-row">
            <div className={`kyc-ico${isVerified ? " verified" : ""}`}>
              {isVerified
                ? <CheckCircle size={17} style={{ color: GREEN }} />
                : <AlertCircle size={17} style={{ color: AMBER }} />
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 2 }}>
                {isVerified ? "Perfil activo" : "Perfil inactivo — verificação pendente"}
              </p>
              <p style={{ fontSize: 13, color: MUTED }}>
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

          {/* ═══ ESTATÍSTICAS ═══ */}
          <div>
            <p className="sec-label">Resumo rápido</p>
            <div className="stats-row">
              {dashStats.map((s, i) => {
                const Icon = s.Icon;
                return (
                  <div className="sc" key={i} onClick={() => router.push(s.href)}>
                    <div className="sc-top">
                      <div className="sc-ico"><Icon size={14} style={{ color: MUTED }} /></div>
                      <span className="sc-label">{s.label}</span>
                    </div>
                    {loadingStats
                      ? <div style={{ height: 26, display: "flex", alignItems: "center" }}>
                          <Loader2 size={15} style={{ color: FAINT, animation: "spin 1s linear infinite" }} />
                        </div>
                      : <p className="sc-value">{s.value}</p>
                    }
                    <p className="sc-sub">{s.sub}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══ PRIMEIROS PASSOS + VANTAGENS ═══ */}
          <div className="grid2">

            <div>
              <p className="psec-title">Primeiros passos</p>
              <p className="psec-sub">Completa estes passos para activar o teu perfil</p>
              {visibleSteps.map((s) => {
                const Icon = s.Icon;
                const c = toneColor(s.tone);
                return (
                  <div className="pstep" key={s.title}>
                    <div className="pstep-ico" style={{ background: c.bg }}>
                      <Icon size={17} style={{ color: c.fg }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 700, color: INK, marginBottom: 3 }}>{s.title}</p>
                      <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.55 }}>{s.desc}</p>
                      {s.action && s.href && (
                        <button className="btn-step" onClick={() => router.push(s.href)}>
                          {s.action} <ArrowRight size={11} />
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
                  {showAllSteps ? "Ver menos" : "Ver todos"} <ChevronDown size={14} />
                </button>
              </div>
            </div>

            <div>
              <p className="psec-title">Vantagens da plataforma</p>
              <p className="psec-sub">Tudo o que precisas para gerir o teu negócio</p>
              {FEATS.map((f, i) => {
                const Icon = f.Icon;
                return (
                  <div key={i} className="pfeat">
                    <span className="pfeat-num">{String(i + 1).padStart(2, "0")}</span>
                    <div className="pfeat-ico"><Icon size={15} style={{ color: MUTED }} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 700, color: INK, marginBottom: 3 }}>{f.title}</p>
                      <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.55 }}>{f.desc}</p>
                    </div>
                  </div>
                );
              })}

              <div className="company-cta">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 9, background: "#fff", border: `1px solid ${LINE}`,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Users size={15} style={{ color: MUTED }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: INK, marginBottom: 2 }}>Tens uma empresa?</p>
                    <p style={{ fontSize: 12, color: MUTED }}>Activa o perfil de empresa e gere toda a equipa.</p>
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