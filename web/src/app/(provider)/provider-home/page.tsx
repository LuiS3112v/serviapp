"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Briefcase, ArrowRight, ChevronRight,
  Shield, CheckCircle, AlertCircle, Loader2, ShoppingBag,
} from "lucide-react";
import { servicesApi, ProviderStats } from "@/lib/services.api";
import { subcategoryServicesApi } from "@/lib/subcategory-services.api";
import { buildUnifiedList, ServiceListItem } from "@/lib/service-list-item";
import { chatApi } from "@/lib/chat.api";
import { getSession } from "@/lib/auth.api";
import { kycApi } from "@/lib/api/kyc.api";
import { TOKENS, BOTTOM_NAV_HEIGHT, BOTTOM_NAV_SAFE_AREA } from "@/lib/design-tokens";
import ProviderServiceActionCard from "@/components/services/ProviderServiceActionCard";

/* ─────────────────────────────────────────────────────────────────────────
   NOTAS DE DESIGN (v2 — foco em "o que tenho para fazer agora")

   O que mudou em relação à versão anterior e porquê:

   1. "Vantagens da plataforma" (Wallet/Escrow/Equipa/Ranking) e o CTA
      "Tens uma empresa?" SAÍRAM daqui. É conteúdo de venda para quem
      ainda pondera usar a Mestroo — um provider já a trabalhar não
      precisa de o ver sempre, na Home, ocupando metade da tela.
      NADA foi apagado — o mesmo texto (mesmos títulos, mesmas
      descrições) vive agora em /provider/como-funciona, acessível
      permanentemente a partir da ProviderSidebar (secção "Perfil"), em
      qualquer ecrã da app. Ver
      app/(provider)/provider/como-funciona/page.tsx.

   2. "Primeiros passos" (8 passos) também saiu — mesmo motivo e mesmo
      destino: /provider/como-funciona.

   3. A duplicação de números foi resolvida: antes, Pedidos/Ganhos/
      Avaliação apareciam duas vezes na mesma página (heroStats no topo
      E dashStats mais abaixo, com os mesmos valores). Agora só existe
      uma vez, no topo.

   4. Entrou o bloco "Pedidos perto de ti", ocupando o espaço que sobrou
      — usa servicesApi.getAvailable() + subcategoryServicesApi.getAvailable()
      (já existiam, usados em /provider/services, não estavam a ser
      chamados aqui) com o mesmo ProviderServiceActionCard que essa
      página já usa (tab="available") — por isso o visual e as acções
      (aceitar, propor preço) são idênticos aos que o provider já
      conhece de lá.

   O que ficou exactamente igual: ProviderChrome/ProviderSidebar/
   BottomNav (montados pelo layout.tsx do grupo), welcome com foto e
   nome real, estado do KYC, nenhuma API nova a não ser as já existentes
   reaproveitadas, nenhuma rota nova a não ser /provider/como-funciona.
────────────────────────────────────────────────────────────────────────── */

const INK = TOKENS.color.ink;
const MUTED = TOKENS.color.muted;
const FAINT = TOKENS.color.faint;
const LINE = TOKENS.color.line;
const SURFACE = TOKENS.color.surface;
const AMBER = TOKENS.color.provider;
const GREEN = TOKENS.color.brand;
const GREEN_SOFT = TOKENS.color.brandSoft;

// Nova fotografia: prestador em contexto real de trabalho, luz natural.
const HERO_PROV = "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1000&auto=format&fit=crop";

