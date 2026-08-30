"use client";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Shield, Zap, MapPin, Star, MessageCircle, Search,
  Navigation, KeyRound, LifeBuoy, FileText,
} from "lucide-react";
import { TOKENS } from "@/lib/design-tokens";

const INK = TOKENS.color.ink;
const MUTED = TOKENS.color.muted;
const LINE = TOKENS.color.line;
const BRAND = TOKENS.color.brand;

// Mesmo conteúdo que estava em (dashboard)/home/page.tsx — só mudou de
// sítio. Nenhum texto foi reescrito ou cortado.
const STEPS = [
  { Icon: Search,        title: "Pesquisa",                    desc: "Encontra prestadores verificados por categoria, nome ou localização no mapa." },
  { Icon: FileText,      title: "Serviço personalizado",       desc: "Descreves o serviço em detalhe, defines o orçamento e envias o pedido a um prestador específico." },
  { Icon: Zap,           title: "Serviço rápido",               desc: "Escolhes categoria e morada vários prestadores da área enviam propostas de preço." },
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

export default function ComoFuncionaPage() {
  const router = useRouter();

  return (
    <>
      <style>{`
        .cf-wrap{display:flex;min-height:100vh;background:#FFFFFF}
        .cf-main{flex:1;display:flex;flex-direction:column;min-width:0;overflow-x:hidden}
        .cf-inner{padding:32px;display:flex;flex-direction:column;gap:48px;max-width:900px}
        .cf-back{display:inline-flex;align-items:center;gap:6px;font-size:14px;font-weight:600;color:${INK};background:#fff;border:1px solid ${LINE};cursor:pointer;font-family:inherit;padding:10px 16px;border-radius:10px;margin-top:8px}
        .cf-title{font-size:26px;font-weight:700;color:${INK};letter-spacing:-0.02em;margin-top:16px}
        .cf-sub{font-size:14.5px;color:${MUTED};margin-top:6px}

        .cf-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
        .cf-step-card{background:#FFFFFF;border:1px solid ${LINE};border-radius:16px;padding:22px 20px}
        .cf-step-badge{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:#F4F4F2;color:${MUTED};font-size:11px;font-weight:700;margin-bottom:16px}
        .cf-step-ico{width:40px;height:40px;border-radius:11px;background:${TOKENS.color.brandSoft};display:flex;align-items:center;justify-content:center;margin-bottom:14px}
        .cf-step-card h3{font-size:14.5px;font-weight:600;color:${INK};margin-bottom:7px}
        .cf-step-card p{font-size:12.5px;color:${MUTED};line-height:1.6}

        .cf-feats{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
        .cf-feat-card{background:#FFFFFF;border:1px solid ${LINE};border-radius:14px;padding:18px}
        .cf-feat-ico{width:34px;height:34px;border-radius:10px;background:#F4F4F2;display:flex;align-items:center;justify-content:center;margin-bottom:12px}
        .cf-feat-card h3{font-size:13px;font-weight:600;color:${INK};margin-bottom:5px}
        .cf-feat-card p{font-size:11.5px;color:${MUTED};line-height:1.55}

        .cf-sec-title{font-size:18px;font-weight:700;color:${INK};margin-bottom:20px}

        @media(max-width:1024px){}
        @media(max-width:768px){
          .cf-inner{padding:72px 16px 32px;gap:36px}
          .cf-steps{grid-template-columns:1fr}
          .cf-feats{grid-template-columns:1fr}
        }
      `}</style>

      <div className="cf-wrap">
        <div className="cf-main">
          <main className="cf-inner">
            <div>
              <button className="cf-back" onClick={() => router.back()}>
                <ArrowLeft size={15} /> Voltar
              </button>
              <h1 className="cf-title">Como funciona a Mestroo</h1>
              <p className="cf-sub">Do pedido à conclusão, passo a passo e o que garante a tua segurança em cada etapa.</p>
            </div>

            <section>
              <p className="cf-sec-title">Passo a passo</p>
              <div className="cf-steps">
                {STEPS.map((s, i) => {
                  const Icon = s.Icon;
                  return (
                    <div className="cf-step-card" key={s.title}>
                      <div className="cf-step-badge">{String(i + 1).padStart(2, "0")}</div>
                      <div className="cf-step-ico">
                        <Icon size={20} color={BRAND} />
                      </div>
                      <h3>{s.title}</h3>
                      <p>{s.desc}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <p className="cf-sec-title">Porquê a Mestroo?</p>
              <div className="cf-feats">
                {FEATS.map((f, i) => {
                  const Icon = f.Icon;
                  return (
                    <div key={i} className="cf-feat-card">
                      <div className="cf-feat-ico">
                        <Icon size={17} color={MUTED} />
                      </div>
                      <h3>{f.title}</h3>
                      <p>{f.desc}</p>
                    </div>
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