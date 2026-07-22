"use client";
import { useRouter } from "next/navigation";
import {
  Zap, Shield, ArrowLeft, ArrowRight, CheckCircle2, Info, UserCircle,
  Wallet, Percent, ShieldCheck, AlertTriangle, XCircle,
} from "lucide-react";

const ACCENTS = ["#2563eb", "#1D9E75", "#EF9F27"];

const sections = [
  { icon: CheckCircle2, title: "1. Aceitação dos Termos", text: "Ao aceder e utilizar a plataforma Serviapp, concordas com estes Termos de Serviço. Se não concordares, não deves utilizar a plataforma." },
  { icon: Info, title: "2. Descrição do Serviço", text: "A Serviapp é uma plataforma digital que facilita a ligação entre clientes e prestadores de serviços em Angola. Não somos prestadores de serviços — somos um intermediário digital." },
  { icon: UserCircle, title: "3. Registo e Conta", text: "Para utilizar a plataforma deves criar uma conta com informações verdadeiras. És responsável pela confidencialidade da tua senha e por todas as actividades realizadas na tua conta." },
  { icon: Wallet, title: "4. Pagamentos e Escrow", text: "Todos os pagamentos digitais são processados através do nosso sistema de escrow. O valor fica retido até ambas as partes confirmarem a conclusão do serviço." },
  { icon: Percent, title: "5. Comissões", text: "A Serviapp cobra uma comissão sobre cada transacção processada pela plataforma. A percentagem varia entre 10% e 20% consoante a categoria e região." },
  { icon: ShieldCheck, title: "6. Verificação de Identidade", text: "Os prestadores de serviços são obrigados a completar o processo de verificação de identidade (KYC) antes de poderem oferecer os seus serviços na plataforma." },
  { icon: AlertTriangle, title: "7. Responsabilidades", text: "A Serviapp não se responsabiliza pela qualidade dos serviços prestados. Encorajamos os utilizadores a avaliar os prestadores após cada serviço." },
  { icon: XCircle, title: "8. Rescisão", text: "Reservamo-nos o direito de suspender ou terminar contas que violem estes termos, a nosso critério e sem aviso prévio." },
];

