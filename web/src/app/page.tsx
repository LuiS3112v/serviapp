"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Zap, Menu, X, ArrowRight, Star, Download, UserRoundPlus, ThumbsUp, Smartphone,
  ShieldCheck, Wrench, Sparkles, Leaf, Paintbrush, Truck,
  Snowflake, Laptop, Scissors, Car, Hammer, MapPin, Lock,
  CheckCircle2, Percent, BarChart3, MessageCircle, Building2,
  Globe, Camera, Link2, UserCheck, Star as StarIcon, Wifi, Battery, Signal,
} from "lucide-react";
import { InstallGuideSection } from "@/components/pwa/InstallGuideSection";

/* Hook simples de scroll-reveal, sem dependências novas */
function useReveal() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );

    obs.observe(el);

    return () => obs.disconnect();
  }, []);

  return { ref, visible };
}

function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
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

/* Uma só cor de acção (azul da marca) + verde só para estados de confirmação/verificação. */
const BRAND = "#1e293b";
const CONFIRM = "#1D9E75";
const INK = "#0f172a";
const LOGO_ACCENT = "#7C6FE0";
const MAP_ACCENT = "#0F766E";

export default function HomePage() {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [heroPhotoFailed, setHeroPhotoFailed] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);

    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goLogin = () => router.push("/login");
  const goRegisterClient = () => router.push("/register/client");
  const goRegisterProvider = () => router.push("/register/provider");

  const journey = [
    {
      label: "Antes",
      title: "Sabe com quem está a lidar",
      text: "Todo o prestador passa por verificação de identidade antes de poder receber pedidos. Não é um perfil anónimo a bater à sua porta.",
      icon: UserCheck,
    },
    {
      label: "Durante",
      title: "A conversa fica registada",
      text: "Combine horário e detalhes pelo chat da Mestroo. Se houver alguma dúvida depois, está tudo ali.",
      icon: MessageCircle,
    },
    {
      label: "Pagamento",
      title: "O dinheiro só sai quando o trabalho estiver feito",
      text: "Fica retido até confirmar que o serviço foi concluído. Ninguém recebe antes de entregar.",
      icon: Lock,
    },
    {
      label: "Depois",
      title: "A sua avaliação conta",
      text: "Fica ligada a um serviço real, feito por essa pessoa. É o que ajuda o próximo cliente a decidir.",
      icon: Star,
    },
  ];

  const providerChecklist = [
    {
      icon: CheckCircle2,
      text: "Perfil fica verificado depois da aprovação",
    },
    {
      icon: Percent,
      text: "Fica 10% para a Mestroo em cada pagamento recebido",
    },
    {
      icon: BarChart3,
      text: "Vê os seus pedidos e desempenho num painel",
    },
    {
      icon: StarIcon,
      text: "As avaliações dos clientes ficam no seu perfil",
    },
    {
      icon: Building2,
      text: "Pode criar depois um perfil de empresa",
    },
    {
      icon: MessageCircle,
      text: "Fala com o cliente sem sair da Mestroo",
    },
  ];

  const stats = [
    { v: "500+", l: "Prestadores" },
    { v: "12+", l: "Categorias" },
    { v: "4.9★", l: "Avaliação média" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300;1,9..40,400&family=Inter:wght@700;800&display=swap');
        .lp *{box-sizing:border-box}
        .lp{background:#ffffff;scroll-behavior:smooth;color:#111827;font-family:'DM Sans',sans-serif;overflow-x:hidden}
        .lp-container{max-width:1180px;margin:0 auto;padding:0 24px}
        @keyframes ringPulse{0%{transform:scale(0.5);opacity:0.5}
        100%{transform:scale(2.2);opacity:0}}
        @keyframes dashMove{to{stroke-dashoffset:-40}}
        @keyframes fadeBlink{0%,100%{opacity:1;transform:scale(1)}
        50%{opacity:0.4;transform:scale(0.92)}}
        .lp-header{position:sticky;top:0;z-index:50;background:rgba(255,255,255,0.9);backdrop-filter:blur(10px);border-bottom:1px solid #eef1f5;transition:box-shadow .2s}
        .lp-header.scrolled{box-shadow:0 2px 16px rgba(15,23,42,0.06)}
        .lp-header-inner{max-width:1180px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;justify-content:space-between}
        .lp-logo{display:flex;align-items:center;gap:10px;cursor:pointer}
        .lp-logo-mark{width:38px;height:38px;border-radius:11px;background:${BRAND};display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .lp-logo-text{font-size:19px;font-weight:500;color:#0f172a;letter-spacing:-0.02em;font-family:'DM Sans',sans-serif}
        .lp-nav{display:flex;align-items:center;gap:32px}
        .lp-nav a,.lp-nav a:visited{font-size:14.5px;font-weight:600;color:#475569;text-decoration:none;transition:color .15s;font-family:'DM Sans',sans-serif}
        .lp-nav a:hover{color:${BRAND}}
        .lp-header-actions{display:flex;align-items:center;gap:10px}
        .lp-btn-ghost{padding:10px 18px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;color:#334155;font-size:14px;font-weight:600;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif}
        .lp-btn-ghost:hover{border-color:${BRAND};color:${BRAND}}
        .lp-btn-solid{padding:10px 20px;border-radius:10px;border:none;background:${BRAND};color:#fff;font-size:14px;font-weight:600;cursor:pointer;transition:transform .15s,box-shadow .15s;font-family:'DM Sans',sans-serif}
        .lp-btn-solid:hover{transform:translateY(-1px)}
        .lp-menu-toggle{display:none;background:none;border:none;cursor:pointer;color:#0f172a}
        .lp-hero{padding:56px 0 64px}
        .lp-hero-grid{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
        .lp-eyebrow{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:99px;background:#f1f5f9;color:#475569;font-size:12.5px;font-weight:400;margin-bottom:20px}
        .lp-h1{font-size:42px;line-height:1.1;font-weight:800;color:#1e293b;letter-spacing:-0.03em;margin-bottom:18px;font-family:'Inter',sans-serif;text-transform:uppercase}
        .lp-h1 span{color:${BRAND}}
        .lp-sub{font-size:17px;line-height:1.6;color:#64748b;max-width:460px;margin-bottom:32px}
        .lp-hero-actions{display:flex;flex-wrap:wrap;align-items:center;gap:18px;margin-bottom:36px}
        .lp-btn-primary{display:inline-flex;align-items:center;gap:8px;padding:15px 26px;border-radius:12px;border:none;background:${BRAND};color:#fff;font-size:15px;font-weight:400;cursor:pointer;transition:transform .15s;font-family:inherit}
        .lp-btn-primary:hover{transform:translateY(-2px)}
        .lp-btn-secondary{display:inline-flex;align-items:center;gap:8px;padding:15px 26px;border-radius:12px;border:1.5px solid #e2e8f0;background:#fff;color:#334155;font-size:15px;font-weight:400;cursor:pointer;transition:all .15s;font-family:inherit}
        .lp-btn-secondary:hover{border-color:#cbd5e1;color:${INK};transform:translateY(-2px)}
        .lp-hero-link{font-size:14.5px;font-weight:400;color:#64748b;text-decoration:none;border-bottom:1.5px solid #e2e8f0;padding-bottom:2px;transition:color .15s,border-color .15s}
        .lp-hero-link:hover{color:${BRAND};border-color:${BRAND}}
        .lp-stats{display:flex;flex-wrap:wrap;gap:28px}
        .lp-stat-v{font-size:21px;font-weight:500;color:${INK}}
        .lp-stat-l{font-size:12px;color:#94a3b8;margin-top:2px}
        .lp-hero-visual{position:relative;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;min-height:420px;background:linear-gradient(160deg,#1e293b,#0f172a)}
        .lp-hero-photo-fallback{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#94a3b8;font-size:12.5px;text-align:center;padding:24px;line-height:1.6;z-index:1}
        .lp-visual-card{position:absolute;background:#fff;border-radius:14px;box-shadow:0 10px 24px rgba(15,23,42,0.16);padding:12px 14px;display:flex;align-items:center;gap:10px;z-index:4;border:1px solid #eef1f5;max-width:calc(100% - 24px)}
        .lp-section{padding:80px 0}
        .lp-section-alt{background:#f8fafc}
        .lp-section-head{max-width:620px;margin:0 0 44px}
        .lp-section-head.center{text-align:center;margin-left:auto;margin-right:auto}
        .lp-tag{display:inline-block;font-size:13px;font-weight:400;color:${BRAND};margin-bottom:14px}
        .lp-h2{font-size:30px;font-weight:400;color:#0f172a;letter-spacing:-0.02em;margin-bottom:12px}
        .lp-section-sub{font-size:15.5px;color:#64748b;line-height:1.6}
        .lp-solution{padding:8px 0 8px}
        .lp-solution-inner{max-width:640px}
        .lp-solution-inner p{font-size:19px;line-height:1.55;color:${INK};font-weight:400}
        .lp-solution-inner p + p{margin-top:14px;color:#64748b;font-size:16px;font-weight:400}
        .lp-how-section{width:100%;position:relative;overflow:hidden;background:radial-gradient(circle at 50% 0%,rgba(255,55,55,0.12),transparent 42%), linear-gradient(180deg,#8f0000 0%,#780000 100%);border-top:1px solid #b41414;border-bottom:1px solid #b41414;scroll-margin-top:76px;padding:58px 0 64px}
        .lp-how-section::before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient( 90deg, rgba(255,255,255,0.015), transparent 30%, transparent 70%, rgba(255,255,255,0.015) )}
        .lp-how-inner{position:relative;z-index:1;width:100%}
        .lp-how-heading{max-width:920px;margin:0 auto 42px;text-align:center}
        .lp-how-title{margin:0 auto 18px;color:#fff;font-size:39px;line-height:1.12;font-weight:300;letter-spacing:-0.02em;text-transform:uppercase}
        .lp-how-title .accent{color:#ff2525}
        .lp-how-subtitle{max-width:820px;margin:0 auto;color:rgba(255,255,255,0.92);font-size:16px;line-height:1.6}
        .lp-how-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
        .lp-how-item{min-width:0;min-height:184px;padding:24px 24px 22px;background:rgba(116,0,0,0.42);border:1px solid rgba(255,255,255,0.045);border-radius:10px;box-shadow:0 10px 30px rgba(44,0,0,0.12)}
        .lp-how-item-head{display:flex;align-items:flex-start;gap:15px;min-height:48px;color:#fff}
        .lp-how-item-icon{width:36px;height:36px;flex:0 0 36px;display:flex;align-items:center;justify-content:center;color:#fff}
        .lp-how-item-title{margin:0;padding-top:2px;color:#fff;font-size:16px;line-height:1.35;font-weight:400}
        .lp-how-divider{width:100%;height:1px;margin:18px 0 20px;background:rgba(255,255,255,0.28)}
        .lp-how-item-text{margin:0;color:rgba(255,255,255,0.9);font-size:14.5px;line-height:1.65}
        .lp-how-pwa{display:inline-flex;align-items:center;gap:13px;margin-top:18px;padding:12px 22px;min-width:180px;border:2px solid rgba(255,255,255,0.92);border-radius:13px;color:#fff;font-size:16px;font-weight:400;background:transparent}
        .lp-how-pwa svg{flex-shrink:0}
        .lp-tool-row{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;padding:44px 0;border-bottom:1px solid #eef1f5;min-width:0}
        .lp-tool-row:last-child{border-bottom:none}
        .lp-tool-row.reverse .lp-tool-copy{order:2}
        .lp-tool-row.reverse .lp-tool-visual{order:1}
        .lp-tool-eyebrow{font-size:13px;font-weight:400;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:10px}
        .lp-tool-copy h3{font-size:24px;font-weight:400;color:${INK};letter-spacing:-0.01em;margin-bottom:12px;line-height:1.25}
        .lp-tool-copy p{font-size:15px;color:#64748b;line-height:1.65;max-width:400px}
        .lp-tool-visual{background:#f8fafc;border:1px solid #eef1f5;border-radius:18px;padding:24px;min-height:220px;display:flex;align-items:center;justify-content:center;position:relative;min-width:0}
        .lp-map-dot-wrap{position:absolute;top:50%;left:50%;width:14px;height:14px;transform:translate(-50%,-50%);z-index:5}
        .lp-map-dot-ring{position:absolute;inset:-10px;border-radius:50%;background:${MAP_ACCENT};opacity:0.35;animation:ringPulse 1.6s ease-out infinite}
        .lp-map-dot{position:relative;width:14px;height:14px;border-radius:50%;background:${MAP_ACCENT};border:2px solid #fff}
        .lp-map-route{stroke-dasharray:8 8;stroke-dashoffset:0;animation:dashMove 1s linear infinite}
        .lp-map-marker{animation:fadeBlink 2.4s ease-in-out infinite}
        .lp-map-marker.delay{animation-delay:1.1s}
        .lp-iphone{--lp-phone-bezel:9px;--lp-phone-radius-top:32px;--lp-phone-radius-bottom:46px;position:relative;width:100%;min-width:126px;max-width:212px;aspect-ratio:9/18.3;margin:0 auto;border-radius:var(--lp-phone-radius-top) var(--lp-phone-radius-top) var(--lp-phone-radius-bottom) var(--lp-phone-radius-bottom);background:linear-gradient(155deg,#1c2436,${INK}
        55%,#050810);box-shadow:0 22px 44px rgba(2,6,16,0.32), 0 2px 6px rgba(2,6,16,0.18), inset 0 0 0 1px rgba(255,255,255,0.06);flex-shrink:0}
        .lp-iphone-glass{position:absolute;top:var(--lp-phone-bezel);left:var(--lp-phone-bezel);right:var(--lp-phone-bezel);bottom:var(--lp-phone-bezel);display:flex;flex-direction:column;min-height:0;min-width:0;border-radius:calc(var(--lp-phone-radius-top) - 6px) calc(var(--lp-phone-radius-top) - 6px) calc(var(--lp-phone-radius-bottom) - 6px) calc(var(--lp-phone-radius-bottom) - 6px);background:#f8fafc;overflow:hidden;isolation:isolate;container-type:inline-size;container-name:phone}
        .lp-phone-notch{position:absolute;top:0;left:50%;transform:translateX(-50%);width:46%;height:20px;background:${INK};border-radius:0 0 13px 13px;z-index:5}
        .lp-phone-notch::before, .lp-phone-notch::after{content:"";position:absolute;top:6px;border-radius:50%;background:#0a0e18}
        .lp-phone-notch::before{left:16px;width:6px;height:6px}
        .lp-phone-notch::after{right:16px;width:8px;height:8px}
        .lp-phone-status{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 6px;font-size:11px;font-weight:400;color:${INK};flex-shrink:0}
        .lp-phone-status-icons{display:flex;align-items:center;gap:4px;flex-shrink:0}
        .lp-phone-chatbar{display:flex;align-items:center;gap:8px;padding:8px 14px;border-bottom:1px solid #eef1f5;background:#ffffff;flex-shrink:0;min-width:0}
        .lp-phone-chatavatar{width:26px;height:26px;border-radius:8px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .lp-phone-chatname{font-size:11.5px;font-weight:500;color:${INK};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .lp-phone-chatstatus{font-size:9.5px;color:${CONFIRM};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .lp-phone-messages{flex:1 1 0;min-height:0;width:100%;max-width:100%;padding:12px;padding-bottom:26px;display:flex;flex-direction:column;gap:8px;justify-content:flex-end;overflow:hidden;min-width:0;box-sizing:border-box}
        .lp-phone-bubble{flex-shrink:0;max-width:82%;width:fit-content;word-break:break-word;overflow-wrap:break-word}
        .lp-phone-home-indicator{position:absolute;bottom:7px;left:50%;transform:translateX(-50%);width:36%;height:4px;border-radius:2px;background:${INK};opacity:0.85;z-index:6}
        @container phone (max-width:180px){.lp-phone-status{padding:11px 13px 4px;font-size:9.5px}.lp-phone-notch{height:17px}.lp-phone-chatbar{padding:6px 11px;gap:6px}.lp-phone-chatavatar{width:22px;height:22px}.lp-phone-chatname{font-size:10px}.lp-phone-chatstatus{font-size:8.5px}.lp-phone-messages{padding:9px;padding-bottom:22px;gap:6px}.lp-phone-bubble{font-size:10.5px !important;padding:7px 10px !important}}
        @container phone (max-width:155px){.lp-phone-status{padding:9px 11px 3px;font-size:8.5px}.lp-phone-notch{height:14px;width:50%}.lp-phone-messages{padding:7px;padding-bottom:20px;gap:5px}.lp-phone-bubble{font-size:9.5px !important;padding:6px 9px !important;border-radius:10px !important}}
        .lp-story{background:#fff;border:1px solid #eef1f5;border-radius:18px;padding:36px 32px}
        .lp-story-lead{font-size:19px;font-weight:400;color:${INK};margin-bottom:20px}
        .lp-story-steps{display:flex;flex-direction:column;gap:0}
        .lp-story-step{display:flex;align-items:baseline;gap:14px;padding:12px 0;border-bottom:1px solid #f1f5f9;font-size:15px;color:#334155}
        .lp-story-step:last-child{border-bottom:none}
        .lp-story-step b{color:${INK};font-weight:500}
        .lp-journey{display:flex;flex-direction:column}
        .lp-journey-item{display:grid;grid-template-columns:120px 40px 1fr;column-gap:16px;padding:24px 0}
        .lp-journey-label{font-size:13px;font-weight:400;color:#94a3b8;padding-top:2px}
        .lp-journey-line{display:flex;flex-direction:column;align-items:center}
        .lp-journey-dot{width:34px;height:34px;border-radius:10px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:${BRAND};flex-shrink:0}
        .lp-journey-rule{width:1px;flex:1;background:#e2e8f0;margin-top:8px}
        .lp-journey-item:last-child .lp-journey-rule{display:none}
        .lp-journey-body h3{font-size:16.5px;font-weight:400;color:${INK};margin-bottom:6px}
        .lp-journey-body p{font-size:14px;color:#64748b;line-height:1.6;max-width:460px}
        .lp-provider-panel{position:relative;background:#f8fafc;border:1px solid #eef1f5;border-radius:24px;padding:52px 44px}
        .lp-provider-top{display:grid;grid-template-columns:1.05fr 0.95fr;gap:56px;align-items:center}
        .lp-provider-copy{max-width:460px}
        .lp-provider-mini-stats{display:flex;align-items:center;flex-wrap:wrap;gap:20px;margin:24px 0 28px}
        .lp-mini-v{font-size:20px;font-weight:500;line-height:1;color:${INK}}
        .lp-mini-l{font-size:11px;color:#94a3b8;margin-top:4px}
        .lp-mini-sep{width:1px;height:28px;background:#dbe3ee;flex-shrink:0}
        .lp-provider-mock{position:relative;background:#fff;border:1px solid #eef1f5;border-radius:18px;padding:24px 24px 20px}
        .lp-mock-header{display:flex;align-items:center;gap:12px;margin-bottom:22px}
        .lp-mock-avatar{position:relative;width:42px;height:42px;border-radius:12px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#334155}
        .lp-mock-verified{position:absolute;bottom:-3px;right:-3px;width:16px;height:16px;border-radius:50%;background:${CONFIRM};display:flex;align-items:center;justify-content:center;border:2px solid #fff}
        .lp-mock-name{font-size:14.5px;font-weight:500;color:#0f172a}
        .lp-mock-role{font-size:12px;color:#94a3b8;margin-top:1px}
        .lp-mock-bars{display:flex;align-items:flex-end;gap:8px;height:80px;padding:0 2px}
        .lp-mock-bar{flex:1;border-radius:5px 5px 2px 2px;background:#dbeafe}
        .lp-mock-bar.high{background:${BRAND}}
        .lp-mock-caption{font-size:11.5px;color:#94a3b8;margin-top:14px;text-align:center}
        .lp-provider-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#eef1f5;border:1px solid #eef1f5;border-radius:14px;overflow:hidden;margin-top:36px}
        .lp-provider-mini-card{display:flex;align-items:flex-start;gap:12px;background:#fff;padding:16px}
        .lp-provider-mini-icon{width:30px;height:30px;border-radius:9px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:${BRAND}}
        .lp-provider-mini-card span{font-size:13px;color:#334155;line-height:1.5;padding-top:3px}
        .lp-cta{background:${INK};border-radius:24px;padding:56px 48px;text-align:center;color:#fff}
        .lp-cta h2{font-size:28px;font-weight:400;margin-bottom:14px;letter-spacing:-0.02em}
        .lp-cta p{font-size:15.5px;color:#cbd5e1;max-width:460px;margin:0 auto 30px;line-height:1.6}
        .lp-btn-white{padding:15px 28px;border-radius:12px;border:none;background:#fff;color:${INK};font-size:15px;font-weight:400;cursor:pointer;transition:transform .15s;font-family:inherit}
        .lp-btn-white:hover{transform:translateY(-2px)}
        .lp-footer{background:#0f172a;color:#cbd5e1;padding:56px 0 28px}
        .lp-footer-grid{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:40px;margin-bottom:40px}
        .lp-footer h4{font-size:13.5px;font-weight:400;color:#fff;margin-bottom:16px}
        .lp-footer a, .lp-footer a:visited{display:block;font-size:13.5px;color:#94a3b8;text-decoration:none;margin-bottom:10px;transition:color .15s}
        .lp-footer a:hover{color:#fff}
        .lp-footer-social{display:flex;gap:10px;margin-top:16px}
        .lp-footer-social a, .lp-footer-social a:visited{width:36px;height:36px;border-radius:10px;background:#1e293b;display:flex;align-items:center;justify-content:center;margin:0}
        .lp-footer-social a:hover{background:${BRAND}}
        .lp-footer-bottom{border-top:1px solid #1e293b;padding-top:24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
        .lp-footer-bottom p{font-size:12.5px;color:#64748b}
        .lp-coverage-note{font-size:12.5px;color:#64748b;max-width:420px;text-align:right}
        @media(max-width:1080px){.lp-how-section{padding:52px 0 56px}.lp-how-title{font-size:34px}.lp-how-grid{gap:14px}.lp-how-item{padding:22px 20px}.lp-container{padding:0 20px}.lp-hero-grid{gap:40px}.lp-h1{font-size:36px}}
        @media(max-width:960px){.lp-how-section{padding:48px 0 52px}.lp-how-title{font-size:31px}.lp-how-grid{grid-template-columns:1fr;gap:12px}.lp-how-item{min-height:auto}.lp-nav{display:none}.lp-header-actions .lp-btn-ghost{display:none}.lp-menu-toggle{display:block}.lp-hero{padding:36px 0 48px}.lp-hero-grid{grid-template-columns:1fr}.lp-hero-visual{order:-1;min-height:280px}.lp-tool-row, .lp-tool-row.reverse{grid-template-columns:1fr;gap:24px;padding:32px 0}.lp-tool-row.reverse .lp-tool-copy, .lp-tool-row.reverse .lp-tool-visual{order:initial}.lp-tool-visual{order:-1}.lp-tool-copy p{max-width:100%}.lp-journey-item{grid-template-columns:90px 34px 1fr;column-gap:14px}.lp-provider-panel{padding:40px 28px}.lp-provider-top{grid-template-columns:1fr;gap:32px}.lp-provider-copy{max-width:100%}.lp-provider-grid{grid-template-columns:repeat(2,1fr)}.lp-footer-grid{grid-template-columns:1fr 1fr}.lp-footer-bottom{flex-direction:column;align-items:flex-start}.lp-coverage-note{text-align:left;max-width:100%}.lp-section{padding:56px 0}}
        @media(max-width:600px){.lp-how-section{padding:42px 0 44px}.lp-how-heading{margin-bottom:30px}.lp-how-title{font-size:25px;line-height:1.18}.lp-how-subtitle{font-size:14px;line-height:1.55}.lp-how-item{padding:20px 18px}.lp-how-item-title{font-size:15px}.lp-how-item-text{font-size:13.5px}.lp-how-pwa{width:100%;justify-content:center}.lp-container{padding:0 18px}.lp-h1{font-size:29px;line-height:1.2}.lp-h2{font-size:23px}.lp-sub{font-size:15.5px}.lp-solution-inner p{font-size:17px}.lp-solution-inner p + p{font-size:14.5px}.lp-hero-actions{flex-direction:column;align-items:flex-start;gap:14px}.lp-btn-primary, .lp-btn-secondary{width:100%;justify-content:center}.lp-hero-link{align-self:flex-start}.lp-cta{padding:36px 20px}.lp-cta h2{font-size:22px}.lp-btn-white{width:100%}.lp-footer-grid{grid-template-columns:1fr;gap:28px}.lp-stats{gap:18px}.lp-provider-panel{padding:26px 16px;border-radius:18px}.lp-provider-grid{grid-template-columns:1fr}.lp-provider-mini-stats{gap:14px}.lp-journey-item{grid-template-columns:56px 30px 1fr;column-gap:10px;padding:18px 0}.lp-journey-label{font-size:11.5px}.lp-journey-dot{width:30px;height:30px}.lp-story{padding:22px 18px}.lp-story-lead{font-size:17px}.lp-story-step{font-size:14px;gap:10px}.lp-visual-card{padding:9px 11px}.lp-tool-copy h3{font-size:20px}.lp-iphone{max-width:170px}.lp-header-inner{padding:12px 18px}.lp-logo-text{font-size:17px}}
        @media(max-width:380px){.lp-h1{font-size:25px}.lp-h2{font-size:20px}.lp-eyebrow{font-size:11.5px;padding:6px 12px}.lp-mock-header{flex-wrap:wrap}.lp-mini-v{font-size:17px}.lp-iphone{max-width:148px}}
        @media(min-width:1440px){.lp-container{max-width:1280px}}
        @media(prefers-reduced-motion:reduce){.lp-map-dot, .lp-map-route, .lp-map-marker{animation:none !important}}
      `}</style>

      <div className="lp">

        {/* Header */}
        <header className={`lp-header${scrolled ? " scrolled" : ""}`}>
          <div className="lp-header-inner">

            <div
              className="lp-logo"
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                })
              }
            >
              <div className="lp-logo-mark">
                <Zap size={19} color="#fff" />
              </div>

              <span className="lp-logo-text">
                Mestr<span style={{ color: LOGO_ACCENT }}>oo</span>
              </span>
            </div>

            <nav className="lp-nav">
              <a href="#como-funciona">Como funciona</a>
              <a href="/sobre">Sobre</a>
              <a href="#para-prestadores">Para prestadores</a>
              <a href="#contacto">Contacto</a>
            </nav>

            <div className="lp-header-actions">
              <button
                className="lp-btn-ghost"
                onClick={goLogin}
              >
                Entrar
              </button>

              <button
                className="lp-btn-solid"
                onClick={goRegisterClient}
              >
                Criar conta
              </button>

              <button
                className="lp-menu-toggle"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? (
                  <X size={24} />
                ) : (
                  <Menu size={24} />
                )}
              </button>
            </div>
          </div>

          {menuOpen && (
            <div
              style={{
                padding: "8px 24px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                borderTop: "1px solid #eef1f5",
              }}
            >
              {[
                ["Como funciona", "#como-funciona"],
                ["Sobre", "/sobre"],
                ["Para prestadores", "#para-prestadores"],
                ["Contacto", "#contacto"],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    padding: "12px 0",
                    fontSize: 14.5,
                    fontWeight: 400,
                    color: "#334155",
                    textDecoration: "none",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  {label}
                </a>
              ))}

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 14,
                }}
              >
                <button
                  className="lp-btn-ghost"
                  style={{ flex: 1 }}
                  onClick={goLogin}
                >
                  Entrar
                </button>

                <button
                  className="lp-btn-solid"
                  style={{ flex: 1 }}
                  onClick={goRegisterClient}
                >
                  Criar conta
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Hero */}
        <section className="lp-hero">
          <div className="lp-container lp-hero-grid">

            <Reveal>
              <div className="lp-eyebrow">
                <MapPin size={13} />
                A operar em Luanda
              </div>

              <h1 className="lp-h1">
                Precisa de alguém para resolver isso?
              </h1>

              <p className="lp-sub">
                AC avariado, torneira a pingar, uma instalação por fazer.
                Descreva o que precisa e veja quem está disponível perto de
                si agora.
              </p>

              <div className="lp-hero-actions">
                <button
                  className="lp-btn-primary"
                  onClick={goRegisterClient}
                >
                  Encontrar um profissional
                  <ArrowRight size={16} />
                </button>

                <a
                  className="lp-hero-link"
                  href="#como-funciona"
                >
                  Presta serviços? Veja como funciona
                </a>
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

                {!heroPhotoFailed && (
                  <Image
                    src="/hero-professional.png"
                    alt="Profissional a trabalhar num serviço na casa de um cliente"
                    fill
                    priority
                    sizes="(max-width: 960px) 100vw, 50vw"
                    style={{
                      objectFit: "cover",
                    }}
                    onError={() =>
                      setHeroPhotoFailed(true)
                    }
                  />
                )}

                {heroPhotoFailed && (
                  <div className="lp-hero-photo-fallback">
                    <Wrench size={22} color="#475569" />

                    <span>
                      Coloque a fotografia em
                      <br />
                      <code>
                        /public/hero-professional.png
                      </code>
                    </span>
                  </div>
                )}

                <div
                  className="lp-visual-card"
                  style={{
                    bottom: 22,
                    left: 18,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      background: "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Zap size={16} color="#334155" />
                  </div>

                  <div>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#0f172a",
                      }}
                    >
                      Eletricista
                    </p>

                    <p
                      style={{
                        fontSize: 11.5,
                        color: "#94a3b8",
                      }}
                    >
                      Disponível hoje
                    </p>
                  </div>
                </div>

                <div
                  className="lp-visual-card"
                  style={{
                    top: 20,
                    right: 18,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      background: "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Star size={16} color={CONFIRM} />
                  </div>

                  <div>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#0f172a",
                      }}
                    >
                      4.9 de avaliação
                    </p>

                    <p
                      style={{
                        fontSize: 11.5,
                        color: "#94a3b8",
                      }}
                    >
                      Serviço concluído
                    </p>
                  </div>
                </div>

              </div>
            </Reveal>
          </div>
        </section>

        {/* Solução */}
        <section className="lp-solution">
          <div className="lp-container">
            <Reveal>
              <div className="lp-solution-inner">

                <p>
                  Tem um serviço para resolver? Encontre quem está
                  disponível perto de si e escolha com quem prefere
                  trabalhar.
                </p>

                <p>
                  Sem ligar para vários números à procura de alguém
                  livre. Sem confiar às cegas em quem aparece.
                </p>

              </div>
            </Reveal>
          </div>
        </section>

        {/* =========================================================
            BLOCO 4 — FERRAMENTAS
        ========================================================= */}

        <section className="lp-section">
          <div className="lp-container">

            <Reveal>
              <div className="lp-section-head">

                <span className="lp-tag">
                  No dia a dia
                </span>

                <h2 className="lp-h2">
                  É assim que fica mais simples
                </h2>

              </div>
            </Reveal>

            {/* Mapa */}
            <Reveal>
              <div className="lp-tool-row">

                <div className="lp-tool-copy">

                  <p className="lp-tool-eyebrow">
                    Mapa
                  </p>

                  <h3>
                    Não é preciso ligar a ninguém às cegas
                  </h3>

                  <p>
                    Vê no mapa quem está disponível na sua zona
                    agora, e escolhe quem pode chegar mais depressa.
                  </p>

                </div>

                <div
                  className="lp-tool-visual"
                  style={{ padding: 0 }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: 220,
                    }}
                  >

                    <svg
                      viewBox="0 0 560 420"
                      preserveAspectRatio="xMidYMid slice"
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "block",
                      }}
                    >
                      <rect
                        width="560"
                        height="420"
                        fill="#eef2f7"
                      />

                      <g fill="#e6ebf1">
                        <rect
                          x="30"
                          y="20"
                          width="150"
                          height="110"
                          rx="6"
                        />

                        <rect
                          x="210"
                          y="10"
                          width="120"
                          height="90"
                          rx="6"
                        />

                        <rect
                          x="360"
                          y="30"
                          width="170"
                          height="120"
                          rx="6"
                        />

                        <rect
                          x="20"
                          y="170"
                          width="120"
                          height="100"
                          rx="6"
                        />

                        <rect
                          x="180"
                          y="190"
                          width="150"
                          height="90"
                          rx="6"
                        />

                        <rect
                          x="370"
                          y="190"
                          width="160"
                          height="110"
                          rx="6"
                        />

                        <rect
                          x="40"
                          y="310"
                          width="160"
                          height="90"
                          rx="6"
                        />

                        <rect
                          x="230"
                          y="320"
                          width="140"
                          height="80"
                          rx="6"
                        />

                        <rect
                          x="400"
                          y="330"
                          width="140"
                          height="80"
                          rx="6"
                        />
                      </g>

                      <g
                        stroke="#ffffff"
                        strokeWidth="10"
                        fill="none"
                        strokeLinecap="round"
                      >
                        <path d="M0,150 H560" />
                        <path d="M0,300 H560" />
                        <path d="M190,0 V420" />
                        <path d="M355,0 V420" />
                      </g>

                      <g
                        stroke="#ffffff"
                        strokeWidth="5"
                        fill="none"
                        strokeLinecap="round"
                        opacity="0.85"
                      >
                        <path d="M0,95 H560" />
                        <path d="M0,235 H560" />
                        <path d="M0,365 H560" />
                        <path d="M95,0 V420" />
                        <path d="M275,0 V420" />
                        <path d="M470,0 V420" />
                      </g>

                      <path
                        className="lp-map-route"
                        stroke={MAP_ACCENT}
                        strokeWidth="2.5"
                        fill="none"
                        opacity="0.7"
                        strokeLinecap="round"
                        d="M110,335 C160,260 220,230 280,210 C330,192 360,140 385,95"
                      />
                    </svg>

                    <div className="lp-map-dot-wrap">
                      <div className="lp-map-dot-ring" />
                      <div className="lp-map-dot" />
                    </div>

                    <div
                      className="lp-visual-card lp-map-marker"
                      style={{
                        width: 34,
                        height: 34,
                        padding: 0,
                        top: "24%",
                        left: "18%",
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Zap
                        size={15}
                        color={MAP_ACCENT}
                      />
                    </div>

                    <div
                      className="lp-visual-card lp-map-marker delay"
                      style={{
                        width: 34,
                        height: 34,
                        padding: 0,
                        top: "60%",
                        right: "16%",
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Sparkles
                        size={15}
                        color={MAP_ACCENT}
                      />
                    </div>

                  </div>
                </div>

              </div>
            </Reveal>

            {/* Chat */}
            <Reveal>
              <div className="lp-tool-row reverse">

                <div className="lp-tool-copy">

                  <p className="lp-tool-eyebrow">
                    Chat
                  </p>

                  <h3>
                    Combina tudo numa única conversa
                  </h3>

                  <p>
                    Horário, endereço, detalhes do serviço, tudo
                    fica ali. Não precisa de trocar números nem de
                    sair da Mestroo.
                  </p>

                </div>

                <div className="lp-tool-visual">

                  <div className="lp-iphone">

                    <div className="lp-iphone-glass">

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

                        <div className="lp-phone-chatavatar">
                          <Zap
                            size={13}
                            color="#334155"
                          />
                        </div>

                        <div>
                          <p className="lp-phone-chatname">
                            Carlos Manuel
                          </p>

                          <p className="lp-phone-chatstatus">
                            Eletricista · Online agora
                          </p>
                        </div>

                      </div>

                      <div className="lp-phone-messages">

                        <div
                          className="lp-phone-bubble"
                          style={{
                            alignSelf: "flex-start",
                            background: "#fff",
                            border: "1px solid #eef1f5",
                            borderRadius:
                              "12px 12px 12px 3px",
                            padding: "9px 13px",
                            fontSize: 12.5,
                            color: "#334155",
                          }}
                        >
                          Pode ser amanhã de manhã?
                        </div>

                        <div
                          className="lp-phone-bubble"
                          style={{
                            alignSelf: "flex-end",
                            background: BRAND,
                            color: "#fff",
                            borderRadius:
                              "12px 12px 3px 12px",
                            padding: "9px 13px",
                            fontSize: 12.5,
                          }}
                        >
                          Sim, chego às 9h
                        </div>

                        <div
                          className="lp-phone-bubble"
                          style={{
                            alignSelf: "flex-start",
                            background: "#fff",
                            border: "1px solid #eef1f5",
                            borderRadius:
                              "12px 12px 12px 3px",
                            padding: "9px 13px",
                            fontSize: 12.5,
                            color: "#334155",
                          }}
                        >
                          Combinado 👍
                        </div>

                      </div>

                      <div className="lp-phone-home-indicator" />

                    </div>
                  </div>

                </div>

              </div>
            </Reveal>

            {/* Pagamento */}
            <Reveal>
              <div className="lp-tool-row">

                <div className="lp-tool-copy">

                  <p className="lp-tool-eyebrow">
                    Pagamento
                  </p>

                  <h3>
                    Ninguém recebe antes de entregar
                  </h3>

                  <p>
                    O valor fica retido até o serviço estar concluído
                    e confirmado. Assim os dois lados ficam protegidos.
                  </p>

                </div>

                <div className="lp-tool-visual">

                  <div
                    style={{
                      background: "#fff",
                      border: "1px solid #eef1f5",
                      borderRadius: 14,
                      padding: "18px 20px",
                      width: "100%",
                      maxWidth: 240,
                    }}
                  >

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 14,
                      }}
                    >
                      <Lock
                        size={16}
                        color={BRAND}
                      />

                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 500,
                          color: "#334155",
                        }}
                      >
                        Valor retido
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: 20,
                        fontWeight: 500,
                        color: INK,
                        marginBottom: 4,
                      }}
                    >
                      Kz 15.000
                    </p>

                    <p
                      style={{
                        fontSize: 11.5,
                        color: "#94a3b8",
                      }}
                    >
                      Libertado após confirmação do serviço
                    </p>

                  </div>

                </div>

              </div>
            </Reveal>

          </div>
        </section>

        {/* Na prática */}
        <section className="lp-section lp-section-alt">

          <div className="lp-container">

            <Reveal>
              <div className="lp-section-head">

                <span className="lp-tag">
                  Na prática
                </span>

                <h2 className="lp-h2">
                  O seu AC deixou de funcionar
                </h2>

              </div>
            </Reveal>

            <Reveal>
              <div className="lp-story">

                <p className="lp-story-lead">
                  É segunda-feira, 30 graus, e o AC não liga.
                </p>

                <div className="lp-story-steps">

                  <div className="lp-story-step">
                    <span>1.</span>
                    <span>
                      Publica o que aconteceu,{" "}
                      <b>duas linhas bastam</b>.
                    </span>
                  </div>

                  <div className="lp-story-step">
                    <span>2.</span>
                    <span>
                      Em minutos, aparecem{" "}
                      <b>técnicos disponíveis</b>{" "}
                      perto de si.
                    </span>
                  </div>

                  <div className="lp-story-step">
                    <span>3.</span>
                    <span>
                      Escolhe quem tem{" "}
                      <b>melhor avaliação</b>{" "}
                      ou pode chegar mais rápido.
                    </span>
                  </div>

                  <div className="lp-story-step">
                    <span>4.</span>
                    <span>
                      Combina o horário{" "}
                      <b>pelo chat</b>, sem trocar números.
                    </span>
                  </div>

                  <div className="lp-story-step">
                    <span>5.</span>
                    <span>
                      O técnico vem, resolve, e o pagamento{" "}
                      <b>só sai depois</b>.
                    </span>
                  </div>

                </div>

              </div>
            </Reveal>

          </div>
        </section>

        {/* Confiança */}
        <section className="lp-section">

          <div className="lp-container">

            <Reveal>
              <div className="lp-section-head">

                <span className="lp-tag">
                  Confiança
                </span>

                <h2 className="lp-h2">
                  Não basta encontrar alguém
                </h2>

                <p className="lp-section-sub">
                  É preciso saber com quem está a contratar.
                  É por isso que o processo funciona assim.
                </p>

              </div>
            </Reveal>

            <Reveal>
              <div className="lp-journey">

                {journey.map((j, i) => (
                  <div
                    className="lp-journey-item"
                    key={i}
                  >

                    <p className="lp-journey-label">
                      {j.label}
                    </p>

                    <div className="lp-journey-line">

                      <div className="lp-journey-dot">
                        <j.icon size={16} />
                      </div>

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
        <section
          className="lp-section lp-section-alt"
          id="para-prestadores"
        >

          <div className="lp-container">

            <Reveal>
              <div className="lp-provider-panel">

                <div className="lp-provider-top">

                  <div className="lp-provider-copy">

                    <span className="lp-tag">
                      Para prestadores
                    </span>

                    <h2
                      className="lp-h2"
                      style={{ marginTop: 4 }}
                    >
                      Tem uma habilidade que pode virar rendimento?
                    </h2>

                    <p className="lp-section-sub">
                      Crie o seu perfil, mostre o que faz e comece
                      a receber pedidos de clientes perto de si.
                    </p>

                    <div className="lp-provider-mini-stats">

                      <div>
                        <p className="lp-mini-v">
                          500+
                        </p>

                        <p className="lp-mini-l">
                          Prestadores ativos
                        </p>
                      </div>

                      <div className="lp-mini-sep" />

                      <div>
                        <p className="lp-mini-v">
                          10%
                        </p>

                        <p className="lp-mini-l">
                          Taxa de serviço
                        </p>
                      </div>

                      <div className="lp-mini-sep" />

                      <div>
                        <p className="lp-mini-v">
                          4.9★
                        </p>

                        <p className="lp-mini-l">
                          Avaliação média
                        </p>
                      </div>

                    </div>

                    <button
                      className="lp-btn-primary"
                      onClick={goRegisterProvider}
                    >
                      Começar como prestador
                      <ArrowRight size={16} />
                    </button>

                  </div>

                  <div className="lp-provider-mock">

                    <div className="lp-mock-header">

                      <div className="lp-mock-avatar">

                        <Leaf
                          size={17}
                          color="#334155"
                        />

                        <span className="lp-mock-verified">
                          <ShieldCheck
                            size={10}
                            color="#fff"
                          />
                        </span>

                      </div>

                      <div>
                        <p className="lp-mock-name">
                          Isaac Costa
                        </p>

                        <p className="lp-mock-role">
                          Jardineiro · Luanda
                        </p>
                      </div>

                    </div>

                    <div className="lp-mock-bars">

                      <div
                        className="lp-mock-bar"
                        style={{ height: "38%" }}
                      />

                      <div
                        className="lp-mock-bar"
                        style={{ height: "58%" }}
                      />

                      <div
                        className="lp-mock-bar"
                        style={{ height: "48%" }}
                      />

                      <div
                        className="lp-mock-bar high"
                        style={{ height: "88%" }}
                      />

                      <div
                        className="lp-mock-bar"
                        style={{ height: "62%" }}
                      />

                      <div
                        className="lp-mock-bar high"
                        style={{ height: "72%" }}
                      />

                    </div>

                    <p className="lp-mock-caption">
                      Pedidos recebidos esta semana
                    </p>

                  </div>

                </div>

                <div className="lp-provider-grid">

                  {providerChecklist.map((item, i) => (
                    <div
                      className="lp-provider-mini-card"
                      key={i}
                    >

                      <div className="lp-provider-mini-icon">
                        <item.icon size={16} />
                      </div>

                      <span>
                        {item.text}
                      </span>

                    </div>
                  ))}

                </div>

              </div>
            </Reveal>

          </div>
        </section>

        {/* Como funciona */}
        <section className="lp-how-section" id="como-funciona">
          <div className="lp-container lp-how-inner">
            <Reveal>
              <div className="lp-how-heading">
                <h2 className="lp-how-title">
                  MESTROO É <span className="accent">PRÁTICO</span> PARA PLATAFORMAS
                  <br className="lp-how-title-break" /> DE SERVIÇOS
                </h2>

                <p className="lp-how-subtitle">
                  Oferecemos a melhor experiência de conexão entre clientes que
                  precisam de serviços e prestadores que oferecem soluções no
                  dia a dia.
                </p>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <div className="lp-how-grid">
                <div className="lp-how-item">
                  <div className="lp-how-item-head">
                    <div className="lp-how-item-icon">
                      <Download size={34} strokeWidth={2} />
                    </div>

                    <h3 className="lp-how-item-title">
                      Baixe a App pelo chrome e safari do seu smartphone
                    </h3>
                  </div>

                  <div className="lp-how-divider" />

                  <div className="lp-how-pwa">
                    <Smartphone size={22} strokeWidth={1.9} />
                    <span>PWA</span>
                  </div>
                </div>

                <div className="lp-how-item">
                  <div className="lp-how-item-head">
                    <div className="lp-how-item-icon">
                      <UserRoundPlus size={35} strokeWidth={1.9} />
                    </div>

                    <h3 className="lp-how-item-title">
                      Cria a sua conta
                    </h3>
                  </div>

                  <div className="lp-how-divider" />

                  <p className="lp-how-item-text">
                    A conta é única, para ser cliente ou prestador de serviços
                    e gerir tudo num só lugar.
                  </p>
                </div>

                <div className="lp-how-item">
                  <div className="lp-how-item-head">
                    <div className="lp-how-item-icon">
                      <ThumbsUp size={35} strokeWidth={1.9} />
                    </div>

                    <h3 className="lp-how-item-title">
                      Já está, agora fazes parte do MESTROO
                    </h3>
                  </div>

                  <div className="lp-how-divider" />

                  <p className="lp-how-item-text">
                    Encontra serviços, recebe pedidos, comunica e gere tudo
                    diretamente na plataforma.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Aplicação PWA */}
        <InstallGuideSection />

        {/* CTA final */}
        <section className="lp-section">

          <div className="lp-container">

            <Reveal>
              <div className="lp-cta">

                <h2>
                  Tem um serviço para resolver?
                </h2>

                <p>
                  Encontre quem pode fazer, perto de si,
                  hoje mesmo.
                </p>

                <button
                  className="lp-btn-white"
                  onClick={goRegisterClient}
                >
                  Encontrar um profissional
                </button>

              </div>
            </Reveal>

          </div>
        </section>

        {/* Footer */}
        <footer
          className="lp-footer"
          id="contacto"
        >

          <div className="lp-container">

            <div className="lp-footer-grid">

              <div>

                <div
                  className="lp-logo"
                  style={{ marginBottom: 14 }}
                >

                  <div className="lp-logo-mark">
                    <Zap
                      size={17}
                      color="#fff"
                    />
                  </div>

                  <span
                    className="lp-logo-text"
                    style={{ color: "#fff" }}
                  >
                    Mestr
                    <span style={{ color: LOGO_ACCENT }}>
                      oo
                    </span>
                  </span>

                </div>

                <p
                  style={{
                    fontSize: 13,
                    color: "#94a3b8",
                    lineHeight: 1.6,
                    maxWidth: 260,
                  }}
                >
                  A plataforma que liga clientes a prestadores
                  de serviços de confiança.
                </p>

                <div className="lp-footer-social">

                  <a href="#">
                    <Globe
                      size={16}
                      color="#cbd5e1"
                    />
                  </a>

                  <a href="#">
                    <Camera
                      size={16}
                      color="#cbd5e1"
                    />
                  </a>

                  <a href="#">
                    <Link2
                      size={16}
                      color="#cbd5e1"
                    />
                  </a>

                </div>

              </div>

              <div>

                <h4>
                  Plataforma
                </h4>

                <a href="#como-funciona">
                  Como funciona
                </a>

                <a href="#para-prestadores">
                  Para prestadores
                </a>

              </div>

              <div>

                <h4>
                  Empresa
                </h4>

                <a href="/sobre">
                  Sobre
                </a>

                <a href="/termos">
                  Termos de uso
                </a>

                <a href="/privacidade">
                  Privacidade
                </a>

              </div>

            </div>

            <div className="lp-footer-bottom">

              <p>
                © 2026 Mestroo. Todos os direitos reservados.
              </p>

              <p className="lp-coverage-note">
                De momento disponível em Luanda, com expansão
                progressiva para outras cidades.
              </p>

            </div>

          </div>
        </footer>

      </div>
    </>
  );
}