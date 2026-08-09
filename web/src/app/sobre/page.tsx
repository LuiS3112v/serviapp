"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Zap, Menu, X, ArrowRight, Target, Heart, Users, MapPin,
  ShieldCheck, Lock, MessageCircle, Star, Handshake, Globe, Camera,
  Link2, CheckCircle2, Sparkles, Rocket, Building2, Clock, HelpCircle,
} from "lucide-react";

/* Hook simples de scroll-reveal, sem dependências novas */
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
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* Mesma linguagem visual da Homepage: cinza escuro como cor de acção,
   verde só para estados de confirmação/verificação, roxo só no "app"
   do logo (igual ao rodapé em todas as páginas). */
const BRAND = "#1e293b";
const CONFIRM = "#1D9E75";
const INK = "#0f172a";
const LOGO_ACCENT = "#7C6FE0";

export default function SobrePage() {
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
  const goHome = () => router.push("/");

  const values = [
    { icon: ShieldCheck, title: "Confiança em primeiro lugar", text: "Todos os prestadores passam por verificação de identidade (KYC) antes de poderem aceitar pedidos na plataforma." },
    { icon: Handshake, title: "Justo para os dois lados", text: "Preços claros, sem letras pequenas. O cliente sabe o que paga e o prestador sabe o que recebe." },
    { icon: Heart, title: "Feito para Angola", text: "Pensado de raiz para a realidade angolana: bairros, formas de pagamento e o dia a dia de quem contrata e de quem presta serviços." },
    { icon: Rocket, title: "Sempre a melhorar", text: "Ouvimos quem usa a plataforma todos os dias para tornar cada pedido mais simples e rápido." },
  ];

  const timeline = [
    { year: "A ideia", title: "Um problema do dia a dia", text: "Encontrar um eletricista, uma faxineira ou um canalizador de confiança em Luanda era, muitas vezes, uma questão de sorte ou de perguntar a amigos." },
    { year: "O projeto", title: "Nasce a Serviapp", text: "Criámos uma plataforma simples onde qualquer pessoa pode descrever o que precisa e receber propostas de prestadores verificados perto de si." },
    { year: "Hoje", title: "A crescer em Luanda", text: "Já ligamos centenas de prestadores a clientes em várias zonas de Luanda, com avaliações reais e pagamento seguro." },
    { year: "O futuro", title: "Todo o país pela frente", text: "O objetivo é expandir progressivamente para outras províncias de Angola, mantendo o mesmo nível de confiança e qualidade." },
  ];

  const howItWorks = [
    { icon: Users, title: "Duas comunidades, uma plataforma", text: "De um lado, pessoas e famílias que precisam de um serviço feito com qualidade. Do outro, profissionais que querem trabalho a sério, sem depender só do boca a boca." },
    { icon: Lock, title: "Pagamento protegido (escrow)", text: "O valor combinado fica retido em segurança e só é entregue ao prestador depois de o cliente confirmar que o serviço foi concluído como esperado." },
    { icon: MessageCircle, title: "Comunicação dentro da plataforma", text: "Cliente e prestador combinam todos os detalhes por um chat integrado, sem precisar de trocar contactos antes de terem confiança um no outro." },
    { icon: Star, title: "Reputação construída com avaliações reais", text: "Cada avaliação vem de um serviço que foi mesmo realizado, o que ajuda a manter o padrão de qualidade dos prestadores na plataforma." },
  ];

  const faqs = [
    { q: "Quanto custa usar a Serviapp?", a: "Criar conta e pedir orçamentos é gratuito para clientes. Os prestadores pagam uma taxa de serviço apenas sobre os pagamentos que recebem através da plataforma." },
    { q: "Como sei que o prestador é de confiança?", a: "Todos os prestadores passam por verificação de identidade (KYC) antes de poderem ser contactados, e o seu histórico de avaliações fica visível no perfil." },
    { q: "O que acontece se eu não ficar satisfeito com o serviço?", a: "O pagamento só é libertado ao prestador depois de o cliente confirmar a conclusão do serviço, e a nossa equipa de suporte está disponível para ajudar a resolver qualquer situação." },
    { q: "A Serviapp já está disponível em toda Angola?", a: "Neste momento operamos em Luanda, com planos de expansão progressiva para outras províncias do país." },
    { q: "Como posso tornar-me prestador?", a: "Basta criar uma conta, submeter os seus dados para verificação e definir os serviços que pretende oferecer. Depois de aprovado, já pode começar a receber pedidos." },
  ];

  return (
    <>
      <style>{`
        .lp *{box-sizing:border-box}
        .lp{background:#ffffff;color:#111827;font-family:inherit;overflow-x:hidden}
        .lp-container{max-width:1180px;margin:0 auto;padding:0 24px}

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
        .lp-nav a.active{color:${BRAND}}
        .lp-header-actions{display:flex;align-items:center;gap:10px}
        .lp-btn-ghost{padding:10px 18px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;color:#334155;font-size:14px;font-weight:700;cursor:pointer;transition:all .15s;font-family:inherit}
        .lp-btn-ghost:hover{border-color:${BRAND};color:${BRAND}}
        .lp-btn-solid{padding:10px 20px;border-radius:10px;border:none;background:${BRAND};color:#fff;font-size:14px;font-weight:700;cursor:pointer;transition:transform .15s;font-family:inherit}
        .lp-btn-solid:hover{transform:translateY(-1px)}
        .lp-menu-toggle{display:none;background:none;border:none;cursor:pointer;color:#0f172a}

        /* Hero da página Sobre */
        .lp-about-hero{padding:60px 0 52px;text-align:center}
        .lp-eyebrow{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:99px;background:#f1f5f9;color:#475569;font-size:12.5px;font-weight:700;margin-bottom:20px}
        .lp-about-h1{font-size:40px;line-height:1.16;font-weight:800;color:#0f172a;letter-spacing:-0.02em;margin:0 auto 18px;max-width:720px}
        .lp-about-h1 span{color:${BRAND}}
        .lp-about-sub{font-size:16.5px;line-height:1.65;color:#64748b;max-width:600px;margin:0 auto}

        /* Section shared */
        .lp-section{padding:76px 0}
        .lp-section-alt{background:#f8fafc}
        .lp-section-head{text-align:center;max-width:640px;margin:0 auto 44px}
        .lp-tag{display:inline-block;font-size:13px;font-weight:700;color:${BRAND};margin-bottom:14px}
        .lp-h2{font-size:29px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;margin-bottom:12px}
        .lp-section-sub{font-size:15px;color:#64748b;line-height:1.65}

        /* Missão (dois blocos) */
        .lp-mission-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#eef1f5;border:1px solid #eef1f5;border-radius:18px;overflow:hidden}
        .lp-mission-card{padding:36px 32px;background:#fff}
        .lp-mission-icon{width:48px;height:48px;border-radius:13px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;margin-bottom:18px;color:#334155}
        .lp-mission-card h3{font-size:18px;font-weight:800;color:#0f172a;margin-bottom:12px}
        .lp-mission-card p{font-size:14.5px;color:#475569;line-height:1.7}

        /* Timeline */
        .lp-timeline{position:relative;max-width:780px;margin:0 auto}
        .lp-timeline-line{position:absolute;left:12px;top:8px;bottom:8px;width:1px;background:#e2e8f0}
        .lp-timeline-item{position:relative;padding-left:48px;margin-bottom:36px}
        .lp-timeline-item:last-child{margin-bottom:0}
        .lp-timeline-dot{position:absolute;left:2px;top:2px;width:20px;height:20px;border-radius:50%;background:#fff;border:2px solid ${BRAND};z-index:2}
        .lp-timeline-year{display:block;font-size:12px;font-weight:700;color:#A15C3E;margin-bottom:8px;text-transform:uppercase;letter-spacing:.04em}
        .lp-timeline-item h3{font-size:16.5px;font-weight:700;color:#0f172a;margin-bottom:8px}
        .lp-timeline-item p{font-size:14px;color:#64748b;line-height:1.65;max-width:560px}

        /* Como funciona por dentro */
        .lp-how-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:#eef1f5;border:1px solid #eef1f5;border-radius:18px;overflow:hidden}
        .lp-how-card{padding:30px 28px;background:#fff}
        .lp-how-icon{width:46px;height:46px;border-radius:13px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;margin-bottom:18px;color:#334155}
        .lp-how-card h3{font-size:16px;font-weight:700;color:#0f172a;margin-bottom:10px}
        .lp-how-card p{font-size:13.5px;color:#475569;line-height:1.65}

        /* Valores */
        .lp-values-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#eef1f5;border:1px solid #eef1f5;border-radius:16px;overflow:hidden}
        .lp-value-card{background:#fff;padding:26px 22px}
        .lp-value-icon{width:42px;height:42px;border-radius:12px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;margin-bottom:16px;color:#334155}
        .lp-value-card h3{font-size:14.5px;font-weight:700;color:#0f172a;margin-bottom:8px}
        .lp-value-card p{font-size:13px;color:#64748b;line-height:1.6}

        /* Números */
        .lp-stats-band{border:1px solid #eef1f5;border-radius:18px;padding:36px 40px;display:grid;grid-template-columns:repeat(4,1fr);text-align:center}
        .lp-stats-band > div{border-left:1px solid #eef1f5;padding:0 12px}
        .lp-stats-band > div:first-child{border-left:none}
        .lp-stats-band .num{font-size:27px;font-weight:800;color:${INK}}
        .lp-stats-band .lbl{font-size:12.5px;color:#94a3b8;margin-top:4px}

        /* Cobertura */
        .lp-coverage-panel{display:grid;grid-template-columns:1fr 1fr;gap:44px;align-items:center;background:#f8fafc;border:1px solid #eef1f5;border-radius:20px;padding:44px 40px}
        .lp-coverage-list{display:flex;flex-direction:column;gap:14px}
        .lp-coverage-item{display:flex;align-items:flex-start;gap:12px}
        .lp-coverage-item span{font-size:14px;color:#334155;line-height:1.55}
        .lp-coverage-icon{width:28px;height:28px;border-radius:8px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#334155}
        .lp-map-mini{position:relative;border-radius:16px;overflow:hidden;min-height:250px;border:1px solid #e2e8f0}
        .lp-map-mini svg{width:100%;height:100%;display:block}
        .lp-map-pin{position:absolute;width:36px;height:36px;border-radius:10px;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(15,23,42,0.14);border:1px solid #eef1f5}

        /* FAQ */
        .lp-faq-list{max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:12px}
        .lp-faq-item{background:#fff;border:1px solid #eef1f5;border-radius:16px;padding:20px 22px;cursor:pointer;transition:border-color .2s}
        .lp-faq-item:hover{border-color:#cbd5e1}
        .lp-faq-q{display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:15px;font-weight:700;color:#0f172a}
        .lp-faq-a{font-size:14px;color:#64748b;line-height:1.65;margin-top:12px}

        /* CTA final */
        .lp-cta{background:${INK};border-radius:22px;padding:52px 48px;text-align:center;color:#fff}
        .lp-cta h2{font-size:27px;font-weight:800;margin-bottom:14px;letter-spacing:-0.02em}
        .lp-cta p{font-size:15px;color:#cbd5e1;max-width:480px;margin:0 auto 28px;line-height:1.6}
        .lp-cta-actions{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
        .lp-btn-white{padding:15px 28px;border-radius:12px;border:none;background:#fff;color:${INK};font-size:15px;font-weight:800;cursor:pointer;transition:transform .15s;font-family:inherit}
        .lp-btn-white:hover{transform:translateY(-2px)}
        .lp-btn-outline-white{padding:15px 28px;border-radius:12px;border:1.5px solid rgba(255,255,255,0.35);background:transparent;color:#fff;font-size:15px;font-weight:700;cursor:pointer;transition:all .15s;font-family:inherit}
        .lp-btn-outline-white:hover{background:rgba(255,255,255,0.1)}

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
          .lp-mission-grid,.lp-how-grid{grid-template-columns:1fr}
          .lp-values-grid{grid-template-columns:repeat(2,1fr)}
          .lp-stats-band{grid-template-columns:repeat(2,1fr);row-gap:20px}
          .lp-stats-band > div:nth-child(3){border-left:none}
          .lp-coverage-panel{grid-template-columns:1fr;padding:32px 26px}
          .lp-footer-grid{grid-template-columns:1fr 1fr}
          .lp-footer-bottom{flex-direction:column;align-items:flex-start}
          .lp-coverage-note{text-align:left}
        }
        @media(max-width:600px){
          .lp-about-h1{font-size:27px}
          .lp-h2{font-size:22px}
          .lp-values-grid{grid-template-columns:1fr}
          .lp-stats-band{grid-template-columns:1fr;padding:28px 24px}
          .lp-stats-band > div{border-left:none;border-top:1px solid #eef1f5;padding-top:16px}
          .lp-stats-band > div:first-child{border-top:none;padding-top:0}
          .lp-cta{padding:38px 22px}
          .lp-footer-grid{grid-template-columns:1fr}
          .lp-coverage-panel{padding:24px 18px}
          .lp-timeline-item{padding-left:40px}
        }
      `}</style>

      <div className="lp">
        {/* Header */}
        <header className={`lp-header${scrolled ? " scrolled" : ""}`}>
          <div className="lp-header-inner">
            <div className="lp-logo" onClick={goHome}>
              <div className="lp-logo-mark"><Zap size={19} color="#fff" /></div>
              <span className="lp-logo-text">Servi<span style={{ color: LOGO_ACCENT }}>app</span></span>
            </div>
            <nav className="lp-nav">
              <a href="/#como-funciona">Como funciona</a>
              <a href="/sobre" className="active">Sobre</a>
              <a href="/#para-prestadores">Para prestadores</a>
              <a href="/#contacto">Contacto</a>
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
              {[["Como funciona", "/#como-funciona"], ["Sobre", "/sobre"], ["Para prestadores", "/#para-prestadores"], ["Contacto", "/#contacto"]].map(([label, href]) => (
                <a key={href} href={href} onClick={() => setMenuOpen(false)} style={{ padding: "12px 0", fontSize: 14.5, fontWeight: 600, color: "#334155", textDecoration: "none", borderBottom: "1px solid #f1f5f9" }}>{label}</a>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button className="lp-btn-ghost" style={{ flex: 1 }} onClick={goLogin}>Entrar</button>
                <button className="lp-btn-solid" style={{ flex: 1 }} onClick={goRegisterClient}>Criar conta</button>
              </div>
            </div>
          )}
        </header>

        {/* Hero da página Sobre */}
        <section className="lp-about-hero">
          <div className="lp-container">
            <Reveal>
              <div className="lp-eyebrow" style={{ marginLeft: "auto", marginRight: "auto" }}><MapPin size={13} /> Sobre a Serviapp</div>
              <h1 className="lp-about-h1">Ligamos pessoas a <span>profissionais de confiança</span>, em Luanda e, em breve, em todo o país</h1>
              <p className="lp-about-sub">Somos uma plataforma angolana que facilita encontrar e ser encontrado por quem precisa de um serviço bem feito. Aqui explicamos quem somos, como trabalhamos e porque pode confiar em nós.</p>
            </Reveal>
          </div>
        </section>

        {/* Missão e visão */}
        <section className="lp-section lp-section-alt">
          <div className="lp-container">
            <Reveal>
              <div className="lp-mission-grid">
                <div className="lp-mission-card">
                  <div className="lp-mission-icon"><Target size={22} /></div>
                  <h3>A nossa missão</h3>
                  <p>Tornar simples e seguro encontrar um profissional de confiança para qualquer serviço do dia a dia da canalização à limpeza, da eletricidade à beleza sem depender só de contactos ou do boca a boca.</p>
                </div>
                <div className="lp-mission-card">
                  <div className="lp-mission-icon"><Sparkles size={22} /></div>
                  <h3>A nossa visão</h3>
                  <p>Ser a plataforma de referência para serviços em Angola, valorizando o talento local e dando a milhares de profissionais uma forma justa e digital de fazer crescer o seu trabalho.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Como surgimos — timeline */}
        <section className="lp-section">
          <div className="lp-container">
            <Reveal>
              <div className="lp-section-head">
                <span className="lp-tag">A nossa história</span>
                <h2 className="lp-h2">Como surgiu a Serviapp</h2>
                <p className="lp-section-sub">De um problema comum em Luanda a uma plataforma pensada para crescer com o país.</p>
              </div>
            </Reveal>
            <div className="lp-timeline">
              <div className="lp-timeline-line" />
              {timeline.map((t, i) => (
                <Reveal key={i} delay={i * 80}>
                  <div className="lp-timeline-item">
                    <div className="lp-timeline-dot" />
                    <span className="lp-timeline-year">{t.year}</span>
                    <h3>{t.title}</h3>
                    <p>{t.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Como funciona por dentro */}
        <section className="lp-section lp-section-alt">
          <div className="lp-container">
            <Reveal>
              <div className="lp-section-head">
                <span className="lp-tag">Por dentro da plataforma</span>
                <h2 className="lp-h2">Como garantimos confiança em cada pedido</h2>
                <p className="lp-section-sub">Cada detalhe da plataforma foi pensado para proteger tanto quem contrata como quem presta o serviço.</p>
              </div>
            </Reveal>
            <Reveal>
              <div className="lp-how-grid">
                {howItWorks.map((h, i) => (
                  <div className="lp-how-card" key={i}>
                    <div className="lp-how-icon"><h.icon size={22} /></div>
                    <h3>{h.title}</h3>
                    <p>{h.text}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Valores */}
        <section className="lp-section">
          <div className="lp-container">
            <Reveal>
              <div className="lp-section-head">
                <span className="lp-tag">O que nos guia</span>
                <h2 className="lp-h2">Os nossos valores</h2>
              </div>
            </Reveal>
            <Reveal>
              <div className="lp-values-grid">
                {values.map((v, i) => (
                  <div className="lp-value-card" key={i}>
                    <div className="lp-value-icon"><v.icon size={19} /></div>
                    <h3>{v.title}</h3>
                    <p>{v.text}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Números */}
        <section className="lp-section lp-section-alt">
          <div className="lp-container">
            <Reveal>
              <div className="lp-stats-band">
                <div><p className="num">500+</p><p className="lbl">Prestadores</p></div>
                <div><p className="num">12+</p><p className="lbl">Categorias</p></div>
                <div><p className="num">4.9★</p><p className="lbl">Avaliação média</p></div>
                <div><p className="num">1</p><p className="lbl">Cidade, para já</p></div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Cobertura */}
        <section className="lp-section">
          <div className="lp-container">
            <Reveal>
              <div className="lp-coverage-panel">
                <div>
                  <span className="lp-tag">Onde estamos</span>
                  <h2 className="lp-h2" style={{ marginTop: 4 }}>Hoje em Luanda, amanhã em Angola</h2>
                  <p className="lp-section-sub" style={{ marginBottom: 24 }}>Começámos por Luanda para garantir que cada prestador é bem verificado e cada serviço corre bem, antes de crescer para novas zonas.</p>
                  <div className="lp-coverage-list">
                    <div className="lp-coverage-item">
                      <div className="lp-coverage-icon"><CheckCircle2 size={14} /></div>
                      <span>Já disponível em várias zonas de Luanda, incluindo Talatona, Maianga, Ingombota e Samba.</span>
                    </div>
                    <div className="lp-coverage-item">
                      <div className="lp-coverage-icon"><Clock size={14} /></div>
                      <span>Expansão progressiva planeada para outras províncias de Angola nos próximos passos da plataforma.</span>
                    </div>
                    <div className="lp-coverage-item">
                      <div className="lp-coverage-icon"><Building2 size={14} /></div>
                      <span>Equipa local dedicada a acompanhar prestadores e clientes em cada nova zona.</span>
                    </div>
                  </div>
                </div>
                <div className="lp-map-mini">
                  <svg viewBox="0 0 400 280" preserveAspectRatio="xMidYMid slice">
                    <rect width="400" height="280" fill="#f1f5f9" />
                    <g fill="#e6ebf1">
                      <rect x="20" y="20" width="110" height="80" rx="6" />
                      <rect x="160" y="14" width="90" height="70" rx="6" />
                      <rect x="270" y="24" width="110" height="90" rx="6" />
                      <rect x="16" y="130" width="90" height="80" rx="6" />
                      <rect x="140" y="150" width="110" height="70" rx="6" />
                      <rect x="280" y="140" width="100" height="90" rx="6" />
                      <rect x="30" y="230" width="120" height="40" rx="6" />
                      <rect x="180" y="235" width="100" height="35" rx="6" />
                    </g>
                    <g stroke="#ffffff" strokeWidth="8" fill="none" strokeLinecap="round">
                      <path d="M0,110 H400" />
                      <path d="M0,220 H400" />
                      <path d="M140,0 V280" />
                      <path d="M260,0 V280" />
                    </g>
                  </svg>
                  <div className="lp-map-pin" style={{ top: "24%", left: "18%" }}><MapPin size={16} color="#334155" /></div>
                  <div className="lp-map-pin" style={{ top: "56%", left: "48%" }}><MapPin size={16} color="#334155" /></div>
                  <div className="lp-map-pin" style={{ top: "34%", right: "12%" }}><MapPin size={16} color="#334155" /></div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* FAQ */}
        <section className="lp-section lp-section-alt">
          <div className="lp-container">
            <Reveal>
              <div className="lp-section-head">
                <span className="lp-tag">Perguntas frequentes</span>
                <h2 className="lp-h2">Tudo o que precisa de saber</h2>
                <p className="lp-section-sub">Se tiver mais dúvidas, a nossa equipa de suporte está sempre disponível para ajudar.</p>
              </div>
            </Reveal>
            <div className="lp-faq-list">
              {faqs.map((f, i) => (
                <Reveal key={i} delay={i * 40}>
                  <details className="lp-faq-item">
                    <summary className="lp-faq-q" style={{ listStyle: "none", cursor: "pointer" }}>
                      {f.q}
                      <HelpCircle size={18} color="#94a3b8" style={{ flexShrink: 0 }} />
                    </summary>
                    <p className="lp-faq-a">{f.a}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="lp-section">
          <div className="lp-container">
            <Reveal>
              <div className="lp-cta">
                <h2>Faça parte da Serviapp</h2>
                <p>Quer contratar um serviço de confiança ou quer começar a receber novos clientes? Crie a sua conta gratuita agora.</p>
                <div className="lp-cta-actions">
                  <button className="lp-btn-white" onClick={goRegisterClient}>Criar conta</button>
                  <button className="lp-btn-outline-white" onClick={goHome}>Voltar ao início</button>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Footer */}
        <footer className="lp-footer" id="contacto">
          <div className="lp-container">
            <div className="lp-footer-grid">
              <div>
                <div className="lp-logo" style={{ marginBottom: 14 }} onClick={goHome}>
                  <div className="lp-logo-mark"><Zap size={17} color="#fff" /></div>
                  <span className="lp-logo-text" style={{ color: "#fff" }}>Servi<span style={{ color: LOGO_ACCENT }}>app</span></span>
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
                <a href="/#como-funciona">Como funciona</a>
                <a href="/sobre">Sobre</a>
                <a href="/#para-prestadores">Para prestadores</a>
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