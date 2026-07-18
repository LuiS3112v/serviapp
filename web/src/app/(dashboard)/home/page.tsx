"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  Shield, ChevronRight, ChevronDown, ArrowRight, Zap, MapPin,
  Star, CheckCircle, MessageCircle, Search, Navigation,
  KeyRound, LifeBuoy, FileText,
  Sparkles, Wind, Wrench, Monitor, Leaf,
  Package, Scissors, Car, Paintbrush, HardHat, Lock, Users,
} from "lucide-react";

// ── CATEGORIAS ──────────────────────────────────────────────────────────────
// ÚNICA mudança neste ficheiro: card neutro (fundo/borda/texto sem cor), com
// a cor da categoria confinada ao chip do ícone pequeno (fundo + borda a
// baixa opacidade, ícone em cor cheia) e ao ícone gigante de fundo tipo
// marca de água (opacity bem baixa). Tamanho do card mantido.
const CATS = [
  { Icon: Sparkles,   label: "Limpeza",       desc: "Casas, escritórios e mais",    color: "#1D9E75" },
  { Icon: Wind,       label: "Climatização",  desc: "Instalação e manutenção",      color: "#38bdf8" },
  { Icon: Wrench,     label: "Canalização",   desc: "Reparações e instalações",     color: "#a78bfa" },
  { Icon: Zap,        label: "Eletricista",   desc: "Instalações e reparações",     color: "#fbbf24" },
  { Icon: Monitor,    label: "TI & Redes",    desc: "Suporte e redes informáticas", color: "#60a5fa" },
  { Icon: Leaf,       label: "Jardinagem",    desc: "Manutenção de jardins",        color: "#34d399" },
  { Icon: Package,    label: "Mudanças",      desc: "Transporte e mudanças",        color: "#fb923c" },
  { Icon: Scissors,   label: "Beleza",        desc: "Cabeleireiro e estética",      color: "#f472b6" },
  { Icon: Car,        label: "Automóvel",     desc: "Reparação e manutenção",       color: "#93c5fd" },
  { Icon: Paintbrush, label: "Pintura",       desc: "Interior e exterior",          color: "#e879f9" },
  { Icon: HardHat,    label: "Construção",    desc: "Obras e remodelações",         color: "#fb923c" },
  { Icon: Lock,       label: "Segurança",     desc: "Sistemas e monitorização",     color: "#818cf8" },
];

// ── PASSO A PASSO ────────────────────────────────────────────────────────────
// 3 sempre visíveis + 5 atrás de "Ver todos" (8 no total). Estrutura de
// card idêntica à anterior (número, ícone, título, descrição) — só o
// conteúdo e a quantidade mudaram. `num` é gerado pelo índice.
const STEPS = [
  { Icon: Search,        color: "#1D9E75", bg: "#0b2a20", title: "Pesquisa",                    desc: "Encontra prestadores verificados por categoria, nome ou localização no mapa." },
  { Icon: FileText,      color: "#60a5fa", bg: "#0a1a2e", title: "Pede o serviço",               desc: "Descreve o que precisas, propõe um orçamento e envia o pedido ao prestador escolhido." },
  { Icon: Shield,        color: "#378ADD", bg: "#071830", title: "Combina e paga em segurança",  desc: "Acorda o preço pelo chat, paga por transferência e o dinheiro fica protegido até confirmares o serviço." },
  { Icon: Navigation,    color: "#EF9F27", bg: "#271a05", title: "Acompanha em tempo real",      desc: "Vê o prestador a chegar no mapa, com distância e tempo estimado, assim que ele aceitar o pedido." },
  { Icon: KeyRound,      color: "#8B5CF6", bg: "#1a1030", title: "Confirma com PIN",             desc: "No local, dás um código único ao prestador para confirmares que o serviço começou de forma segura." },
  { Icon: Star,          color: "#EF9F27", bg: "#271a05", title: "Avalia o serviço",             desc: "No fim, confirma a conclusão e deixa uma avaliação para ajudar outros clientes." },
  { Icon: MessageCircle, color: "#378ADD", bg: "#071830", title: "Fala sempre pelo chat",        desc: "Todas as combinações ficam registadas na app, para tua proteção em caso de dúvida." },
  { Icon: LifeBuoy,      color: "#D4537E", bg: "#2a0f1a", title: "Resolve disputas com apoio",   desc: "Se algo correr mal, a nossa equipa está disponível para mediar e resolver." },
];

