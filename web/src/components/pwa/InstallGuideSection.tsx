"use client";

import { useCallback, useState } from "react";
import {
  Download,
  Share,
  SquarePlus,
  CheckCircle2,
  Wifi,
  Battery,
  Signal,
  ChevronLeft,
  ChevronRight,
  Menu as MenuIcon,
  MoreVertical,
  Compass,
} from "lucide-react";
import { usePwaInstall } from "@/hooks/use-pwa-install";

/* Mesma paleta usada em page.tsx — nada de cor nova */
const CONFIRM = "#1D9E75";
const INK = "#0f172a";

interface Step {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  title: string;
  text: string;
}

const BROWSER_LABEL: Record<string, string> = {
  chrome: "Chrome",
  safari: "Safari",
  firefox: "Firefox",
  edge: "Edge",
  samsung: "Samsung Internet",
  unknown: "o seu navegador",
};

/* ---------- Conjuntos de passos por plataforma + browser ---------- */

const IOS_SAFARI_STEPS: Step[] = [
  {
    icon: Share,
    label: "Passo 1",
    title: "Toque em Partilhar",
    text: "Na barra do Safari, toque no ícone de partilha.",
  },
  {
    icon: SquarePlus,
    label: "Passo 2",
    title: "Adicionar ao Ecrã Principal",
    text: "Percorra as opções e escolha esta opção na lista.",
  },
  {
    icon: CheckCircle2,
    label: "Pronto",
    title: "A app está instalada",
    text: "Abra a Serviapp a partir do ícone no seu ecrã inicial, como uma aplicação normal.",
  },
];

/** iOS fora do Safari (Chrome, Firefox, Edge no iPhone): a Apple não
 * permite instalar PWAs a partir de nenhum outro navegador, porque
 * todos correm sobre o motor WebKit do sistema sem essa opção exposta.
 * A única forma é abrir o link no Safari. */
function iosOtherBrowserSteps(browserLabel: string): Step[] {
  return [
    {
      icon: Compass,
      label: "Passo 1",
      title: `Abra este link no Safari`,
      text: `No iPhone, o ${browserLabel} não permite instalar aplicações. Copie o link e abra-o no Safari.`,
    },
    {
      icon: Share,
      label: "Passo 2",
      title: "Toque em Partilhar",
      text: "Já no Safari, toque no ícone de partilha na barra do navegador.",
    },
    {
      icon: SquarePlus,
      label: "Passo 3",
      title: "Adicionar ao Ecrã Principal",
      text: "Percorra as opções e escolha esta opção na lista.",
    },
  ];
}

const ANDROID_CHROMIUM_STEPS: Step[] = [
  {
    icon: MenuIcon,
    label: "Passo 1",
    title: "Abra o menu do navegador",
    text: "Toque nos três pontos no canto superior.",
  },
  {
    icon: SquarePlus,
    label: "Passo 2",
    title: "Instalar aplicação",
    text: "Escolha \"Instalar aplicação\" ou \"Adicionar ao ecrã inicial\".",
  },
  {
    icon: CheckCircle2,
    label: "Pronto",
    title: "A app está instalada",
    text: "Abra a Serviapp a partir do ícone no seu ecrã inicial, como uma aplicação normal.",
  },
];

/** Firefox no Android não tem instalação nativa de PWA — cria um
 * atalho ao ecrã inicial, sem o comportamento de app completa. */
const ANDROID_FIREFOX_STEPS: Step[] = [
  {
    icon: MenuIcon,
    label: "Passo 1",
    title: "Abra o menu do navegador",
    text: "Toque nos três pontos no canto superior do Firefox.",
  },
  {
    icon: SquarePlus,
    label: "Passo 2",
    title: "Adicionar ao ecrã inicial",
    text: "Escolha esta opção no menu para criar um atalho.",
  },
  {
    icon: CheckCircle2,
    label: "Pronto",
    title: "Atalho criado",
    text: "Abra a Serviapp a partir do ícone no seu ecrã inicial.",
  },
];

