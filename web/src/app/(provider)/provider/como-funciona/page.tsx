"use client";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Shield, Zap, Users, TrendingUp, CheckCircle,
  Handshake, KeyRound, ImagePlus, MapPin, Wallet,
} from "lucide-react";
import { TOKENS } from "@/lib/design-tokens";

const INK = TOKENS.color.ink;
const MUTED = TOKENS.color.muted;
const LINE = TOKENS.color.line;
const AMBER = TOKENS.color.provider;
const AMBER_SOFT = TOKENS.color.providerSoft;
const GREEN = TOKENS.color.brand;
const GREEN_SOFT = TOKENS.color.brandSoft;

// Mesmo conteúdo que estava em provider-home/page.tsx — só mudou de
// sítio. Nenhum texto foi reescrito ou cortado.
const STEPS = [
  { Icon: CheckCircle, title: "Completa o KYC",              desc: "Verifica a tua identidade para activar o perfil e receber pedidos.", tone: "amber" },
  { Icon: ImagePlus,   title: "Cria o teu portfólio",         desc: "Adiciona fotos e descrição dos serviços que ofereces.",               tone: "neutral" },
  { Icon: Zap,         title: "Recebe o primeiro pedido",     desc: "Quando o perfil estiver activo, os clientes vão encontrar-te.",        tone: "neutral" },
  { Icon: MapPin,      title: "Activa a tua localização",     desc: "Liga a partilha de localização no teu painel para apareceres no mapa e receberes pedidos perto de ti.", tone: "neutral" },
  { Icon: Handshake,   title: "Aceita e negoceia",            desc: "Analisa o pedido, propõe um preço se quiseres, e aceita para começar.", tone: "neutral" },
  { Icon: KeyRound,    title: "Valida o PIN no local",        desc: "O cliente dá-te um código quando chegares introduz para iniciares o serviço com segurança.", tone: "neutral" },
  { Icon: Wallet,      title: "Recebe o pagamento protegido", desc: "O valor fica reservado desde o início; depois de confirmado, a comissão é descontada automaticamente e transferido para ti.", tone: "green" },
  { Icon: TrendingUp,  title: "Constrói a tua reputação",     desc: "Cada serviço concluído soma avaliações e aumenta a tua visibilidade nas pesquisas.", tone: "neutral" },
];

const FEATS = [
  { Icon: Wallet,     title: "Wallet integrada",   desc: "Recebe pagamentos directamente na tua wallet. Levanta quando quiseres." },
  { Icon: Shield,     title: "Pagamento garantido", desc: "O escrow protege-te o valor é retido até confirmares a conclusão." },
  { Icon: Users,      title: "Gestão de equipa",    desc: "Tens uma empresa? Adiciona funcionários e distribui os serviços." },
  { Icon: TrendingUp, title: "Sistema de ranking",  desc: "Quanto mais serviços via app, maior a tua visibilidade e ranking." },
];

function toneColor(tone: string) {
  if (tone === "amber") return { fg: AMBER, bg: AMBER_SOFT };
  if (tone === "green") return { fg: GREEN, bg: GREEN_SOFT };
  return { fg: MUTED, bg: "#F1F5F9" };
}

export default function ProviderComoFuncionaPage() {
  const router = useRouter();

  return (
    <>
      <style>{`
        .pcf-inner{padding:32px;display:flex;flex-direction:column;gap:48px;max-width:900px}
        .pcf-back{display:flex;align-items:center;gap:6px;font-size:13px;color:${MUTED};background:none;border:none;cursor:pointer;font-family:inherit;padding:0}
        .pcf-title{font-size:26px;font-weight:700;color:${INK};letter-spacing:-0.02em;margin-top:16px}
        .pcf-sub{font-size:14.5px;color:${MUTED};margin-top:6px}

        .pcf-sec-title{font-size:18px;font-weight:700;color:${INK};margin-bottom:4px}
        .pcf-sec-sub{font-size:13px;color:${MUTED};margin-bottom:24px}

        .pcf-timeline{position:relative}
        .pcf-step{
          position:relative;display:flex;gap:16px;padding-bottom:24px;
        }
        .pcf-step:last-child{padding-bottom:0}
        .pcf-step-num-col{
          display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:38px;
        }
        .pcf-step-num{
          width:38px;height:38px;border-radius:12px;
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
          font-size:14px;font-weight:700;
        }
        .pcf-step-line{
          width:2px;flex:1;margin-top:6px;background:${LINE};border-radius:1px;
        }
        .pcf-step-body{
          flex:1;min-width:0;background:#FFFFFF;border:1px solid ${LINE};
          border-radius:14px;padding:14px 16px;
        }
        .pcf-step-body h3{font-size:14px;font-weight:700;color:${INK};margin-bottom:4px;display:flex;align-items:center;gap:8px}
        .pcf-step-body p{font-size:13px;color:${MUTED};line-height:1.55}

        .pcf-feats{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
        .pcf-feat-card{background:#FFFFFF;border:1px solid ${LINE};border-radius:14px;padding:18px}
        .pcf-feat-ico{width:34px;height:34px;border-radius:10px;background:#F1F5F9;display:flex;align-items:center;justify-content:center;margin-bottom:12px}
        .pcf-feat-card h3{font-size:13px;font-weight:600;color:${INK};margin-bottom:5px}
        .pcf-feat-card p{font-size:11.5px;color:${MUTED};line-height:1.55}

        @media(max-width:768px){
          .pcf-inner{padding:16px;gap:36px}
          .pcf-feats{grid-template-columns:1fr}
        }
      `}</style>

      <main className="pcf-inner">
        <div>
          <button className="pcf-back" onClick={() => router.back()}>
            <ArrowLeft size={15} /> Voltar
          </button>
          <h1 className="pcf-title">Como funciona para prestadores</h1>
          <p className="pcf-sub">Do primeiro pedido ao pagamento, o percurso completo na Mestroo.</p>
        </div>

        <section>
          <p className="pcf-sec-title">Passo a passo</p>
          <p className="pcf-sec-sub">O caminho completo, da verificação ao pagamento</p>
          <div className="pcf-timeline">
            {STEPS.map((s, i) => {
              const Icon = s.Icon;
              const c = toneColor(s.tone);
              const isLast = i === STEPS.length - 1;
              return (
                <div className="pcf-step" key={s.title}>
                  <div className="pcf-step-num-col">
                    <div className="pcf-step-num" style={{ background: c.bg, color: c.fg }}>
                      {i + 1}
                    </div>
                    {!isLast && <div className="pcf-step-line" />}
                  </div>
                  <div className="pcf-step-body">
                    <h3><Icon size={15} style={{ color: c.fg, flexShrink: 0 }} /> {s.title}</h3>
                    <p>{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <p className="pcf-sec-title">Vantagens da plataforma</p>
          <p className="pcf-sec-sub">Tudo o que precisas para gerir o teu negócio</p>
          <div className="pcf-feats">
            {FEATS.map((f, i) => {
              const Icon = f.Icon;
              return (
                <div key={i} className="pcf-feat-card">
                  <div className="pcf-feat-ico">
                    <Icon size={17} style={{ color: MUTED }} />
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}