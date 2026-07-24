"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Zap, Menu, X, ArrowRight, ClipboardList, Inbox, CalendarCheck, Star,
  Shield, ShieldCheck, Headphones, Wrench, Sparkles, Leaf, Paintbrush, Truck,
  Snowflake, Laptop, Scissors, Car, Hammer, MapPin, Map, Lock,
  CheckCircle2, Percent, BarChart3, MessageCircle, Building2,
  Globe, Camera, Link2, Navigation, Search,
  Sprout,
} from "lucide-react";

/* ─── Hook simples de scroll-reveal (sem dependências novas) ─────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* Paleta ampliada — usada para dar mais diversidade cromática aos ícones
   dos cards de "Ferramentas" e "Confiança", mantendo tudo em tons claros
   que assentam bem sobre fundo branco. */
const ACCENTS = ["#2563eb", "#1D9E75", "#EF9F27"];
const RICH_ACCENTS = ["#2563eb", "#1D9E75", "#EF9F27", "#7C3AED", "#DB2777", "#0891B2"];

export default function HomePage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goLogin = () => router.push("/login");
  const goRegisterClient = () => router.push("/register/client");
  const goRegisterProvider = () => router.push("/register/provider");

  const steps = [
    { icon: ClipboardList, title: "Descreva o que precisa", text: "Explique o serviço que procura e o que espera do prestador." },
    { icon: Inbox, title: "Receba propostas", text: "Prestadores disponíveis na sua zona respondem com condições e preço." },
    { icon: CalendarCheck, title: "Escolha e agende", text: "Compare perfis e marque o serviço para a data que lhe convier." },
    { icon: Star, title: "Avalie o serviço", text: "Depois do trabalho feito, deixe a sua avaliação para ajudar outros utilizadores." },
  ];

  const resources = [
    { icon: Map, color: "#2563eb", title: "Mapa inteligente", text: "Veja pedidos, categorias e prestadores perto de si num mapa interativo e atualizado em tempo real." },
    { icon: Lock, color: "#1D9E75", title: "Pagamento em escrow", text: "O valor fica retido com segurança e só é libertado ao prestador depois de confirmar a conclusão do serviço." },
    { icon: MessageCircle, color: "#EF9F27", title: "Chat integrado", text: "Fale diretamente com o cliente ou prestador para combinar detalhes antes e durante o serviço." },
  ];

  const categories = [
    { icon: Sparkles, name: "Limpeza", desc: "Limpeza residencial e comercial" },
    { icon: Snowflake, name: "Climatização", desc: "Instalação e manutenção de AC" },
    { icon: Wrench, name: "Canalização", desc: "Fugas, instalações e reparações" },
    { icon: Zap, name: "Eletricista", desc: "Instalações eléctricas e reparações" },
    { icon: Laptop, name: "TI & Redes", desc: "Suporte técnico e redes" },
    { icon: Leaf, name: "Jardinagem", desc: "Poda, manutenção e paisagismo" },
    { icon: Truck, name: "Mudanças", desc: "Transporte e mudanças de casa" },
    { icon: Scissors, name: "Beleza", desc: "Cabeleireiro, manicure e estética" },
    { icon: Car, name: "Automóvel", desc: "Mecânica e manutenção auto" },
    { icon: Paintbrush, name: "Pintura", desc: "Pintura de interiores e exteriores" },
    { icon: Hammer, name: "Construção", desc: "Obras, remodelações e acabamentos" },
    { icon: ShieldCheck, name: "Segurança", desc: "Vigilância e sistemas de segurança" },
  ];

  const trust = [
    { icon: Shield, color: "#2563eb", title: "Prestadores verificados", text: "Identidade e experiência confirmadas através de verificação KYC antes de entrarem na plataforma." },
    { icon: Headphones, color: "#EF9F27", title: "Suporte rápido", text: "Equipa disponível para ajudar em qualquer etapa do processo." },
    { icon: Star, color: "#1D9E75", title: "Avaliações reais", text: "Cada avaliação vem de um serviço efetivamente realizado." },
  ];

  const providerChecklist = [
    { icon: CheckCircle2, color: "#1D9E75", text: "Perfil verificado após aprovação do KYC" },
    { icon: Percent, color: "#2563eb", text: "Taxa de serviço de 10% sobre os pagamentos recebidos" },
    { icon: BarChart3, color: "#EF9F27", text: "Painel de estatísticas para acompanhar pedidos e desempenho" },
    { icon: Star, color: "#2563eb", text: "Sistema de avaliações deixadas pelos clientes" },
    { icon: Building2, color: "#1D9E75", text: "Possibilidade de criar depois um perfil de empresa" },
    { icon: MessageCircle, color: "#EF9F27", text: "Chat integrado para falar diretamente com o cliente" },
  ];

  const stats = [
    { v: "500+", l: "Prestadores", c: "#2563eb" },
    { v: "12+", l: "Categorias", c: "#1D9E75" },
    { v: "4.9★", l: "Avaliação média", c: "#EF9F27" },
  ];

  return (
    <>
      <style>{`
        .lp *{box-sizing:border-box}
        .lp{background:#ffffff;color:#111827;font-family:inherit;overflow-x:hidden}
        .lp-container{max-width:1180px;margin:0 auto;padding:0 24px}

        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes pulseDot{0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,0.35)}50%{box-shadow:0 0 0 10px rgba(37,99,235,0)}}
        @keyframes dashMove{to{stroke-dashoffset:-24}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}

        /* Header */
        .lp-header{position:sticky;top:0;z-index:50;background:rgba(255,255,255,0.88);backdrop-filter:blur(10px);border-bottom:1px solid #eef1f5;transition:box-shadow .2s}
        .lp-header.scrolled{box-shadow:0 2px 16px rgba(15,23,42,0.06)}
        .lp-header-inner{max-width:1180px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;justify-content:space-between}
        .lp-logo{display:flex;align-items:center;gap:10px;cursor:pointer}
        .lp-logo-mark{width:38px;height:38px;border-radius:11px;background:linear-gradient(135deg,#2563eb,#3b82f6);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .lp-logo-text{font-size:19px;font-weight:800;color:#0f172a;letter-spacing:-0.02em}
        .lp-nav{display:flex;align-items:center;gap:32px}
        .lp-nav a{font-size:14.5px;font-weight:600;color:#475569;text-decoration:none;transition:color .15s}
        .lp-nav a:hover{color:#2563eb}
        .lp-header-actions{display:flex;align-items:center;gap:10px}
        .lp-btn-ghost{padding:10px 18px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;color:#334155;font-size:14px;font-weight:700;cursor:pointer;transition:all .15s;font-family:inherit}
        .lp-btn-ghost:hover{border-color:#2563eb;color:#2563eb}
        .lp-btn-solid{padding:10px 20px;border-radius:10px;border:none;background:linear-gradient(135deg,#2563eb,#3b82f6);color:#fff;font-size:14px;font-weight:700;cursor:pointer;transition:transform .15s,box-shadow .15s;font-family:inherit;box-shadow:0 4px 14px rgba(37,99,235,0.25)}
        .lp-btn-solid:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(37,99,235,0.32)}
        .lp-menu-toggle{display:none;background:none;border:none;cursor:pointer;color:#0f172a}

        /* Hero */
        .lp-hero{padding:68px 0 60px}
        .lp-hero-grid{display:grid;grid-template-columns:1.05fr 0.95fr;gap:56px;align-items:center}
        .lp-eyebrow{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:99px;background:#eff6ff;color:#2563eb;font-size:12.5px;font-weight:700;margin-bottom:20px}
        .lp-h1{font-size:44px;line-height:1.12;font-weight:800;color:#0f172a;letter-spacing:-0.02em;margin-bottom:18px}
        .lp-h1 span{background:linear-gradient(135deg,#2563eb,#1D9E75);-webkit-background-clip:text;background-clip:text;color:transparent}
        .lp-sub{font-size:17px;line-height:1.6;color:#64748b;max-width:480px;margin-bottom:32px}
        .lp-hero-actions{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:36px}
        .lp-btn-primary{display:inline-flex;align-items:center;gap:8px;padding:15px 26px;border-radius:12px;border:none;background:linear-gradient(135deg,#2563eb,#3b82f6);color:#fff;font-size:15px;font-weight:700;cursor:pointer;transition:transform .15s,box-shadow .15s;font-family:inherit;box-shadow:0 6px 20px rgba(37,99,235,0.28)}
        .lp-btn-primary:hover{transform:translateY(-2px)}
        .lp-btn-secondary{display:inline-flex;align-items:center;gap:8px;padding:15px 26px;border-radius:12px;border:1.5px solid #bbf7e8;background:#fff;color:#0f766e;font-size:15px;font-weight:700;cursor:pointer;transition:all .15s;font-family:inherit}
        .lp-btn-secondary:hover{background:#f0fdf9;border-color:#1D9E75;color:#1D9E75;transform:translateY(-2px)}
        .lp-stats{display:flex;gap:28px}
        .lp-stat-v{font-size:22px;font-weight:800}
        .lp-stat-l{font-size:12px;color:#94a3b8;margin-top:2px}

        /* ─── Hero visual: mapa real de fundo ─── */
        .lp-hero-visual{position:relative;border-radius:24px;padding:22px;min-height:380px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:inset 0 0 0 1px rgba(255,255,255,0.4)}
        .lp-map-bg{position:absolute;inset:0;z-index:0}
        .lp-map-bg svg{width:100%;height:100%;display:block}
        .lp-hero-you{position:absolute;top:50%;left:50%;width:14px;height:14px;border-radius:50%;background:#2563eb;border:2px solid #fff;transform:translate(-50%,-50%);animation:pulseDot 2.2s ease-out infinite;z-index:3;box-shadow:0 2px 6px rgba(15,23,42,0.25)}
        .lp-pin{position:absolute;width:44px;height:44px;border-radius:13px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 18px rgba(15,23,42,0.16);z-index:3;border:2px solid #fff}
        .lp-visual-card{position:absolute;background:#fff;border-radius:16px;box-shadow:0 14px 32px rgba(15,23,42,0.16);padding:14px 16px;display:flex;align-items:center;gap:12px;z-index:4;animation:float 4.5s ease-in-out infinite}
        .lp-route-line{stroke:#2563eb;stroke-width:2.5;stroke-dasharray:6 6;fill:none;opacity:0.55;stroke-linecap:round;animation:dashMove 1.4s linear infinite}

        /* Section shared */
        .lp-section{padding:84px 0}
        .lp-section-alt{background:#f8fafc}
        .lp-section-head{text-align:center;max-width:620px;margin:0 auto 48px}
        .lp-tag{display:inline-block;font-size:13px;font-weight:700;color:#2563eb;background:#eff6ff;padding:6px 14px;border-radius:99px;margin-bottom:16px}
        .lp-h2{font-size:32px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;margin-bottom:14px}
        .lp-section-sub{font-size:15.5px;color:#64748b;line-height:1.6}

        /* Steps */
        .lp-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:22px}
        .lp-step{background:#fff;border:1px solid #eef1f5;border-radius:18px;padding:26px 22px;transition:transform .2s,box-shadow .2s}
        .lp-step:hover{transform:translateY(-4px);box-shadow:0 12px 26px rgba(15,23,42,0.08)}
        .lp-step-num{font-size:12.5px;font-weight:800;color:#94a3b8;margin-bottom:14px}
        .lp-step-icon{width:44px;height:44px;border-radius:13px;display:flex;align-items:center;justify-content:center;margin-bottom:16px}
        .lp-step h3{font-size:15.5px;font-weight:700;color:#0f172a;margin-bottom:8px}
        .lp-step p{font-size:13.5px;color:#64748b;line-height:1.55}

        /* Resources (map / escrow / chat) — cards maiores, mais arredondados, ícones a cores diversas */
        .lp-feature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
        .lp-feature-card{border-radius:26px;padding:36px 30px;transition:transform .2s,box-shadow .2s;border:1px solid #eef1f5;background:#fff;box-shadow:0 4px 18px rgba(15,23,42,0.05)}
        .lp-feature-card:hover{transform:translateY(-5px);box-shadow:0 16px 32px rgba(15,23,42,0.09)}
        .lp-feature-icon{width:60px;height:60px;border-radius:18px;display:flex;align-items:center;justify-content:center;margin-bottom:20px}
        .lp-feature-card h3{font-size:17.5px;font-weight:700;color:#0f172a;margin-bottom:10px}
        .lp-feature-card p{font-size:14px;color:#475569;line-height:1.65}

        /* Categories */
        .lp-cat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
        .lp-cat-card{background:#fff;border:1px solid #eef1f5;border-radius:18px;padding:22px 20px;display:flex;flex-direction:column;gap:8px;cursor:pointer;transition:all .2s}
        .lp-cat-card:hover{border-color:#bfdbfe;transform:translateY(-3px);box-shadow:0 10px 24px rgba(37,99,235,0.10)}
        .lp-cat-icon{width:44px;height:44px;border-radius:13px;display:flex;align-items:center;justify-content:center;margin-bottom:2px}
        .lp-cat-name{font-size:15px;font-weight:700;color:#0f172a}
        .lp-cat-desc{font-size:12.5px;color:#64748b;line-height:1.5}

        /* Trust — cards maiores, mais arredondados, ícones a cores diversas */
        .lp-trust-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
        .lp-trust-card{background:#fff;border:1px solid #eef1f5;border-radius:26px;padding:34px 28px;transition:transform .2s,box-shadow .2s;box-shadow:0 4px 18px rgba(15,23,42,0.05)}
        .lp-trust-card:hover{transform:translateY(-5px);box-shadow:0 16px 32px rgba(15,23,42,0.09)}
        .lp-trust-icon{width:58px;height:58px;border-radius:17px;display:flex;align-items:center;justify-content:center;margin-bottom:20px}
        .lp-trust-card h3{font-size:16.5px;font-weight:700;color:#0f172a;margin-bottom:10px}
        .lp-trust-card p{font-size:14px;color:#64748b;line-height:1.6}

        /* Ilustração de secção (categorias) */
        .lp-illustration{display:flex;justify-content:center;margin-bottom:36px}

        /* ─── Para prestadores ─── */
        .lp-provider-panel{position:relative;background:linear-gradient(135deg,#f8fafc,#eff6ff);border-radius:32px;padding:56px 48px;overflow:hidden}
        .lp-provider-top{position:relative;z-index:1;display:grid;grid-template-columns:1.05fr 0.95fr;gap:56px;align-items:center}
        .lp-provider-copy{max-width:460px}
        .lp-provider-mini-stats{display:flex;align-items:center;gap:20px;margin:24px 0 28px}
        .lp-mini-v{font-size:21px;font-weight:800;line-height:1}
        .lp-mini-l{font-size:11px;color:#94a3b8;margin-top:4px}
        .lp-mini-sep{width:1px;height:30px;background:#dbe3ee;flex-shrink:0}

        .lp-provider-visual{position:relative;padding:26px}
        .lp-provider-blob{position:absolute;border-radius:50%;filter:blur(36px);opacity:.55;z-index:0}
        .lp-provider-blob-1{width:180px;height:180px;background:#bfdbfe;top:-26px;right:-20px}
        .lp-provider-blob-2{width:150px;height:150px;background:#bbf7e8;bottom:-20px;left:0}

        .lp-provider-mock{position:relative;z-index:2;background:#fff;border:1px solid #eef1f5;border-radius:22px;padding:24px 24px 20px;box-shadow:0 18px 40px rgba(15,23,42,0.12)}
        .lp-mock-header{display:flex;align-items:center;gap:12px;margin-bottom:22px}
        .lp-mock-avatar{position:relative;width:44px;height:44px;border-radius:13px;background:#eff6ff;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .lp-mock-verified{position:absolute;bottom:-3px;right:-3px;width:16px;height:16px;border-radius:50%;background:#1D9E75;display:flex;align-items:center;justify-content:center;border:2px solid #fff}
        .lp-mock-name{font-size:14.5px;font-weight:700;color:#0f172a}
        .lp-mock-role{font-size:12px;color:#94a3b8;margin-top:1px}
        .lp-mock-bars{display:flex;align-items:flex-end;gap:8px;height:84px;padding:0 2px}
        .lp-mock-bar{flex:1;border-radius:6px 6px 2px 2px}
        .lp-mock-caption{font-size:11.5px;color:#94a3b8;margin-top:14px;text-align:center}

        .lp-provider-grid{position:relative;z-index:1;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:40px}
        .lp-provider-mini-card{display:flex;align-items:flex-start;gap:12px;background:#fff;border:1px solid #f1f5f9;border-radius:16px;padding:16px;box-shadow:0 6px 18px rgba(15,23,42,0.05);transition:transform .2s,box-shadow .2s;height:100%}
        .lp-provider-mini-card:hover{transform:translateY(-3px);box-shadow:0 12px 26px rgba(15,23,42,0.08)}
        .lp-provider-mini-icon{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .lp-provider-mini-card span{font-size:13px;color:#334155;line-height:1.5;padding-top:3px}

        /* Final CTA */
        .lp-cta{background:linear-gradient(120deg,#2563eb,#1D9E75);border-radius:28px;padding:60px 48px;text-align:center;color:#fff}
        .lp-cta h2{font-size:30px;font-weight:800;margin-bottom:14px;letter-spacing:-0.02em}
        .lp-cta p{font-size:15.5px;color:#e0f2ef;max-width:480px;margin:0 auto 30px;line-height:1.6}
        .lp-btn-white{padding:16px 30px;border-radius:12px;border:none;background:#fff;color:#2563eb;font-size:15.5px;font-weight:800;cursor:pointer;transition:transform .15s;font-family:inherit}
        .lp-btn-white:hover{transform:translateY(-2px)}

        /* Footer */
        .lp-footer{background:#0f172a;color:#cbd5e1;padding:56px 0 28px}
        .lp-footer-grid{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:40px;margin-bottom:40px}
        .lp-footer h4{font-size:13.5px;font-weight:700;color:#fff;margin-bottom:16px}
        .lp-footer a{display:block;font-size:13.5px;color:#94a3b8;text-decoration:none;margin-bottom:10px;transition:color .15s}
        .lp-footer a:hover{color:#fff}
        .lp-footer-social{display:flex;gap:10px;margin-top:16px}
        .lp-footer-social a{width:36px;height:36px;border-radius:10px;background:#1e293b;display:flex;align-items:center;justify-content:center;margin:0}
        .lp-footer-social a:hover{background:#2563eb}
        .lp-footer-bottom{border-top:1px solid #1e293b;padding-top:24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
        .lp-footer-bottom p{font-size:12.5px;color:#64748b}
        .lp-coverage-note{font-size:12.5px;color:#64748b;max-width:420px;text-align:right}

        @media(max-width:960px){
          .lp-nav{display:none}
          .lp-header-actions .lp-btn-ghost{display:none}
          .lp-menu-toggle{display:block}
          .lp-hero-grid{grid-template-columns:1fr}
          .lp-hero-visual{order:-1;min-height:280px}
          .lp-steps,.lp-feature-grid,.lp-cat-grid,.lp-trust-grid{grid-template-columns:repeat(2,1fr)}
          .lp-provider-panel{padding:40px 28px}
          .lp-provider-top{grid-template-columns:1fr;gap:36px}
          .lp-provider-copy{max-width:100%}
          .lp-provider-visual{order:-1;max-width:380px;width:100%;margin:0 auto}
          .lp-provider-grid{grid-template-columns:repeat(2,1fr)}
          .lp-footer-grid{grid-template-columns:1fr 1fr}
          .lp-footer-bottom{flex-direction:column;align-items:flex-start}
          .lp-coverage-note{text-align:left}
        }
        @media(max-width:600px){
          .lp-h1{font-size:30px}
          .lp-h2{font-size:24px}
          .lp-steps,.lp-feature-grid,.lp-cat-grid,.lp-trust-grid{grid-template-columns:1fr}
          .lp-cta{padding:40px 22px}
          .lp-footer-grid{grid-template-columns:1fr}
          .lp-stats{gap:18px}
          .lp-provider-panel{padding:30px 18px}
          .lp-provider-visual{padding:16px;max-width:100%}
          .lp-provider-blob-1{width:120px;height:120px;top:-16px;right:-16px}
          .lp-provider-blob-2{width:100px;height:100px}
          .lp-provider-mock{padding:20px 18px 16px}
          .lp-mock-bars{height:64px}
          .lp-provider-visual .lp-visual-card{padding:10px 12px;gap:8px}
          .lp-provider-mini-stats{gap:14px}
          .lp-mini-v{font-size:18px}
          .lp-provider-grid{grid-template-columns:1fr}
        }
      `}</style>

      <div className="lp">
        {/* Header */}
        <header className={`lp-header${scrolled ? " scrolled" : ""}`}>
          <div className="lp-header-inner">
            <div className="lp-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <div className="lp-logo-mark"><Zap size={19} color="#fff" /></div>
              <span className="lp-logo-text">Servi<span style={{ color: "#2563eb" }}>app</span></span>
            </div>
            <nav className="lp-nav">
              <a href="#como-funciona">Como funciona</a>
              <a href="/sobre">Sobre</a>
              <a href="#para-prestadores">Para prestadores</a>
              <a href="#contacto">Contacto</a>
            </nav>
            <div className="lp-header-actions">
              <button className="lp-btn-ghost" onClick={goLogin}>Entrar</button>
              <button className="lp-btn-solid" onClick={goRegisterClient}>Criar conta</button>
              <button className="lp-menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
          {menuOpen && (
            <div style={{ padding: "8px 24px 20px", display: "flex", flexDirection: "column", gap: 4, borderTop: "1px solid #eef1f5" }}>
              {[["Como funciona", "#como-funciona"], ["Sobre", "/sobre"], ["Para prestadores", "#para-prestadores"], ["Contacto", "#contacto"]].map(([label, href]) => (
                <a key={href} href={href} onClick={() => setMenuOpen(false)} style={{ padding: "12px 0", fontSize: 14.5, fontWeight: 600, color: "#334155", textDecoration: "none", borderBottom: "1px solid #f1f5f9" }}>{label}</a>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button className="lp-btn-ghost" style={{ flex: 1 }} onClick={goLogin}>Entrar</button>
                <button className="lp-btn-solid" style={{ flex: 1 }} onClick={goRegisterClient}>Criar conta</button>
              </div>
            </div>
          )}
        </header>

        {/* Hero */}
        <section className="lp-hero">
          <div className="lp-container lp-hero-grid">
            <Reveal>
              <div className="lp-eyebrow"><MapPin size={13} /> A operar em Luanda</div>
              <h1 className="lp-h1">Encontre o <span>profissional certo</span>, quando precisar</h1>
              <p className="lp-sub">Ligamos quem precisa de um serviço a prestadores verificados perto de si do eletricista à faxineira, tudo num só lugar.</p>
              <div className="lp-hero-actions">
                <button className="lp-btn-primary" onClick={goRegisterClient}>Quero contratar <ArrowRight size={16} /></button>
                <button className="lp-btn-secondary" onClick={goRegisterProvider}>Quero prestar serviços</button>
              </div>
              <div className="lp-stats">
                {stats.map((s, i) => (
                  <div key={i}>
                    <p className="lp-stat-v" style={{ color: s.c }}>{s.v}</p>
                    <p className="lp-stat-l">{s.l}</p>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={150}>
              <div className="lp-hero-visual">
                {/* Mapa real de fundo, estilizado como um mapa de ruas (SVG, sem dependências externas) */}
                <div className="lp-map-bg">
                  <svg viewBox="0 0 560 420" preserveAspectRatio="xMidYMid slice">
                    <rect width="560" height="420" fill="#eaf2fb" />
                    {/* blocos de "quarteirões" */}
                    <g fill="#dde9f7">
                      <rect x="30" y="20" width="150" height="110" rx="6" />
                      <rect x="210" y="10" width="120" height="90" rx="6" />
                      <rect x="360" y="30" width="170" height="120" rx="6" />
                      <rect x="20" y="170" width="120" height="100" rx="6" />
                      <rect x="180" y="190" width="150" height="90" rx="6" />
                      <rect x="370" y="190" width="160" height="110" rx="6" />
                      <rect x="40" y="310" width="160" height="90" rx="6" />
                      <rect x="230" y="320" width="140" height="80" rx="6" />
                      <rect x="400" y="330" width="140" height="80" rx="6" />
                    </g>
                    {/* zona verde (parque) */}
                    <rect x="240" y="110" width="90" height="70" rx="10" fill="#d9f0e4" />
                    {/* água */}
                    <path d="M0,60 Q80,90 160,60 T320,55 T560,70 L560,0 L0,0 Z" fill="#dbeafe" opacity="0.6" />
                    {/* ruas principais */}
                    <g stroke="#ffffff" strokeWidth="10" fill="none" strokeLinecap="round">
                      <path d="M0,150 H560" />
                      <path d="M0,300 H560" />
                      <path d="M190,0 V420" />
                      <path d="M355,0 V420" />
                    </g>
                    <g stroke="#ffffff" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.85">
                      <path d="M0,95 H560" />
                      <path d="M0,235 H560" />
                      <path d="M0,365 H560" />
                      <path d="M95,0 V420" />
                      <path d="M275,0 V420" />
                      <path d="M470,0 V420" />
                    </g>
                    {/* rota tracejada entre pins */}
                    <path className="lp-route-line" d="M110,335 C160,260 220,230 280,210 C330,192 360,140 385,95" />
                  </svg>
                </div>

                <div className="lp-hero-you" style={{ top: "50%", left: "50%" }} />
                <div className="lp-pin" style={{ background: "#eff6ff", top: "22%", left: "20%" }}><Zap size={19} color="#2563eb" /></div>
                <div className="lp-pin" style={{ background: "#f0fdf9", top: "62%", left: "30%" }}><Wrench size={19} color="#1D9E75" /></div>
                <div className="lp-pin" style={{ background: "#fef3e2", top: "30%", right: "14%" }}><Sparkles size={19} color="#EF9F27" /></div>
                <div className="lp-visual-card" style={{ bottom: 22, left: 18 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}><Wrench size={18} color="#2563eb" /></div>
                  <div><p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Canalizador</p><p style={{ fontSize: 11.5, color: "#94a3b8" }}>Disponível hoje</p></div>
                </div>
                <div className="lp-visual-card" style={{ top: 20, right: 18, animationDelay: "1.4s" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f0fdf9", display: "flex", alignItems: "center", justifyContent: "center" }}><Star size={18} color="#1D9E75" /></div>
                  <div><p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>4.9 de avaliação</p><p style={{ fontSize: 11.5, color: "#94a3b8" }}>Serviço concluído</p></div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Como funciona */}
        <section className="lp-section lp-section-alt" id="como-funciona">
          <div className="lp-container">
            <Reveal>
              <div className="lp-section-head">
                <span className="lp-tag">Como funciona</span>
                <h2 className="lp-h2">Do pedido ao serviço feito, em 4 passos</h2>
                <p className="lp-section-sub">Um processo simples, pensado para poupar tempo a quem contrata e a quem presta o serviço.</p>
              </div>
            </Reveal>
            <div className="lp-steps">
              {steps.map((s, i) => {
                const c = ACCENTS[i % 3];
                return (
                  <Reveal key={i} delay={i * 70}>
                    <div className="lp-step">
                      <p className="lp-step-num">0{i + 1}</p>
                      <div className="lp-step-icon" style={{ background: `${c}18` }}><s.icon size={21} color={c} /></div>
                      <h3>{s.title}</h3>
                      <p>{s.text}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* Recursos: mapa, escrow, chat — cards maiores, mais arredondados, ícones a cores diversas */}
        <section className="lp-section">
          <div className="lp-container">
            <Reveal>
              <div className="lp-section-head">
                <span className="lp-tag">Feito para o dia a dia</span>
                <h2 className="lp-h2">Ferramentas que facilitam cada pedido</h2>
              </div>
            </Reveal>
            <div className="lp-feature-grid">
              {resources.map((r, i) => {
                const color = RICH_ACCENTS[i % RICH_ACCENTS.length];
                return (
                  <Reveal key={i} delay={i * 80}>
                    <div className="lp-feature-card">
                      <div className="lp-feature-icon" style={{ background: `${color}16` }}><r.icon size={28} color={color} /></div>
                      <h3>{r.title}</h3>
                      <p>{r.text}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* Categorias */}
        <section className="lp-section lp-section-alt" id="servicos">
          <div className="lp-container">
            <Reveal>
              <div className="lp-section-head">
                <span className="lp-tag">Serviços</span>
                <h2 className="lp-h2">Para cada necessidade, um especialista</h2>
                <p className="lp-section-sub">Categorias disponíveis na plataforma neste momento.</p>
              </div>
            </Reveal>

            {/* Ilustração da secção — profissionais e ferramentas, em SVG leve */}
            <Reveal>
              <div className="lp-illustration">
                <svg width="300" height="130" viewBox="0 0 300 130" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="150" cy="118" rx="130" ry="10" fill="#f1f5f9" />
                  <circle cx="70" cy="55" r="34" fill="#eff6ff" />
                  <circle cx="150" cy="40" r="42" fill="#f0fdf9" />
                  <circle cx="232" cy="58" r="30" fill="#fef3e2" />
                  <g transform="translate(52,38)">
                    <rect x="0" y="10" width="36" height="36" rx="10" fill="#2563eb" />
                    <path d="M9 28 L16 35 L28 20" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </g>
                  <g transform="translate(130,18)">
                    <rect x="0" y="8" width="42" height="42" rx="12" fill="#1D9E75" />
                    <path d="M21 16 v20 M11 26 h20" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
                  </g>
                  <g transform="translate(214,40)">
                    <rect x="0" y="8" width="34" height="34" rx="9" fill="#EF9F27" />
                    <circle cx="17" cy="25" r="6.5" stroke="#fff" strokeWidth="3" fill="none" />
                  </g>
                </svg>
              </div>
            </Reveal>

            <div className="lp-cat-grid">
              {categories.map((c, i) => {
                const color = ACCENTS[i % 3];
                return (
                  <Reveal key={i} delay={i * 35}>
                    <div className="lp-cat-card">
                      <div className="lp-cat-icon" style={{ background: `${color}18` }}><c.icon size={20} color={color} /></div>
                      <p className="lp-cat-name">{c.name}</p>
                      <p className="lp-cat-desc">{c.desc}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* Confiança — cards maiores, mais arredondados, ícones a cores diversas */}
        <section className="lp-section">
          <div className="lp-container">
            <Reveal>
              <div className="lp-section-head">
                <span className="lp-tag">Confiança</span>
                <h2 className="lp-h2">Segurança em cada etapa</h2>
              </div>
            </Reveal>
            <div className="lp-trust-grid">
              {trust.map((t, i) => {
                const color = RICH_ACCENTS[(i + 2) % RICH_ACCENTS.length];
                return (
                  <Reveal key={i} delay={i * 80}>
                    <div className="lp-trust-card">
                      <div className="lp-trust-icon" style={{ background: `${color}16` }}><t.icon size={26} color={color} /></div>
                      <h3>{t.title}</h3>
                      <p>{t.text}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* Para prestadores */}
        <section className="lp-section lp-section-alt" id="para-prestadores">
          <div className="lp-container">
            <Reveal>
              <div className="lp-provider-panel">
                <div className="lp-provider-top">
                  <div className="lp-provider-copy">
                    <span className="lp-tag" style={{ background: "#fff" }}>Para prestadores</span>
                    <h2 className="lp-h2" style={{ marginTop: 4 }}>Encontre novos clientes na sua área</h2>
                    <p className="lp-section-sub">Crie o seu perfil, defina os serviços que presta e comece a receber pedidos de clientes perto de si.</p>

                    <div className="lp-provider-mini-stats">
                      <div>
                        <p className="lp-mini-v" style={{ color: "#2563eb" }}>500+</p>
                        <p className="lp-mini-l">Prestadores ativos</p>
                      </div>
                      <div className="lp-mini-sep" />
                      <div>
                        <p className="lp-mini-v" style={{ color: "#1D9E75" }}>10%</p>
                        <p className="lp-mini-l">Taxa de serviço</p>
                      </div>
                      <div className="lp-mini-sep" />
                      <div>
                        <p className="lp-mini-v" style={{ color: "#EF9F27" }}>4.9★</p>
                        <p className="lp-mini-l">Avaliação média</p>
                      </div>
                    </div>

                    <button className="lp-btn-primary" onClick={goRegisterProvider}>Criar perfil de prestador <ArrowRight size={16} /></button>
                  </div>

                  {/* Ilustração: mockup do painel do prestador (sem imagens externas, tudo SVG/CSS) */}
                  <div className="lp-provider-visual">
                    <div className="lp-provider-blob lp-provider-blob-1" />
                    <div className="lp-provider-blob lp-provider-blob-2" />

                    <div className="lp-provider-mock">
                      <div className="lp-mock-header">
                        <div className="lp-mock-avatar">
                          <Leaf size={18} color="#EF9F27" />
                          <span className="lp-mock-verified"><ShieldCheck size={10} color="#fff" /></span>
                        </div>
                        <div>
                          <p className="lp-mock-name">Isaac Costa</p>
                          <p className="lp-mock-role">Jardineiro · Luanda</p>
                        </div>
                      </div>
                      <div className="lp-mock-bars">
                        <div className="lp-mock-bar" style={{ height: "38%", background: "#bfdbfe" }} />
                        <div className="lp-mock-bar" style={{ height: "58%", background: "#93c5fd" }} />
                        <div className="lp-mock-bar" style={{ height: "48%", background: "#bfdbfe" }} />
                        <div className="lp-mock-bar" style={{ height: "88%", background: "#1D9E75" }} />
                        <div className="lp-mock-bar" style={{ height: "62%", background: "#93c5fd" }} />
                        <div className="lp-mock-bar" style={{ height: "72%", background: "#2563eb" }} />
                      </div>
                      <p className="lp-mock-caption">Pedidos recebidos esta semana</p>
                    </div>

                    <div className="lp-visual-card" style={{ top: -10, right: -8, animationDelay: "0.6s" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0fdf9", display: "flex", alignItems: "center", justifyContent: "center" }}><Star size={16} color="#1D9E75" /></div>
                      <div><p style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>4.9 de avaliação</p><p style={{ fontSize: 11, color: "#94a3b8" }}>+128 serviços</p></div>
                    </div>
                    <div className="lp-visual-card" style={{ bottom: -10, left: -8, animationDelay: "1.4s" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}><Lock size={16} color="#2563eb" /></div>
                      <div><p style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>Pagamento seguro</p><p style={{ fontSize: 11, color: "#94a3b8" }}>Retido em escrow</p></div>
                    </div>
                  </div>
                </div>

                <div className="lp-provider-grid">
                  {providerChecklist.map((item, i) => (
                    <Reveal key={i} delay={i * 60}>
                      <div className="lp-provider-mini-card">
                        <div className="lp-provider-mini-icon" style={{ background: `${item.color}18` }}><item.icon size={17} color={item.color} /></div>
                        <span>{item.text}</span>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* CTA final */}
        <section className="lp-section">
          <div className="lp-container">
            <Reveal>
              <div className="lp-cta">
                <h2>Comece a usar a Serviapp</h2>
                <p>Crie a sua conta gratuita e ligue-se a quem precisa de si ou a quem pode resolver o seu problema.</p>
                <button className="lp-btn-white" onClick={goRegisterClient}>Criar conta</button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Footer */}
        <footer className="lp-footer" id="contacto">
          <div className="lp-container">
            <div className="lp-footer-grid">
              <div>
                <div className="lp-logo" style={{ marginBottom: 14 }}>
                  <div className="lp-logo-mark"><Zap size={17} color="#fff" /></div>
                  <span className="lp-logo-text" style={{ color: "#fff" }}>Servi<span style={{ color: "#60a5fa" }}>app</span></span>
                </div>
                <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, maxWidth: 260 }}>A plataforma que liga clientes a prestadores de serviços de confiança.</p>
                <div className="lp-footer-social">
                  <a href="#"><Globe size={16} color="#cbd5e1" /></a>
                  <a href="#"><Camera size={16} color="#cbd5e1" /></a>
                  <a href="#"><Link2 size={16} color="#cbd5e1" /></a>
                </div>
              </div>
              <div>
                <h4>Plataforma</h4>
                <a href="#como-funciona">Como funciona</a>
                <a href="#servicos">Serviços</a>
                <a href="#para-prestadores">Para prestadores</a>
              </div>
              <div>
                <h4>Empresa</h4>
                <a href="/sobre">Sobre</a>
                <a href="/termos">Termos de uso</a>
                <a href="/privacidade">Privacidade</a>
              </div>
            </div>
            <div className="lp-footer-bottom">
              <p>© 2026 Serviapp. Todos os direitos reservados.</p>
              <p className="lp-coverage-note">De momento disponível em Luanda, com expansão progressiva para outras cidades.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}