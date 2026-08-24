"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  MapPin, Briefcase, HelpCircle, ArrowRight, Loader2, Shield, Wrench,
  Sparkles, Wind, Zap, Monitor, Leaf,
  Package, Scissors, Car, Paintbrush, HardHat, Lock,
} from "lucide-react";
import { servicesApi } from "@/lib/services.api";
import { buildUnifiedList, ServiceListItem } from "@/lib/service-list-item";
import { getSession } from "@/lib/auth.api";
import ServiceCard from "@/components/services/ServiceCard";
import { TOKENS } from "@/lib/design-tokens";

/* ─────────────────────────────────────────────────────────────────────────
   DESIGN NOTES (v2 — Home como app real, não landing page)

   O que mudou em relação à versão anterior e porquê:

   1. "Como funciona" (9 passos) e "Vantagens" (4 features) SAÍRAM daqui.
      Um cliente que já fez login já se registou — já viu essa informação
      na landing pública antes de criar conta. Repeti-la aqui, sempre,
      para todos, era o principal sintoma de "página gerada": conteúdo
      institucional na primeira tela de uma app já em uso.
      NADA foi apagado — o texto exacto (mesmos títulos, mesmas
      descrições) vive agora em /como-funciona, acessível permanentemente
      a partir da Sidebar (secção "Conta"), em qualquer ecrã da app —
      não só a partir da Home. Ver app/(dashboard)/como-funciona/page.tsx.

   2. O CTA "És prestador?" também saiu — é copy de conversão de
      visitante anónimo; não faz sentido para um cliente já autenticado.

   3. NÃO entrou nenhum campo de pesquisa aqui — o Navbar (montado por
      cima desta página) já tem a barra "Pesquise um serviço..." que
      navega para /search; duplicar era repetir a mesma acção duas
      vezes na mesma tela. No lugar entrou um hero editorial (foto real
      + selo de confiança), pensado para ser a primeira coisa que um
      cliente vê ao entrar na conta pela primeira vez — visual, não
      mais um controlo de pesquisa a competir com o do Navbar.

   4. Entrou o bloco "Os teus pedidos": usa servicesApi.getMyServices()
      (já existia, não estava a ser chamado por esta página) e o mesmo
      ServiceCard que a página /services já usa para desenhar cada
      pedido — por isso o visual e o comportamento (clique, estado,
      preço) são idênticos aos que o cliente já conhece de lá. Só
      aparece se existir pelo menos um pedido; um cliente sem pedidos
      não vê uma secção vazia.

   O que ficou exactamente igual: Sidebar, Navbar, BottomNav, as 12
   categorias (mesmo destino de clique — /services/new?category=...),
   nenhuma API nova, nenhuma rota nova a não ser /como-funciona.
────────────────────────────────────────────────────────────────────────── */

const BRAND = TOKENS.color.brand;
const BRAND_SOFT = TOKENS.color.brandSoft;
const INK = TOKENS.color.ink;
const MUTED = TOKENS.color.muted;
const LINE = TOKENS.color.line;

// Fotografia editorial do hero — distinta da usada em provider-home
// (HERO_PROV), para os dois lados não repetirem a mesma imagem.
const HERO_CLIENT = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop";

// Categorias — mesmos 12 itens, mesma rota de clique de antes.
const CATS = [
  { Icon: Sparkles,   label: "Limpeza",       desc: "Casas, escritórios e mais" },
  { Icon: Wind,       label: "Climatização",  desc: "Instalação e manutenção" },
  { Icon: Wrench,     label: "Canalização",   desc: "Reparações e instalações" },
  { Icon: Zap,        label: "Eletricidade",  desc: "Instalações e reparações" },
  { Icon: Monitor,    label: "TI & Redes",    desc: "Suporte e redes informáticas" },
  { Icon: Leaf,       label: "Jardinagem",    desc: "Manutenção de jardins" },
  { Icon: Package,    label: "Mudanças",      desc: "Transporte e mudanças" },
  { Icon: Scissors,   label: "Beleza",        desc: "Cabeleireiro e estética" },
  { Icon: Car,        label: "Automóvel",     desc: "Reparação e manutenção" },
  { Icon: Paintbrush, label: "Pintura",       desc: "Interior e exterior" },
  { Icon: HardHat,    label: "Construção",    desc: "Obras e remodelações" },
  { Icon: Lock,       label: "Segurança",     desc: "Sistemas e monitorização" },
];

