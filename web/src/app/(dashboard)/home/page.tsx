"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  Shield, ChevronRight, ChevronDown, ArrowRight, Zap, MapPin,
  Star, MessageCircle, Search, Navigation,
  KeyRound, LifeBuoy, FileText,
  Sparkles, Wind, Wrench, Monitor, Leaf,
  Package, Scissors, Car, Paintbrush, HardHat, Lock,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────
   DESIGN NOTES (aplicando o prompt de redesign a esta Home de Cliente)

   Este ficheiro é a Home pública/de cliente, não a Home do Provider — não
   existem aqui KYC, estatísticas de ganhos, "Primeiros passos" nem chamadas
   a servicesApi.getProviderStats(). Isso pertence a outra página e não foi
   inventado aqui.

   O que foi aplicado do prompt (é transversal ao produto):
   - Light Mode: fundo branco/off-white, texto quase-preto.
   - Muito menos cor: a antiga paleta de 12 tons por categoria foi reduzida
     a UM accent de marca (emerald) + tons neutros de cinza para ícones.
     O dourado do Provider (#EF9F27) foi isolado exclusivamente no bloco
     "És prestador?", que é precisamente onde faz sentido semanticamente.
   - Números/labels a preto (#0F172A), nunca coloridos.
   - Cards com fundo branco, borda cinza clara, sombra muito discreta.
   - Sem gradientes multicoloridos, sem glow, sem glassmorphism.
   - Nova fotografia de hero (pessoa a trabalhar, contexto real).
   - Nenhuma API, rota ou funcionalidade foi alterada ou removida.
────────────────────────────────────────────────────────────────────────── */

// Cor de marca única para o cliente. O dourado do Provider fica reservado
// só para a secção "És prestador?".
const BRAND = "#0E7A5F";
const BRAND_SOFT = "#EAF4F0";
const INK = "#12181B";
const MUTED = "#6B7280";
const LINE = "#E7E5E0";
const PROVIDER = "#EF9F27";
const PROVIDER_SOFT = "#FCEFDA";

// Categorias — mesmos 12 itens, mesma rota de clique. A cor deixou de
// variar por categoria (isso é o que produzia o efeito "dashboard de IA");
// todos os ícones usam agora o mesmo par neutro, com o accent de marca
// reservado a estados de hover/interação.
const CATS = [
  { Icon: Sparkles,   label: "Limpeza",       desc: "Casas, escritórios e mais" },
  { Icon: Wind,       label: "Climatização",  desc: "Instalação e manutenção" },
  { Icon: Wrench,     label: "Canalização",   desc: "Reparações e instalações" },
  { Icon: Zap,        label: "Eletricista",   desc: "Instalações e reparações" },
  { Icon: Monitor,    label: "TI & Redes",    desc: "Suporte e redes informáticas" },
  { Icon: Leaf,       label: "Jardinagem",    desc: "Manutenção de jardins" },
  { Icon: Package,    label: "Mudanças",      desc: "Transporte e mudanças" },
  { Icon: Scissors,   label: "Beleza",        desc: "Cabeleireiro e estética" },
  { Icon: Car,        label: "Automóvel",     desc: "Reparação e manutenção" },
  { Icon: Paintbrush, label: "Pintura",       desc: "Interior e exterior" },
  { Icon: HardHat,    label: "Construção",    desc: "Obras e remodelações" },
  { Icon: Lock,       label: "Segurança",     desc: "Sistemas e monitorização" },
];

// Passo a passo — mesmos 9 passos, mesma lógica de "ver todos" (3 + resto).
const STEPS = [
  { Icon: Search,        title: "Pesquisa",                    desc: "Encontra prestadores verificados por categoria, nome ou localização no mapa." },
  { Icon: FileText,      title: "Serviço personalizado",       desc: "Descreves o serviço em detalhe, defines o orçamento e envias o pedido a um prestador específico." },
  { Icon: Zap,           title: "Serviço rápido",               desc: "Escolhes categoria e morada — vários prestadores da área enviam propostas de preço." },
  { Icon: Shield,        title: "Combina e paga em segurança",  desc: "Acorda o preço pelo chat, paga por transferência e o dinheiro fica protegido até confirmares." },
  { Icon: Navigation,    title: "Acompanha em tempo real",      desc: "Vê o prestador a chegar no mapa, com distância e tempo estimado." },
  { Icon: KeyRound,      title: "Confirma com PIN",             desc: "No local, dás um código único ao prestador para confirmar o início do serviço." },
  { Icon: Star,          title: "Avalia o serviço",             desc: "No fim, confirma a conclusão e deixa uma avaliação para ajudar outros clientes." },
  { Icon: MessageCircle, title: "Fala sempre pelo chat",        desc: "Todas as combinações ficam registadas na app, para tua proteção em caso de dúvida." },
  { Icon: LifeBuoy,      title: "Resolve disputas com apoio",   desc: "Se algo correr mal, a nossa equipa está disponível para mediar e resolver." },
];

const FEATS = [
  { Icon: Shield,   title: "Pagamento protegido",     desc: "Valor retido e só libertado quando confirmas a conclusão." },
  { Icon: Star,     title: "Prestadores verificados", desc: "Todos passam por verificação de identidade antes de serem aceites." },
  { Icon: MapPin,   title: "Geolocalização",          desc: "Prestadores no teu raio com tempo estimado de chegada." },
  { Icon: Zap,      title: "Resposta rápida",         desc: "Os melhores prestadores respondem em minutos pelo chat." },
];

const STATS = [
  { value: "500+", label: "Prestadores" },
  { value: "12",   label: "Categorias" },
  { value: "4.9★", label: "Avaliação média" },
];

// Nova fotografia: pessoa a trabalhar num contexto real (eletricista em
// ação, luz natural), não um retrato de stock a sorrir para a câmara.
const HERO = "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1400&auto=format&fit=crop";

export default function HomePage() {
  const router = useRouter();
  const [showAllSteps, setShowAllSteps] = useState(false);
  const [heroImgOk, setHeroImgOk] = useState(true);

  const visibleSteps = showAllSteps ? STEPS : STEPS.slice(0, 3);

  return (
    <>
      <style>{`
        .hw{display:flex;min-height:100vh;background:#FFFFFF}
        .hm{flex:1;margin-left:240px;display:flex;flex-direction:column;min-width:0;overflow-x:hidden}
        .hi{padding:32px;display:flex;flex-direction:column;gap:72px;max-width:1220px}

        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp 0.5s cubic-bezier(.16,1,.3,1) both}

        /* ═══════════ HERO — composição editorial, assimétrica ═══════════ */
        .h-hero{display:grid;grid-template-columns:1.05fr 0.95fr;gap:40px;align-items:stretch}
        .h-hero-copy{display:flex;flex-direction:column;justify-content:center;padding:8px 0}
        .h-eyebrow{display:inline-flex;align-items:center;gap:8px;margin-bottom:20px}
        .h-eyebrow-dot{width:6px;height:6px;border-radius:50%;background:${BRAND}}
        .h-title{
          font-size:42px;font-weight:700;color:${INK};line-height:1.1;
          letter-spacing:-0.03em;margin-bottom:18px;
        }
        .h-title em{font-style:normal;color:${BRAND}}
        .h-sub{font-size:16px;color:${MUTED};line-height:1.65;max-width:420px;margin-bottom:32px}

        .h-cta-row{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:40px}
        .btn-primary{
          display:inline-flex;align-items:center;gap:8px;padding:14px 24px;border-radius:12px;border:none;
          background:${INK};color:#fff;font-size:14.5px;font-weight:600;cursor:pointer;
          font-family:inherit;white-space:nowrap;transition:all 0.18s;
        }
        .btn-primary:hover{background:#000;transform:translateY(-1px)}
        .btn-secondary{
          display:inline-flex;align-items:center;gap:8px;padding:14px 22px;border-radius:12px;
          background:#fff;border:1px solid ${LINE};color:${INK};font-size:14.5px;font-weight:600;
          cursor:pointer;font-family:inherit;transition:all .18s;white-space:nowrap;
        }
        .btn-secondary:hover{border-color:${BRAND};color:${BRAND}}

        .h-stats-row{display:flex;gap:36px;padding-top:24px;border-top:1px solid ${LINE}}
        .h-stat b{font-size:22px;font-weight:700;display:block;line-height:1;color:${INK}}
        .h-stat span{font-size:12.5px;color:${MUTED};margin-top:6px;display:block}

        .h-hero-media{position:relative;border-radius:20px;overflow:hidden;background:#F1F0EC;min-height:420px}
        .h-hero-media img{width:100%;height:100%;object-fit:cover;display:block;position:absolute;inset:0}
        .h-hero-fallback{
          width:100%;height:100%;display:flex;align-items:center;justify-content:center;
          background:${BRAND_SOFT};position:absolute;inset:0;
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

        /* ═══════════ SECTION HEADERS ═══════════ */
        .sec-hdr{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:28px;gap:16px}
        .sec-eyebrow{font-size:11.5px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND};margin-bottom:8px;display:block}
        .sec-title{font-size:23px;font-weight:700;color:${INK};letter-spacing:-0.02em}
        .sec-sub{font-size:14px;color:${MUTED};margin-top:5px}
        .sec-link{
          display:flex;align-items:center;gap:4px;font-size:13.5px;font-weight:600;color:${INK};
          background:#fff;border:1px solid ${LINE};cursor:pointer;font-family:inherit;padding:10px 16px;
          border-radius:10px;transition:all .18s;flex-shrink:0;
        }
        .sec-link:hover{border-color:${BRAND};color:${BRAND}}

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

        /* ═══════════ COMO FUNCIONA ═══════════ */
        .steps-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
        .step-card{
          background:#FFFFFF;border:1px solid ${LINE};border-radius:16px;padding:22px 20px;
          transition:all 0.2s;
        }
        .step-card:hover{border-color:#D6D3CB;box-shadow:0 6px 18px rgba(15,23,42,0.05)}
        .step-badge{
          display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;
          border-radius:8px;background:#F4F4F2;color:${MUTED};font-size:11px;font-weight:700;margin-bottom:16px;
        }
        .step-card-ico{
          width:40px;height:40px;border-radius:11px;background:${BRAND_SOFT};
          display:flex;align-items:center;justify-content:center;margin-bottom:14px;
        }
        .step-card h3{font-size:14.5px;font-weight:600;color:${INK};margin-bottom:7px}
        .step-card p{font-size:12.5px;color:${MUTED};line-height:1.6}

        .steps-more-wrap{display:flex;justify-content:center;margin-top:20px}
        .btn-steps-more{
          display:inline-flex;align-items:center;gap:6px;padding:11px 20px;border-radius:11px;
          background:#fff;border:1px solid ${LINE};color:${INK};font-size:13px;font-weight:600;
          cursor:pointer;font-family:inherit;transition:all 0.18s ease;
        }
        .btn-steps-more:hover{border-color:${BRAND};color:${BRAND}}
        .btn-steps-more svg{transition:transform 0.2s ease}
        .btn-steps-more.open svg{transform:rotate(180deg)}

        /* ═══════════ VANTAGENS ═══════════ */
        .feats-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
        .feat-strip-card{background:#FFFFFF;border:1px solid ${LINE};border-radius:14px;padding:18px;transition:all .2s}
        .feat-strip-card:hover{border-color:#D6D3CB}
        .feat-strip-ico{
          width:34px;height:34px;border-radius:10px;background:#F4F4F2;
          display:flex;align-items:center;justify-content:center;margin-bottom:12px;
        }
        .feat-strip-card h3{font-size:13px;font-weight:600;color:${INK};margin-bottom:5px}
        .feat-strip-card p{font-size:11.5px;color:${MUTED};line-height:1.55}

        /* ═══════════ CTA PRESTADOR — único lugar com o dourado do Provider ═══════════ */
        .pcta-banner{
          border-radius:20px;padding:38px 42px;position:relative;overflow:hidden;
          background:${PROVIDER_SOFT};border:1px solid #F3DDA9;
          display:flex;align-items:center;justify-content:space-between;gap:32px;flex-wrap:wrap;
        }
        .pcta-copy{max-width:460px}
        .pcta-eyebrow{
          display:inline-flex;align-items:center;gap:7px;font-size:11px;font-weight:700;
          letter-spacing:0.08em;text-transform:uppercase;color:${PROVIDER};margin-bottom:12px;
        }
        .pcta-copy h2{font-size:22px;font-weight:700;color:${INK};margin-bottom:8px;letter-spacing:-0.01em}
        .pcta-copy p{font-size:14px;color:${MUTED};line-height:1.6}
        .btn-provider{
          flex-shrink:0;padding:14px 26px;border-radius:12px;background:${PROVIDER};color:#fff;
          font-size:14px;font-weight:600;cursor:pointer;border:none;font-family:inherit;
          white-space:nowrap;transition:all 0.2s;display:inline-flex;align-items:center;gap:8px;
        }
        .btn-provider:hover{background:#D9880F;transform:translateY(-1px)}

        /* ═══════════ RESPONSIVE ═══════════ */
        @media(max-width:1200px){
          .cat-grid{grid-template-columns:repeat(3,1fr)}
          .feats-strip{grid-template-columns:repeat(2,1fr)}
        }
        @media(max-width:1024px){
          .hm{margin-left:0}
          .hi{padding:80px 20px 40px;gap:56px}
          .h-hero{grid-template-columns:1fr;gap:28px}
          .h-hero-media{min-height:260px;order:-1}
          .h-title{font-size:32px}
          .steps-grid{grid-template-columns:repeat(2,1fr)}
        }
        @media(max-width:768px){
          .hi{padding:72px 16px 32px;gap:44px}
          .h-title{font-size:27px}
          .h-cta-row{flex-direction:column;align-items:stretch}
          .h-stats-row{gap:24px}
          .cat-grid{grid-template-columns:repeat(2,1fr)}
          .steps-grid{grid-template-columns:1fr}
          .feats-strip{grid-template-columns:1fr}
          .sec-hdr{flex-direction:column;align-items:flex-start}
          .pcta-banner{flex-direction:column;text-align:center;align-items:center;padding:32px 24px}
          .pcta-copy{text-align:center}
        }
        @media(max-width:480px){
          .hi{padding:68px 12px 28px}
          .h-hero-media{min-height:220px}
          .cat-grid{grid-template-columns:1fr 1fr}
          .h-stats-row{flex-wrap:wrap;row-gap:16px}
        }
      `}</style>

      <div className="hw">
        <Sidebar />
        <div className="hm">
          <Navbar />
          <main className="hi">

            {/* ═══ HERO ═══ */}
            <section className="h-hero fade-up">
              <div className="h-hero-copy">
                <span className="h-eyebrow">
                  <span className="h-eyebrow-dot" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: MUTED, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    Mestroo · Angola
                  </span>
                </span>
                <h1 className="h-title">Encontra o serviço<br /><em>certo, perto de ti.</em></h1>
                <p className="h-sub">Prestadores verificados com geolocalização, avaliações reais e pagamento 100% protegido.</p>

                <div className="h-cta-row">
                  <button className="btn-primary" onClick={() => router.push("/search")}>
                    <Search size={16} /> Encontrar prestador
                  </button>
                  <button className="btn-secondary" onClick={() => router.push("/register/provider")}>
                    Sou prestador <ArrowRight size={14} />
                  </button>
                </div>

                <div className="h-stats-row">
                  {STATS.map((s, i) => (
                    <div className="h-stat" key={i}>
                      <b>{s.value}</b>
                      <span>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-hero-media">
                {heroImgOk ? (
                  <img
                    src={HERO}
                    alt="Prestador profissional a trabalhar"
                    loading="lazy"
                    onError={() => setHeroImgOk(false)}
                  />
                ) : (
                  <div className="h-hero-fallback">
                    <Wrench size={64} color={BRAND} />
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

            {/* ═══ CATEGORIAS ═══ */}
            <section className="fade-up">
              <div className="sec-hdr">
                <div>
                  <span className="sec-eyebrow">Categorias</span>
                  <h2 className="sec-title">Escolhe a categoria que precisas</h2>
                  <p className="sec-sub">12 especialidades disponíveis em Luanda</p>
                </div>
                <button className="sec-link" onClick={() => router.push("/categories")}>
                  Ver todas <ChevronRight size={15} />
                </button>
              </div>
              <div className="cat-grid">
                {CATS.map((cat, i) => {
                  const Icon = cat.Icon;
                  return (
                    <button
                      key={i}
                      className="cat-card"
                      onClick={() => router.push(`/search?category=${encodeURIComponent(cat.label)}`)}
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

            {/* ═══ COMO FUNCIONA ═══ */}
            <section className="fade-up">
              <div className="sec-hdr">
                <div>
                  <span className="sec-eyebrow">Como funciona</span>
                  <h2 className="sec-title">Do pedido à conclusão, passo a passo</h2>
                </div>
              </div>
              <div className="steps-grid">
                {visibleSteps.map((s, i) => {
                  const Icon = s.Icon;
                  return (
                    <div className="step-card" key={s.title}>
                      <div className="step-badge">{String(i + 1).padStart(2, "0")}</div>
                      <div className="step-card-ico">
                        <Icon size={20} color={BRAND} />
                      </div>
                      <h3>{s.title}</h3>
                      <p>{s.desc}</p>
                    </div>
                  );
                })}
              </div>
              <div className="steps-more-wrap">
                <button
                  className={`btn-steps-more${showAllSteps ? " open" : ""}`}
                  onClick={() => setShowAllSteps((v) => !v)}
                >
                  {showAllSteps ? "Ver menos" : "Ver todos os passos"} <ChevronDown size={15} />
                </button>
              </div>
            </section>

            {/* ═══ VANTAGENS ═══ */}
            <section className="fade-up">
              <div className="sec-hdr">
                <div>
                  <span className="sec-eyebrow">Vantagens</span>
                  <h2 className="sec-title">Porquê a Mestroo?</h2>
                  <p className="sec-sub">A plataforma mais segura de Angola</p>
                </div>
              </div>
              <div className="feats-strip">
                {FEATS.map((f, i) => {
                  const Icon = f.Icon;
                  return (
                    <div key={i} className="feat-strip-card">
                      <div className="feat-strip-ico">
                        <Icon size={17} color={MUTED} />
                      </div>
                      <h3>{f.title}</h3>
                      <p>{f.desc}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ═══ CTA PRESTADOR ═══ */}
            <section className="fade-up">
              <div className="pcta-banner">
                <div className="pcta-copy">
                  <span className="pcta-eyebrow"><Zap size={13} /> Para prestadores</span>
                  <h2>És prestador?</h2>
                  <p>Regista-te e começa a receber clientes hoje.</p>
                </div>
                <button className="btn-provider" onClick={() => router.push("/register/provider")}>
                  Criar perfil <ArrowRight size={16} />
                </button>
              </div>
            </section>

          </main>
        </div>
      </div>
    </>
  );
}