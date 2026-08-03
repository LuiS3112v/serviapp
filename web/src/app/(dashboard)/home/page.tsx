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

// ── DESIGN SYSTEM: COLOR TOKENS ─────────────────────────────────────────────
// Emerald continua a ser a cor de marca, mas deixa de ser a única cor do
// produto. Cada tom tem um par [texto/ícone, fundo suave] extraído de uma
// paleta consistente (estilo Stripe/Linear/Revolut), usada com propósito:
// cada secção e cada categoria ganha a sua própria personalidade cromática.
const TONES: Record<string, { text: string; bg: string }> = {
  emerald: { text: "#0E7A5F", bg: "#E3F5EE" },
  sky:     { text: "#0284C7", bg: "#E0F2FE" },
  teal:    { text: "#0D9488", bg: "#D9F5F0" },
  amber:   { text: "#B45309", bg: "#FEF3C7" },
  indigo:  { text: "#4F46E5", bg: "#E5E4FF" },
  lime:    { text: "#65A30D", bg: "#ECFCCB" },
  cyan:    { text: "#0891B2", bg: "#CFFAFE" },
  rose:    { text: "#E11D48", bg: "#FFE4E7" },
  blue:    { text: "#2563EB", bg: "#DBEAFE" },
  violet:  { text: "#7C3AED", bg: "#EDE7FE" },
  orange:  { text: "#C2410C", bg: "#FFEDD5" },
  slate:   { text: "#475569", bg: "#F1F5F9" },
};

// Converte hex em rgba (para sombras e bordas tingidas por tom, com a
// opacidade certa em vez de cinzentos planos).
function rgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function toneVars(toneKey: string) {
  const t = TONES[toneKey] || TONES.emerald;
  return {
    "--accent": t.text,
    "--accent-bg": t.bg,
    "--accent-ring": rgba(t.text, 0.16),
    "--accent-border": rgba(t.text, 0.34),
  };
}

// ── CATEGORIAS ──────────────────────────────────────────────────────────────
// Mesmos 12 itens, mesma forma de dados e mesma rota de clique do ficheiro
// original — agora cada categoria recebe o seu próprio tom de marca.
const CATS = [
  { Icon: Sparkles,   label: "Limpeza",       desc: "Casas, escritórios e mais",    tone: "emerald" },
  { Icon: Wind,       label: "Climatização",  desc: "Instalação e manutenção",      tone: "sky" },
  { Icon: Wrench,     label: "Canalização",   desc: "Reparações e instalações",     tone: "teal" },
  { Icon: Zap,        label: "Eletricista",   desc: "Instalações e reparações",     tone: "amber" },
  { Icon: Monitor,    label: "TI & Redes",    desc: "Suporte e redes informáticas", tone: "indigo" },
  { Icon: Leaf,       label: "Jardinagem",    desc: "Manutenção de jardins",        tone: "lime" },
  { Icon: Package,    label: "Mudanças",      desc: "Transporte e mudanças",        tone: "cyan" },
  { Icon: Scissors,   label: "Beleza",        desc: "Cabeleireiro e estética",      tone: "rose" },
  { Icon: Car,        label: "Automóvel",     desc: "Reparação e manutenção",       tone: "blue" },
  { Icon: Paintbrush, label: "Pintura",       desc: "Interior e exterior",          tone: "violet" },
  { Icon: HardHat,    label: "Construção",    desc: "Obras e remodelações",         tone: "orange" },
  { Icon: Lock,       label: "Segurança",     desc: "Sistemas e monitorização",     tone: "slate" },
];