export default function HomePage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [heroImgOk, setHeroImgOk] = useState(true);

  const [myItems, setMyItems] = useState<ServiceListItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (session?.fullName) setFirstName(session.fullName.split(" ")[0]);
  }, []);

  const fetchMyServices = useCallback(async () => {
    setLoadingItems(true);
    try {
      const services = await servicesApi.getMyServices();
      setMyItems(buildUnifiedList(services, []).slice(0, 3));
    } catch {
      setMyItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchMyServices();
      if (cancelled) return;
    })();
    return () => { cancelled = true; };
  }, [fetchMyServices]);

  return (
    <>
      <style>{`
        .hw{display:flex;min-height:100vh;background:#FFFFFF}
        .hm{flex:1;margin-left:240px;display:flex;flex-direction:column;min-width:0;overflow-x:hidden}
        .hi{padding:32px;display:flex;flex-direction:column;gap:44px;max-width:1220px}

        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .fade-up{animation:fadeUp 0.5s cubic-bezier(.16,1,.3,1) both}

        /* ═══════════ SAUDAÇÃO + HERO EDITORIAL ═══════════ */
        .h-greet{font-size:26px;font-weight:700;color:${INK};letter-spacing:-0.02em;margin-bottom:4px}
        .h-greet-sub{font-size:14.5px;color:${MUTED};margin-bottom:22px}

        .h-hero-media{position:relative;border-radius:20px;overflow:hidden;background:#F1F0EC;min-height:220px}
        .h-hero-media img{width:100%;height:100%;object-fit:cover;display:block;position:absolute;inset:0}
        .h-hero-fallback{
          width:100%;height:100%;display:flex;align-items:center;justify-content:center;
          background:${BRAND_SOFT};position:absolute;inset:0;min-height:220px;
        }
        .h-hero-caption{
          position:absolute;left:20px;bottom:20px;right:20px;z-index:2;
          background:rgba(255,255,255,0.92);backdrop-filter:blur(6px);
          border-radius:12px;padding:14px 16px;display:flex;align-items:center;gap:12px;
          box-shadow:0 8px 24px rgba(15,23,42,0.10);
        }
        .h-hero-caption-ico{
          width:34px;height:34px;border-radius:9px;background:${BRAND_SOFT};flex-shrink:0;
          display:flex;align-items:center;justify-content:center;
        }
        .h-hero-caption p:first-child{font-size:12.5px;font-weight:700;color:${INK}}
        .h-hero-caption p:last-child{font-size:11px;color:${MUTED};margin-top:1px}

        /* ═══════════ AÇÕES RÁPIDAS ═══════════ */
        .h-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        .h-action{
          display:flex;align-items:center;gap:12px;padding:16px 18px;border-radius:14px;
          background:#fff;border:1px solid ${LINE};cursor:pointer;text-align:left;transition:all .18s;
        }
        .h-action:hover{border-color:${BRAND};box-shadow:0 6px 18px rgba(15,23,42,0.06)}
        .h-action-ico{width:38px;height:38px;border-radius:11px;background:${BRAND_SOFT};display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .h-action-label{font-size:13.5px;font-weight:600;color:${INK}}
        .h-action-desc{font-size:11.5px;color:${MUTED};margin-top:1px}

        /* ═══════════ SECTION HEADERS ═══════════ */
        .sec-hdr{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:20px;gap:16px}
        .sec-title{font-size:18px;font-weight:700;color:${INK};letter-spacing:-0.01em}
        .sec-sub{font-size:13px;color:${MUTED};margin-top:3px}
        .sec-link{
          display:flex;align-items:center;gap:4px;font-size:13px;font-weight:600;color:${INK};
          background:#fff;border:1px solid ${LINE};cursor:pointer;font-family:inherit;padding:9px 14px;
          border-radius:10px;transition:all .18s;flex-shrink:0;
        }
        .sec-link:hover{border-color:${BRAND};color:${BRAND}}

        /* ═══════════ OS TEUS PEDIDOS ═══════════ */
        .h-empty-orders{
          display:flex;flex-direction:column;align-items:flex-start;gap:10px;padding:24px;
          border:1px dashed ${LINE};border-radius:16px;background:#FAFAF8;
        }
        .h-empty-orders p{font-size:13.5px;color:${MUTED}}

        /* ═══════════ CATEGORIAS — monocromáticas, accent só no hover ═══════════ */
        .cat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
        .cat-card{
          position:relative;border-radius:16px;padding:20px 18px;
          background:#FFFFFF;border:1px solid ${LINE};cursor:pointer;text-align:left;
          transition:all 0.2s cubic-bezier(.16,1,.3,1);
        }
        .cat-card:hover{
          border-color:${BRAND};
          box-shadow:0 6px 18px rgba(15,23,42,0.06);
        }
        .cat-card-ico{
          width:40px;height:40px;border-radius:11px;background:#F4F4F2;
          display:flex;align-items:center;justify-content:center;margin-bottom:14px;
          transition:background .2s;
        }
        .cat-card:hover .cat-card-ico{background:${BRAND_SOFT}}
        .cat-card:hover .cat-card-ico svg{color:${BRAND}}
        .cat-card-label{font-size:14px;font-weight:600;color:${INK};margin-bottom:3px}
        .cat-card-desc{font-size:11.5px;color:${MUTED};line-height:1.4}

        /* ═══════════ RESPONSIVE ═══════════ */
        @media(max-width:1200px){
          .cat-grid{grid-template-columns:repeat(3,1fr)}
        }
        @media(max-width:1024px){
          .hm{margin-left:0}
          .hi{padding:80px 20px 40px;gap:36px}
          .h-actions{grid-template-columns:1fr}
        }
        @media(max-width:768px){
          .hi{padding:72px 16px 32px;gap:32px}
          .h-hero-media{min-height:180px}
          .cat-grid{grid-template-columns:repeat(2,1fr)}
          .sec-hdr{flex-direction:column;align-items:flex-start}
        }
        @media(max-width:480px){
          .hi{padding:68px 12px 28px}
          .cat-grid{grid-template-columns:1fr 1fr}
        }
      `}</style>

      <div className="hw">
        <Sidebar />
        <div className="hm">
          <Navbar />
          <main className="hi">

            {/* ═══ SAUDAÇÃO + HERO ═══ */}
            <section className="fade-up">
              <p className="h-greet">{firstName ? `Olá, ${firstName}` : "Olá"}</p>
              <p className="h-greet-sub">O que precisas hoje?</p>

              <div className="h-hero-media">
                {heroImgOk ? (
                  <img
                    src={HERO_CLIENT}
                    alt="Prestador profissional a trabalhar"
                    loading="lazy"
                    onError={() => setHeroImgOk(false)}
                  />
                ) : (
                  <div className="h-hero-fallback">
                    <Wrench size={48} color={BRAND} />
                  </div>
                )}
                <div className="h-hero-caption">
                  <div className="h-hero-caption-ico"><Shield size={16} color={BRAND} /></div>
                  <div>
                    <p>Pagamento protegido</p>
                    <p>Só liberto quando confirmas o serviço</p>
                  </div>
                </div>
              </div>
            </section>

            {/* ═══ AÇÕES RÁPIDAS ═══ */}
            <section className="fade-up">
              <div className="h-actions">
                <button className="h-action" onClick={() => router.push("/map")}>
                  <div className="h-action-ico"><MapPin size={18} color={BRAND} /></div>
                  <div>
                    <p className="h-action-label">Ver mapa</p>
                    <p className="h-action-desc">Prestadores perto de ti</p>
                  </div>
                </button>
                <button className="h-action" onClick={() => router.push("/services")}>
                  <div className="h-action-ico"><Briefcase size={18} color={BRAND} /></div>
                  <div>
                    <p className="h-action-label">Os meus pedidos</p>
                    <p className="h-action-desc">Ver todos e acompanhar</p>
                  </div>
                </button>
                <button className="h-action" onClick={() => router.push("/como-funciona")}>
                  <div className="h-action-ico"><HelpCircle size={18} color={BRAND} /></div>
                  <div>
                    <p className="h-action-label">Como funciona</p>
                    <p className="h-action-desc">Passo a passo e segurança</p>
                  </div>
                </button>
              </div>
            </section>

            {/* ═══ OS TEUS PEDIDOS — só aparece se houver algo a mostrar ═══ */}
            {(loadingItems || myItems.length > 0) && (
              <section className="fade-up">
                <div className="sec-hdr">
                  <div>
                    <p className="sec-title">Os teus pedidos</p>
                    <p className="sec-sub">Os mais recentes, com o estado actual</p>
                  </div>
                  <button className="sec-link" onClick={() => router.push("/services")}>
                    Ver todos <ArrowRight size={14} />
                  </button>
                </div>
                {loadingItems ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: MUTED, fontSize: 13.5, padding: "12px 0" }}>
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> A carregar...
                  </div>
                ) : (
                  myItems.map((item) => (
                    <ServiceCard key={item.id} item={item} detailBasePath="/services" />
                  ))
                )}
              </section>
            )}

            {/* ═══ CATEGORIAS ═══ */}
            <section className="fade-up">
              <div className="sec-hdr">
                <div>
                  <p className="sec-title">Categorias</p>
                  <p className="sec-sub">Escolhe a categoria que precisas</p>
                </div>
                <button className="sec-link" onClick={() => router.push("/categories")}>
                  Ver subcategorias <ArrowRight size={14} />
                </button>
              </div>
              <div className="cat-grid">
                {CATS.map((cat, i) => {
                  const Icon = cat.Icon;
                  return (
                    <button
                      key={i}
                      className="cat-card"
                      onClick={() => router.push(`/services/new?category=${encodeURIComponent(cat.label)}`)}
                    >
                      <div className="cat-card-ico">
                        <Icon size={19} color={MUTED} />
                      </div>
                      <p className="cat-card-label">{cat.label}</p>
                      <p className="cat-card-desc">{cat.desc}</p>
                    </button>
                  );
                })}
              </div>
            </section>

          </main>
        </div>
      </div>
    </>
  );
}