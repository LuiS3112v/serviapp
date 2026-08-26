"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Zap, Menu, X, Target, Heart, MapPin,
  ShieldCheck, Lock, MessageCircle, Star, Handshake, Globe, Camera,
  Link2, CheckCircle2, Sparkles, Rocket, Building2, Clock, Send,
} from "lucide-react";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold: 0.12 }
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

const BRAND = "#1e293b";
const INK = "#0f172a";
const LOGO_ACCENT = "#7C6FE0";

export default function SobrePage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formSent, setFormSent] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", assunto: "", mensagem: "" });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goLogin = () => router.push("/login");
  const goRegisterClient = () => router.push("/register/client");
  const goHome = () => router.push("/");

  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!form.nome || !form.email || !form.mensagem) return;
    setFormSent(true);
  };

  const values = [
    { icon: ShieldCheck, title: "Confiança antes de tudo", text: "Nenhum prestador aparece na plataforma sem passar por verificação de identidade. Isso não é opcional." },
    { icon: Handshake, title: "Justo para os dois lados", text: "Preços claros, sem surpresas. Quem contrata sabe o que paga. Quem trabalha sabe o que recebe." },
    { icon: Heart, title: "Feito para Angola", text: "Não adaptámos uma plataforma de fora. Pensámos isto de raiz para como as coisas funcionam aqui: os bairros, os pagamentos, o dia a dia." },
    { icon: Rocket, title: "Sempre a melhorar", text: "Ouvimos quem usa a plataforma. Se algo não está a funcionar bem, queremos saber." },
  ];

  const timeline = [
    { year: "A ideia", title: "Um problema do dia a dia", text: "Encontrar um eletricista, uma faxineira ou um canalizador de confiança em Luanda era, muitas vezes, uma questão de sorte ou de perguntar a amigos." },
    { year: "O projeto", title: "Nasce a Mestroo", text: "Criámos uma plataforma onde qualquer pessoa descreve o que precisa e recebe propostas de prestadores verificados perto de si. Simples assim." },
    { year: "Hoje", title: "A crescer em Luanda", text: "Já ligámos centenas de prestadores a clientes em várias zonas de Luanda, com avaliações reais e pagamento seguro." },
    { year: "O futuro", title: "Todo o país pela frente", text: "O objetivo é chegar progressivamente a outras províncias de Angola, sem perder o nível de confiança que construímos até agora." },
  ];

  const faqs = [
    { q: "Quanto custa usar a Mestroo?", a: "Para clientes é gratuito: criar conta, publicar pedidos e receber propostas não tem custo nenhum. Os prestadores pagam uma taxa de 10% apenas sobre os pagamentos que recebem pela plataforma." },
    { q: "Como sei que o prestador é de confiança?", a: "Todos os prestadores passam por verificação de identidade antes de poderem ser contactados. O histórico de avaliações de cada um fica visível no perfil." },
    { q: "O que acontece se o serviço não correr bem?", a: "O pagamento só sai depois de confirmar que o serviço foi concluído. Se houver algum problema, a nossa equipa está disponível para ajudar a resolver." },
    { q: "A Mestroo já está disponível em toda Angola?", a: "Neste momento operamos em Luanda. A expansão para outras províncias está planeada e vai acontecer de forma progressiva." },
    { q: "Como começo a prestar serviços?", a: "Cria uma conta, submete os dados para verificação e define os serviços que queres oferecer. Depois de aprovado, já podes começar a receber pedidos." },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300;1,9..40,400&family=Inter:wght@700;800&display=swap');

        .lp *{box-sizing:border-box}
        .lp{background:#ffffff;color:#111827;font-family:'DM Sans',sans-serif;overflow-x:hidden}
        .lp-container{max-width:1180px;margin:0 auto;padding:0 24px}

        /* ── HEADER ── */
        .lp-header{position:sticky;top:0;z-index:50;background:rgba(255,255,255,0.9);backdrop-filter:blur(10px);border-bottom:1px solid #eef1f5;transition:box-shadow .2s}
        .lp-header.scrolled{box-shadow:0 2px 16px rgba(15,23,42,0.06)}
        .lp-header-inner{max-width:1180px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;justify-content:space-between}
        .lp-logo{display:flex;align-items:center;gap:10px;cursor:pointer}
        .lp-logo-mark{width:38px;height:38px;border-radius:11px;background:${BRAND};display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .lp-logo-text{font-size:19px;font-weight:500;color:#0f172a;letter-spacing:-0.02em;font-family:'DM Sans',sans-serif}
        .lp-nav{display:flex;align-items:center;gap:32px}
        .lp-nav a,.lp-nav a:visited{font-size:14.5px;font-weight:600;color:#475569;text-decoration:none;transition:color .15s;font-family:'DM Sans',sans-serif}
        .lp-nav a:hover{color:${BRAND}}
        .lp-nav a.active{color:${BRAND}}
        .lp-header-actions{display:flex;align-items:center;gap:10px}
        .lp-btn-ghost{padding:10px 18px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;color:#334155;font-size:14px;font-weight:600;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif}
        .lp-btn-ghost:hover{border-color:${BRAND};color:${BRAND}}
        .lp-btn-solid{padding:10px 20px;border-radius:10px;border:none;background:${BRAND};color:#fff;font-size:14px;font-weight:600;cursor:pointer;transition:transform .15s;font-family:'DM Sans',sans-serif}
        .lp-btn-solid:hover{transform:translateY(-1px)}
        .lp-menu-toggle{display:none;background:none;border:none;cursor:pointer;color:#0f172a}

        /* ── HERO ── */
        .lp-about-hero{padding:64px 0 56px}
        .lp-eyebrow{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:99px;background:#f1f5f9;color:#475569;font-size:12.5px;font-weight:400;margin-bottom:20px}
        .lp-about-h1{font-size:40px;line-height:1.1;font-weight:800;color:#1e293b;letter-spacing:-0.03em;margin:0 0 18px;max-width:680px;font-family:'Inter',sans-serif;text-transform:uppercase}
        .lp-about-sub{font-size:16.5px;line-height:1.65;color:#64748b;max-width:580px;font-weight:400}

        /* ── SECTIONS ── */
        .lp-section{padding:76px 0}
        .lp-section-alt{background:#f8fafc}
        .lp-section-head{max-width:640px;margin:0 0 44px}
        .lp-section-head.center{text-align:center;margin-left:auto;margin-right:auto}
        .lp-tag{display:inline-block;font-size:13px;font-weight:400;color:${BRAND};margin-bottom:14px}
        .lp-h2{font-size:29px;font-weight:400;color:#0f172a;letter-spacing:-0.02em;margin-bottom:12px;font-family:'DM Sans',sans-serif}
        .lp-section-sub{font-size:15px;color:#64748b;line-height:1.65;font-weight:400}

        /* ── MISSION ── */
        .lp-mission-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#eef1f5;border:1px solid #eef1f5;border-radius:18px;overflow:hidden}
        .lp-mission-card{padding:36px 32px;background:#fff}
        .lp-mission-icon{width:48px;height:48px;border-radius:13px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;margin-bottom:18px;color:#334155}
        .lp-mission-card h3{font-size:18px;font-weight:500;color:#0f172a;margin-bottom:12px}
        .lp-mission-card p{font-size:14.5px;color:#475569;line-height:1.7;font-weight:400}

        /* ── TIMELINE ── */
        .lp-timeline{position:relative;max-width:720px}
        .lp-timeline-rule{position:absolute;left:9px;top:8px;bottom:8px;width:1px;background:#e2e8f0}
        .lp-timeline-item{position:relative;padding-left:42px;padding-bottom:36px}
        .lp-timeline-item:last-child{padding-bottom:0}
        .lp-timeline-dot{position:absolute;left:0;top:4px;width:18px;height:18px;border-radius:50%;background:#fff;border:2px solid ${BRAND};z-index:2}
        .lp-timeline-year{display:block;font-size:11.5px;font-weight:400;color:#94a3b8;margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em}
        .lp-timeline-item h3{font-size:16px;font-weight:500;color:#0f172a;margin-bottom:8px}
        .lp-timeline-item p{font-size:14px;color:#64748b;line-height:1.65;max-width:520px;font-weight:400}

        /* ── VALUES ── */
        .lp-values-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#eef1f5;border:1px solid #eef1f5;border-radius:16px;overflow:hidden}
        .lp-value-card{background:#fff;padding:26px 22px}
        .lp-value-icon{width:42px;height:42px;border-radius:12px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;margin-bottom:16px;color:#334155}
        .lp-value-card h3{font-size:14.5px;font-weight:500;color:#0f172a;margin-bottom:8px}
        .lp-value-card p{font-size:13px;color:#64748b;line-height:1.6;font-weight:400}

        /* ── STATS ── */
        .lp-stats-band{border:1px solid #eef1f5;border-radius:18px;padding:36px 40px;display:grid;grid-template-columns:repeat(4,1fr);text-align:center}
        .lp-stats-band > div{border-left:1px solid #eef1f5;padding:0 12px}
        .lp-stats-band > div:first-child{border-left:none}
        .lp-stats-num{font-size:27px;font-weight:500;color:${INK}}
        .lp-stats-lbl{font-size:12.5px;color:#94a3b8;margin-top:4px;font-weight:400}

        /* ── COVERAGE ── */
        .lp-coverage-panel{display:grid;grid-template-columns:1fr 1fr;gap:44px;align-items:center;background:#f8fafc;border:1px solid #eef1f5;border-radius:20px;padding:44px 40px}
        .lp-coverage-list{display:flex;flex-direction:column;gap:14px;margin-top:20px}
        .lp-coverage-item{display:flex;align-items:flex-start;gap:12px}
        .lp-coverage-item span{font-size:14px;color:#334155;line-height:1.55;font-weight:400}
        .lp-coverage-icon{width:28px;height:28px;border-radius:8px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#334155}
        .lp-map-mini{position:relative;border-radius:16px;overflow:hidden;min-height:250px;border:1px solid #e2e8f0}
        .lp-map-mini svg{width:100%;height:100%;display:block}
        .lp-map-pin{position:absolute;width:36px;height:36px;border-radius:10px;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(15,23,42,0.14);border:1px solid #eef1f5}

        /* ── FAQ ── */
        .lp-faq-list{max-width:760px;display:flex;flex-direction:column;gap:10px}
        .lp-faq-item{background:#fff;border:1px solid #eef1f5;border-radius:14px;overflow:hidden;transition:border-color .2s}
        .lp-faq-item.open{border-color:#cbd5e1}
        .lp-faq-q{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 22px;font-size:15px;font-weight:500;color:#0f172a;cursor:pointer;user-select:none}
        .lp-faq-a{padding:0 22px 20px;font-size:14px;color:#64748b;line-height:1.65;font-weight:400}

        /* ── CONTACT FORM ── */
        .lp-contact-grid{display:grid;grid-template-columns:1fr 1.4fr;gap:56px;align-items:start}
        .lp-contact-info h3{font-size:22px;font-weight:400;color:#0f172a;margin-bottom:12px;letter-spacing:-0.01em}
        .lp-contact-info p{font-size:14.5px;color:#64748b;line-height:1.7;margin-bottom:24px;font-weight:400}
        .lp-contact-detail{display:flex;align-items:center;gap:10px;font-size:14px;color:#334155;margin-bottom:12px;font-weight:400}
        .lp-contact-detail-icon{width:34px;height:34px;border-radius:9px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#334155}
        .lp-form{display:flex;flex-direction:column;gap:16px}
        .lp-form-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .lp-field{display:flex;flex-direction:column;gap:6px}
        .lp-field label{font-size:13px;font-weight:500;color:#334155}
        .lp-field input,.lp-field textarea{padding:12px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;font-family:'DM Sans',sans-serif;font-weight:400;color:#0f172a;background:#fff;outline:none;transition:border-color .15s;resize:none}
        .lp-field input:focus,.lp-field textarea:focus{border-color:#334155}
        .lp-field input::placeholder,.lp-field textarea::placeholder{color:#94a3b8}
        .lp-form-submit{padding:14px 24px;border-radius:11px;border:none;background:${BRAND};color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;justify-content:center;gap:8px;transition:transform .15s}
        .lp-form-submit:hover{transform:translateY(-1px)}
        .lp-form-success{padding:24px;border-radius:14px;background:#f0fdf4;border:1px solid #bbf7d0;text-align:center}
        .lp-form-success p{font-size:15px;color:#15803d;font-weight:500}

        /* ── CTA ── */
        .lp-cta{background:${INK};border-radius:22px;padding:52px 48px;text-align:center;color:#fff}
        .lp-cta h2{font-size:27px;font-weight:400;margin-bottom:14px;letter-spacing:-0.02em}
        .lp-cta p{font-size:15px;color:#cbd5e1;max-width:480px;margin:0 auto 28px;line-height:1.6;font-weight:400}
        .lp-cta-actions{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
        .lp-btn-white{padding:15px 28px;border-radius:12px;border:none;background:#fff;color:${INK};font-size:15px;font-weight:500;cursor:pointer;transition:transform .15s;font-family:'DM Sans',sans-serif}
        .lp-btn-white:hover{transform:translateY(-2px)}
        .lp-btn-outline-white{padding:15px 28px;border-radius:12px;border:1.5px solid rgba(255,255,255,0.3);background:transparent;color:#fff;font-size:15px;font-weight:400;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif}
        .lp-btn-outline-white:hover{background:rgba(255,255,255,0.08)}

        /* ── FOOTER ── */
        .lp-footer{background:#0f172a;color:#cbd5e1;padding:56px 0 28px}
        .lp-footer-grid{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:40px;margin-bottom:40px}
        .lp-footer h4{font-size:13.5px;font-weight:500;color:#fff;margin-bottom:16px}
        .lp-footer a,.lp-footer a:visited{display:block;font-size:13.5px;color:#94a3b8;text-decoration:none;margin-bottom:10px;transition:color .15s;font-weight:400}
        .lp-footer a:hover{color:#fff}
        .lp-footer-social{display:flex;gap:10px;margin-top:16px}
        .lp-footer-social a,.lp-footer-social a:visited{width:36px;height:36px;border-radius:10px;background:#1e293b;display:flex;align-items:center;justify-content:center;margin:0}
        .lp-footer-social a:hover{background:${BRAND}}
        .lp-footer-bottom{border-top:1px solid #1e293b;padding-top:24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
        .lp-footer-bottom p{font-size:12.5px;color:#64748b;font-weight:400}

        /* ── RESPONSIVE ── */
        @media(max-width:960px){
          .lp-nav{display:none}
          .lp-header-actions .lp-btn-ghost{display:none}
          .lp-menu-toggle{display:block}
          .lp-mission-grid{grid-template-columns:1fr}
          .lp-services-grid{grid-template-columns:repeat(2,1fr)}
          .lp-values-grid{grid-template-columns:repeat(2,1fr)}
          .lp-stats-band{grid-template-columns:repeat(2,1fr);row-gap:20px}
          .lp-stats-band > div:nth-child(3){border-left:none}
          .lp-coverage-panel{grid-template-columns:1fr;padding:32px 26px}
          .lp-contact-grid{grid-template-columns:1fr;gap:36px}
          .lp-footer-grid{grid-template-columns:1fr 1fr}
          .lp-footer-bottom{flex-direction:column;align-items:flex-start}
        }
        @media(max-width:600px){
          .lp-about-h1{font-size:27px}
          .lp-h2{font-size:22px}
          .lp-services-grid{grid-template-columns:1fr}
          .lp-values-grid{grid-template-columns:1fr}
          .lp-stats-band{grid-template-columns:1fr;padding:28px 24px}
          .lp-stats-band > div{border-left:none;border-top:1px solid #eef1f5;padding-top:16px}
          .lp-stats-band > div:first-child{border-top:none;padding-top:0}
          .lp-cta{padding:38px 22px}
          .lp-footer-grid{grid-template-columns:1fr}
          .lp-coverage-panel{padding:24px 18px}
          .lp-form-row{grid-template-columns:1fr}
        }
      `}</style>

      <div className="lp">

        {/* ── HEADER ── */}
        <header className={`lp-header${scrolled ? " scrolled" : ""}`}>
          <div className="lp-header-inner">
            <div className="lp-logo" onClick={goHome}>
              <div className="lp-logo-mark"><Zap size={19} color="#fff" /></div>
              <span className="lp-logo-text">Mestr<span style={{ color: LOGO_ACCENT }}>oo</span></span>
            </div>
            <nav className="lp-nav">
              <a href="/#como-funciona">Como funciona</a>
              <a href="/sobre" className="active">Sobre</a>
              <a href="/#para-prestadores">Para prestadores</a>
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
              {[["Como funciona", "/#como-funciona"], ["Sobre", "/sobre"], ["Para prestadores", "/#para-prestadores"], ["Contacto", "#contacto"]].map(([label, href]) => (
                <a key={href} href={href} onClick={() => setMenuOpen(false)} style={{ padding: "12px 0", fontSize: 14.5, fontWeight: 600, color: "#334155", textDecoration: "none", borderBottom: "1px solid #f1f5f9", fontFamily: "'DM Sans',sans-serif" }}>{label}</a>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button className="lp-btn-ghost" style={{ flex: 1 }} onClick={goLogin}>Entrar</button>
                <button className="lp-btn-solid" style={{ flex: 1 }} onClick={goRegisterClient}>Criar conta</button>
              </div>
            </div>
          )}
        </header>

        {/* ── HERO ── */}
        <section className="lp-about-hero">
          <div className="lp-container">
            <Reveal>
              <div className="lp-eyebrow"><MapPin size={13} /> Sobre a Mestroo</div>
              <h1 className="lp-about-h1">Encontrar um profissional de confiança em Luanda não devia ser tão difícil</h1>
              <p className="lp-about-sub">Aqui explicamos quem somos, como pensámos a plataforma e porque acreditamos que isto pode funcionar melhor para toda a gente.</p>
            </Reveal>
          </div>
        </section>

        {/* ── MISSÃO ── */}
        <section className="lp-section lp-section-alt">
          <div className="lp-container">
            <Reveal>
              <div className="lp-mission-grid">
                <div className="lp-mission-card">
                  <div className="lp-mission-icon"><Target size={22} /></div>
                  <h3>Porque existimos</h3>
                  <p>Contratar um eletricista, uma faxineira ou um canalizador de confiança em Luanda era, muitas vezes, questão de sorte. Criámos a Mestroo para mudar isso: qualquer pessoa descreve o que precisa e encontra quem pode fazer, perto de si, com avaliações reais.</p>
                </div>
                <div className="lp-mission-card">
                  <div className="lp-mission-icon"><Sparkles size={22} /></div>
                  <h3>Para onde vamos</h3>
                  <p>Queremos ser a forma mais natural de encontrar e ser encontrado por quem precisa de um serviço em Angola. E fazer isso valorizando quem trabalha, não só quem contrata.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── HISTÓRIA ── */}
        <section className="lp-section">
          <div className="lp-container">
            <Reveal>
              <div className="lp-section-head">
                <span className="lp-tag">A nossa história</span>
                <h2 className="lp-h2">Como surgiu a Mestroo</h2>
              </div>
            </Reveal>
            <div className="lp-timeline" style={{ position: "relative" }}>
              <div className="lp-timeline-rule" />
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

        {/* ── VALORES ── */}
        <section className="lp-section">
          <div className="lp-container">
            <Reveal>
              <div className="lp-section-head">
                <span className="lp-tag">O que nos guia</span>
                <h2 className="lp-h2">Em que acreditamos</h2>
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

        {/* ── NÚMEROS ── */}
        <section className="lp-section lp-section-alt">
          <div className="lp-container">
            <Reveal>
              <div className="lp-stats-band">
                <div><p className="lp-stats-num">500+</p><p className="lp-stats-lbl">Prestadores</p></div>
                <div><p className="lp-stats-num">12+</p><p className="lp-stats-lbl">Categorias</p></div>
                <div><p className="lp-stats-num">4.9★</p><p className="lp-stats-lbl">Avaliação média</p></div>
                <div><p className="lp-stats-num">1</p><p className="lp-stats-lbl">Cidade, por agora</p></div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── COBERTURA ── */}
        <section className="lp-section">
          <div className="lp-container">
            <Reveal>
              <div className="lp-coverage-panel">
                <div>
                  <span className="lp-tag">Onde estamos</span>
                  <h2 className="lp-h2" style={{ marginTop: 4 }}>Hoje em Luanda, amanhã em Angola</h2>
                  <p className="lp-section-sub">Começámos por Luanda para garantir que cada prestador é verificado a sério e cada serviço corre bem, antes de crescer para outras zonas.</p>
                  <div className="lp-coverage-list">
                    <div className="lp-coverage-item">
                      <div className="lp-coverage-icon"><CheckCircle2 size={14} /></div>
                      <span>Já disponível em várias zonas de Luanda: Talatona, Maianga, Ingombota, Samba e outras.</span>
                    </div>
                    <div className="lp-coverage-item">
                      <div className="lp-coverage-icon"><Clock size={14} /></div>
                      <span>Expansão progressiva para outras províncias de Angola nos próximos meses.</span>
                    </div>
                    <div className="lp-coverage-item">
                      <div className="lp-coverage-icon"><Building2 size={14} /></div>
                      <span>Equipa local a acompanhar cada nova zona antes de abrir ao público.</span>
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

        {/* ── FAQ ── */}
        <section className="lp-section lp-section-alt">
          <div className="lp-container">
            <Reveal>
              <div className="lp-section-head">
                <span className="lp-tag">Perguntas frequentes</span>
                <h2 className="lp-h2">O que as pessoas costumam perguntar</h2>
              </div>
            </Reveal>
            <div className="lp-faq-list">
              {faqs.map((f, i) => (
                <Reveal key={i} delay={i * 40}>
                  <div
                    className={`lp-faq-item${openFaq === i ? " open" : ""}`}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <div className="lp-faq-q">
                      {f.q}
                      <span style={{ color: "#94a3b8", flexShrink: 0, fontSize: 18, fontWeight: 400, lineHeight: 1 }}>
                        {openFaq === i ? "−" : "+"}
                      </span>
                    </div>
                    {openFaq === i && <p className="lp-faq-a">{f.a}</p>}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── CONTACTO (com formulário) ── */}
        <section className="lp-section" id="contacto">
          <div className="lp-container">
            <Reveal>
              <div className="lp-section-head">
                <span className="lp-tag">Fale connosco</span>
                <h2 className="lp-h2">Tem alguma questão? Estamos aqui.</h2>
              </div>
            </Reveal>
            <Reveal delay={80}>
              <div className="lp-contact-grid">
                <div className="lp-contact-info">
                  <h3>Respondemos a todas as mensagens</h3>
                  <p>Seja para uma dúvida sobre a plataforma, um problema num serviço ou simplesmente para nos dar feedback a nossa equipa lê tudo e responde em até 24 horas.</p>
                  <div className="lp-contact-detail">
                    <div className="lp-contact-detail-icon"><MessageCircle size={15} /></div>
                    suporte@mestroo.ao
                  </div>
                  <div className="lp-contact-detail">
                    <div className="lp-contact-detail-icon"><MapPin size={15} /></div>
                    Luanda, Angola
                  </div>
                  <div className="lp-contact-detail">
                    <div className="lp-contact-detail-icon"><Globe size={15} /></div>
                    mestroo.ao
                  </div>
                </div>

                <div>
                  {formSent ? (
                    <div className="lp-form-success">
                      <p>✓ Mensagem enviada! Respondemos em breve.</p>
                    </div>
                  ) : (
                    <div className="lp-form">
                      <div className="lp-form-row">
                        <div className="lp-field">
                          <label>Nome</label>
                          <input
                            type="text"
                            placeholder="O seu nome"
                            value={form.nome}
                            onChange={e => setForm({ ...form, nome: e.target.value })}
                          />
                        </div>
                        <div className="lp-field">
                          <label>Email</label>
                          <input
                            type="email"
                            placeholder="seu@email.com"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="lp-field">
                        <label>Assunto</label>
                        <input
                          type="text"
                          placeholder="Sobre o que quer falar?"
                          value={form.assunto}
                          onChange={e => setForm({ ...form, assunto: e.target.value })}
                        />
                      </div>
                      <div className="lp-field">
                        <label>Mensagem</label>
                        <textarea
                          rows={5}
                          placeholder="Escreva a sua mensagem aqui..."
                          value={form.mensagem}
                          onChange={e => setForm({ ...form, mensagem: e.target.value })}
                        />
                      </div>
                      <button className="lp-form-submit" onClick={handleSubmit}>
                        <Send size={15} /> Enviar mensagem
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="lp-section lp-section-alt">
          <div className="lp-container">
            <Reveal>
              <div className="lp-cta">
                <h2>Tem um serviço para resolver?</h2>
                <p>Crie a sua conta e encontre quem pode fazer, perto de si, hoje mesmo.</p>
                <div className="lp-cta-actions">
                  <button className="lp-btn-white" onClick={goRegisterClient}>Encontrar um profissional</button>
                  <button className="lp-btn-outline-white" onClick={goHome}>Voltar ao início</button>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="lp-footer">
          <div className="lp-container">
            <div className="lp-footer-grid">
              <div>
                <div className="lp-logo" style={{ marginBottom: 14 }} onClick={goHome}>
                  <div className="lp-logo-mark"><Zap size={17} color="#fff" /></div>
                  <span className="lp-logo-text" style={{ color: "#fff" }}>Mestr<span style={{ color: LOGO_ACCENT }}>oo</span></span>
                </div>
                <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, maxWidth: 260, fontWeight: 400 }}>A plataforma que liga clientes a prestadores de serviços de confiança.</p>
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
                <a href="#contacto">Fale connosco</a>
                <a href="/termos">Termos de uso</a>
                <a href="/privacidade">Privacidade</a>
              </div>
            </div>
            <div className="lp-footer-bottom">
              <p>© 2026 Mestroo. Todos os direitos reservados.</p>
              <p style={{ fontSize: "12.5px", color: "#64748b" }}>De momento disponível em Luanda, com expansão progressiva para outras cidades.</p>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}