const DESKTOP_CHROMIUM_STEPS: Step[] = [
  {
    icon: MoreVertical,
    label: "Passo 1",
    title: "Abra o menu do navegador",
    text: "Clique nos três pontos no canto superior direito, ou no ícone de instalação na barra de endereço.",
  },
  {
    icon: SquarePlus,
    label: "Passo 2",
    title: "Instalar Serviapp",
    text: "Escolha \"Instalar Serviapp...\" no menu.",
  },
  {
    icon: CheckCircle2,
    label: "Pronto",
    title: "A app está instalada",
    text: "A Serviapp abre agora na sua própria janela, com atalho no ambiente de trabalho.",
  },
];

/** Safari e Firefox no computador não suportam instalação de PWA. */
function desktopOtherBrowserSteps(browserLabel: string): Step[] {
  return [
    {
      icon: Compass,
      label: "Sem instalação",
      title: `O ${browserLabel} não instala aplicações`,
      text: "No computador, apenas o Chrome e o Edge permitem instalar a Serviapp como aplicação.",
    },
    {
      icon: SquarePlus,
      label: "Alternativa",
      title: "Crie um marcador",
      text: "Pode guardar esta página nos marcadores para aceder rapidamente sempre que precisar.",
    },
    {
      icon: CheckCircle2,
      label: "Ou",
      title: "Use o Chrome ou o Edge",
      text: "Abra este endereço num desses navegadores para instalar a Serviapp como aplicação.",
    },
  ];
}

function getSteps(platform: string, browser: string): Step[] {
  const label = BROWSER_LABEL[browser] ?? BROWSER_LABEL.unknown;

  if (platform === "ios") {
    return browser === "safari" ? IOS_SAFARI_STEPS : iosOtherBrowserSteps(label);
  }
  if (platform === "desktop") {
    return browser === "chrome" || browser === "edge"
      ? DESKTOP_CHROMIUM_STEPS
      : desktopOtherBrowserSteps(label);
  }
  // android
  if (browser === "firefox") return ANDROID_FIREFOX_STEPS;
  return ANDROID_CHROMIUM_STEPS;
}

function getEyebrow(platform: string, browser: string): string {
  const label = BROWSER_LABEL[browser] ?? BROWSER_LABEL.unknown;
  const device =
    platform === "ios" ? "iPhone" : platform === "desktop" ? "Computador" : "Telemóvel";
  return `${device} · ${label}`;
}

/**
 * Secção de instalação da Home. Segue rigorosamente o design system
 * existente: mesmo padrão .lp-tool-row (copy + visual lado a lado)
 * e o mesmo mockup de iPhone (.lp-phone) já usado na secção de Chat
 * em page.tsx. Nenhuma cor, radius ou sombra nova é introduzida.
 *
 * Adapta-se tanto ao tipo de dispositivo (telemóvel/computador) como
 * ao navegador real detetado (Chrome, Safari, Firefox, Edge, Samsung
 * Internet), porque o caminho de instalação difere entre eles — nem
 * todos os navegadores suportam instalar a app da mesma forma.
 *
 * Renderiza apenas quando faz sentido (shouldShowInstallUI do hook):
 * nunca aparece a quem já tem o PWA instalado.
 */