export default function TermosPage() {
  const router = useRouter();
  return (
    <>
      <style>{`
        .legal-page{min-height:100vh;background:#fff;display:flex;flex-direction:column}

        .legal-topbar{position:sticky;top:0;z-index:50;background:rgba(255,255,255,0.88);backdrop-filter:blur(10px);border-bottom:1px solid #eef1f5}
        .legal-topbar-inner{max-width:1180px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;justify-content:space-between}
        .legal-logo{display:flex;align-items:center;gap:10px;cursor:pointer}
        .legal-logo-mark{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#2563eb,#3b82f6);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .legal-logo-text{font-size:18px;font-weight:800;color:#0f172a;letter-spacing:-0.02em}
        .legal-topbar-back{display:inline-flex;align-items:center;gap:7px;padding:9px 16px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;color:#334155;font-size:13.5px;font-weight:700;cursor:pointer;transition:all .15s;font-family:inherit}
        .legal-topbar-back:hover{border-color:#2563eb;color:#2563eb}

        .legal-body{flex:1;padding:44px 24px 64px}
        .legal-inner{max-width:920px;margin:0 auto;display:flex;flex-direction:column;gap:24px}

        .legal-hero{display:flex;align-items:center;gap:16px;padding:22px 26px;border-radius:20px;color:#fff;box-shadow:0 14px 30px rgba(29,158,117,0.22)}
        .legal-hero-icon{width:46px;height:46px;border-radius:14px;background:rgba(255,255,255,0.18);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .legal-hero-title{font-size:18px;font-weight:800;letter-spacing:-0.01em}
        .legal-hero-sub{font-size:12.5px;opacity:.85;margin-top:3px}

        .legal-layout{display:grid;grid-template-columns:200px 1fr;gap:28px;align-items:start}
        .legal-toc{position:sticky;top:88px;display:flex;flex-direction:column;gap:2px;padding:18px 4px;border-right:1px solid #eef1f5}
        .legal-toc-label{font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;padding-left:12px}
        .legal-toc-link{font-size:12.5px;color:#64748b;text-decoration:none;padding:8px 12px;border-radius:9px;transition:all .15s;line-height:1.4}
        .legal-toc-link:hover{background:#eff6ff;color:#2563eb}

        .legal-content{display:flex;flex-direction:column;gap:16px;min-width:0}
        .legal-card{background:#fff;border:1px solid #eef1f5;border-radius:18px;padding:22px 24px;box-shadow:0 4px 14px rgba(15,23,42,0.04);scroll-margin-top:96px;animation:legalFadeUp .5s ease both;transition:box-shadow .2s,transform .2s}
        .legal-card:hover{box-shadow:0 10px 24px rgba(15,23,42,0.07);transform:translateY(-2px)}
        .legal-card-head{display:flex;align-items:center;gap:12px;margin-bottom:10px}
        .legal-card-icon{width:36px;height:36px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .legal-card h2{font-size:15px;font-weight:700;color:#0f172a}
        .legal-card p{font-size:13.5px;color:#64748b;line-height:1.75}

        .legal-cta{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;background:#f8fafc;border:1px solid #eef1f5;border-radius:20px;padding:24px 28px}
        .legal-cta-title{font-size:15px;font-weight:700;color:#0f172a;margin-bottom:4px}
        .legal-cta-sub{font-size:13px;color:#64748b;max-width:420px;line-height:1.55}
        .legal-cta-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 20px;border-radius:11px;border:none;background:linear-gradient(135deg,#2563eb,#3b82f6);color:#fff;font-size:13.5px;font-weight:700;cursor:pointer;text-decoration:none;white-space:nowrap;transition:transform .15s;font-family:inherit}
        .legal-cta-btn:hover{transform:translateY(-2px)}

        @keyframes legalFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

        .legal-footer{background:#0f172a;padding:22px 24px}
        .legal-footer-inner{max-width:1180px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
        .legal-footer-inner p{font-size:12.5px;color:#64748b}
        .legal-footer-links{display:flex;gap:20px}
        .legal-footer-links a{font-size:12.5px;color:#94a3b8;text-decoration:none;transition:color .15s}
        .legal-footer-links a:hover{color:#fff}

        @media(max-width:900px){
          .legal-layout{grid-template-columns:1fr}
          .legal-toc{position:static;flex-direction:row;flex-wrap:wrap;border-right:none;border-bottom:1px solid #eef1f5;padding:0 0 14px}
          .legal-toc-label{display:none}
          .legal-toc-link{background:#f1f5f9;padding:7px 12px}
        }
        @media(max-width:640px){
          .legal-body{padding:32px 16px 48px}
          .legal-hero{padding:18px 20px;border-radius:16px}
          .legal-cta{flex-direction:column;align-items:flex-start}
          .legal-footer-inner{flex-direction:column;align-items:flex-start}
        }
      `}</style>

      <div className="legal-page">
        <header className="legal-topbar">
          <div className="legal-topbar-inner">
            <div className="legal-logo" onClick={() => router.push("/")}>
              <div className="legal-logo-mark"><Zap size={17} color="#fff"/></div>
              <span className="legal-logo-text">Servi<span style={{ color: "#2563eb" }}>app</span></span>
            </div>
            <button className="legal-topbar-back" onClick={() => router.push("/")}>
              <ArrowLeft size={15}/> Voltar ao início
            </button>
          </div>
        </header>

        <main className="legal-body">
          <div className="legal-inner">
            <div className="legal-hero" style={{ background: "linear-gradient(120deg,#1D9E75,#2563eb)" }}>
              <div className="legal-hero-icon"><Shield size={22} color="#fff"/></div>
              <div>
                <p className="legal-hero-title">Termos de Serviço</p>
                <p className="legal-hero-sub">Última actualização: 2026 · Serviapp Angola · 8 secções</p>
              </div>
            </div>

            <div className="legal-layout">
              <nav className="legal-toc">
                <p className="legal-toc-label">Índice</p>
                {sections.map((s, i) => (
                  <a key={i} href={`#t-sec-${i}`} className="legal-toc-link">{s.title}</a>
                ))}
              </nav>

              <div className="legal-content">
                {sections.map((s, i) => {
                  const c = ACCENTS[i % 3];
                  return (
                    <section id={`t-sec-${i}`} className="legal-card" key={i} style={{ animationDelay: `${i * 40}ms` }}>
                      <div className="legal-card-head">
                        <div className="legal-card-icon" style={{ background: `${c}18` }}><s.icon size={18} color={c}/></div>
                        <h2>{s.title}</h2>
                      </div>
                      <p>{s.text}</p>
                    </section>
                  );
                })}
              </div>
            </div>

            <div className="legal-cta">
              <div>
                <p className="legal-cta-title">Ainda tens dúvidas?</p>
                <p className="legal-cta-sub">A nossa equipa de suporte está disponível para esclarecer qualquer questão sobre estes termos.</p>
              </div>
              <a className="legal-cta-btn" href="mailto:suporte@serviapp.ao">Falar com o suporte <ArrowRight size={15}/></a>
            </div>
          </div>
        </main>

        <footer className="legal-footer">
          <div className="legal-footer-inner">
            <p>© 2026 Serviapp. Todos os direitos reservados.</p>
            <div className="legal-footer-links">
              <a href="/">Início</a>
              <a href="/termos">Termos de uso</a>
              <a href="/privacidade">Privacidade</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}