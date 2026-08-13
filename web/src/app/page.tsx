"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Zap, Menu, X, ArrowRight, ClipboardList, Inbox, CalendarCheck, Star,
  Shield, ShieldCheck, Headphones, Wrench, Sparkles, Leaf, Paintbrush, Truck,
  Snowflake, Laptop, Scissors, Car, Hammer, MapPin, Map, Lock,
  CheckCircle2, Percent, BarChart3, MessageCircle, Building2,
  Globe, Camera, Link2, UserCheck, Star as StarIcon, Wifi, Battery, Signal,
} from "lucide-react";
import { InstallGuideSection } from "@/components/pwa/InstallGuideSection";

/* Hook simples de scroll-reveal, sem dependências novas */
function useReveal() {
  const ref = useRef(null);
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
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* Uma só cor de acção (azul da marca) + verde só para estados de confirmação/verificação.
   Nada de cor própria por categoria ou por card, a identidade é do Mestroo, não do item. */
const BRAND = "#1e293b";
const CONFIRM = "#1D9E75";
const INK = "#0f172a";
const LOGO_ACCENT = "#7C6FE0";
const MAP_ACCENT = "#0F766E";

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

  const journey = [
    { label: "Antes", title: "Saiba com quem está a contratar", text: "Cada prestador passa por verificação de identidade (KYC) antes de poder receber pedidos.", icon: UserCheck },
    { label: "Durante", title: "Fale sem sair da Mestroo", text: "Combine horários, detalhes e alterações pelo chat integrado, fica tudo registado.", icon: MessageCircle },
    { label: "Pagamento", title: "O dinheiro fica retido até o serviço terminar", text: "O valor entra em escrow e só é libertado ao prestador depois de confirmar a conclusão.", icon: Lock },
    { label: "Depois", title: "Avalie o que foi feito", text: "A sua avaliação fica ligada a um serviço real e ajuda o próximo cliente a escolher.", icon: Star },
  ];

  const providerChecklist = [
    { icon: CheckCircle2, text: "Perfil verificado após aprovação do KYC" },
    { icon: Percent, text: "Taxa de serviço de 10% sobre os pagamentos recebidos" },
    { icon: BarChart3, text: "Painel de estatísticas para acompanhar pedidos e desempenho" },
    { icon: StarIcon, text: "Sistema de avaliações deixadas pelos clientes" },
    { icon: Building2, text: "Possibilidade de criar depois um perfil de empresa" },
    { icon: MessageCircle, text: "Chat integrado para falar diretamente com o cliente" },
  ];

  const stats = [
    { v: "500+", l: "Prestadores" },
    { v: "12+", l: "Categorias" },
    { v: "4.9★", l: "Avaliação média" },
  ];

  return (
    <>
      <style>{`
        .lp *{box-sizing:border-box}
        .lp{background:#ffffff;color:#111827;font-family:inherit;overflow-x:hidden}
        .lp-container{max-width:1180px;margin:0 auto;padding:0 24px}

        @keyframes pulseDot{0%,100%{box-shadow:0 0 0 0 rgba(15,118,110,0.35)}50%{box-shadow:0 0 0 10px rgba(15,118,110,0)}}
        @keyframes dashMove{to{stroke-dashoffset:-24}}

        /* Header */
        .lp-header{position:sticky;top:0;z-index:50;background:rgba(255,255,255,0.9);backdrop-filter:blur(10px);border-bottom:1px solid #eef1f5;transition:box-shadow .2s}
        .lp-header.scrolled{box-shadow:0 2px 16px rgba(15,23,42,0.06)}
        .lp-header-inner{max-width:1180px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;justify-content:space-between}
        .lp-logo{display:flex;align-items:center;gap:10px;cursor:pointer}
        .lp-logo-mark{width:38px;height:38px;border-radius:11px;background:${BRAND};display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .lp-logo-text{font-size:19px;font-weight:800;color:#0f172a;letter-spacing:-0.02em}
        .lp-nav{display:flex;align-items:center;gap:32px}
        .lp-nav a,.lp-nav a:visited{font-size:14.5px;font-weight:600;color:#475569;text-decoration:none;transition:color .15s}
        .lp-nav a:hover{color:${BRAND}}
        .lp-header-actions{display:flex;align-items:center;gap:10px}
        .lp-btn-ghost{padding:10px 18px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;color:#334155;font-size:14px;font-weight:700;cursor:pointer;transition:all .15s;font-family:inherit}
        .lp-btn-ghost:hover{border-color:${BRAND};color:${BRAND}}
        .lp-btn-solid{padding:10px 20px;border-radius:10px;border:none;background:${BRAND};color:#fff;font-size:14px;font-weight:700;cursor:pointer;transition:transform .15s,box-shadow .15s;font-family:inherit}
        .lp-btn-solid:hover{transform:translateY(-1px)}
        .lp-menu-toggle{display:none;background:none;border:none;cursor:pointer;color:#0f172a}

        /* Hero */
        .lp-hero{padding:64px 0 56px}
        .lp-hero-grid{display:grid;grid-template-columns:1.05fr 0.95fr;gap:56px;align-items:center}
        .lp-eyebrow{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:99px;background:#f1f5f9;color:#475569;font-size:12.5px;font-weight:700;margin-bottom:20px}
        .lp-h1{font-size:42px;line-height:1.14;font-weight:800;color:#0f172a;letter-spacing:-0.02em;margin-bottom:18px}
        .lp-h1 span{color:${BRAND}}
        .lp-sub{font-size:17px;line-height:1.6;color:#64748b;max-width:460px;margin-bottom:32px}
        .lp-hero-actions{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:36px}
        .lp-btn-primary{display:inline-flex;align-items:center;gap:8px;padding:15px 26px;border-radius:12px;border:none;background:${BRAND};color:#fff;font-size:15px;font-weight:700;cursor:pointer;transition:transform .15s;font-family:inherit}
        .lp-btn-primary:hover{transform:translateY(-2px)}
        .lp-btn-secondary{display:inline-flex;align-items:center;gap:8px;padding:15px 26px;border-radius:12px;border:1.5px solid #e2e8f0;background:#fff;color:#334155;font-size:15px;font-weight:700;cursor:pointer;transition:all .15s;font-family:inherit}
        .lp-btn-secondary:hover{border-color:#cbd5e1;color:${INK};transform:translateY(-2px)}
        .lp-stats{display:flex;gap:28px}
        .lp-stat-v{font-size:21px;font-weight:800;color:${INK}}
        .lp-stat-l{font-size:12px;color:#94a3b8;margin-top:2px}

        /* Hero visual: mapa real de fundo */
        .lp-hero-visual{position:relative;border-radius:20px;padding:22px;min-height:380px;overflow:hidden;border:1px solid #e2e8f0}
        .lp-map-bg{position:absolute;inset:0;z-index:0}
        .lp-map-bg svg{width:100%;height:100%;display:block}
        .lp-hero-you{position:absolute;top:50%;left:50%;width:14px;height:14px;border-radius:50%;background:${MAP_ACCENT};border:2px solid #fff;transform:translate(-50%,-50%);animation:pulseDot 2.2s ease-out infinite;z-index:3}
        .lp-pin{position:absolute;width:42px;height:42px;border-radius:12px;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(15,23,42,0.14);z-index:3;border:1px solid #eef1f5}
        .lp-visual-card{position:absolute;background:#fff;border-radius:14px;box-shadow:0 10px 24px rgba(15,23,42,0.12);padding:12px 14px;display:flex;align-items:center;gap:10px;z-index:4;border:1px solid #eef1f5}
        .lp-route-line{stroke:${MAP_ACCENT};stroke-width:2.5;stroke-dasharray:6 6;fill:none;opacity:0.55;stroke-linecap:round;animation:dashMove 1.4s linear infinite}

        /* Section shared */
        .lp-section{padding:80px 0}
        .lp-section-alt{background:#f8fafc}
        .lp-section-head{max-width:620px;margin:0 0 44px}
        .lp-section-head.center{text-align:center;margin-left:auto;margin-right:auto}
        .lp-tag{display:inline-block;font-size:13px;font-weight:700;color:${BRAND};margin-bottom:14px}
        .lp-h2{font-size:30px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;margin-bottom:12px}
        .lp-section-sub{font-size:15.5px;color:#64748b;line-height:1.6}

        /* Steps */
        .lp-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-top:1px solid #eef1f5;border-left:1px solid #eef1f5}
        .lp-step{border-right:1px solid #eef1f5;border-bottom:1px solid #eef1f5;padding:26px 24px}
        .lp-step-num{font-size:12.5px;font-weight:800;color:#94a3b8;margin-bottom:14px}
        .lp-step-icon{width:40px;height:40px;border-radius:11px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;margin-bottom:16px}
        .lp-step h3{font-size:15.5px;font-weight:700;color:#0f172a;margin-bottom:8px}
        .lp-step p{font-size:13.5px;color:#64748b;line-height:1.55}

        /* Ferramentas: blocos split, alternados, com visual real ao lado da copy */
        .lp-tool-row{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;padding:44px 0;border-bottom:1px solid #eef1f5}
        .lp-tool-row:last-child{border-bottom:none}
        .lp-tool-row.reverse .lp-tool-copy{order:2}
        .lp-tool-row.reverse .lp-tool-visual{order:1}
        .lp-tool-eyebrow{font-size:13px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:10px}
        .lp-tool-copy h3{font-size:24px;font-weight:800;color:${INK};letter-spacing:-0.01em;margin-bottom:12px;line-height:1.25}
        .lp-tool-copy p{font-size:15px;color:#64748b;line-height:1.65;max-width:400px}
        .lp-tool-visual{background:#f8fafc;border:1px solid #eef1f5;border-radius:18px;padding:24px;min-height:220px;display:flex;align-items:center;justify-content:center;position:relative}

        /* iPhone ilustrativo para a secção Chat */
        .lp-phone{position:relative;width:210px;height:428px;border-radius:36px;background:${INK};padding:10px;box-shadow:0 18px 40px rgba(15,23,42,0.22)}
        .lp-phone-screen{position:relative;width:100%;height:100%;border-radius:28px;background:#f8fafc;overflow:hidden;display:flex;flex-direction:column}
        .lp-phone-notch{position:absolute;top:0;left:50%;transform:translateX(-50%);width:84px;height:22px;background:${INK};border-radius:0 0 14px 14px;z-index:5}
        .lp-phone-status{display:flex;align-items:center;justify-content:space-between;padding:16px 18px 6px;font-size:11px;font-weight:700;color:${INK}}
        .lp-phone-status-icons{display:flex;align-items:center;gap:4px}
        .lp-phone-chatbar{display:flex;align-items:center;gap:8px;padding:8px 14px;border-bottom:1px solid #eef1f5;background:#ffffff}
        .lp-phone-chatavatar{width:26px;height:26px;border-radius:8px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .lp-phone-chatname{font-size:11.5px;font-weight:700;color:${INK}}
        .lp-phone-chatstatus{font-size:9.5px;color:${CONFIRM}}
        .lp-phone-messages{flex:1;padding:14px;display:flex;flex-direction:column;gap:8px;justify-content:flex-end}

        /* Categories */
        .lp-cat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#eef1f5;border:1px solid #eef1f5;border-radius:16px;overflow:hidden}
        .lp-cat-card{background:#fff;padding:22px 20px;display:flex;flex-direction:column;gap:8px;cursor:pointer;transition:background .15s}
        .lp-cat-card:hover{background:#f8fafc}
        .lp-cat-icon{width:40px;height:40px;border-radius:11px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;margin-bottom:2px;color:#334155}
        .lp-cat-name{font-size:15px;font-weight:700;color:#0f172a}
        .lp-cat-desc{font-size:12.5px;color:#64748b;line-height:1.5}

        /* Exemplo real: cadeia horizontal */
        .lp-chain{display:flex;align-items:center;flex-wrap:wrap;gap:0;background:#fff;border:1px solid #eef1f5;border-radius:18px;padding:28px 24px}
        .lp-chain-step{display:flex;align-items:center;gap:10px;padding:10px 16px;border-radius:10px;background:#f8fafc;font-size:13.5px;font-weight:600;color:#334155}
        .lp-chain-arrow{color:#cbd5e1;margin:0 8px;flex-shrink:0}

        /* Segurança: jornada em 4 etapas, split copy + linha do tempo */
        .lp-journey{display:flex;flex-direction:column}
        .lp-journey-item{display:grid;grid-template-columns:120px 40px 1fr;column-gap:16px;padding:24px 0}
        .lp-journey-label{font-size:13px;font-weight:700;color:#94a3b8;padding-top:2px}
        .lp-journey-line{display:flex;flex-direction:column;align-items:center}
        .lp-journey-dot{width:34px;height:34px;border-radius:10px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:${BRAND};flex-shrink:0}
        .lp-journey-rule{width:1px;flex:1;background:#e2e8f0;margin-top:8px}
        .lp-journey-item:last-child .lp-journey-rule{display:none}
        .lp-journey-body h3{font-size:16.5px;font-weight:700;color:${INK};margin-bottom:6px}
        .lp-journey-body p{font-size:14px;color:#64748b;line-height:1.6;max-width:460px}

        /* Para prestadores */
        .lp-provider-panel{position:relative;background:#f8fafc;border:1px solid #eef1f5;border-radius:24px;padding:52px 44px}
        .lp-provider-top{display:grid;grid-template-columns:1.05fr 0.95fr;gap:56px;align-items:center}
        .lp-provider-copy{max-width:460px}
        .lp-provider-mini-stats{display:flex;align-items:center;gap:20px;margin:24px 0 28px}
        .lp-mini-v{font-size:20px;font-weight:800;line-height:1;color:${INK}}
        .lp-mini-l{font-size:11px;color:#94a3b8;margin-top:4px}
        .lp-mini-sep{width:1px;height:28px;background:#dbe3ee;flex-shrink:0}

        .lp-provider-mock{position:relative;background:#fff;border:1px solid #eef1f5;border-radius:18px;padding:24px 24px 20px}
        .lp-mock-header{display:flex;align-items:center;gap:12px;margin-bottom:22px}
        .lp-mock-avatar{position:relative;width:42px;height:42px;border-radius:12px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#334155}
        .lp-mock-verified{position:absolute;bottom:-3px;right:-3px;width:16px;height:16px;border-radius:50%;background:${CONFIRM};display:flex;align-items:center;justify-content:center;border:2px solid #fff}
        .lp-mock-name{font-size:14.5px;font-weight:700;color:#0f172a}
        .lp-mock-role{font-size:12px;color:#94a3b8;margin-top:1px}
        .lp-mock-bars{display:flex;align-items:flex-end;gap:8px;height:80px;padding:0 2px}
        .lp-mock-bar{flex:1;border-radius:5px 5px 2px 2px;background:#dbeafe}
        .lp-mock-bar.high{background:${BRAND}}
        .lp-mock-caption{font-size:11.5px;color:#94a3b8;margin-top:14px;text-align:center}

        .lp-provider-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#eef1f5;border:1px solid #eef1f5;border-radius:14px;overflow:hidden;margin-top:36px}
        .lp-provider-mini-card{display:flex;align-items:flex-start;gap:12px;background:#fff;padding:16px}
        .lp-provider-mini-icon{width:30px;height:30px;border-radius:9px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:${BRAND}}
        .lp-provider-mini-card span{font-size:13px;color:#334155;line-height:1.5;padding-top:3px}

        /* Final CTA */
        .lp-cta{background:${INK};border-radius:24px;padding:56px 48px;text-align:center;color:#fff}
        .lp-cta h2{font-size:28px;font-weight:800;margin-bottom:14px;letter-spacing:-0.02em}
        .lp-cta p{font-size:15.5px;color:#cbd5e1;max-width:460px;margin:0 auto 30px;line-height:1.6}
        .lp-btn-white{padding:15px 28px;border-radius:12px;border:none;background:#fff;color:${INK};font-size:15px;font-weight:800;cursor:pointer;transition:transform .15s;font-family:inherit}
        .lp-btn-white:hover{transform:translateY(-2px)}

        /* Footer */
        .lp-footer{background:#0f172a;color:#cbd5e1;padding:56px 0 28px}
        .lp-footer-grid{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:40px;margin-bottom:40px}
        .lp-footer h4{font-size:13.5px;font-weight:700;color:#fff;margin-bottom:16px}
        .lp-footer a,.lp-footer a:visited{display:block;font-size:13.5px;color:#94a3b8;text-decoration:none;margin-bottom:10px;transition:color .15s}
        .lp-footer a:hover{color:#fff}
        .lp-footer-social{display:flex;gap:10px;margin-top:16px}
        .lp-footer-social a,.lp-footer-social a:visited{width:36px;height:36px;border-radius:10px;background:#1e293b;display:flex;align-items:center;justify-content:center;margin:0}
        .lp-footer-social a:hover{background:${BRAND}}
        .lp-footer-bottom{border-top:1px solid #1e293b;padding-top:24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
        .lp-footer-bottom p{font-size:12.5px;color:#64748b}
        .lp-coverage-note{font-size:12.5px;color:#64748b;max-width:420px;text-align:right}

        @media(max-width:960px){
          .lp-nav{display:none}
          .lp-header-actions .lp-btn-ghost{display:none}
          .lp-menu-toggle{display:block}
          .lp-hero-grid{grid-template-columns:1fr}
          .lp-hero-visual{order:-1;min-height:280px}
          .lp-steps{grid-template-columns:repeat(2,1fr)}
          .lp-cat-grid{grid-template-columns:repeat(2,1fr)}
          .lp-tool-row,.lp-tool-row.reverse{grid-template-columns:1fr;gap:24px}
          .lp-tool-row.reverse .lp-tool-copy,.lp-tool-row.reverse .lp-tool-visual{order:initial}
          .lp-tool-visual{order:-1}
          .lp-journey-item{grid-template-columns:90px 34px 1fr;column-gap:14px}
          .lp-provider-panel{padding:40px 28px}
          .lp-provider-top{grid-template-columns:1fr;gap:32px}
          .lp-provider-copy{max-width:100%}
          .lp-provider-grid{grid-template-columns:repeat(2,1fr)}
          .lp-footer-grid{grid-template-columns:1fr 1fr}
          .lp-footer-bottom{flex-direction:column;align-items:flex-start}
          .lp-coverage-note{text-align:left}
        }
        @media(max-width:600px){
          .lp-h1{font-size:29px}
          .lp-h2{font-size:23px}
          .lp-steps{grid-template-columns:1fr}
          .lp-cat-grid{grid-template-columns:1fr}
          .lp-cta{padding:40px 22px}
          .lp-footer-grid{grid-template-columns:1fr}
          .lp-stats{gap:18px}
          .lp-provider-panel{padding:28px 18px}
          .lp-provider-grid{grid-template-columns:1fr}
          .lp-journey-item{grid-template-columns:60px 34px 1fr;column-gap:14px}
          .lp-journey-label{font-size:12px}
          .lp-chain{padding:20px 16px}
        }
      `}</style>

      <div className="lp">
        {/* Header */}
        <header className={`lp-header${scrolled ? " scrolled" : ""}`}>
          <div className="lp-header-inner">
            <div className="lp-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <div className="lp-logo-mark"><Zap size={19} color="#fff" /></div>
              <span className="lp-logo-text">Mestr<span style={{ color: LOGO_ACCENT }}>oo</span></span>
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
              <h1 className="lp-h1">Precisa de alguém para resolver isso?</h1>
              <p className="lp-sub">Descreva o serviço, veja quem está disponível perto de si e escolha com quem quer trabalhar. Do eletricista à faxineira.</p>
              <div className="lp-hero-actions">
                <button className="lp-btn-primary" onClick={goRegisterClient}>Encontrar um profissional <ArrowRight size={16} /></button>
                <button className="lp-btn-secondary" onClick={goRegisterProvider}>Quero prestar serviços</button>
              </div>
              <div className="lp-stats">
                {stats.map((s, i) => (
                  <div key={i}>
                    <p className="lp-stat-v">{s.v}</p>
                    <p className="lp-stat-l">{s.l}</p>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="lp-hero-visual">
                <div className="lp-map-bg">
                  <svg viewBox="0 0 560 420" preserveAspectRatio="xMidYMid slice">
                    <rect width="560" height="420" fill="#f1f5f9" />
                    <g fill="#e6ebf1">
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
                    <path className="lp-route-line" d="M110,335 C160,260 220,230 280,210 C330,192 360,140 385,95" />
                  </svg>
                </div>

                <div className="lp-hero-you" style={{ top: "50%", left: "50%" }} />
                <div className="lp-pin" style={{ top: "22%", left: "20%" }}><Zap size={18} color={MAP_ACCENT} /></div>
                <div className="lp-pin" style={{ top: "62%", left: "30%" }}><Wrench size={18} color={MAP_ACCENT} /></div>
                <div className="lp-pin" style={{ top: "30%", right: "14%" }}><Sparkles size={18} color={MAP_ACCENT} /></div>
                <div className="lp-visual-card" style={{ bottom: 22, left: 18 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}><Wrench size={16} color="#334155" /></div>
                  <div><p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Canalizador</p><p style={{ fontSize: 11.5, color: "#94a3b8" }}>Disponível hoje</p></div>
                </div>
                <div className="lp-visual-card" style={{ top: 20, right: 18 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}><Star size={16} color={CONFIRM} /></div>
                  <div><p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>4.9 de avaliação</p><p style={{ fontSize: 11.5, color: "#94a3b8" }}>Serviço concluído</p></div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Categorias */}
        <section className="lp-section" id="servicos">
          <div className="lp-container">
            <Reveal>
              <div className="lp-section-head">
                <span className="lp-tag">Serviços</span>
                <h2 className="lp-h2">O que precisa de resolver?</h2>
                <p className="lp-section-sub">Categorias disponíveis na plataforma neste momento.</p>
              </div>
            </Reveal>
            <Reveal>
              <div className="lp-cat-grid">
                {categories.map((c, i) => (
                  <div className="lp-cat-card" key={i}>
                    <div className="lp-cat-icon"><c.icon size={19} /></div>
                    <p className="lp-cat-name">{c.name}</p>
                    <p className="lp-cat-desc">{c.desc}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Como funciona */}
        <section className="lp-section lp-section-alt" id="como-funciona">
          <div className="lp-container">
            <Reveal>
              <div className="lp-section-head center">
                <span className="lp-tag">Como funciona</span>
                <h2 className="lp-h2">Do pedido ao serviço feito, em 4 passos</h2>
                <p className="lp-section-sub">Um processo simples, pensado para poupar tempo a quem contrata e a quem presta o serviço.</p>
              </div>
            </Reveal>
            <Reveal>
              <div className="lp-steps">
                {steps.map((s, i) => (
                  <div className="lp-step" key={i}>
                    <p className="lp-step-num">0{i + 1}</p>
                    <div className="lp-step-icon"><s.icon size={19} color="#334155" /></div>
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Ferramentas: benefício + visual real, alternados */}
        <section className="lp-section">
          <div className="lp-container">
            <Reveal>
              <div className="lp-section-head">
                <span className="lp-tag">No dia a dia</span>
                <h2 className="lp-h2">Ferramentas que facilitam cada pedido</h2>
              </div>
            </Reveal>

            {/* Mapa: usa o mesmo mapa real do hero, numa versão compacta */}
            <Reveal>
              <div className="lp-tool-row">
                <div className="lp-tool-copy">
                  <p className="lp-tool-eyebrow">Mapa</p>
                  <h3>Veja quem está perto de si</h3>
                  <p>O mapa mostra prestadores e pedidos na sua zona em tempo real, para saber quem pode chegar mais depressa.</p>
                </div>
                <div className="lp-tool-visual" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ position: "relative", width: "100%", height: 220 }}>
                    <svg viewBox="0 0 560 420" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
                      <rect width="560" height="420" fill="#eef2f7" />
                      <g fill="#e6ebf1">
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
                      <path className="lp-route-line" d="M110,335 C160,260 220,230 280,210 C330,192 360,140 385,95" />
                    </svg>
                    <div className="lp-hero-you" style={{ top: "50%", left: "50%" }} />
                    <div className="lp-pin" style={{ width: 34, height: 34, top: "24%", left: "18%" }}><Wrench size={15} color={MAP_ACCENT} /></div>
                    <div className="lp-pin" style={{ width: 34, height: 34, top: "60%", right: "16%" }}><Sparkles size={15} color={MAP_ACCENT} /></div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Chat: iPhone ilustrativo com a conversa */}
            <Reveal>
              <div className="lp-tool-row reverse">
                <div className="lp-tool-copy">
                  <p className="lp-tool-eyebrow">Chat</p>
                  <h3>Combine tudo sem sair da Mestroo</h3>
                  <p>Fale com o cliente ou o prestador para acertar horários, endereço e detalhes do serviço. Tudo fica guardado numa só conversa.</p>
                </div>
                <div className="lp-tool-visual">
                  <div className="lp-phone">
                    <div className="lp-phone-screen">
                      <div className="lp-phone-notch" />
                      <div className="lp-phone-status">
                        <span>9:41</span>
                        <div className="lp-phone-status-icons">
                          <Signal size={11} />
                          <Wifi size={11} />
                          <Battery size={13} />
                        </div>
                      </div>
                      <div className="lp-phone-chatbar">
                        <div className="lp-phone-chatavatar"><Wrench size={13} color="#334155" /></div>
                        <div>
                          <p className="lp-phone-chatname">Canalizador</p>
                          <p className="lp-phone-chatstatus">Online agora</p>
                        </div>
                      </div>
                      <div className="lp-phone-messages">
                        <div style={{ alignSelf: "flex-start", background: "#fff", border: "1px solid #eef1f5", borderRadius: "12px 12px 12px 3px", padding: "9px 13px", fontSize: 12.5, color: "#334155", maxWidth: "82%" }}>Pode ser amanhã de manhã?</div>
                        <div style={{ alignSelf: "flex-end", background: BRAND, color: "#fff", borderRadius: "12px 12px 3px 12px", padding: "9px 13px", fontSize: 12.5, maxWidth: "82%" }}>Sim, chego às 9h</div>
                        <div style={{ alignSelf: "flex-start", background: "#fff", border: "1px solid #eef1f5", borderRadius: "12px 12px 12px 3px", padding: "9px 13px", fontSize: 12.5, color: "#334155", maxWidth: "82%" }}>Combinado 👍</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal>
              <div className="lp-tool-row">
                <div className="lp-tool-copy">
                  <p className="lp-tool-eyebrow">Pagamento</p>
                  <h3>O pagamento só sai quando o serviço estiver feito</h3>
                  <p>O valor fica retido em escrow e só é libertado ao prestador depois de confirmar que o trabalho foi concluído.</p>
                </div>
                <div className="lp-tool-visual">
                  <div style={{ background: "#fff", border: "1px solid #eef1f5", borderRadius: 14, padding: "18px 20px", width: "100%", maxWidth: 240 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                      <Lock size={16} color={BRAND} />
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#334155" }}>Valor retido</span>
                    </div>
                    <p style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 4 }}>Kz 15.000</p>
                    <p style={{ fontSize: 11.5, color: "#94a3b8" }}>Libertado após confirmação do serviço</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Exemplo real */}
        <section className="lp-section lp-section-alt">
          <div className="lp-container">
            <Reveal>
              <div className="lp-section-head">
                <span className="lp-tag">Na prática</span>
                <h2 className="lp-h2">O seu AC deixou de funcionar</h2>
                <p className="lp-section-sub">Um exemplo de como um pedido percorre a plataforma, do problema à avaliação.</p>
              </div>
            </Reveal>
            <Reveal>
              <div className="lp-chain">
                {["Climatização", "Reparação de AC", "Prestadores disponíveis", "Escolher perfil", "Chat", "Serviço concluído"].map((step, i, arr) => (
                  <span key={step} style={{ display: "flex", alignItems: "center" }}>
                    <span className="lp-chain-step">{step}</span>
                    {i < arr.length - 1 && <ArrowRight size={15} className="lp-chain-arrow" />}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Segurança: jornada em etapas */}
        <section className="lp-section">
          <div className="lp-container">
            <Reveal>
              <div className="lp-section-head">
                <span className="lp-tag">Confiança</span>
                <h2 className="lp-h2">Segurança em cada etapa</h2>
                <p className="lp-section-sub">Não é apenas uma promessa. É o próprio processo, do primeiro contacto à avaliação final.</p>
              </div>
            </Reveal>
            <Reveal>
              <div className="lp-journey">
                {journey.map((j, i) => (
                  <div className="lp-journey-item" key={i}>
                    <p className="lp-journey-label">{j.label}</p>
                    <div className="lp-journey-line">
                      <div className="lp-journey-dot"><j.icon size={16} /></div>
                      <div className="lp-journey-rule" />
                    </div>
                    <div className="lp-journey-body">
                      <h3>{j.title}</h3>
                      <p>{j.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Para prestadores */}
        <section className="lp-section lp-section-alt" id="para-prestadores">
          <div className="lp-container">
            <Reveal>
              <div className="lp-provider-panel">
                <div className="lp-provider-top">
                  <div className="lp-provider-copy">
                    <span className="lp-tag">Para prestadores</span>
                    <h2 className="lp-h2" style={{ marginTop: 4 }}>Tem um serviço para oferecer?</h2>
                    <p className="lp-section-sub">Crie o seu perfil, defina os serviços que presta e comece a receber pedidos de clientes perto de si.</p>

                    <div className="lp-provider-mini-stats">
                      <div><p className="lp-mini-v">500+</p><p className="lp-mini-l">Prestadores ativos</p></div>
                      <div className="lp-mini-sep" />
                      <div><p className="lp-mini-v">10%</p><p className="lp-mini-l">Taxa de serviço</p></div>
                      <div className="lp-mini-sep" />
                      <div><p className="lp-mini-v">4.9★</p><p className="lp-mini-l">Avaliação média</p></div>
                    </div>

                    <button className="lp-btn-primary" onClick={goRegisterProvider}>Começar como prestador <ArrowRight size={16} /></button>
                  </div>

                  <div className="lp-provider-mock">
                    <div className="lp-mock-header">
                      <div className="lp-mock-avatar">
                        <Leaf size={17} color="#334155" />
                        <span className="lp-mock-verified"><ShieldCheck size={10} color="#fff" /></span>
                      </div>
                      <div>
                        <p className="lp-mock-name">Isaac Costa</p>
                        <p className="lp-mock-role">Jardineiro · Luanda</p>
                      </div>
                    </div>
                    <div className="lp-mock-bars">
                      <div className="lp-mock-bar" style={{ height: "38%" }} />
                      <div className="lp-mock-bar" style={{ height: "58%" }} />
                      <div className="lp-mock-bar" style={{ height: "48%" }} />
                      <div className="lp-mock-bar high" style={{ height: "88%" }} />
                      <div className="lp-mock-bar" style={{ height: "62%" }} />
                      <div className="lp-mock-bar high" style={{ height: "72%" }} />
                    </div>
                    <p className="lp-mock-caption">Pedidos recebidos esta semana</p>
                  </div>
                </div>

                <div className="lp-provider-grid">
                  {providerChecklist.map((item, i) => (
                    <div className="lp-provider-mini-card" key={i}>
                      <div className="lp-provider-mini-icon"><item.icon size={16} /></div>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Aplicação (PWA) */}
        <InstallGuideSection />

        {/* CTA final */}
        <section className="lp-section">
          <div className="lp-container">
            <Reveal>
              <div className="lp-cta">
                <h2>Comece a usar a Mestroo</h2>
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
                  <span className="lp-logo-text" style={{ color: "#fff" }}>Mestr<span style={{ color: LOGO_ACCENT }}>oo</span></span>
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
              <p>© 2026 Mestroo. Todos os direitos reservados.</p>
              <p className="lp-coverage-note">De momento disponível em Luanda, com expansão progressiva para outras cidades.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}