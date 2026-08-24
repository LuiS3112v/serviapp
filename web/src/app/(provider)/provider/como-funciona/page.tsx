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
        .pcf-sec-sub{font-size:13px;color:${MUTED};margin-bottom:20px}

        .pcf-step{display:flex;gap:14px;padding:16px 0;border-bottom:1px solid ${LINE}}
        .pcf-step:last-child{border-bottom:none}
        .pcf-step-ico{width:38px;height:38px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0}

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
          <p className="pcf-sub">Do primeiro pedido ao pagamento — o percurso completo na Mestroo.</p>
        </div>

        <section>
          <p className="pcf-sec-title">Passo a passo</p>
          <p className="pcf-sec-sub">O caminho completo, da verificação ao pagamento</p>
          {STEPS.map((s) => {
            const Icon = s.Icon;
            const c = toneColor(s.tone);
            return (
              <div className="pcf-step" key={s.title}>
                <div className="pcf-step-ico" style={{ background: c.bg }}>
                  <Icon size={18} style={{ color: c.fg }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 3 }}>{s.title}</p>
                  <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </div>
            );
          })}
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