const FEATS = [
  { Icon: Shield,   color: "#1D9E75", title: "Pagamento protegido",    desc: "Valor retido e só libertado quando confirmas a conclusão." },
  { Icon: Star,     color: "#EF9F27", title: "Prestadores verificados", desc: "Todos passam por verificação de identidade antes de serem aceites." },
  { Icon: MapPin,   color: "#378ADD", title: "Geolocalização",          desc: "Prestadores no teu raio com tempo estimado de chegada." },
  { Icon: Zap,      color: "#D4537E", title: "Resposta rápida",         desc: "Os melhores prestadores respondem em minutos pelo chat." },
];

const HERO = "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=900&auto=format&fit=crop";

export default function HomePage() {
  const router = useRouter();
  const [showAllSteps, setShowAllSteps] = useState(false);

  const visibleSteps = showAllSteps ? STEPS : STEPS.slice(0, 3);

  return (
    <>
      <style>{`
        .hw{display:flex;min-height:100vh;background:#0d1117}
        .hm{flex:1;margin-left:240px;display:flex;flex-direction:column;min-width:0;overflow-x:hidden}
        .hi{padding:32px;display:flex;flex-direction:column;gap:28px}

        /* ── Hero ── */
        .h-hero{
          position:relative;border-radius:24px;overflow:hidden;
          min-height:440px;display:flex;align-items:stretch;
          background:linear-gradient(135deg,#071e1e 0%,#0a2525 100%);
          border:1px solid rgba(29,158,117,0.18);
        }
        .h-hero-img{
          position:absolute;top:0;right:0;width:55%;height:100%;
          object-fit:cover;object-position:center top;
        }
        .h-hero-ov{
          position:absolute;inset:0;
          background:linear-gradient(to right,#071e1e 38%,rgba(7,30,30,0.9) 55%,rgba(7,30,30,0.15) 100%);
        }
        .h-hero-body{
          position:relative;z-index:2;
          padding:52px 56px;
          display:flex;flex-direction:column;justify-content:center;
          max-width:580px;
        }
        .h-badge{
          display:inline-flex;align-items:center;gap:8px;
          padding:6px 14px;border-radius:99px;
          background:rgba(29,158,117,0.1);border:1px solid rgba(29,158,117,0.28);
          margin-bottom:24px;width:fit-content;
        }
        .h-dot{
          width:7px;height:7px;border-radius:50%;background:#1D9E75;
          box-shadow:0 0 8px #1D9E75;
          animation:hdot 2.2s ease-in-out infinite;
        }
        @keyframes hdot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.8)}}
        .h-title{
          font-size:44px;font-weight:800;color:#f1f5f9;
          line-height:1.08;margin-bottom:20px;letter-spacing:-0.02em;
        }
        .h-title-g{
          background:linear-gradient(135deg,#1D9E75 0%,#4ade80 100%);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
        }
        .h-sub{font-size:16px;color:rgba(148,170,180,0.88);line-height:1.75;margin-bottom:36px;max-width:440px}
        .h-btns{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
        .btn-green{
          display:inline-flex;align-items:center;gap:8px;
          padding:14px 26px;border-radius:12px;border:none;
          background:linear-gradient(135deg,#1D9E75,#16876a);
          color:white;font-size:15px;font-weight:700;
          cursor:pointer;font-family:inherit;white-space:nowrap;
          box-shadow:0 4px 20px rgba(29,158,117,0.35);
          transition:all 0.2s ease;
        }
        .btn-green:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(29,158,117,0.5)}
        .btn-ghost{
          display:inline-flex;align-items:center;gap:8px;
          padding:14px 26px;border-radius:12px;
          background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);
          color:#8a9ab0;font-size:15px;font-weight:500;
          cursor:pointer;font-family:inherit;white-space:nowrap;
          transition:all 0.2s ease;
        }
        .btn-ghost:hover{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.22);color:#e2e8f0}
        .h-stats{
          position:absolute;bottom:28px;right:28px;
          display:flex;gap:12px;z-index:2;
        }
        .h-stat{
          padding:14px 20px;border-radius:16px;
          background:rgba(4,14,14,0.88);backdrop-filter:blur(12px);
          border:1px solid rgba(29,158,117,0.18);
          text-align:center;min-width:88px;
        }

        /* ── Section ── */
        .sec{background:#0f1923;border:1px solid #1a2535;border-radius:20px;padding:28px}
        .sec-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px}
        .sec-link{
          display:flex;align-items:center;gap:4px;font-size:13px;color:#1D9E75;
          background:none;border:none;cursor:pointer;font-family:inherit;
        }
        .sec-link:hover{opacity:0.7}

        /* ── Categories ── */
        .cats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
        .cat{
          display:flex;align-items:center;gap:14px;
          padding:20px;border-radius:14px;
          background:#0d1117;
          border:1px solid #1a2535;
          cursor:pointer;text-align:left;
          transition:all 0.22s ease;position:relative;overflow:hidden;
        }
        .cat:hover{transform:translateY(-3px);box-shadow:0 6px 22px rgba(0,0,0,0.35)}
        .cat-ico{
          position:relative;z-index:2;
          width:46px;height:46px;border-radius:12px;
          display:flex;align-items:center;justify-content:center;
          flex-shrink:0;transition:transform 0.2s;
          background:rgba(255,255,255,0.04);
          background:color-mix(in srgb, var(--cat-color) 14%, transparent);
          border:1px solid rgba(255,255,255,0.12);
          border:1px solid color-mix(in srgb, var(--cat-color) 35%, transparent);
        }
        .cat:hover .cat-ico{transform:scale(1.08)}
        .cat-body{position:relative;z-index:2;flex:1;min-width:0}
        .cat-label{
          font-size:14px;font-weight:700;color:#e2e8f0;
          margin:0 0 3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
        }
        .cat-desc{
          font-size:11px;color:#5a6a7a;line-height:1.4;margin:0;
        }
        .cat-ghost{
          position:absolute;right:-14px;bottom:-18px;z-index:1;
          pointer-events:none;color:var(--cat-color);opacity:0.06;
          transform:rotate(-12deg);
        }

        /* ── Steps ── */
        .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
        .step{padding:24px;border-radius:16px;background:#0d1117;border:1px solid #1a2535}
        .step-ico{
          width:48px;height:48px;border-radius:14px;
          display:flex;align-items:center;justify-content:center;margin-bottom:14px;
        }
        .steps-more-wrap{display:flex;justify-content:center;margin-top:18px}
        .btn-steps-more{
          display:inline-flex;align-items:center;gap:6px;
          padding:10px 20px;border-radius:10px;
          background:rgba(29,158,117,0.08);border:1px solid rgba(29,158,117,0.24);
          color:#1D9E75;font-size:13px;font-weight:600;
          cursor:pointer;font-family:inherit;transition:all 0.16s ease;
        }
        .btn-steps-more:hover{background:rgba(29,158,117,0.16)}
        .btn-steps-more svg{transition:transform 0.2s ease}
        .btn-steps-more.open svg{transform:rotate(180deg)}

        /* ── Features ── */
        .feats{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .feat{padding:22px;border-radius:16px;transition:transform 0.2s}
        .feat:hover{transform:translateY(-2px)}
        .feat-ico{
          width:42px;height:42px;border-radius:11px;
          display:flex;align-items:center;justify-content:center;margin-bottom:14px;
        }

        /* ── Provider CTA ── */
        .pcta{
          border-radius:20px;padding:24px 32px;
          background:linear-gradient(135deg,rgba(239,159,39,0.08),rgba(239,159,39,0.02));
          border:1px solid rgba(239,159,39,0.18);
          display:flex;align-items:center;justify-content:space-between;gap:20px;
        }
        .pcta-ico{
          width:46px;height:46px;border-radius:12px;
          background:rgba(239,159,39,0.12);border:1px solid rgba(239,159,39,0.25);
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
        }
        .btn-amber{
          padding:12px 22px;border-radius:10px;
          background:linear-gradient(135deg,#EF9F27,#d4870a);
          color:#0d1117;font-size:14px;font-weight:700;
          cursor:pointer;border:none;font-family:inherit;white-space:nowrap;
          box-shadow:0 4px 14px rgba(239,159,39,0.3);
          transition:all 0.2s;flex-shrink:0;
        }
        .btn-amber:hover{transform:translateY(-1px);box-shadow:0 6px 22px rgba(239,159,39,0.48)}

        /* ── Responsive ── */
        @media(max-width:1200px){.cats{grid-template-columns:repeat(3,1fr)}}
        @media(max-width:1024px){
          .hm{margin-left:0}
          .hi{padding:80px 20px 28px}
          .h-hero-img{width:44%}
          .h-hero-body{padding:36px 36px;max-width:68%}
          .cats{grid-template-columns:repeat(3,1fr)}
        }
        @media(max-width:768px){
          .hi{padding:72px 16px 24px;gap:20px}
          .h-title{font-size:30px}
          .h-hero-body{max-width:100%;padding:28px 24px}
          .h-hero{flex-direction:column;min-height:auto}
          .h-hero-img{display:block;position:relative;width:100%;height:220px;object-fit:cover;object-position:center top}
          .h-hero-ov{background:linear-gradient(to bottom,rgba(7,30,30,0.05) 0%,rgba(7,30,30,0.55) 40%,#071e1e 65%)}
          .h-stats{position:static;flex-wrap:wrap;padding:4px 24px 24px;gap:8px}
          .cats{grid-template-columns:repeat(2,1fr)}
          .steps{grid-template-columns:1fr}
          .feats{grid-template-columns:1fr}
          .pcta{flex-direction:column;text-align:center}
          .pcta-ico{margin:0 auto}
        }
        @media(max-width:480px){
          .hi{padding:68px 12px 20px}
          .h-stat{min-width:72px;padding:12px 14px}
          .h-stats{gap:6px;padding:4px 16px 20px}
        }
        @media(max-width:360px){
          .cats{grid-template-columns:1fr}
          .h-title{font-size:26px}
        }
      `}</style>

      <div className="hw">
        <Sidebar />
        <div className="hm">
          <Navbar />
          <main className="hi">

            {/* ═══ HERO ═══ */}
            <section className="h-hero">
              <img className="h-hero-img" src={HERO} alt="Prestador profissional a trabalhar" loading="lazy" />
              <div className="h-hero-ov" />
              <div className="h-hero-body">
                <div className="h-badge">
                  <span className="h-dot" />
                  <span style={{ fontSize:11, fontWeight:700, color:"#1D9E75", letterSpacing:"0.14em", textTransform:"uppercase" }}>
                    Serviapp · Angola
                  </span>
                </div>
                <h1 className="h-title">
                  Encontra o serviço<br />
                  <span className="h-title-g">certo, perto de ti.</span>
                </h1>
                <p className="h-sub">
                  Prestadores verificados com geolocalização, avaliações reais e pagamento 100% protegido.
                </p>
                <div className="h-btns">
                  <button className="btn-green" onClick={() => router.push("/search")}>
                    <Search size={16} /> Encontrar prestador
                  </button>
                  <button className="btn-ghost" onClick={() => router.push("/register/provider")}>
                    Sou prestador <ArrowRight size={16} />
                  </button>
                </div>
              </div>
              <div className="h-stats">
                {[
                  { value:"500+", label:"Prestadores", color:"#1D9E75" },
                  { value:"12",   label:"Categorias",  color:"#EF9F27" },
                  { value:"4.9★", label:"Avaliação",   color:"#378ADD" },
                ].map((s, i) => (
                  <div className="h-stat" key={i}>
                    <span style={{ fontSize:22, fontWeight:800, color:s.color, display:"block", lineHeight:1 }}>{s.value}</span>
                    <span style={{ fontSize:11, color:"#4a6a6a", marginTop:6, display:"block" }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ═══ CATEGORIES ═══ */}
            <div className="sec">
              <div className="sec-hdr">
                <div>
                  <h2 style={{ fontSize:18, fontWeight:700, color:"#e2e8f0", marginBottom:4 }}>Categorias de serviço</h2>
                  <p style={{ fontSize:13, color:"#4a6a6a" }}>Escolhe a categoria que precisas</p>
                </div>
                <button className="sec-link" onClick={() => router.push("/categories")}>
                  Ver todas <ChevronRight size={15} />
                </button>
              </div>
              <div className="cats">
                {CATS.map((cat, i) => {
                  const Icon = cat.Icon;
                  return (
                    <button
                      key={i}
                      className="cat"
                      style={{ "--cat-color": cat.color } as React.CSSProperties}
                      onClick={() => router.push(`/search?category=${encodeURIComponent(cat.label)}`)}
                    >
                      <Icon className="cat-ghost" size={88} />
                      <div className="cat-ico">
                        <Icon size={22} style={{ color:cat.color }} />
                      </div>
                      <div className="cat-body">
                        <p className="cat-label">{cat.label}</p>
                        <p className="cat-desc">{cat.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ═══ COMO FUNCIONA ═══ */}
            <div className="sec">
              <div style={{ marginBottom:22 }}>
                <h2 style={{ fontSize:18, fontWeight:700, color:"#e2e8f0", marginBottom:4 }}>Como funciona</h2>
                <p style={{ fontSize:13, color:"#4a6a6a" }}>Do pedido à conclusão, passo a passo</p>
              </div>
              <div className="steps">
                {visibleSteps.map((s, i) => {
                  const Icon = s.Icon;
                  return (
                    <div className="step" key={s.title}>
                      <p style={{ fontSize:11, fontWeight:800, color:s.color, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14 }}>
                        Passo {String(i + 1).padStart(2, "0")}
                      </p>
                      <div className="step-ico" style={{ background:s.bg, border:`1px solid ${s.color}28` }}>
                        <Icon size={24} style={{ color:s.color }} />
                      </div>
                      <h3 style={{ fontSize:15, fontWeight:700, color:"#e2e8f0", marginBottom:8 }}>{s.title}</h3>
                      <p style={{ fontSize:13, color:"#4a6a6a", lineHeight:1.65 }}>{s.desc}</p>
                    </div>
                  );
                })}
              </div>
              <div className="steps-more-wrap">
                <button
                  className={`btn-steps-more${showAllSteps ? " open" : ""}`}
                  onClick={() => setShowAllSteps((v) => !v)}
                >
                  {showAllSteps ? "Ver menos" : "Ver todos"} <ChevronDown size={15} />
                </button>
              </div>
            </div>

            {/* ═══ VANTAGENS ═══ */}
            <div className="sec">
              <div style={{ marginBottom:22 }}>
                <h2 style={{ fontSize:18, fontWeight:700, color:"#e2e8f0", marginBottom:4 }}>Porquê a Serviapp?</h2>
                <p style={{ fontSize:13, color:"#4a6a6a" }}>A plataforma mais segura de Angola</p>
              </div>
              <div className="feats">
                {FEATS.map((f, i) => {
                  const Icon = f.Icon;
                  return (
                    <div key={i} className="feat" style={{ background:`${f.color}08`, border:`1px solid ${f.color}1e` }}>
                      <div className="feat-ico" style={{ background:`${f.color}14` }}>
                        <Icon size={20} style={{ color:f.color }} />
                      </div>
                      <h3 style={{ fontSize:14, fontWeight:700, color:"#e2e8f0", marginBottom:6 }}>{f.title}</h3>
                      <p style={{ fontSize:12, color:"#4a6a6a", lineHeight:1.6 }}>{f.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ═══ PROVIDER CTA ═══ */}
            <div className="pcta">
              <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                <div className="pcta-ico"><Zap size={22} style={{ color:"#EF9F27" }} /></div>
                <div>
                  <p style={{ fontSize:15, fontWeight:700, color:"#e2e8f0", marginBottom:4 }}>És prestador?</p>
                  <p style={{ fontSize:13, color:"#6a5a3a" }}>Regista-te e começa a receber clientes hoje.</p>
                </div>
              </div>
              <button className="btn-amber" onClick={() => router.push("/register/provider")}>
                Criar perfil
              </button>
            </div>

          </main>
        </div>
      </div>
    </>
  );
}