// ── PASSO A PASSO ────────────────────────────────────────────────────────────
// Mesmos 8 passos e mesma lógica (3 sempre visíveis + "Ver todos" revela os
// restantes 5). Os 3 primeiros passos (sempre visíveis) foram neutralizados
// a pedido — deixam de ter cor própria e passam a usar o tom slate/cinza.
const STEPS = [
  { Icon: Search,        title: "Pesquisa",                    desc: "Encontra prestadores verificados por categoria, nome ou localização no mapa.", tone: "slate" },
  { Icon: FileText,      title: "Serviço Personalizado",       desc: "Descreves o serviço em detalhe, defines o orçamento e envias o pedido diretamente a um prestador específico, que pode aceitá-lo ou propor outro valor.", tone: "slate" },
  { Icon: Zap,           title: "Serviço Rápido",               desc: "Escolhes a categoria, a subcategoria e indicas a morada vários prestadores da área recebem o pedido e enviam propostas de preço, para escolheres a melhor opção.", tone: "slate" },
  { Icon: Shield,        title: "Combina e paga em segurança",  desc: "Acorda o preço pelo chat, paga por transferência e o dinheiro fica protegido até confirmares o serviço.", tone: "slate" },
  { Icon: Navigation,    title: "Acompanha em tempo real",      desc: "Vê o prestador a chegar no mapa, com distância e tempo estimado, assim que ele aceitar o pedido.", tone: "slate" },
  { Icon: KeyRound,      title: "Confirma com PIN",             desc: "No local, dás um código único ao prestador para confirmares que o serviço começou de forma segura.", tone: "slate" },
  { Icon: Star,          title: "Avalia o serviço",             desc: "No fim, confirma a conclusão e deixa uma avaliação para ajudar outros clientes.", tone: "slate" },
  { Icon: MessageCircle, title: "Fala sempre pelo chat",        desc: "Todas as combinações ficam registadas na app, para tua proteção em caso de dúvida.", tone: "slate" },
  { Icon: LifeBuoy,      title: "Resolve disputas com apoio",   desc: "Se algo correr mal, a nossa equipa está disponível para mediar e resolver.", tone: "slate" },
];

const FEATS = [
  { Icon: Shield,   title: "Pagamento protegido",     desc: "Valor retido e só libertado quando confirmas a conclusão.", tone: "emerald" },
  { Icon: Star,     title: "Prestadores verificados", desc: "Todos passam por verificação de identidade antes de serem aceites.", tone: "violet" },
  { Icon: MapPin,   title: "Geolocalização",          desc: "Prestadores no teu raio com tempo estimado de chegada.", tone: "sky" },
  { Icon: Zap,      title: "Resposta rápida",         desc: "Os melhores prestadores respondem em minutos pelo chat.", tone: "amber" },
];

// Estatísticas do hero — cada uma com o seu próprio tom, para serem
// imediatamente distinguíveis em vez de repetirem a mesma cor.
const STATS = [
  { value: "500+", label: "Prestadores",      tone: "emerald" },
  { value: "12",   label: "Categorias",       tone: "blue" },
  { value: "4.9★", label: "Avaliação média",  tone: "amber" },
];

// Imagem real com fallback garantido: se a Unsplash falhar, cai para um
// painel com ícone — nunca fica um espaço vazio.
const HERO = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1200&auto=format&fit=crop";