export function InstallGuideSection() {
  const { platform, browser, shouldShowInstallUI, canPromptInstall, promptInstall } =
    usePwaInstall();
  const [index, setIndex] = useState(0);

  const isIOS = platform === "ios";
  const isDesktop = platform === "desktop";
  const steps = getSteps(platform, browser);

  const next = useCallback(
    () => setIndex((i) => Math.min(i + 1, steps.length - 1)),
    [steps.length],
  );
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);
  const goTo = useCallback((i: number) => setIndex(i), []);

  if (!shouldShowInstallUI) return null;

  const isLastStep = index === steps.length - 1;
  // O prompt nativo só existe em Chromium (Chrome/Edge/Samsung) em Android/desktop.
  const showNativeButton = !isIOS && canPromptInstall;

  return (
    <section className="lp-section lp-section-alt" id="instalar" aria-label="Como instalar a aplicação">
      <div className="lp-container">
        <div className="lp-section-head">
          <span className="lp-tag">Aplicação</span>
          <h2 className="lp-h2">Leve a Serviapp consigo</h2>
          <p className="lp-section-sub">
            Instale a aplicação e tenha acesso mais rápido a pedidos, chat e
            notificações, sem precisar de abrir o navegador todas as vezes.
          </p>
        </div>

        <div className="lp-install-row">
          <div className="lp-install-copy">
            <p className="lp-tool-eyebrow">{getEyebrow(platform, browser)}</p>

            <div className="lp-install-steps" aria-live="polite">
              {steps.map((s, i) => {
                const isActive = i === index;
                return (
                  <button
                    key={s.title}
                    type="button"
                    onClick={() => goTo(i)}
                    className={`lp-install-step-item${isActive ? " active" : ""}`}
                    aria-current={isActive ? "step" : undefined}
                  >
                    <span className="lp-install-step-icon">
                      <s.icon size={17} color={isActive ? "#fff" : "#334155"} />
                    </span>
                    <span className="lp-install-step-copy">
                      <span className="lp-install-step-label">{s.label}</span>
                      <span className="lp-install-step-title">{s.title}</span>
                      {isActive && <span className="lp-install-step-text">{s.text}</span>}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="lp-install-actions">
              <div className="lp-install-nav" role="group" aria-label="Navegar passos">
                <button
                  type="button"
                  onClick={prev}
                  disabled={index === 0}
                  aria-label="Passo anterior"
                  className="lp-install-nav-btn"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={next}
                  disabled={isLastStep}
                  aria-label="Passo seguinte"
                  className="lp-install-nav-btn"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {showNativeButton && (
                <button type="button" className="lp-btn-primary" onClick={promptInstall}>
                  <Download size={16} />
                  Instalar agora
                </button>
              )}
            </div>
          </div>

          {/* Mockup — telefone (iOS/Android) ou janela de browser (desktop) */}
          <div className="lp-install-visual">
            {isDesktop ? (
              <DesktopMock step={index} browser={browser} />
            ) : (
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
                  <div className="lp-install-phone-body">
                    {isIOS ? (
                      <IOSMock step={index} browser={browser} />
                    ) : (
                      <AndroidMock step={index} browser={browser} />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .lp-install-row{
          display:grid;
          grid-template-columns:1fr 0.85fr;
          gap:48px;
          align-items:center;
          background:#fff;
          border:1px solid #eef1f5;
          border-radius:20px;
          padding:40px;
        }
        .lp-install-copy{ max-width:440px; }
        .lp-install-steps{
          display:flex;
          flex-direction:column;
          gap:6px;
          margin:18px 0 24px;
        }
        .lp-install-step-item{
          display:flex;
          align-items:flex-start;
          gap:12px;
          text-align:left;
          background:transparent;
          border:none;
          border-radius:12px;
          padding:10px 10px;
          cursor:pointer;
          font-family:inherit;
          transition:background .15s;
          width:100%;
        }
        .lp-install-step-item:hover{ background:#f8fafc; }
        .lp-install-step-item.active{ background:#f8fafc; }
        .lp-install-step-icon{
          width:32px;height:32px;border-radius:9px;
          background:#f1f5f9;
          display:flex;align-items:center;justify-content:center;
          flex-shrink:0;
          transition:background .15s;
        }
        .lp-install-step-item.active .lp-install-step-icon{ background:${CONFIRM}; }
        .lp-install-step-copy{ display:flex; flex-direction:column; padding-top:2px; }
        .lp-install-step-label{ font-size:11.5px; font-weight:700; color:#94a3b8; }
        .lp-install-step-title{ font-size:14.5px; font-weight:700; color:${INK}; margin-top:1px; }
        .lp-install-step-text{ font-size:12.5px; color:#64748b; line-height:1.5; margin-top:4px; max-width:340px; }

        .lp-install-actions{
          display:flex;
          align-items:center;
          gap:14px;
        }
        .lp-install-nav{ display:flex; gap:6px; }
        .lp-install-nav-btn{
          width:34px;height:34px;border-radius:10px;
          border:1px solid #e2e8f0;background:#fff;color:#334155;
          display:flex;align-items:center;justify-content:center;
          cursor:pointer;
        }
        .lp-install-nav-btn:disabled{ color:#cbd5e1; cursor:default; }

        .lp-install-visual{
          display:flex;
          justify-content:center;
        }
        .lp-install-phone-body{
          flex:1;
          display:flex;
          flex-direction:column;
        }

        /* --- Conteúdo mock dentro do ecrã do iPhone --- */
        .lp-install-mock-page{
          flex:1;
          display:flex;
          flex-direction:column;
          padding:10px;
        }
        .lp-install-mock-page.center{
          align-items:center;
          justify-content:center;
          text-align:center;
          gap:6px;
        }
        .lp-install-mock-browserbar{
          display:flex;
          align-items:center;
          gap:6px;
          background:#fff;
          border:1px solid #eef1f5;
          border-radius:8px;
          padding:7px 10px;
          font-size:10.5px;
          color:#64748b;
          font-weight:600;
        }
        .lp-install-mock-content{
          flex:1;
          margin-top:8px;
          background:#fff;
          border:1px solid #eef1f5;
          border-radius:8px;
        }
        .lp-install-mock-toolbar{
          display:flex;
          align-items:center;
          justify-content:space-around;
          margin-top:auto;
          padding-top:10px;
        }
        .lp-install-mock-toolbar-icon{
          width:26px;height:26px;border-radius:7px;
          background:#eef1f5;
        }
        .lp-install-mock-toolbar-icon.highlight{
          background:${CONFIRM};
          display:flex;align-items:center;justify-content:center;
        }
        .lp-install-mock-sheet{
          background:#fff;
          border:1px solid #eef1f5;
          border-radius:12px;
          padding:12px;
          margin-top:auto;
          margin-bottom:6px;
          display:flex;
          flex-direction:column;
          gap:6px;
        }
        .lp-install-mock-sheet-title{
          font-size:10.5px;
          font-weight:700;
          color:#94a3b8;
          margin:0 0 4px;
          text-align:center;
        }
        .lp-install-mock-sheet-row{
          display:flex;
          align-items:center;
          gap:8px;
          padding:7px 8px;
          border-radius:8px;
          font-size:11px;
          font-weight:600;
          color:#334155;
          background:#f8fafc;
        }
        .lp-install-mock-sheet-row.highlight{
          background:${CONFIRM};
          color:#fff;
        }
        .lp-install-mock-dot{
          width:16px;height:16px;border-radius:5px;
          background:#dbe3ee;
          flex-shrink:0;
        }
        .lp-install-mock-appicon{
          width:52px;height:52px;border-radius:14px;
          background:${CONFIRM};
          display:flex;align-items:center;justify-content:center;
          color:#fff;font-size:22px;font-weight:800;
          box-shadow:0 6px 16px rgba(15,23,42,0.14);
        }
        .lp-install-mock-applabel{
          font-size:11px;font-weight:700;color:${INK};margin:6px 0 0;
        }
        .lp-install-mock-donetext{
          font-size:10px;color:${CONFIRM};font-weight:600;margin:2px 0 0;
        }

        /* --- Mockup de janela de browser desktop --- */
        .lp-desktop-window{
          width:100%;
          max-width:380px;
          background:#fff;
          border:1px solid #eef1f5;
          border-radius:14px;
          overflow:hidden;
          box-shadow:0 18px 40px rgba(15,23,42,0.14);
        }
        .lp-desktop-titlebar{
          display:flex;
          align-items:center;
          gap:6px;
          padding:10px 12px;
          background:#f8fafc;
          border-bottom:1px solid #eef1f5;
        }
        .lp-desktop-dot{ width:9px;height:9px;border-radius:50%;background:#dbe3ee; }
        .lp-desktop-addressbar{
          flex:1;
          margin-left:8px;
          background:#fff;
          border:1px solid #eef1f5;
          border-radius:7px;
          padding:5px 10px;
          font-size:10.5px;
          color:#64748b;
          font-weight:600;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:8px;
        }
        .lp-desktop-menu-icon{
          width:22px;height:22px;border-radius:6px;
          display:flex;align-items:center;justify-content:center;
          flex-shrink:0;
        }
        .lp-desktop-menu-icon.highlight{ background:${CONFIRM}; color:#fff; }
        .lp-desktop-body{
          padding:16px;
          min-height:180px;
          display:flex;
          flex-direction:column;
        }
        .lp-desktop-menu-panel{
          margin-left:auto;
          width:200px;
          background:#fff;
          border:1px solid #eef1f5;
          border-radius:10px;
          box-shadow:0 10px 24px rgba(15,23,42,0.12);
          padding:8px;
          display:flex;
          flex-direction:column;
          gap:3px;
        }
        .lp-desktop-menu-row{
          padding:8px 9px;
          border-radius:7px;
          font-size:11px;
          font-weight:600;
          color:#334155;
          background:#f8fafc;
        }
        .lp-desktop-menu-row.highlight{
          background:${CONFIRM};
          color:#fff;
        }
        .lp-desktop-center{
          flex:1;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          text-align:center;
          gap:6px;
        }
        .lp-desktop-note{
          font-size:11px;
          color:#94a3b8;
          line-height:1.5;
          max-width:220px;
          margin:0;
        }

        @media(prefers-reduced-motion: reduce){
          .lp-install-step-item{ transition:none; }
        }

        @media(max-width:960px){
          .lp-install-row{ grid-template-columns:1fr; padding:28px 22px; gap:28px; }
          .lp-install-visual{ order:-1; }
          .lp-install-copy{ max-width:100%; }
        }
        @media(max-width:600px){
          .lp-install-row{ padding:22px 16px; }
        }
      `}</style>
    </section>
  );
}

/* ---------- Mockups de conteúdo por plataforma e passo ---------- */

function IOSMock({ step, browser }: { step: number; browser: string }) {
  const isSafari = browser === "safari";

  if (!isSafari) {
    // iOS fora do Safari: passo 0 mostra o aviso, passo 1/2 reutilizam
    // o fluxo do Safari (partilhar → adicionar ao ecrã principal).
    if (step === 0) {
      return (
        <div className="lp-install-mock-page center">
          <div className="lp-install-mock-appicon" style={{ background: "#94a3b8" }}>
            <Compass size={22} color="#fff" />
          </div>
          <p className="lp-install-mock-applabel">Abrir no Safari</p>
          <p className="lp-install-mock-donetext" style={{ color: "#64748b" }}>
            Este navegador não instala apps
          </p>
        </div>
      );
    }
    if (step === 1) {
      return (
        <div className="lp-install-mock-page">
          <div className="lp-install-mock-browserbar">
            <span>serviapp.ao</span>
          </div>
          <div className="lp-install-mock-content" />
          <div className="lp-install-mock-toolbar">
            <div className="lp-install-mock-toolbar-icon highlight">
              <Share size={16} color="#fff" />
            </div>
            <div className="lp-install-mock-toolbar-icon" />
            <div className="lp-install-mock-toolbar-icon" />
            <div className="lp-install-mock-toolbar-icon" />
          </div>
        </div>
      );
    }
    return (
      <div className="lp-install-mock-page">
        <div className="lp-install-mock-sheet">
          <p className="lp-install-mock-sheet-title">Partilhar</p>
          <div className="lp-install-mock-sheet-row highlight">
            <SquarePlus size={16} color="#fff" />
            <span>Adicionar ao Ecrã Principal</span>
          </div>
          <div className="lp-install-mock-sheet-row">
            <div className="lp-install-mock-dot" />
            <span>Copiar</span>
          </div>
        </div>
      </div>
    );
  }

  if (step === 0) {
    return (
      <div className="lp-install-mock-page">
        <div className="lp-install-mock-browserbar">
          <span>serviapp.ao</span>
        </div>
        <div className="lp-install-mock-content" />
        <div className="lp-install-mock-toolbar">
          <div className="lp-install-mock-toolbar-icon highlight">
            <Share size={16} color="#fff" />
          </div>
          <div className="lp-install-mock-toolbar-icon" />
          <div className="lp-install-mock-toolbar-icon" />
          <div className="lp-install-mock-toolbar-icon" />
        </div>
      </div>
    );
  }
  if (step === 1) {
    return (
      <div className="lp-install-mock-page">
        <div className="lp-install-mock-sheet">
          <p className="lp-install-mock-sheet-title">Partilhar</p>
          <div className="lp-install-mock-sheet-row highlight">
            <SquarePlus size={16} color="#fff" />
            <span>Adicionar ao Ecrã Principal</span>
          </div>
          <div className="lp-install-mock-sheet-row">
            <div className="lp-install-mock-dot" />
            <span>Copiar</span>
          </div>
          <div className="lp-install-mock-sheet-row">
            <div className="lp-install-mock-dot" />
            <span>Marcadores</span>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="lp-install-mock-page center">
      <div className="lp-install-mock-appicon">S</div>
      <p className="lp-install-mock-applabel">Serviapp</p>
      <p className="lp-install-mock-donetext">Adicionado ao ecrã principal</p>
    </div>
  );
}

function AndroidMock({ step, browser }: { step: number; browser: string }) {
  const menuLabel = browser === "firefox" ? "Adicionar ao ecrã inicial" : "Instalar aplicação";

  if (step === 0) {
    return (
      <div className="lp-install-mock-page">
        <div className="lp-install-mock-browserbar">
          <span>serviapp.ao</span>
          <div className="lp-install-mock-toolbar-icon highlight" style={{ marginLeft: "auto" }}>
            <MenuIcon size={14} color="#fff" />
          </div>
        </div>
        <div className="lp-install-mock-content" />
      </div>
    );
  }
  if (step === 1) {
    return (
      <div className="lp-install-mock-page">
        <div className="lp-install-mock-sheet" style={{ marginTop: 40 }}>
          <div className="lp-install-mock-sheet-row">
            <div className="lp-install-mock-dot" />
            <span>Nova aba</span>
          </div>
          <div className="lp-install-mock-sheet-row">
            <div className="lp-install-mock-dot" />
            <span>Favoritos</span>
          </div>
          <div className="lp-install-mock-sheet-row highlight">
            <SquarePlus size={16} color="#fff" />
            <span>{menuLabel}</span>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="lp-install-mock-page center">
      <div className="lp-install-mock-appicon">S</div>
      <p className="lp-install-mock-applabel">Serviapp</p>
      <p className="lp-install-mock-donetext">
        {browser === "firefox" ? "Atalho criado" : "Aplicação instalada"}
      </p>
    </div>
  );
}

function DesktopMock({ step, browser }: { step: number; browser: string }) {
  const canInstall = browser === "chrome" || browser === "edge";

  if (!canInstall) {
    const label = BROWSER_LABEL[browser] ?? BROWSER_LABEL.unknown;
    return (
      <div className="lp-desktop-window">
        <div className="lp-desktop-titlebar">
          <span className="lp-desktop-dot" />
          <span className="lp-desktop-dot" />
          <span className="lp-desktop-dot" />
          <div className="lp-desktop-addressbar">
            <span>serviapp.ao</span>
          </div>
        </div>
        <div className="lp-desktop-body">
          <div className="lp-desktop-center">
            <div className="lp-install-mock-appicon" style={{ background: "#94a3b8" }}>
              <Compass size={22} color="#fff" />
            </div>
            <p className="lp-install-mock-applabel">{label}</p>
            <p className="lp-desktop-note">
              {step < 2
                ? "Este navegador não suporta instalar aplicações"
                : "Use o Chrome ou o Edge para instalar"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 0) {
    return (
      <div className="lp-desktop-window">
        <div className="lp-desktop-titlebar">
          <span className="lp-desktop-dot" />
          <span className="lp-desktop-dot" />
          <span className="lp-desktop-dot" />
          <div className="lp-desktop-addressbar">
            <span>serviapp.ao</span>
            <div className="lp-desktop-menu-icon highlight">
              <MoreVertical size={13} />
            </div>
          </div>
        </div>
        <div className="lp-desktop-body" />
      </div>
    );
  }
  if (step === 1) {
    return (
      <div className="lp-desktop-window">
        <div className="lp-desktop-titlebar">
          <span className="lp-desktop-dot" />
          <span className="lp-desktop-dot" />
          <span className="lp-desktop-dot" />
          <div className="lp-desktop-addressbar">
            <span>serviapp.ao</span>
          </div>
        </div>
        <div className="lp-desktop-body">
          <div className="lp-desktop-menu-panel">
            <div className="lp-desktop-menu-row">Nova aba</div>
            <div className="lp-desktop-menu-row">Histórico</div>
            <div className="lp-desktop-menu-row highlight">Instalar Serviapp...</div>
            <div className="lp-desktop-menu-row">Definições</div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="lp-desktop-window">
      <div className="lp-desktop-body">
        <div className="lp-desktop-center">
          <div className="lp-install-mock-appicon">S</div>
          <p className="lp-install-mock-applabel">Serviapp</p>
          <p className="lp-install-mock-donetext">Aplicação instalada</p>
        </div>
      </div>
    </div>
  );
}