export default function ProviderHomePage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  useEffect(() => { setUser(getSession()); }, []);

  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [kycStatus, setKycStatus] = useState<string | null>(null);

  const [available, setAvailable] = useState<ServiceListItem[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(true);

  const currentUserId = user?.id ?? user?.userId;

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

  // CORRIGIDO — mesmo bug da home do cliente: useCallback + cancelled
  // flag causava closure stale ao voltar do mapa, deixando o componente
  // preso com loadingAvailable:true e os onClick dos botões a não
  // responder. Substituído por useEffect com AbortController, criado
  // dentro do effect para nunca ser partilhado entre montagens.
  // fetchAvailable é extraída fora do useEffect para poder ser passada
  // como onActionComplete ao ProviderServiceActionCard.
  const fetchAvailable = useCallback(async () => {
    setLoadingAvailable(true);
    try {
      const [regular, quick] = await Promise.all([
        servicesApi.getAvailable(),
        subcategoryServicesApi.getAvailable(),
      ]);
      const unified = buildUnifiedList(regular, quick, { forProviderId: currentUserId });
      setAvailable(unified.slice(0, 3));
    } catch {
      setAvailable([]);
    } finally {
      setLoadingAvailable(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchAvailable();
  }, [fetchAvailable]);

  const heroStats = [
    { value: loadingStats ? "…" : stats ? String(stats.totalOrders) : "0", label: "Pedidos" },
    { value: loadingStats ? "…" : stats ? `${stats.totalEarnings.toLocaleString("pt-PT")} Kz` : "0 Kz", label: "Ganhos" },
    { value: loadingStats ? "…" : stats?.averageRating != null ? stats.averageRating.toFixed(1) : "—", label: "Avaliação" },
    { value: loadingStats ? "…" : String(unreadMessages), label: "Mensagens" },
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

        .ph-inline-stats{display:flex;gap:0;flex-wrap:wrap}
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
        .btn-ph-ghost{
          display:inline-flex;align-items:center;gap:6px;padding:12px 18px;border-radius:11px;
          background:#fff;border:1px solid ${LINE};color:${INK};font-size:13.5px;font-weight:600;
          cursor:pointer;font-family:inherit;white-space:nowrap;transition:all 0.18s ease;
        }
        /* CORRIGIDO — mesmo fix do sticky hover aplicado na home do
           cliente: em touch, :hover fica "preso" porque não há evento
           de "saída do cursor" para o desligar. @media(hover:hover)
           restringe o estilo a dispositivos com cursor real. */
        @media(hover:hover){
          .btn-ph-primary:hover{background:#1E293B}
          .btn-ph-ghost:hover{border-color:#CBD5E1}
        }
        /* Feedback de toque imediato — ver comentário equivalente em
           web/src/app/(dashboard)/home/page.tsx sobre por que :active
           é seguro em touch (ao contrário de :hover, não fica "colado"
           depois de soltar o dedo). */
        .btn-ph-primary:active{transform:scale(0.96)}
        .btn-ph-ghost:active{transform:scale(0.96)}

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
          width:38px;height:38px;border-radius:10px;background:${TOKENS.color.providerSoft};
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
        }
        .kyc-ico.verified{background:${GREEN_SOFT}}
        .btn-kyc{
          padding:9px 16px;border-radius:9px;background:${AMBER};color:#fff;font-size:12.5px;font-weight:700;
          cursor:pointer;border:none;font-family:inherit;white-space:nowrap;margin-left:auto;flex-shrink:0;
          transition:all .18s;
        }
        @media(hover:hover){
          .btn-kyc:hover{background:#D98E1A}
        }
        .btn-kyc:active{transform:scale(0.95)}

        /* ═══════════ SECTION HEADERS ═══════════ */
        .sec-hdr{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:16px;gap:16px}
        .psec-title{font-size:16.5px;font-weight:700;color:${INK};margin-bottom:4px;letter-spacing:-0.01em}
        .psec-sub{font-size:13px;color:${MUTED}}
        .sec-link{
          display:flex;align-items:center;gap:4px;font-size:13px;font-weight:600;color:${INK};
          background:#fff;border:1px solid ${LINE};cursor:pointer;font-family:inherit;padding:9px 14px;
          border-radius:10px;transition:all .18s;flex-shrink:0;
        }
        @media(hover:hover){
          .sec-link:hover{border-color:${AMBER};color:${AMBER}}
        }
        .sec-link:active{transform:scale(0.96)}

        .ph-empty{
          display:flex;flex-direction:column;align-items:flex-start;gap:10px;padding:24px;
          border:1px dashed ${LINE};border-radius:16px;background:#fff;
        }
        .ph-empty p{font-size:13.5px;color:${MUTED}}

        /* ═══════════ RESPONSIVE ═══════════ */
        /* A BottomNav (ver BottomNav.tsx) só existe nesta página
           (/provider-home) abaixo de 1024px — o mesmo breakpoint
           usado aqui. O espaço para ela deixou de ser reservado
           globalmente no body (globals.css) porque isso criava um gap
           vazio em TODAS as outras páginas do Provider, que nunca têm
           a barra. Agora soma-se ao padding-bottom de 64px que .ph já
           tinha (esse continua igual no desktop), só neste breakpoint. */
        @media(max-width:1024px){
          .ph{padding-bottom:calc(64px + ${BOTTOM_NAV_HEIGHT}px + ${BOTTOM_NAV_SAFE_AREA})}
          .ph-shell{padding:0 24px}
          .ph-welcome-row{grid-template-columns:1fr}
          .ph-photo{height:180px;order:-1}
        }
        @media(max-width:768px){
          .ph-shell{padding:0 16px}
          .ph-top{padding:76px 0 28px}
          .ph-name{font-size:21px}
          .ph-inline-stats{flex-wrap:wrap;row-gap:12px}
          .ph-cta-row{flex-direction:column;align-items:stretch}
          .ph-body{gap:26px;padding-top:26px}
          .kyc-row{flex-wrap:wrap}
          .btn-kyc{margin-left:0;width:100%;justify-content:center}
          .sec-hdr{flex-direction:column;align-items:flex-start;gap:10px}
        }
        @media(max-width:480px){
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
                  <button className="btn-ph-ghost" onClick={() => router.push("/provider/como-funciona")}>
                    Como funciona <ArrowRight size={14} />
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

          {/* ═══ PEDIDOS PERTO DE TI — foco principal da Home ═══ */}
          <div>
            <div className="sec-hdr">
              <div>
                <p className="psec-title">Pedidos perto de ti</p>
                <p className="psec-sub">Os mais recentes disponíveis na tua área</p>
              </div>
              <button className="sec-link" onClick={() => router.push("/provider/services")}>
                Ver todos <ChevronRight size={15} />
              </button>
            </div>

            {loadingAvailable ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: MUTED, fontSize: 13.5, padding: "12px 0" }}>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> A carregar...
              </div>
            ) : available.length === 0 ? (
              <div className="ph-empty">
                <ShoppingBag size={22} style={{ color: FAINT }} />
                <p>Ainda não há pedidos disponíveis na tua área. Verifica se a tua localização está activa no perfil.</p>
              </div>
            ) : (
              available.map((item) => (
                <ProviderServiceActionCard
                  key={item.id}
                  item={item}
                  tab="available"
                  onActionComplete={fetchAvailable}
                />
              ))
            )}
          </div>

        </div>
      </div>
    </>
  );
}