export default function HomePage() {
  const router = useRouter();
  const [showAllSteps, setShowAllSteps] = useState(false);
  const [heroImgOk, setHeroImgOk] = useState(true);

  const visibleSteps = showAllSteps ? STEPS : STEPS.slice(0, 3);

  return (
    <>
      <style>{`
        .hw{display:flex;min-height:100vh;background:#F8FAFC}
        .hm{flex:1;margin-left:240px;display:flex;flex-direction:column;min-width:0;overflow-x:hidden}
        .hi{padding:32px;display:flex;flex-direction:column;gap:64px;max-width:1240px}

        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp 0.6s cubic-bezier(.16,1,.3,1) both}

        /* ═══════════ HERO ═══════════ */
        .h-hero{position:relative}
        .h-hero-media{
          position:relative;border-radius:28px;overflow:hidden;height:360px;
          background:#E2E8F0;
        }
        .h-hero-media img{width:100%;height:100%;object-fit:cover;display:block}
        .h-hero-fallback{
          width:100%;height:100%;display:flex;align-items:center;justify-content:center;
          background:linear-gradient(150deg,#0E7A5F,#4F46E5);
        }
        .h-hero-tint{
          position:absolute;inset:0;
          background:
            radial-gradient(70% 90% at 100% 0%, rgba(79,70,229,0.30) 0%, rgba(79,70,229,0) 55%),
            linear-gradient(180deg, rgba(15,26,22,0.10) 0%, rgba(15,26,22,0.42) 60%, rgba(10,20,17,0.66) 100%);
        }
        .h-hero-text{
          position:absolute;left:48px;top:48px;right:48px;z-index:2;max-width:560px;
        }
        .h-eyebrow{
          display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:99px;
          background:rgba(255,255,255,0.14);backdrop-filter:blur(8px);
          border:1px solid rgba(255,255,255,0.22);margin-bottom:18px;
        }
        .h-eyebrow-dot{width:6px;height:6px;border-radius:50%;background:#4ADE94}
        .h-title{
          font-size:40px;font-weight:800;color:#FFFFFF;line-height:1.12;
          letter-spacing:-0.025em;margin-bottom:14px;text-shadow:0 2px 24px rgba(0,0,0,0.22);
        }
        .h-title span{
          background:linear-gradient(90deg,#7EF0C4,#A5B4FC);
          -webkit-background-clip:text;background-clip:text;color:transparent;
          -webkit-text-fill-color:transparent;
        }
        .h-sub{font-size:15.5px;color:rgba(255,255,255,0.88);line-height:1.65;max-width:420px}

        /* Cartão de busca flutuante — sobreposto ao rodapé da imagem */
        .h-search-card{
          position:relative;z-index:3;margin-top:-46px;margin-left:48px;margin-right:48px;
          background:#FFFFFF;border-radius:20px;padding:20px 22px;
          border:1px solid rgba(79,70,229,0.10);
          box-shadow:0 16px 40px rgba(15,26,22,0.14),0 2px 8px rgba(15,26,22,0.06);
          display:flex;align-items:center;gap:14px;flex-wrap:wrap;
        }
        .h-search-icowrap{
          width:44px;height:44px;border-radius:13px;flex-shrink:0;
          background:#E0F2FE;display:flex;align-items:center;justify-content:center;
        }
        .h-search-copy{flex:1;min-width:180px}
        .h-search-copy p:first-child{font-size:14px;font-weight:700;color:#1F2A28;margin-bottom:2px}
        .h-search-copy p:last-child{font-size:12.5px;color:#6B7770}
        .btn-search{
          display:inline-flex;align-items:center;gap:8px;padding:13px 22px;border-radius:13px;border:none;
          background:#0E7A5F;color:#fff;font-size:14px;font-weight:700;cursor:pointer;
          font-family:inherit;white-space:nowrap;transition:all 0.18s;
          box-shadow:0 4px 14px rgba(14,122,95,0.28);
        }
        .btn-search:hover{background:#0A5F4A;transform:translateY(-1px);box-shadow:0 6px 20px rgba(14,122,95,0.36)}
        .btn-provider-link{
          display:inline-flex;align-items:center;gap:6px;padding:13px 18px;border-radius:13px;
          background:#FBFAFF;border:1px solid #E3E1F7;color:#1F2A28;font-size:13.5px;font-weight:600;
          cursor:pointer;font-family:inherit;transition:all .18s;white-space:nowrap;
        }
        .btn-provider-link:hover{border-color:#4F46E5;color:#4F46E5;background:#EEF0FF}

        /* Estatísticas sob o cartão de busca */
        .h-stats-row{display:flex;gap:32px;margin-top:34px;padding-left:8px}
        .h-stat b{font-size:24px;font-weight:800;display:block;line-height:1}
        .h-stat span{font-size:12px;color:#6B7770;margin-top:5px;display:block}

        /* ═══════════ SECTION HEADERS ═══════════ */
        .sec-hdr{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:26px;gap:16px}
        .sec-eyebrow{font-size:11.5px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;display:block}
        .sec-eyebrow.tone-emerald{color:#0E7A5F}
        .sec-eyebrow.tone-blue{color:#2563EB}
        .sec-eyebrow.tone-violet{color:#7C3AED}
        .sec-title{font-size:24px;font-weight:800;color:#1F2A28;letter-spacing:-0.02em}
        .sec-sub{font-size:14px;color:#6B7770;margin-top:5px}
        .sec-link{
          display:flex;align-items:center;gap:4px;font-size:13.5px;font-weight:700;color:#0E7A5F;
          background:#E3F5EE;border:none;cursor:pointer;font-family:inherit;padding:9px 16px;
          border-radius:10px;transition:all .18s;flex-shrink:0;
        }
        .sec-link:hover{background:#D3EEE3}

        /* ═══════════ CATEGORIES: cartões totalmente brancos ═══════════
           Antes cada card tinha uma barra de cor de 3px no topo (::before)
           e um "glow" colorido no canto, imitando a cor da categoria.
           Isso foi removido: o card fica branco, com a borda e a sombra
           de hover neutras. A cor da categoria fica só no ícone. */
        .cat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
        .cat-card{
          position:relative;overflow:hidden;border-radius:18px;padding:22px 18px;
          background:#FFFFFF;border:1px solid #ECE9DF;cursor:pointer;text-align:left;
          transition:all 0.22s cubic-bezier(.16,1,.3,1);
        }
        .cat-card:hover{
          transform:translateY(-4px);
          box-shadow:0 14px 28px rgba(15,23,42,0.10);
          border-color:#CBD5E1;
        }
        .cat-card-ico{
          position:relative;z-index:1;width:44px;height:44px;border-radius:12px;
          display:flex;align-items:center;justify-content:center;margin-bottom:14px;
          transition:transform .2s;
        }
        .cat-card:hover .cat-card-ico{transform:scale(1.08) rotate(-4deg)}
        .cat-card-label{position:relative;z-index:1;font-size:14.5px;font-weight:700;color:#1F2A28;margin-bottom:3px}
        .cat-card-desc{position:relative;z-index:1;font-size:11.5px;color:#8A948E;line-height:1.4}

        /* ═══════════ COMO FUNCIONA: cartões conectados ═══════════ */
        .steps-rail{position:relative}
        .steps-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;position:relative;z-index:1}
        .step-card{
          background:#FFFFFF;border:1px solid #ECE9DF;border-radius:18px;padding:24px 20px;
          transition:all 0.2s;
        }
        .step-card:hover{
          border-color:var(--accent-border, #BFDBFE);
          box-shadow:0 10px 24px var(--accent-ring, rgba(37,99,235,0.12));
          transform:translateY(-3px);
        }
        .step-badge{
          display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;
          border-radius:9px;background:#1F2A28;color:#fff;font-size:12px;font-weight:800;margin-bottom:16px;
        }
        .step-card-ico{
          width:46px;height:46px;border-radius:13px;
          display:flex;align-items:center;justify-content:center;margin-bottom:14px;
        }
        .step-card h3{font-size:15px;font-weight:700;color:#1F2A28;margin-bottom:7px}
        .step-card p{font-size:13px;color:#6B7770;line-height:1.6}

        .steps-more-wrap{display:flex;justify-content:center;margin-top:22px}
        .btn-steps-more{
          display:inline-flex;align-items:center;gap:6px;padding:11px 22px;border-radius:11px;
          background:#1F2A28;border:none;color:#fff;font-size:13.5px;font-weight:700;
          cursor:pointer;font-family:inherit;transition:all 0.18s ease;
        }
        .btn-steps-more:hover{background:#4338CA;box-shadow:0 8px 20px rgba(67,56,202,0.32)}
        .btn-steps-more svg{transition:transform 0.2s ease}
        .btn-steps-more.open svg{transform:rotate(180deg)}

        /* ═══════════ VANTAGENS: faixa compacta ═══════════ */
        .feats-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
        .feat-strip-card{
          background:#FFFFFF;border:1px solid #ECE9DF;border-radius:16px;padding:20px;
          transition:all .2s;
        }
        .feat-strip-card:hover{
          transform:translateY(-3px);
          box-shadow:0 10px 22px var(--accent-ring, rgba(14,122,95,0.12));
          border-color:var(--accent-border, #BEE3D3);
        }
        .feat-strip-ico{
          width:38px;height:38px;border-radius:11px;
          display:flex;align-items:center;justify-content:center;margin-bottom:14px;
        }
        .feat-strip-card h3{font-size:13.5px;font-weight:700;color:#1F2A28;margin-bottom:5px}
        .feat-strip-card p{font-size:11.5px;color:#8A948E;line-height:1.55}

        /* ═══════════ CTA PRESTADOR: banner full-width ═══════════ */
        .pcta-banner{
          border-radius:24px;padding:40px 44px;position:relative;overflow:hidden;
          background:
            radial-gradient(45% 70% at 0% 100%, rgba(124,58,237,0.20) 0%, transparent 65%),
            linear-gradient(135deg, #1F2A28 0%, #161B22 55%, #1E1B3A 100%);
          display:flex;align-items:center;justify-content:space-between;gap:32px;flex-wrap:wrap;
        }
        .pcta-glow{
          position:absolute;top:-80px;right:-40px;width:260px;height:260px;border-radius:50%;
          background:radial-gradient(circle,rgba(217,119,6,0.35),transparent 70%);
        }
        .pcta-copy{position:relative;z-index:1;max-width:460px}
        .pcta-eyebrow{
          display:inline-flex;align-items:center;gap:7px;font-size:11px;font-weight:700;
          letter-spacing:0.1em;text-transform:uppercase;color:#FCD34D;margin-bottom:12px;
        }
        .pcta-copy h2{font-size:24px;font-weight:800;color:#fff;margin-bottom:8px;letter-spacing:-0.01em}
        .pcta-copy p{font-size:14px;color:rgba(255,255,255,0.68);line-height:1.6}
        .btn-amber{
          position:relative;z-index:1;flex-shrink:0;
          padding:15px 28px;border-radius:13px;background:#D97706;color:#fff;
          font-size:14.5px;font-weight:700;cursor:pointer;border:none;font-family:inherit;
          white-space:nowrap;box-shadow:0 6px 18px rgba(217,119,6,0.32);
          transition:all 0.2s;display:inline-flex;align-items:center;gap:8px;
        }
        .btn-amber:hover{background:#B45F04;transform:translateY(-2px);box-shadow:0 8px 24px rgba(217,119,6,0.4)}

        /* ═══════════ RESPONSIVE ═══════════ */
        @media(max-width:1200px){
          .cat-grid{grid-template-columns:repeat(3,1fr)}
          .feats-strip{grid-template-columns:repeat(2,1fr)}
        }
        @media(max-width:1024px){
          .hm{margin-left:0}
          .hi{padding:80px 20px 40px;gap:48px}
          .h-hero-media{height:300px}
          .h-hero-text{left:32px;right:32px;top:32px}
          .h-search-card{margin-left:24px;margin-right:24px;margin-top:-34px}
          .steps-grid{grid-template-columns:repeat(2,1fr)}
        }
        @media(max-width:768px){
          .hi{padding:72px 16px 32px;gap:40px}
          .h-title{font-size:28px}
          .h-hero-media{height:266px}
          .h-hero-text{left:24px;right:24px;top:24px}
          .h-search-card{
            margin-left:16px;margin-right:16px;margin-top:-18px;flex-direction:column;align-items:stretch;text-align:center;
          }
          .h-search-copy{text-align:center}
          .h-stats-row{gap:22px;justify-content:center;padding-left:0}
          .cat-grid{grid-template-columns:repeat(2,1fr)}
          .steps-grid{grid-template-columns:1fr}
          .feats-strip{grid-template-columns:1fr}
          .sec-hdr{flex-direction:column;align-items:flex-start}
          .pcta-banner{flex-direction:column;text-align:center;align-items:center;padding:36px 28px}
          .pcta-copy{text-align:center}
        }
        @media(max-width:480px){
          .hi{padding:68px 12px 28px}
          .h-hero-media{height:292px}
          .h-search-card{margin-top:-14px}
          .cat-grid{grid-template-columns:1fr 1fr}
          .h-stats-row{flex-wrap:wrap}
        }
      `}</style>

      <div className="hw">
        <Sidebar />
        <div className="hm">
          <Navbar />
          <main className="hi">

            {/* ═══ HERO ═══ */}
            <section className="h-hero fade-up">
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
                    <Wrench size={72} color="rgba(255,255,255,0.9)" />
                  </div>
                )}
                <div className="h-hero-tint" />
                <div className="h-hero-text">
                  <span className="h-eyebrow">
                    <span className="h-eyebrow-dot" />
                    <span style={{ fontSize:11.5, fontWeight:700, color:"#fff", letterSpacing:"0.08em", textTransform:"uppercase" }}>
                      Serviapp · Angola
                    </span>
                  </span>
                  <h1 className="h-title">Encontra o serviço<br /><span>certo, perto de ti.</span></h1>
                  <p className="h-sub">Prestadores verificados com geolocalização, avaliações reais e pagamento 100% protegido.</p>
                </div>
              </div>

              <div className="h-search-card">
                <div className="h-search-icowrap"><Search size={20} color="#0284C7" /></div>
                <div className="h-search-copy">
                  <p>Pronto para começar?</p>
                  <p>Procura entre mais de 500 prestadores verificados</p>
                </div>
                <button className="btn-search" onClick={() => router.push("/search")}>
                  <Search size={16} /> Encontrar prestador
                </button>
                <button className="btn-provider-link" onClick={() => router.push("/register/provider")}>
                  Sou prestador <ArrowRight size={14} />
                </button>
              </div>

              <div className="h-stats-row">
                {STATS.map((s, i) => (
                  <div className="h-stat" key={i}>
                    <b style={{ color: TONES[s.tone].text }}>{s.value}</b>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ═══ CATEGORIAS ═══ */}
            <section className="fade-up">
              <div className="sec-hdr">
                <div>
                  <span className="sec-eyebrow tone-emerald">Categorias</span>
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
                  const t = TONES[cat.tone];
                  return (
                    <button
                      key={i}
                      className="cat-card"
                      onClick={() => router.push(`/search?category=${encodeURIComponent(cat.label)}`)}
                    >
                      <div className="cat-card-ico" style={{ background: t.bg }}>
                        <Icon size={21} color={t.text} />
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
                  <span className="sec-eyebrow tone-blue">Como funciona</span>
                  <h2 className="sec-title">Do pedido à conclusão, passo a passo</h2>
                </div>
              </div>
              <div className="steps-rail">
                <div className="steps-grid">
                  {visibleSteps.map((s, i) => {
                    const Icon = s.Icon;
                    const t = TONES[s.tone];
                    return (
                      <div className="step-card" key={s.title} style={toneVars(s.tone) as React.CSSProperties}>
                        <div className="step-badge">{String(i + 1).padStart(2, "0")}</div>
                        <div className="step-card-ico" style={{ background: t.bg }}>
                          <Icon size={22} color={t.text} />
                        </div>
                        <h3>{s.title}</h3>
                        <p>{s.desc}</p>
                      </div>
                    );
                  })}
                </div>
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
                  <span className="sec-eyebrow tone-violet">Vantagens</span>
                  <h2 className="sec-title">Porquê a Serviapp?</h2>
                  <p className="sec-sub">A plataforma mais segura de Angola</p>
                </div>
              </div>
              <div className="feats-strip">
                {FEATS.map((f, i) => {
                  const Icon = f.Icon;
                  const t = TONES[f.tone];
                  return (
                    <div key={i} className="feat-strip-card" style={toneVars(f.tone) as React.CSSProperties}>
                      <div className="feat-strip-ico" style={{ background: t.bg }}>
                        <Icon size={19} color={t.text} />
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
                <div className="pcta-glow" />
                <div className="pcta-copy">
                  <span className="pcta-eyebrow"><Zap size={13} /> Para prestadores</span>
                  <h2>És prestador?</h2>
                  <p>Regista-te e começa a receber clientes hoje.</p>
                </div>
                <button className="btn-amber" onClick={() => router.push("/register/provider")}>
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